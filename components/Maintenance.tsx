import React from 'react';
import { motion } from 'framer-motion';
import { Construction, ShoppingBag } from 'lucide-react';

interface MaintenanceProps {
    brandName?: string;
    logoUrl?: string;
}

const Maintenance: React.FC<MaintenanceProps> = ({
    brandName = 'NeonMarket',
    logoUrl = ''
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Animated Background Elements - Optimized for Mobile */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-amber-600/10 rounded-full md:blur-[100px] blur-[60px]"
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
                    className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-orange-600/10 rounded-full md:blur-[100px] blur-[60px]"
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
                        className="mx-auto w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 to-orange-500 shadow-2xl relative mb-4"
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
                                <img src={logoUrl} alt={brandName} className="w-full h-full object-cover" loading="lazy" />
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

                    <div className="text-center">
                        <motion.div
                            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 text-amber-500 mb-6"
                            animate={{ rotate: [0, 8, -8, 0] }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                repeatDelay: 2.5,
                                ease: [0.4, 0, 0.6, 1]
                            }}
                            style={{
                                transform: 'translateZ(0)',
                                backfaceVisibility: 'hidden'
                            }}
                        >
                            <Construction size={40} />
                        </motion.div>

                        <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
                        <p className="text-slate-300 leading-relaxed text-sm mb-6">
                            Website sedang dalam perbaikan sistem untuk meningkatkan kualitas layanan. Mohon kembali lagi nanti.
                        </p>

                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                style={{
                                    transform: 'translateZ(0)',
                                    backfaceVisibility: 'hidden'
                                }}
                            />
                        </div>
                        <p className="text-slate-500 text-xs mt-3">Estimated time: Unknown</p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-8">
                    &copy; {new Date().getFullYear()} {brandName || 'Store'}. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
};

export default Maintenance;
