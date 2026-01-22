import { useState, useEffect } from 'react';
import { isWithinOperatingHours } from '../utils/storeTime';

interface StoreStatusConfig {
    store_mode?: string;
    store_enabled?: string;
    store_auto_schedule?: string;
    store_hours_open?: string;
    store_hours_close?: string;
    store_days?: string;
}

export type StoreStatus = 'open' | 'closed' | 'maintenance' | 'restocking';

export const useStoreStatus = (config: StoreStatusConfig) => {
    const [status, setStatus] = useState<StoreStatus>('open');

    useEffect(() => {
        const checkStoreStatus = () => {
            // Check for new store_mode first
            const mode = config.store_mode;

            if (mode === 'maintenance') {
                setStatus('maintenance');
                return;
            }

            if (mode === 'restocking') {
                setStatus('restocking');
                return;
            }

            if (mode === 'closed') {
                setStatus('closed');
                return;
            }

            // Backward compatibility for store_enabled (if store_mode is empty/undefined)
            if (!mode && config.store_enabled === 'false') {
                setStatus('closed');
                return;
            }

            // Auto schedule check for 'open' mode
            if (mode === 'open' || (!mode && config.store_enabled !== 'false')) {
                if (config.store_auto_schedule === 'true') {
                    const openTime = config.store_hours_open || '00:00';
                    const closeTime = config.store_hours_close || '23:59';
                    const daysString = config.store_days || '1,2,3,4,5,6,7';
                    const operatingDays = daysString.split(',').map(Number).filter(Boolean);

                    const isOpen = isWithinOperatingHours(openTime, closeTime, operatingDays);
                    setStatus(isOpen ? 'open' : 'closed');
                } else {
                    // Manual Open
                    setStatus('open');
                }
            }
        };

        // Initial check
        checkStoreStatus();

        // Re-check every minute
        const interval = setInterval(checkStoreStatus, 60000);

        return () => clearInterval(interval);
    }, [config]);

    return { status, isOpen: status === 'open' };
};
