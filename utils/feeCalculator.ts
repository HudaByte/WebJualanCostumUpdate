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

    // Flat fee as per user request
    const fee = 2000;

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
