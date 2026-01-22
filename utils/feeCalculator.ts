/**
 * Atlantic Transfer Fee Calculator
 * Based on Atlantic Pedia pricing structure
 */

export interface FeeCalculation {
    nominal: number;
    fee: number;
    total: number;
}

/**
 * Calculate Atlantic transfer fee
 * Fee structure varies by amount
 */
export const calculateTransferFee = (nominal: number): FeeCalculation => {
    if (nominal <= 0) {
        return { nominal: 0, fee: 0, total: 0 };
    }

    let fee = 0;

    // Atlantic fee structure (adjust based on actual Atlantic rates)
    // Example structure - verify with Atlantic documentation:
    if (nominal <= 10000) {
        fee = 1500; // Flat Rp 1500 untuk transfer kecil
    } else if (nominal <= 50000) {
        fee = 2500; // Rp 2500
    } else if (nominal <= 100000) {
        fee = 3000; // Rp 3000
    } else if (nominal <= 500000) {
        fee = 4000; // Rp 4000
    } else if (nominal <= 1000000) {
        fee = 5000; // Rp 5000
    } else {
        // For amounts > 1M, use percentage
        fee = Math.ceil(nominal * 0.005); // 0.5% fee
    }

    const total = nominal + fee;

    return {
        nominal,
        fee,
        total
    };
};

/**
 * Format Rupiah
 */
export const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

/**
 * Check if balance is sufficient for transfer
 */
export const isSufficientBalance = (balance: number, nominal: number): boolean => {
    const { total } = calculateTransferFee(nominal);
    return balance >= total;
};
