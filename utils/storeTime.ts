/**
 * Store Time Utilities
 * Handles WIB (UTC+7) timezone conversions and operating hours logic
 */

/**
 * Get current time in WIB (UTC+7)
 */
export const getCurrentWIBTime = (): Date => {
    const now = new Date();
    // Convert to UTC
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    // Add 7 hours for WIB (UTC+7)
    const wib = new Date(utc + 7 * 3600000);
    return wib;
};

/**
 * Get current WIB time as string (HH:MM format)
 */
export const getCurrentWIBTimeString = (): string => {
    const wib = getCurrentWIBTime();
    const hours = String(wib.getHours()).padStart(2, '0');
    const minutes = String(wib.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Get current WIB day (1=Monday, 7=Sunday)
 */
export const getCurrentWIBDay = (): number => {
    const wib = getCurrentWIBTime();
    const day = wib.getDay();
    return day === 0 ? 7 : day; // Convert Sunday from 0 to 7
};

/**
 * Check if current time is within operating hours
 */
export const isWithinOperatingHours = (
    openTime: string, // "09:00"
    closeTime: string, // "21:00"
    operatingDays: number[] // [1,2,3,4,5,6,7]
): boolean => {
    const currentDay = getCurrentWIBDay();
    const currentTime = getCurrentWIBTimeString();

    // Check if today is an operating day
    if (!operatingDays.includes(currentDay)) {
        return false;
    }

    // Check if current time is within range
    // Handle overnight shifts (e.g., 22:00 - 02:00)
    if (closeTime < openTime) {
        // Overnight shift
        return currentTime >= openTime || currentTime < closeTime;
    } else {
        // Normal shift
        return currentTime >= openTime && currentTime < closeTime;
    }
};

/**
 * Calculate minutes until next opening
 */
export const getMinutesUntilOpen = (
    openTime: string, // "09:00"
    operatingDays: number[] // [1,2,3,4,5,6,7]
): number => {
    const wib = getCurrentWIBTime();
    const currentDay = getCurrentWIBDay();
    const currentTime = getCurrentWIBTimeString();

    // Parse open time
    const [openHour, openMinute] = openTime.split(':').map(Number);

    // If today is operating day and we haven't reached open time yet
    if (operatingDays.includes(currentDay) && currentTime < openTime) {
        const openDateTime = new Date(wib);
        openDateTime.setHours(openHour, openMinute, 0, 0);
        return Math.floor((openDateTime.getTime() - wib.getTime()) / 60000);
    }

    // Find next operating day
    let daysUntilOpen = 1;
    let nextDay = (currentDay % 7) + 1;

    while (!operatingDays.includes(nextDay) && daysUntilOpen < 7) {
        daysUntilOpen++;
        nextDay = (nextDay % 7) + 1;
    }

    // Calculate minutes until that day's opening
    const nextOpenDateTime = new Date(wib);
    nextOpenDateTime.setDate(wib.getDate() + daysUntilOpen);
    nextOpenDateTime.setHours(openHour, openMinute, 0, 0);

    return Math.floor((nextOpenDateTime.getTime() - wib.getTime()) / 60000);
};

/**
 * Format minutes to human-readable string
 */
export const formatMinutesToTime = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes} menit`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours < 24) {
        return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (remainingHours > 0) {
        return `${days} hari ${remainingHours} jam`;
    }
    return `${days} hari`;
};

/**
 * Get day name in Indonesian
 */
export const getDayName = (dayNumber: number): string => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return dayNumber === 7 ? days[0] : days[dayNumber];
};

/**
 * Format operating days to string
 */
export const formatOperatingDays = (days: number[]): string => {
    if (days.length === 7) return 'Setiap Hari';
    if (days.length === 0) return 'Tidak Ada';

    const sortedDays = [...days].sort((a, b) => a - b);
    const dayNames = sortedDays.map(d => getDayName(d));

    // Check if it's weekdays (Mon-Fri)
    if (sortedDays.length === 5 && sortedDays.every((d, i) => d === i + 1)) {
        return 'Senin - Jumat';
    }

    // Check if it's weekend
    if (sortedDays.length === 2 && sortedDays[0] === 6 && sortedDays[1] === 7) {
        return 'Sabtu - Minggu';
    }

    return dayNames.join(', ');
};
