import React, { useMemo } from 'react';
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
    // Gunakan useMemo untuk mencegah re-render pada elemen statis jika parent berubah
    const year = useMemo(() => new Date().getFullYear(), []);

    return (
        // Gunakan bg-slate-900 saja di awal untuk mencegah flash putih saat loading
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans isolate">
            
            {/* BACKGROUND OPTIMIZATION */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                {/* Gunakan will-change untuk memberi tahu browser akan ada animasi */}
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] md:w-[40rem] md:h-[40rem] bg-amber-600/10 rounded-full blur-[60px] md:blur-[100px]"
                    style={{ willChange: 'transform, opacity' }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{
                        duration: 10, // Diperlambat agar tidak memakan CPU saat idle
                        repeat: Infinity,
                        ease: "linear", // Linear lebih ringan dikalkulasi daripada bezier untuk loop
                    }}
                />
                
                {/* Grid Pattern: Gunakan CSS pure daripada inline style untuk caching */}
                <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:40px_40px]"></div>
            </div>

            <motion.div
                className="max-w-md w-full relative z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 to-orange-500 shadow-2xl relative mb-4">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-slate-900">
                            {logoUrl ? (
                                <img src={logoUrl} alt={brandName} className="w-full h-full object-cover" loading="eager" />
                            ) : (
                                <ShoppingBag className="text-white w-10 h-10" />
                            )}
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-wide">{brandName}</h2>
                </div>

                {/* Main Card */}
                {/* md:backdrop-blur dilepas untuk mobile karena sangat berat saat scrolling/animasi */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group md:backdrop-blur-2xl">
                    <div className="text-center">
                        <motion.div
                            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 text-amber-500 mb-6"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            style={{ willChange: 'transform' }}
                        >
                            <Construction size={40} />
                        </motion.div>

                        <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
                        <p className="text-slate-300 leading-relaxed text-sm mb-6">
                            Website sedang dalam perbaikan sistem untuk meningkatkan kualitas layanan.
                        </p>

                        {/* Progress Bar - Optimized */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-1/2"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                style={{ willChange: 'transform' }}
                            />
                        </div>
                    </div>
                </div>

                <p className="text-center text-slate-500 text-sm mt-8">
                    &copy; {year} {brandName}.
                </p>
            </motion.div>
        </div>
    );
};

export default Maintenance;