import React from 'react';
import { motion } from 'framer-motion';
import { PackageOpen, ShoppingBag, ArrowRight } from 'lucide-react';

interface RestockingProps {
    brandName?: string;
    logoUrl?: string;
}

const Restocking: React.FC<RestockingProps> = ({
    brandName = 'NeonMarket',
    logoUrl = ''
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-600/10 rounded-full blur-[100px] will-change-transform"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-teal-600/10 rounded-full blur-[100px] will-change-transform"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                ></div>
            </div>

            <motion.div
                className="max-w-md w-full relative z-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <motion.div
                        className="mx-auto w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-2xl relative mb-4"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
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
                            transition={{ delay: 0.3 }}
                        >
                            {brandName}
                        </motion.h2>
                    )}
                </div>

                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="text-center">
                        <motion.div
                            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <PackageOpen size={40} />
                        </motion.div>

                        <h1 className="text-3xl font-bold text-white mb-3">Restocking Soon</h1>
                        <p className="text-slate-300 leading-relaxed text-sm mb-6">
                            Kami sedang mengisi ulang stok produk-produk terbaik. Nantikan update terbaru segera!
                        </p>

                        <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Preparing New Stock
                        </div>
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

export default Restocking;
