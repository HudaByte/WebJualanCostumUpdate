import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Transaction } from '../types';
import { Loader, CheckCircle, Copy, Download, ArrowLeft, Package } from 'lucide-react';
import { supabase } from '../services/supabase';

const Invoice: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            if (!id) return;

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

        fetchTransaction();
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Link to="/" className="text-white/80 hover:text-white">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={24} />
                            <span className="font-bold text-lg">PEMBAYARAN BERHASIL</span>
                        </div>
                        <div className="w-5"></div>
                    </div>
                    <p className="text-center text-sm opacity-90">
                        Terima kasih atas pembelian Anda!
                    </p>
                </div>

                {/* Invoice Content */}
                <div className="p-6 space-y-6">
                    {/* Order Info */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                        <h2 className="text-sm uppercase tracking-wide text-slate-500 mb-2">Detail Pesanan</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Order ID</span>
                                <span className="font-mono font-medium text-slate-900 dark:text-white">{transaction.ref_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Tanggal</span>
                                <span className="text-slate-900 dark:text-white">{formatDate(transaction.created_at || '')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Email</span>
                                <span className="text-slate-900 dark:text-white">{transaction.buyer_email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Product */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                        <h2 className="text-sm uppercase tracking-wide text-slate-500 mb-2">Produk</h2>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{transaction.product_title}</p>
                    </div>

                    {/* Payment Summary */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                        <h2 className="text-sm uppercase tracking-wide text-slate-500 mb-2">Rincian Pembayaran</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Nominal</span>
                                <span className="text-slate-900 dark:text-white">{formatPrice(transaction.get_balance || transaction.price)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Fee</span>
                                <span className="text-slate-900 dark:text-white">{formatPrice(transaction.fee || 0)}</span>
                            </div>
                            {transaction.unique_code && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Kode Unik</span>
                                    <span className="text-amber-600 dark:text-amber-400">+{transaction.unique_code}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed">
                                <span className="text-slate-900 dark:text-white">Total Dibayar</span>
                                <span className="text-green-600 dark:text-green-400">
                                    {formatPrice((transaction.get_balance || transaction.price) + (transaction.fee || 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stock Content */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h2 className="text-sm uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-3 font-bold">
                            Kode / Konten Anda
                        </h2>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-blue-300 dark:border-blue-700 relative group">
                            <pre className="font-mono text-sm break-all whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                                {transaction.stock_content || 'Konten tidak tersedia. Hubungi admin.'}
                            </pre>
                            {transaction.stock_content && (
                                <button
                                    onClick={() => copyToClipboard(transaction.stock_content || '')}
                                    className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                                    title="Copy"
                                >
                                    <Copy size={16} />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Simpan kode ini dengan baik. Invoice ini dapat diakses kapan saja.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Download size={18} />
                            Print / Download
                        </button>
                        <Link
                            to="/"
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Kembali ke Home
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 text-center text-xs text-slate-500">
                    Invoice ini dibuat otomatis oleh sistem. Jika ada pertanyaan, hubungi admin.
                </div>
            </div>
        </div>
    );
};

export default Invoice;
