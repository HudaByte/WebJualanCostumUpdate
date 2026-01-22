import { supabase, isSupabaseConfigured } from './supabase';
import { Transaction, TransactionStatus } from '../types';
import { maskApiKey, devLog, securityLog } from '../utils/security';

// Real Atlantic API Functions
interface AtlanticResponse {
    status: boolean;
    message?: string;
    data?: {
        id: string;
        reff_id: string;
        nominal: number;
        merchant_fee?: number; // Sometimes it's fee, sometimes merchant_fee
        fee?: number;
        get_balance?: number; // What merchant receives
        total_bayar?: number; // Deducted? Or sum? Usually nominal + fee.
        qr_string?: string;
        qr_image?: string;
        status: string;
        expired_at?: string;
    };
}

export const createAtlanticTransaction = async (price: number, refId: string, apiKey: string) => {
    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('reff_id', refId);
    formData.append('nominal', price.toString());
    formData.append('type', 'ewallet');
    formData.append('method', 'QRIS'); // Example uses this
    formData.append('metode', 'QRIS'); // Docs say this - send both to be safe!

    try {
        devLog('[Atlantic] Creating transaction', {
            api_key: maskApiKey(apiKey),
            reff_id: refId,
            nominal: price,
            type: 'ewallet'
        });

        // Use Vite Proxy to bypass CORS
        const response = await fetch('/api/atlantic/deposit/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        const responseText = await response.text();
        devLog('[Atlantic] Response received', { length: responseText.length });

        let result: AtlanticResponse;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            securityLog('[Atlantic] JSON Parse Error', { error: 'Invalid response format' });
            return { status: false, message: 'Invalid JSON response' };
        }

        if (!result.status) {
            devLog('[Atlantic] API Error', { message: result.message });
        }

        return result;
    } catch (e) {
        securityLog("Atlantic API Error", { error: (e as Error).message });
        return { status: false, message: "Network Error" };
    }
};

export const cancelAtlanticTransaction = async (atlanticId: string, apiKey: string) => {
    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('id', atlanticId);

    try {
        const response = await fetch('/api/atlantic/deposit/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        return await response.json();
    } catch (e) {
        securityLog("Atlantic Cancel Error", { error: (e as Error).message });
        return { status: false };
    }
};

// Test Atlantic API Key by getting available methods
export const testAtlanticKey = async (apiKey: string) => {
    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('type', 'ewallet');

    try {
        devLog('[Atlantic Test] Calling /deposit/metode');

        const response = await fetch('/api/atlantic/deposit/metode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        const responseText = await response.text();
        devLog('[Atlantic Test] Response received', { success: true });

        const result = JSON.parse(responseText);
        return result;
    } catch (e) {
        securityLog('[Atlantic Test] Error', { error: (e as Error).message });
        return { status: false, message: (e as Error).message };
    }
};

export const createTransaction = async (
    productId: number,
    productTitle: string,
    price: number,
    email: string,
    phone: string, // Use this for "Link Tujuan" as well
    method: 'MANUAL' | 'ATLANTIC_QRIS',
    quantity: number = 1
): Promise<Transaction | null> => {
    if (!isSupabaseConfigured()) return null;

    // Create unique Ref ID
    const refId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let paymentUrl = '';
    let status: TransactionStatus = 'PENDING';
    let atlanticId = '';
    let fee = 0;
    let reservedStockIds: number[] = []; // Track reserved stocks for multiple items
    let reservedStockId: number | null = null; // For legacy/single support
    let expiredAt: string | null = null;
    let uniqueCode = 0; // Initialize uniqueCode

    // --- STEP 1: RESERVE STOCK (FOR BOTH MANUAL & QRIS) ---
    // Prevent overselling by claiming stock immediately for ALL orders
    try {
        const { data: availableStocks } = await supabase
            .from('product_stocks')
            .select('*')
            .eq('product_id', productId)
            .eq('is_claimed', false)
            .limit(quantity);

        if (!availableStocks || availableStocks.length < quantity) {
            alert(`Maaf, stok barang ini tidak mencukupi! Tersedia: ${availableStocks?.length || 0}`);
            return null;
        }

        const stocksToReserve = availableStocks;
        reservedStockIds = stocksToReserve.map(s => s.id);
        reservedStockId = reservedStockIds[0]; // Legacy support

        // Claim the stocks
        const { error: claimError } = await supabase
            .from('product_stocks')
            .update({ is_claimed: true })
            .in('id', reservedStockIds);

        if (claimError) {
            securityLog('[Stock Reserve] Failed', { error: claimError.message });
            alert('Gagal memproses stok. Silakan coba lagi.');
            return null;
        }

        devLog('[Stock Reserve] Reserved stocks', { count: reservedStockIds.length });
    } catch (err) {
        securityLog('[Stock Reserve] Error', { error: String(err) });
        return null;
    }

    try {
        // --- STEP 2: PROCESS PAYMENT ---
        // CALCULATE TOTAL PRICE BASED ON QUANTITY
        const totalPrice = price * quantity;

        if (method === 'ATLANTIC_QRIS') {
            // Fetch API Key
            const { data: config } = await supabase.from('payment_config').select('value').eq('key', 'atlantic_api_key').single();
            const apiKey = config?.value;

            if (!apiKey) {
                // Rollback
                await supabase.from('product_stocks').update({ is_claimed: false }).in('id', reservedStockIds);
                alert("API Key Atlantic belum disetting!");
                return null;
            }

            // Generate unique code
            uniqueCode = Math.floor(Math.random() * 150) + 1; // 1 - 150

            // Calculate Nominal so that Net Received >= Total Price
            const flatFee = 200;
            const percentFee = 0.007; // 0.7%

            // Base amount needed to cover price + fees
            const amountNeeded = Math.ceil((totalPrice + flatFee) / (1 - percentFee));

            // Total to request from Atlantic
            const nominalWithFees = amountNeeded + uniqueCode;

            // Calculate the "Admin Fee" to show user (Total - Price - UniqueCode)
            const calculatedFee = amountNeeded - totalPrice;

            devLog('[Payment] Fee calculated', {
                price: totalPrice,
                fee: calculatedFee
            });

            const atlanticRes = await createAtlanticTransaction(nominalWithFees, refId, apiKey);

            if (atlanticRes.status && atlanticRes.data) {
                paymentUrl = atlanticRes.data.qr_image || '';
                atlanticId = atlanticRes.data.id;
                expiredAt = atlanticRes.data.expired_at || null;

                // Store the FEE charged to user
                fee = calculatedFee;
            } else {
                // Rollback
                await supabase.from('product_stocks').update({ is_claimed: false }).in('id', reservedStockIds);
                throw new Error(atlanticRes.message || "Gagal membuat transaksi Atlantic");
            }
        } else {
            // Manual
            paymentUrl = `https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20konfirmasi%20pembelian%20${encodeURIComponent(productTitle)}%20(x${quantity})%20seharga%20Rp%20${totalPrice.toLocaleString()}%20dengan%20ID%20${refId}`;
        }

        // --- STEP 3: SAVE TRANSACTION ---
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                ref_id: refId,
                product_id: productId,
                product_title: productTitle,
                price: totalPrice, // Save TOTAL price
                fee: fee,
                unique_code: method === 'ATLANTIC_QRIS' ? uniqueCode : 0,
                atlantic_id: atlanticId,
                buyer_email: email,
                buyer_phone: phone,
                payment_method: method,
                reserved_stock_id: reservedStockId, // Legacy
                reserved_stock_ids: reservedStockIds, // NEW: Array of IDs
                status: status,
                quantity: quantity,
                payment_url: paymentUrl,
                expired_at: expiredAt
            })
            .select()
            .single();

        if (error) {
            // Rollback if DB insert fails
            await supabase.from('product_stocks').update({ is_claimed: false }).in('id', reservedStockIds);
            securityLog("DB Insert Error", { error: error.message });
            throw error;
        }

        return data;

    } catch (e) {
        // Rollback stock in case of any other error
        if (reservedStockIds.length > 0) {
            await supabase.from('product_stocks').update({ is_claimed: false }).in('id', reservedStockIds);
        }
        securityLog("Transaction Creation Error", { error: (e as Error).message });
        return null;
    }
};

// Check Status (with optional Atlantic sync)
export const checkTransactionStatus = async (transactionId: string): Promise<Transaction | null> => {
    if (!isSupabaseConfigured()) return null;

    // 1. Get Transaction from DB
    const { data: trx, error } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
    if (error || !trx) return null;

    // 2. If already paid/cancelled, return as-is (with retry for missing content)
    if (trx.status === 'PAID') {
        if (!trx.stock_content) {
            devLog('[Check Status] PAID but missing content. Retrying delivery...');
            await deliverStock(transactionId);
            const { data: updated } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
            return updated;
        }
        return trx;
    }

    if (trx.status === 'CANCELLED') return trx;

    // 3. If PENDING and ATLANTIC_QRIS, check with Atlantic API for latest status
    if (trx.status === 'PENDING' && trx.payment_method === 'ATLANTIC_QRIS' && trx.atlantic_id) {
        try {
            // Get API Key
            const { data: config } = await supabase.from('payment_config').select('value').eq('key', 'atlantic_api_key').single();
            const apiKey = config?.value;

            if (apiKey) {
                // Call Atlantic Status API
                const formData = new URLSearchParams();
                formData.append('api_key', apiKey);
                formData.append('id', trx.atlantic_id);

                const response = await fetch('/api/atlantic/deposit/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                const result = await response.json();

                // Update DB if status changed
                if (result.status && result.data) {
                    const atlanticStatus = result.data.status; // 'success', 'pending', 'expired', 'cancel'
                    let newStatus: TransactionStatus = 'PENDING';

                    if (atlanticStatus === 'success' || atlanticStatus === 'processing') {
                        newStatus = 'PAID';
                        // Trigger stock delivery
                        await deliverStock(transactionId);

                        // RE-FETCH transaction to get the delivered stock_content
                        const { data: freshTrx } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
                        if (freshTrx) {
                            return freshTrx;
                        }
                    } else if (atlanticStatus === 'cancel' || atlanticStatus === 'expired') {
                        newStatus = 'CANCELLED';

                        // RESTORE STOCK if cancelled/expired
                        if (trx.reserved_stock_ids && trx.reserved_stock_ids.length > 0) {
                            devLog('[Check Status] Releasing stocks due to cancellation');
                            await supabase
                                .from('product_stocks')
                                .update({ is_claimed: false })
                                .in('id', trx.reserved_stock_ids);
                        } else if (trx.reserved_stock_id) {
                            devLog('[Check Status] Releasing stock due to cancellation');
                            await supabase
                                .from('product_stocks')
                                .update({ is_claimed: false })
                                .eq('id', trx.reserved_stock_id);
                        }
                    }

                    if (newStatus !== 'PENDING' && newStatus !== trx.status) {
                        await supabase.from('transactions').update({ status: newStatus }).eq('id', transactionId);
                        trx.status = newStatus;
                    }
                }
            }
        } catch (e) {
            securityLog("Atlantic Status Check Error", { error: (e as Error).message });
        }
    }

    return trx;
};

// Function to Deliver Stock (called after payment success)
export const deliverStock = async (transactionId: string) => {
    if (!isSupabaseConfigured()) return;

    // Get Trx
    const { data: trx } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
    if (!trx || trx.status !== 'PAID' || trx.stock_content) return; // Already delivered or not paid

    // Get Available Stock
    let stocksToDeliver: any[] = [];

    if (trx.reserved_stock_ids && trx.reserved_stock_ids.length > 0) {
        const { data: reservedStocks } = await supabase
            .from('product_stocks')
            .select('*')
            .in('id', trx.reserved_stock_ids);

        if (reservedStocks) stocksToDeliver = reservedStocks;

    } else if (trx.reserved_stock_id) {
        // Use the stock reserved for this transaction
        const { data: reservedStock } = await supabase
            .from('product_stocks')
            .select('*')
            .eq('id', trx.reserved_stock_id)
            .single();

        if (reservedStock) {
            stocksToDeliver = [reservedStock];
        }
    }

    // Fallback? Probably not needed if logic is correct, but let's keep it safe for single items
    if (stocksToDeliver.length === 0) {
        // Logic for fallback (finding new stock) is dangerous for multi-qty. Skip for now.
        securityLog("No Reserved Stock Found", { transaction_id: transactionId });
        return;
    }

    // Claim Stock (already claimed, but ensure)
    const stockIds = stocksToDeliver.map(s => s.id);
    await supabase.from('product_stocks').update({ is_claimed: true }).in('id', stockIds);

    // Concatenate Content
    const content = stocksToDeliver.map(s => s.content).join('\n---\n');

    // Update Transaction with Content
    await supabase.from('transactions').update({ stock_content: content }).eq('id', transactionId);

    // INCREMENT SOLD COUNT
    if (trx.product_id) {
        // Safe increment using RPC would be better, but for now read-update is acceptable
        const { data: product } = await supabase.from('products').select('sold_count').eq('id', trx.product_id).single();
        if (product) {
            const currentSold = product.sold_count || 0;
            const quantitySold = trx.quantity || 1;
            await supabase
                .from('products')
                .update({ sold_count: currentSold + quantitySold })
                .eq('id', trx.product_id);
        }
    }
};

// Test Connection (Real)
export const testAtlanticConnection = async (apiKey: string): Promise<boolean> => {
    const result = await testAtlanticKey(apiKey);
    return result.status === true;
};

// Manual Approve Transaction (Admin)
export const manualApproveTransaction = async (transactionId: string): Promise<boolean> => {
    try {
        // 1. Get transaction
        const { data: trx, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (fetchError || !trx) {
            devLog('[Manual Approve] Transaction not found');
            return false;
        }

        // 2. Check if already paid
        if (trx.status === 'PAID') {
            devLog('[Manual Approve] Already paid');
            return true;
        }

        // 3. Deliver stock
        await deliverStock(transactionId);

        // 4. Generate invoice URL
        const invoiceUrl = `/invoice/${transactionId}`;

        // 5. Update status to PAID and set invoice_url
        const { error: updateError } = await supabase
            .from('transactions')
            .update({
                status: 'PAID',
                invoice_url: invoiceUrl
            })
            .eq('id', transactionId);

        if (updateError) {
            securityLog('[Manual Approve] Update error', { error: updateError.message });
            return false;
        }

        devLog('[Manual Approve] Success');
        return true;
    } catch (e) {
        securityLog('[Manual Approve] Error', { error: (e as Error).message });
        return false;
    }
};

// Admin Cancel Transaction
export const adminCancelTransaction = async (transactionId: string): Promise<boolean> => {
    devLog('[Admin Cancel] Starting cancellation');

    try {
        // 1. Get transaction
        const { data: trx, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        console.log('[Admin Cancel] Transaction data:', trx);
        console.log('[Admin Cancel] Fetch error:', fetchError);

        if (fetchError || !trx) {
            devLog('[Admin Cancel] Transaction not found');
            return false;
        }

        // 2. Check if already cancelled
        if (trx.status === 'CANCELLED') {
            devLog('[Admin Cancel] Already cancelled');
            return true;
        }

        // 3. Cancel on Atlantic if QRIS and has atlantic_id
        if (trx.payment_method === 'ATLANTIC_QRIS' && trx.atlantic_id) {
            devLog('[Admin Cancel] Calling Atlantic API');
            const { data: config } = await supabase
                .from('payment_config')
                .select('value')
                .eq('key', 'atlantic_api_key')
                .single();

            if (config?.value) {
                await cancelAtlanticTransaction(trx.atlantic_id, config.value);
            }
        }

        // 4. Release reserved stock if exists
        if (trx.reserved_stock_ids && trx.reserved_stock_ids.length > 0) {
            devLog('[Admin Cancel] Releasing stocks');
            const { error: stockError } = await supabase
                .from('product_stocks')
                .update({ is_claimed: false })
                .in('id', trx.reserved_stock_ids);

            if (stockError) {
                securityLog('[Admin Cancel] Stocks release error', { error: stockError.message });
            }
        } else if (trx.reserved_stock_id) {
            devLog('[Admin Cancel] Releasing stock');
            const { error: stockError } = await supabase
                .from('product_stocks')
                .update({ is_claimed: false })
                .eq('id', trx.reserved_stock_id);

            if (stockError) {
                securityLog('[Admin Cancel] Stock release error', { error: stockError.message });
            }
        }

        devLog('[Admin Cancel] Updating status');
        const { error: updateError } = await supabase
            .from('transactions')
            .update({ status: 'CANCELLED' })
            .eq('id', transactionId);

        if (updateError) {
            securityLog('[Admin Cancel] Update error', { error: updateError.message });
            return false;
        }

        devLog('[Admin Cancel] Success');
        return true;
    } catch (e) {
        securityLog('[Admin Cancel] Exception', { error: (e as Error).message });
        return false;
    }
};



export const getAtlanticProfile = async (apiKey: string) => {
    try {
        const response = await fetch('/api/atlantic/get_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ api_key: apiKey })
        });

        const text = await response.text();
        // console.log('[Atlantic Profile] Response:', text); // Reduce noise

        if (!response.ok) {
            return { status: false, message: `HTTP Error: ${response.status}` };
        }

        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            return { status: false, message: 'Invalid JSON response from Atlantic' };
        }
    } catch (error) {
        securityLog("Atlantic Profile Error", { error: String(error) });
        return { status: false, message: 'Network Error' };
    }
};

// --- WITHDRAW / TRANSFER SERVICES ---

export const getBankList = async (apiKey: string) => {
    try {
        const response = await fetch('/api/atlantic/transfer/bank_list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ api_key: apiKey })
        });
        return await response.json();
    } catch (error) {
        securityLog("Bank List Error", { error: String(error) });
        return { status: false, message: 'Network Error' };
    }
};

export const checkBankAccount = async (apiKey: string, bankCode: string, accountNumber: string) => {
    try {
        const response = await fetch('/api/atlantic/transfer/cek_rekening', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                api_key: apiKey,
                bank_code: bankCode,
                account_number: accountNumber
            })
        });
        return await response.json();
    } catch (error) {
        securityLog("Bank Account Check Error", { error: String(error) });
        return { status: false, message: 'Network Error' };
    }
};

export const createTransfer = async (
    apiKey: string,
    bankCode: string,
    accountNumber: string,
    accountName: string, // Required by Atlantic API
    nominal: number
) => {
    const refId = `WD-${Date.now()}`; // Generate internal Ref ID

    try {
        const formData = new URLSearchParams();
        formData.append('api_key', apiKey);
        formData.append('ref_id', refId);
        formData.append('kode_bank', bankCode);
        formData.append('nomor_akun', accountNumber);
        formData.append('nama_pemilik', accountName);
        formData.append('nominal', nominal.toString());
        // Optional: email, phone, note can be added here if needed

        const response = await fetch('/api/atlantic/transfer/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        return await response.json();
    } catch (error) {
        securityLog("Transfer Creation Error", { error: String(error) });
        return { status: false, message: 'Network Error' };
    }
};

export const checkTransferStatus = async (apiKey: string, id: string) => {
    try {
        const response = await fetch('/api/atlantic/transfer/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                api_key: apiKey,
                id: id
            })
        });
        return await response.json();
    } catch (error) {
        securityLog("Transfer Status Check Error", { error: String(error) });
        return { status: false, message: 'Network Error' };
    }
};
