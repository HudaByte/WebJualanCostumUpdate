import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface PromoPopupProps {
    imageUrl?: string;
    text?: string;
    linkUrl?: string;
    delaySeconds: number;
    enabled: boolean;
    repeatMode: boolean; // true = repeat after delay, false = show once only
}

const PromoPopup: React.FC<PromoPopupProps> = ({ imageUrl, text, linkUrl, delaySeconds, enabled, repeatMode }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!enabled || (!imageUrl && !text)) return;

        const checkAndShow = () => {
            const lastShown = localStorage.getItem('popup_last_shown');
            const popupShownOnce = localStorage.getItem('popup_shown_once');
            const now = Date.now();

            // If repeatMode is false and already shown once, never show again
            if (!repeatMode && popupShownOnce === 'true') {
                return;
            }

            if (!lastShown) {
                // First time - show immediately
                setIsVisible(true);
                localStorage.setItem('popup_last_shown', now.toString());
                if (!repeatMode) {
                    localStorage.setItem('popup_shown_once', 'true');
                }
            } else {
                const elapsed = (now - parseInt(lastShown)) / 1000; // seconds

                if (elapsed >= delaySeconds && repeatMode) {
                    // Delay has passed - show popup (only if repeatMode)
                    setIsVisible(true);
                    localStorage.setItem('popup_last_shown', now.toString());
                } else if (repeatMode) {
                    // Schedule show after remaining delay
                    const remaining = (delaySeconds - elapsed) * 1000;
                    const timeoutId = setTimeout(() => {
                        setIsVisible(true);
                        localStorage.setItem('popup_last_shown', Date.now().toString());
                    }, remaining);

                    return () => clearTimeout(timeoutId);
                }
            }
        };

        checkAndShow();
    }, [enabled, imageUrl, text, delaySeconds, repeatMode]);

    const handleClose = () => {
        setIsVisible(false);
        const now = Date.now();
        localStorage.setItem('popup_last_shown', now.toString());

        // Schedule next appearance ONLY if repeatMode is true
        if (enabled && delaySeconds > 0 && repeatMode) {
            setTimeout(() => {
                setIsVisible(true);
                localStorage.setItem('popup_last_shown', Date.now().toString());
            }, delaySeconds * 1000);
        }
    };

    const handleClick = () => {
        if (linkUrl) {
            window.open(linkUrl, '_blank');
        }
    };

    if (!enabled || (!imageUrl && !text) || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
            >
                <motion.div
                    className="relative max-w-2xl w-full"
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute -top-4 -right-4 bg-white dark:bg-slate-900 rounded-full p-2 shadow-xl hover:scale-110 transition-transform z-10 border-2 border-slate-200 dark:border-slate-700"
                        aria-label="Close popup"
                    >
                        <X size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>

                    {/* Popup Content */}
                    <div
                        className={`relative overflow-hidden rounded-2xl shadow-2xl ${linkUrl ? 'cursor-pointer' : ''} ${!imageUrl ? 'bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700' : ''}`}
                        onClick={handleClick}
                    >
                        {/* Image or Text */}
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="Promo"
                                className="w-full h-auto max-h-[80vh] object-contain hover:opacity-95 transition-opacity"
                            />
                        ) : text ? (
                            <div className="p-8 md:p-12 text-center text-white">
                                <div className="prose prose-lg prose-invert max-w-none">
                                    <div
                                        className="text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }}
                                    />
                                </div>
                            </div>
                        ) : null}

                        {/* Link Indicator */}
                        {linkUrl && (
                            <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-sm">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Klik untuk info
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PromoPopup;
