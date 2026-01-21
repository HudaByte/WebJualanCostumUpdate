import { supabase, isSupabaseConfigured } from './supabase';
import { Transaction, TransactionStatus } from '../types';

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
        console.log('[Atlantic] Creating transaction with:', {
            api_key: apiKey.substring(0, 10) + '...',
            reff_id: refId,
            nominal: price,
            type: 'ewallet',
            method: 'QRIS',
            metode: 'QRIS'
        });

        // Use Vite Proxy to bypass CORS
        const response = await fetch('/api/atlantic/deposit/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        const responseText = await response.text();
        console.log('[Atlantic] Raw response:', responseText);

        let result: AtlanticResponse;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('[Atlantic] Failed to parse JSON:', responseText);
            return { status: false, message: 'Invalid JSON response: ' + responseText };
        }

        console.log('[Atlantic] Parsed response:', result);

        if (!result.status) {
            console.error('[Atlantic] API returned error:', result);
        }

        return result;
    } catch (e) {
        console.error("Atlantic API Error", e);
        return { status: false, message: "Network Error: " + (e as Error).message };
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
        console.error("Atlantic Cancel Error", e);
        return { status: false };
    }
};

// Test Atlantic API Key by getting available methods
export const testAtlanticKey = async (apiKey: string) => {
    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('type', 'ewallet');

    try {
        console.log('[Atlantic Test] Calling /deposit/metode...');

        const response = await fetch('/api/atlantic/deposit/metode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        const responseText = await response.text();
        console.log('[Atlantic Test] Raw response:', responseText);

        const result = JSON.parse(responseText);
        console.log('[Atlantic Test] Available methods:', result);

        return result;
    } catch (e) {
        console.error('[Atlantic Test] Error:', e);
        return { status: false, message: (e as Error).message };
    }
};

export const createTransaction = async (
    productId: number,
    productTitle: string,
    price: number,
    email: string,
    phone: string, // Use this for "Link Tujuan" as well
    method: 'MANUAL' | 'ATLANTIC_QRIS'
): Promise<Transaction | null> => {
    if (!isSupabaseConfigured()) return null;

    // Create unique Ref ID
    const refId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let paymentUrl = '';
    let status: TransactionStatus = 'PENDING';
    let atlanticId = '';
    let fee = 0;
    let reservedStockId: number | null = null; // Track reserved stock

    // 1. If Automatic, Call Gateway
    if (method === 'ATLANTIC_QRIS') {
        try {
            // STEP 1: Reserve stock IMMEDIATELY to prevent overbooking
            const { data: availableStock } = await supabase
                .from('product_stocks')
                .select('*')
                .eq('product_id', productId)
                .eq('is_claimed', false)
                .limit(1)
                .single();

            if (!availableStock) {
                alert('Maaf, stok habis!');
                return null;
            }

            reservedStockId = availableStock.id; // Capture ID

            // Claim the stock NOW before creating transaction
            const { error: claimError } = await supabase
                .from('product_stocks')
                .update({ is_claimed: true })
                .eq('id', availableStock.id);

            if (claimError) {
                console.error('[Stock Reserve] Failed:', claimError);
                alert('Gagal mereservasi stok. Silakan coba lagi.');
                return null;
            }

            console.log('[Stock Reserve] Stock claimed:', availableStock.id);

            // STEP 2: Fetch API Key
            const { data: config } = await supabase.from('payment_config').select('value').eq('key', 'atlantic_api_key').single();
            const apiKey = config?.value;

            if (!apiKey) {
                // Rollback stock if no API key
                await supabase.from('product_stocks').update({ is_claimed: false }).eq('id', availableStock.id);
                alert("API Key Atlantic belum disetting!");
                return null;
            }

            // Generate unique code (1-100 for smaller variation)
            const uniqueCode = Math.floor(Math.random() * 100) + 1;

            // Calculate: nominal + 200 + 0.7% + unique_code
            const fee200 = 200;
            const fee07Percent = Math.round(price * 0.007); // 0.7%
            const nominalWithFees = price + fee200 + fee07Percent + uniqueCode;

            console.log('[Payment] Calculation:', {
                originalPrice: price,
                fee200: fee200,
                fee07Percent: fee07Percent,
                uniqueCode: uniqueCode,
                totalNominal: nominalWithFees
            });

            const atlanticRes = await createAtlanticTransaction(nominalWithFees, refId, apiKey);

            if (atlanticRes.status && atlanticRes.data) {
                paymentUrl = atlanticRes.data.qr_image || '';
                atlanticId = atlanticRes.data.id;
                fee = atlanticRes.data.fee || 0;

                // Update price to use get_balance from Atlantic
                const getBalance = atlanticRes.data.get_balance || price;

                // Insert with get_balance and unique_code
                const { data, error } = await supabase
                    .from('transactions')
                    .insert({
                        ref_id: refId,
                        product_id: productId,
                        product_title: productTitle,
                        price: price, // Original price
                        get_balance: getBalance, // What merchant receives
                        fee: fee,
                        unique_code: uniqueCode, // Random unique number
                        atlantic_id: atlanticId,
                        buyer_email: email,
                        payment_method: method,
                        status: status,
                        payment_url: paymentUrl
                    })
                    .select()
                    .single();

                if (error) {
                    console.error("DB Error", error);
                    return null;
                }

                return data;
            } else {
                // Rollback stock if Atlantic API failed
                await supabase.from('product_stocks').update({ is_claimed: false }).eq('id', availableStock.id);
                throw new Error(atlanticRes.message || "Gagal membuat transaksi Atlantic");
            }
        } catch (e) {
            console.error("Payment Gateway Error", e);
            alert("Gagal koneksi ke Payment Gateway");
            // Note: stock already rolled back in else block above if needed
            return null;
        }
    } else {
        // Manual
        paymentUrl = `https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20konfirmasi%20pembelian%20${encodeURIComponent(productTitle)}%20seharga%20Rp%20${price.toLocaleString()}%20dengan%20ID%20${refId}`;
    }

    // 2. Insert into DB
    const { data, error } = await supabase
        .from('transactions')
        .insert({
            ref_id: refId,
            product_id: productId,
            product_title: productTitle,
            price: price,
            fee: fee, // Ensure DB has this column
            atlantic_id: atlanticId, // Ensure DB has this column
            buyer_email: email,
            buyer_phone: phone,
            payment_method: method,
            reserved_stock_id: reservedStockId,
            status: status,
            payment_url: paymentUrl
        })
        .select()
        .single();

    if (error) {
        console.error("DB Error", error);
        throw error;
    }

    return data;
};

// Check Status (with optional Atlantic sync)
export const checkTransactionStatus = async (transactionId: string): Promise<Transaction | null> => {
    if (!isSupabaseConfigured()) return null;

    // 1. Get Transaction from DB
    const { data: trx, error } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
    if (error || !trx) return null;

    // 2. If already paid/cancelled, return as-is
    if (trx.status === 'PAID' || trx.status === 'CANCELLED') return trx;

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

                    if (atlanticStatus === 'success') {
                        newStatus = 'PAID';
                        // Trigger stock delivery
                        await deliverStock(transactionId);
                    } else if (atlanticStatus === 'cancel' || atlanticStatus === 'expired') {
                        newStatus = 'CANCELLED';
                    }

                    if (newStatus !== 'PENDING' && newStatus !== trx.status) {
                        await supabase.from('transactions').update({ status: newStatus }).eq('id', transactionId);
                        trx.status = newStatus;
                    }
                }
            }
        } catch (e) {
            console.error("Atlantic Status Check Error", e);
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
    let stock = null;

    if (trx.reserved_stock_id) {
        // Use the stock reserved for this transaction
        const { data: reservedStock } = await supabase
            .from('product_stocks')
            .select('*')
            .eq('id', trx.reserved_stock_id)
            .single();

        if (reservedStock) {
            stock = reservedStock;
        }
    }

    // Fallback: Find new available stock if no reservation or reservation lost
    if (!stock) {
        const { data: availableStock, error } = await supabase
            .from('product_stocks')
            .select('*')
            .eq('product_id', trx.product_id)
            .eq('is_claimed', false)
            .limit(1)
            .single();

        if (!error && availableStock) {
            stock = availableStock;
        }
    }

    if (!stock) {
        // No stock available, log error or notify admin
        console.error("No Stock Available for Product", trx.product_id);
        return;
    }

    // Claim Stock (idempotent if already claimed)
    await supabase.from('product_stocks').update({ is_claimed: true }).eq('id', stock.id);

    // Update Transaction with Content
    await supabase.from('transactions').update({ stock_content: stock.content }).eq('id', transactionId);
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
            console.error('[Manual Approve] Transaction not found');
            return false;
        }

        // 2. Check if already paid
        if (trx.status === 'PAID') {
            console.log('[Manual Approve] Already paid');
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
            console.error('[Manual Approve] Update error:', updateError);
            return false;
        }

        console.log('[Manual Approve] Success:', transactionId);
        return true;
    } catch (e) {
        console.error('[Manual Approve] Error:', e);
        return false;
    }
};

// Admin Cancel Transaction
export const adminCancelTransaction = async (transactionId: string): Promise<boolean> => {
    console.log('[Admin Cancel] Starting cancellation for:', transactionId);

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
            console.error('[Admin Cancel] Transaction not found');
            return false;
        }

        // 2. Check if already cancelled
        if (trx.status === 'CANCELLED') {
            console.log('[Admin Cancel] Already cancelled');
            return true;
        }

        // 3. Cancel on Atlantic if QRIS and has atlantic_id
        if (trx.payment_method === 'ATLANTIC_QRIS' && trx.atlantic_id) {
            console.log('[Admin Cancel] Calling Atlantic API to cancel:', trx.atlantic_id);
            const { data: config } = await supabase
                .from('payment_config')
                .select('value')
                .eq('key', 'atlantic_api_key')
                .single();

            if (config?.value) {
                const cancelResult = await cancelAtlanticTransaction(trx.atlantic_id, config.value);
                console.log('[Admin Cancel] Atlantic cancel result:', cancelResult);
            }
        }

        // 4. Release reserved stock if exists
        if (trx.reserved_stock_id) {
            console.log('[Admin Cancel] Releasing stock:', trx.reserved_stock_id);
            const { error: stockError } = await supabase
                .from('product_stocks')
                .update({ is_claimed: false })
                .eq('id', trx.reserved_stock_id);

            if (stockError) {
                console.error('[Admin Cancel] Stock release error:', stockError);
            } else {
                console.log('[Admin Cancel] Stock released successfully');
            }
        } else {
            console.log('[Admin Cancel] No reserved stock to release');
        }

        // 5. Update status to CANCELLED
        console.log('[Admin Cancel] Updating status to CANCELLED...');
        const { error: updateError } = await supabase
            .from('transactions')
            .update({ status: 'CANCELLED' })
            .eq('id', transactionId);

        console.log('[Admin Cancel] Update error:', updateError);

        if (updateError) {
            console.error('[Admin Cancel] Update error:', updateError);
            return false;
        }

        console.log('[Admin Cancel] Success! Transaction cancelled:', transactionId);
        return true;
    } catch (e) {
        console.error('[Admin Cancel] Exception:', e);
        return false;
    }
};


