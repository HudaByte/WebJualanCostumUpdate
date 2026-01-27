import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Clock, Calendar, MessageCircle } from 'lucide-react';
import {
    getCurrentWIBTimeString,
    getMinutesUntilOpen,
    formatMinutesToTime,
    formatOperatingDays
} from '../utils/storeTime';

interface StoreClosedProps {
    message?: string;
    openTime?: string;
    closeTime?: string;
    operatingDays?: number[];
    contactLink?: string;
    brandName?: string;
    logoUrl?: string;
}

const StoreClosed: React.FC<StoreClosedProps> = ({
    message = 'Maaf, toko sedang tutup. Silakan kembali saat jam operasional.',
    openTime = '09:00',
    closeTime = '21:00',
    operatingDays = [1, 2, 3, 4, 5, 6, 7],
    contactLink = '',
    brandName = 'NeonMarket',
    logoUrl = ''
}) => {
    const [currentTime, setCurrentTime] = useState('');
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(getCurrentWIBTimeString());

            const minutesUntil = getMinutesUntilOpen(openTime, operatingDays);
            setCountdown(formatMinutesToTime(minutesUntil));
        };

        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [openTime, operatingDays]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Animated Background Elements - Optimized for Mobile */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full md:blur-[100px] blur-[60px]"
                    style={{
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        perspective: 1000
                    }}
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.3, 0.4, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: [0.4, 0, 0.6, 1],
                        repeatType: "reverse"
                    }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-purple-600/20 rounded-full md:blur-[100px] blur-[60px]"
                    style={{
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        perspective: 1000
                    }}
                    animate={{
                        scale: [1.15, 1, 1.15],
                        opacity: [0.4, 0.3, 0.4],
                    }}
                    transition={{
                        duration: 9,
                        repeat: Infinity,
                        ease: [0.4, 0, 0.6, 1],
                        repeatType: "reverse"
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        transform: 'translateZ(0)'
                    }}
                ></div>
            </div>

            <motion.div
                className="max-w-md w-full relative z-10"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.6,
                    ease: [0.4, 0, 0.2, 1]
                }}
                style={{
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                }}
            >
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <motion.div
                        className="mx-auto w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-2xl relative mb-4"
                        initial={{ y: -15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                            delay: 0.15,
                            duration: 0.5,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                        style={{
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden'
                        }}
                    >
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-slate-900">
                            {logoUrl ? (
                                <img src={logoUrl} alt={brandName} className="w-full h-full object-cover" />
                            ) : (
                                <ShoppingBag className="text-white w-10 h-10" />
                            )}
                        </div>
                    </motion.div>

                    {brandName && (
                        <motion.h2
                            className="text-2xl font-bold text-white tracking-wide"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                delay: 0.25,
                                duration: 0.5,
                                ease: [0.4, 0, 0.2, 1]
                            }}
                        >
                            {brandName}
                        </motion.h2>
                    )}
                </div>

                {/* Main Card */}
                <div className="bg-white/5 md:backdrop-blur-2xl backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Toko Sedang Tutup
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">Kami Segera Kembali</h1>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            {message}
                        </p>
                    </div>

                    {/* Operational Hours */}
                    <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 mb-6">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                    <Clock size={18} />
                                </div>
                                <span className="text-slate-300 text-sm">Jam Operasional</span>
                            </div>
                            <span className="text-white font-mono font-medium">{openTime} - {closeTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                    <Calendar size={18} />
                                </div>
                                <span className="text-slate-300 text-sm">Hari Buka</span>
                            </div>
                            <span className="text-white text-sm">{formatOperatingDays(operatingDays)}</span>
                        </div>
                    </div>

                    {/* Countdown */}
                    <div className="text-center mb-8">
                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Buka Dalam</p>
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-mono">
                            {countdown}
                        </div>
                        <p className="text-slate-500 text-xs mt-2">{currentTime} WIB</p>
                    </div>

                    {/* Action Button */}
                    {contactLink && (
                        <a
                            href={contactLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-green-500/20 group/btn"
                        >
                            <MessageCircle size={20} className="group-hover/btn:scale-110 transition-transform" />
                            Hubungi Admin
                        </a>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-8">
                    &copy; {new Date().getFullYear()} {brandName || 'Store'}. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
};

export default StoreClosed;
