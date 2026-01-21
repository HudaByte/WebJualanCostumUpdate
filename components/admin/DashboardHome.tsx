import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Transaction, Product } from '../../types';
import {
    TrendingUp,
    ShoppingBag,
    Users,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

interface DashboardHomeProps {
    transactions: Transaction[];
    products: Product[];
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ transactions, products }) => {
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

    // --- STATS CALCULATION ---
    const stats = useMemo(() => {
        const paidTrx = transactions.filter(t => t.status === 'PAID');

        // Filter by date range
        const now = new Date();
        const filteredTrx = paidTrx.filter(t => {
            const d = new Date(t.created_at || '');
            if (dateRange === 'today') return d.toDateString() === now.toDateString();
            if (dateRange === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return d >= weekAgo;
            }
            if (dateRange === 'month') {
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                return d >= monthAgo;
            }
            return true;
        });

        const totalRevenue = filteredTrx.reduce((acc, curr) => acc + (curr.price || 0), 0);
        const totalOrders = filteredTrx.length;

        // Average Order Value
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return { totalRevenue, totalOrders, aov };
    }, [transactions, dateRange]);

    // --- CHART DATA PREP ---
    const chartData = useMemo(() => {
        const paidTrx = transactions.filter(t => t.status === 'PAID');
        const days = 7;
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const checkDate = d.toDateString();

            const dayTotal = paidTrx
                .filter(t => new Date(t.created_at || '').toDateString() === checkDate)
                .reduce((sum, t) => sum + (t.price || 0), 0);

            data.push({ date: dateStr, value: dayTotal, label: d.toLocaleDateString('id-ID', { weekday: 'short' }) });
        }
        return data;
    }, [transactions]);

    const maxChartValue = Math.max(...chartData.map(d => d.value), 100);

    // --- RECENT ORDERS ---
    const recentOrders = useMemo(() => {
        return transactions.slice(0, 5);
    }, [transactions]);

    return (
        <div className="space-y-6">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400">Welcome back, Admin!</p>
                </div>

                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    {(['today', 'week', 'month', 'all'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setDateRange(r)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${dateRange === r
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            {r === 'today' ? 'Hari Ini' : r === 'week' ? '7 Hari' : r === 'month' ? 'Sebulan' : 'Semua'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Pendapatan</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                Rp {stats.totalRevenue.toLocaleString('id-ID')}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <ArrowUpRight size={16} />
                        <span className="font-medium">+0%</span>
                        <span className="text-slate-400 dark:text-slate-500">dari periode lalu</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Pesanan</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                {stats.totalOrders}
                            </h3>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <ShoppingBag size={24} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Rata-rata Order</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                Rp {Math.round(stats.aov).toLocaleString('id-ID')}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Chart Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Grafik Penjualan (7 Hari Terakhir)</h3>

                <div className="h-64 flex items-end justify-between gap-2 md:gap-4">
                    {chartData.map((d, i) => {
                        const height = (d.value / maxChartValue) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full relative h-[200px] flex items-end rounded-t-lg bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors rounded-t-md relative group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                            Rp {d.value.toLocaleString()}
                                        </div>
                                    </motion.div>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium rotate-0 truncate w-full text-center">
                                    {d.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pesanan Terbaru</h3>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Lihat Semua</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Produk</th>
                                <th className="p-4">Harga</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Waktu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentOrders.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{t.ref_id}</td>
                                    <td className="p-4 text-slate-900 dark:text-white font-medium truncate max-w-[200px]">{t.product_title}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">Rp {(t.price || 0).toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            t.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-xs">
                                        {t.created_at ? new Date(t.created_at).toLocaleString() : '-'}
                                    </td>
                                </tr>
                            ))}
                            {recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Belum ada pesanan terbaru.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
