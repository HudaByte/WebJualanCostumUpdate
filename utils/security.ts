// Security Utilities
// Functions for validation, sanitization, and safe logging

/**
 * Mask sensitive string data (emails, API keys, phone numbers)
 */
export const maskSensitiveData = (data: string, showLast: number = 4): string => {
    if (!data || data.length <= showLast) return '***';
    return '*'.repeat(data.length - showLast) + data.slice(-showLast);
};

/**
 * Mask API Key for logging
 */
export const maskApiKey = (key: string): string => {
    if (!key || key.length < 10) return '***';
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate Indonesian phone number
 */
export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Sanitize string to prevent XSS
 */
export const sanitizeString = (str: string): string => {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    const reg = /[&<>"'/]/gi;
    return str.replace(reg, (match) => map[match]);
};

/**
 * Safe logging - only log in development
 */
export const devLog = (message: string, data?: any): void => {
    if (import.meta.env.DEV) {
        console.log(`[DEV] ${message}`, data);
    }
};

/**
 * Security event logging (always log security events)
 */
export const securityLog = (event: string, details?: any): void => {
    console.warn(`[SECURITY] ${event}`, details);
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: any): boolean => {
    const num = Number(value);
    return !isNaN(num) && num > 0 && isFinite(num);
};

/**
 * Sanitize filename/path to prevent directory traversal
 */
export const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Check if string length is within limits
 */
export const isValidLength = (str: string, min: number = 1, max: number = 1000): boolean => {
    return str.length >= min && str.length <= max;
};

/**
 * Debounce function for rate limiting
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
