import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Transaction } from '../types';
import { Loader, CheckCircle, Copy, Download, ArrowLeft, Package } from 'lucide-react';
import { supabase } from '../services/supabase';
import { getSiteConfig } from '../services/dataService';
import PageTransition from '../components/PageTransition';

const Invoice: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchData = async () => {
            // Load Site Config
            const siteConfig = await getSiteConfig();
            setConfig(siteConfig);

            if (!id) return;

            // Load Transaction
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', id)
                .single();

            if (!error && data) {
                setTransaction(data);
            }
            setLoading(false);
        };

        fetchData();
    }, [id]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Disalin ke clipboard!');
    };

    const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('id-ID', {
            dateStyle: 'long',
            timeStyle: 'short'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    if (!transaction || transaction.status !== 'PAID') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 p-4">
                <Package size={64} className="mb-4 text-slate-300" />
                <p className="text-lg font-medium">Invoice tidak ditemukan atau pembayaran belum selesai.</p>
                <Link to="/" className="mt-4 text-blue-600 hover:text-blue-700">Kembali ke Home</Link>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 transition-colors duration-300 print:bg-white print:p-0 print:pt-0">
                <div className="max-w-2xl mx-auto relative group print:max-w-none print:w-full">
                    {/* Glow Effect - Hide on Print */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 print:hidden"></div>

                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 print:shadow-none print:border-0 print:rounded-none">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 p-8 text-white relative overflow-hidden print:bg-none print:text-black print:p-0 print:mb-8 print:border-b print:border-slate-200">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/2 -translate-y-1/2 print:hidden">
                                <CheckCircle size={150} />
                            </div>

                            <div className="relative z-10 text-center print:text-left print:flex print:items-center print:justify-between">
                                <div className="print:hidden">
                                    <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-md rounded-full mb-4 shadow-lg">
                                        <CheckCircle size={40} className="text-white" />
                                    </div>
                                </div>

                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 print:text-4xl print:mb-1">INVOICE PEMBAYARAN</h1>
                                    <p className="text-indigo-100 text-sm sm:text-base max-w-md mx-auto print:text-slate-600 print:mx-0 print:text-sm">
                                        Terima kasih, pembayaran Anda telah berhasil.
                                    </p>
                                </div>

                                {/* Logo/Brand for Print Only */}
                                <div className="hidden print:block text-right">
                                    <h2 className="text-xl font-bold text-slate-900">{config.brand_name || 'HodewaStore'}</h2>
                                    <p className="text-sm text-slate-500">{config.footer_text || 'Fast & Secure Digital Payment'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Content */}
                        <div className="p-6 sm:p-8 space-y-8 print:p-0 print:px-8">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm print:gap-y-6">
                                <div className="space-y-1">
                                    <p className="text-slate-500 dark:text-slate-400 print:text-slate-500">Order ID</p>
                                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 print:text-black text-lg">{transaction.ref_id}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-slate-500 dark:text-slate-400 print:text-slate-500">Tanggal</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 print:text-black">{formatDate(transaction.created_at || '')}</p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1 print:text-slate-500">Dikirim ke Email</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 print:text-black font-mono">{transaction.buyer_email}</p>
                                </div>
                            </div>

                            {/* Product Card */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex items-start sm:items-center gap-4 print:bg-white print:border print:border-slate-300 print:rounded-lg">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 print:hidden">
                                    <Package size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 print:text-black print:text-lg">{transaction.product_title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 print:text-slate-600">
                                        <span>{transaction.quantity} Item</span>
                                        <span>•</span>
                                        <span>Lunas</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400 print:text-black">
                                        {formatPrice(transaction.get_balance || transaction.price)}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Details (Full Breakdown) */}
                            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 print:border-slate-200">
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 print:text-slate-600">
                                    <span>Total Harga (x{transaction.quantity || 1})</span>
                                    <span>{formatPrice(transaction.get_balance || transaction.price)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 print:text-slate-600">
                                    <span>
                                        Biaya Layanan
                                        {transaction.payment_method === 'ATLANTIC_QRIS' ? (
                                            <span className="inline-flex items-center gap-1 ml-1 align-bottom">
                                                (<img src="/qris2.png" alt="QRIS" className="h-5 w-auto bg-white rounded px-2 py-0.5" />)
                                            </span>
                                        ) : ' (Fee)'}
                                    </span>
                                    <span>{formatPrice(transaction.fee || 0)}</span>
                                </div>
                                {transaction.unique_code > 0 && (
                                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 print:text-slate-600">
                                        <span>Kode Unik</span>
                                        <span className="text-amber-600 dark:text-amber-400">+{transaction.unique_code}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 print:border-slate-300 text-slate-900 dark:text-white print:text-black">
                                    <span>Total Dibayar</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 print:text-black">
                                        {formatPrice((transaction.get_balance || transaction.price) + (transaction.fee || 0) + (transaction.unique_code || 0))}
                                    </span>
                                </div>
                            </div>

                            {/* Actions - Top - HIDE ON PRINT */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('URL Invoice berhasil disalin!');
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium"
                                >
                                    <Copy size={18} />
                                    Copy URL
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-all font-bold shadow-lg shadow-slate-900/10"
                                >
                                    <Download size={18} />
                                    Simpan PDF
                                </button>
                            </div>

                            {/* Stock Content (Premium) */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider print:text-black print:border-slate-300">
                                    <span>Akses Produk Anda</span>
                                    <span className="flex-1 h-px bg-slate-200 dark:border-slate-700 print:bg-slate-300"></span>
                                </div>

                                <div className="space-y-4">
                                    {(transaction.stock_content || '').split('\n---\n').map((stock, index) => (
                                        <div key={index} className="relative group perspective-1000 print:perspective-none">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500 print:hidden"></div>
                                            <div className="relative bg-white dark:bg-[#0F172A] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm print:border print:border-slate-300 print:shadow-none print:rounded-lg print:bg-white print:p-4">
                                                {/* Badge */}
                                                {((transaction.stock_content || '').split('\n---\n').length > 1) && (
                                                    <div className="absolute -top-3 left-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider print:bg-none print:bg-slate-200 print:text-black print:border print:border-slate-400">
                                                        Item #{index + 1}
                                                    </div>
                                                )}

                                                {/* Code Block */}
                                                <div className="mt-2 font-mono text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all pl-3 border-l-2 border-indigo-500/30 print:text-black print:border-slate-400">
                                                    {stock || 'Konten tidak tersedia.'}
                                                </div>

                                                {/* Copy Button - Hide on Print */}
                                                <button
                                                    onClick={() => copyToClipboard(stock || '')}
                                                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors print:hidden"
                                                    title="Copy"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {!transaction.stock_content && (
                                        <p className="text-slate-500 italic text-center print:text-slate-600">Konten belum tersedia.</p>
                                    )}
                                </div>

                                <p className="text-xs text-center text-slate-400 print:text-slate-500 print:mt-8">
                                    Pastikan kode di atas disimpan dengan aman.
                                </p>
                            </div>

                            {/* Actions - Bottom - Hide on Print */}
                            <div className="print:hidden">
                                <Link
                                    to="/"
                                    className="block w-full py-4 text-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                    <ArrowLeft size={16} className="inline mr-1" /> Kembali ke Beranda
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default Invoice;
