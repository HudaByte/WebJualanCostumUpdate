import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { checkTransactionStatus, cancelAtlanticTransaction } from '../services/paymentService';
import { Transaction } from '../types';
import { Loader, XCircle, CheckCircle, Copy, AlertTriangle, ArrowLeft, RefreshCw, Clock, Download, Heart } from 'lucide-react';
import { getPaymentConfig } from '../services/dataService';
import { supabase } from '../services/supabase';
import PageTransition from '../components/PageTransition';

const Payment: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<Record<string, string>>({});
    const [cancelling, setCancelling] = useState(false);
    const [checking, setChecking] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');

    const fetchTransaction = useCallback(async () => {
        if (!id) return;
        const trx = await checkTransactionStatus(id);
        if (trx) setTransaction(trx);
        setLoading(false);
    }, [id]);

    useEffect(() => {
        fetchTransaction();
        getPaymentConfig().then(setConfig);

        const interval = setInterval(() => {
            if (transaction && transaction.status === 'PENDING') {
                fetchTransaction();
            }
        }, 10000); // Poll slower (10s) since we have manual check
        return () => clearInterval(interval);
    }, [fetchTransaction, transaction?.status]);

    // Countdown Timer Logic
    useEffect(() => {
        if (!transaction || transaction.status !== 'PENDING' || !transaction.expired_at) {
            setTimeLeft('');
            return;
        }

        const tick = () => {
            const now = new Date().getTime();
            const expired = new Date(transaction.expired_at!).getTime();
            const diff = expired - now;

            if (diff <= 0) {
                setTimeLeft('Waktu Habis');
            } else {
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}m ${seconds}s`);
            }
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [transaction]);

    const handleCheckStatus = async () => {
        if (!id) return;
        setChecking(true);
        await fetchTransaction();
        setChecking(false);
    };

    const handleCancel = async () => {
        if (!transaction || !transaction.atlantic_id) return;
        if (!confirm('Apakah Anda yakin ingin membatalkan transaksi ini?')) return;

        setCancelling(true);
        const apiKey = config['atlantic_api_key'];
        if (!apiKey) {
            alert("Konfigurasi API Key tidak ditemukan.");
            setCancelling(false);
            return;
        }

        const res = await cancelAtlanticTransaction(transaction.atlantic_id, apiKey);
        if (res.status) {
            if (transaction.reserved_stock_id) {
                await supabase.from('product_stocks').update({ is_claimed: false }).eq('id', transaction.reserved_stock_id);
            }
            await supabase.from('transactions').update({ status: 'CANCELLED' }).eq('id', transaction.id);
            alert('Transaksi berhasil dibatalkan.');
            fetchTransaction();
        } else {
            alert('Gagal membatalkan transaksi: ' + (res.message || 'Unknown error'));
        }
        setCancelling(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Disalin!');
    };

    const copyPaymentUrl = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl);
        alert('URL Pembayaran berhasil disalin!');
    };

    const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader className="animate-spin text-blue-500" /></div>;

    if (!transaction) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
            Transaksi tidak ditemukan.
        </div>
    );

    const isPaid = transaction.status === 'PAID';
    const isCancelled = transaction.status === 'CANCELLED' || transaction.status === 'FAILED';

    // Use original price for user display

    const displayAmount = transaction.price;
    // Calculate Total User Must Pay: Price + Fee + Unique Code
    const totalPay = displayAmount + (transaction.fee || 0) + (transaction.unique_code || 0);

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 transition-colors duration-300">

                <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    {/* Header */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <Link to="/" className="text-slate-500 hover:text-blue-500"><ArrowLeft size={20} /></Link>
                        <h1 className="font-bold text-slate-700 dark:text-slate-200">Detail Pembayaran</h1>
                        <div className="w-5"></div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Status Badge */}
                        <div className="text-center space-y-2">
                            {isPaid ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold">
                                    <CheckCircle size={20} /> BERHASIL
                                </div>
                            ) : isCancelled ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full font-bold">
                                    <XCircle size={20} /> DIBATALKAN
                                </div>
                            ) : (
                                <>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-bold animate-pulse">
                                        <Loader size={20} className="animate-spin" /> MENUNGGU PEMBAYARAN
                                    </div>
                                    {timeLeft && (
                                        <div className="text-red-500 font-mono font-bold flex items-center justify-center gap-2 mt-2">
                                            <Clock size={16} /> Batas Waktu: {timeLeft}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <p className="text-sm text-slate-500">Order ID</p>
                            <div className="flex items-center justify-between">
                                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{transaction.ref_id}</span>
                                <button onClick={() => copyToClipboard(transaction.ref_id || '')} className="text-blue-500"><Copy size={14} /></button>
                            </div>
                            <p className="text-sm text-slate-500 mt-2">Item</p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {transaction.product_title} {transaction.quantity && transaction.quantity > 1 ? `(x${transaction.quantity})` : ''}
                            </p>
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>Nominal</span>
                                <span>{formatPrice(displayAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>Biaya Layanan ({transaction.payment_method === 'ATLANTIC_QRIS' ? 'QRIS' : 'Manual'})</span>
                                <span>{formatPrice(transaction.fee || 0)}</span>
                            </div>
                            {/* Only show Unique Code if > 0 */}
                            {transaction.unique_code ? (
                                <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/10 px-2 py-1 rounded">
                                    <span>Kode Unik (Wajib Transfer Pas)</span>
                                    <span>+{transaction.unique_code}</span>
                                </div>
                            ) : null}

                            <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 items-end">
                                <span>Total yang Harus Dibayar</span>
                                <div className="text-right">
                                    <span className="text-blue-600 dark:text-blue-400 block text-2xl">{formatPrice(totalPay)}</span>
                                    <span className="text-xs text-slate-400 font-normal">Termasuk biaya admin & kode unik</span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        {!isPaid && !isCancelled && transaction.payment_method === 'ATLANTIC_QRIS' && (
                            <div className="flex flex-col items-center gap-4 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                {transaction.payment_url ? (
                                    <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200">
                                        <img src={transaction.payment_url} alt="QRIS Code" className="w-48 h-48 object-contain" />
                                    </div>
                                ) : (
                                    <div className="text-red-500 text-sm">QR Code tidak dimuat.</div>
                                )}
                                <p className="text-xs text-center text-slate-500 max-w-xs">
                                    Scan QRIS di atas dengan GoPay, OVO, Dana, atau Mobile Banking apa saja.
                                </p>

                                {/* Check Status Button */}
                                <button
                                    onClick={handleCheckStatus}
                                    disabled={checking}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full font-bold text-sm transition-colors"
                                >
                                    <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
                                    {checking ? "Mengecek..." : "Cek Status Pembayaran"}
                                </button>
                            </div>
                        )}

                        {/* Thank You Message & Actions for PAID Status */}
                        {isPaid && (
                            <>
                                {/* Thank You Section */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800 text-center space-y-3 animate-fade-in-up">
                                    <div className="flex justify-center">
                                        <div className="bg-green-100 dark:bg-green-800/30 p-3 rounded-full">
                                            <Heart className="text-green-600 dark:text-green-400" size={32} fill="currentColor" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-green-700 dark:text-green-300">Terima Kasih!</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Pembayaran Anda telah berhasil diproses. Kami sangat menghargai kepercayaan Anda!
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={copyPaymentUrl}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm"
                                    >
                                        <Copy size={18} />
                                        Copy URL
                                    </button>
                                    <Link
                                        to={`/invoice/${transaction.id}`}
                                        target="_blank"
                                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm shadow-md hover:shadow-lg"
                                    >
                                        <Download size={18} />
                                        Download Invoice
                                    </Link>
                                </div>

                                {/* Paid Content Delivery */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                                        <span>Akses Produk Anda</span>
                                        <span className="flex-1 h-px bg-slate-200 dark:border-slate-700"></span>
                                    </div>

                                    {(transaction.stock_content || '').split('\n---\n').map((content, index) => (
                                        <div key={index} className="relative group">
                                            {((transaction.stock_content || '').split('\n---\n').length > 1) && (
                                                <div className="absolute -top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider z-10">
                                                    Item #{index + 1}
                                                </div>
                                            )}
                                            <div className="font-mono text-sm break-all text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 pt-4 rounded-lg border border-blue-200 dark:border-blue-800 flex justify-between items-start gap-2 shadow-sm relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                                <span className="ml-2">{content}</span>
                                                <button onClick={() => copyToClipboard(content)} className="text-blue-500 shrink-0 hover:text-blue-600 p-1 bg-blue-50 dark:bg-blue-900/30 rounded"><Copy size={14} /></button>
                                            </div>
                                        </div>
                                    ))}

                                    <p className="text-xs text-center text-slate-400 mt-2">
                                        Simpan kode/link ini baik-baik.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Cancel Button */}
                        {!isPaid && !isCancelled && transaction.atlantic_id && (
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="w-full py-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {cancelling ? <Loader size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                                Batalkan Transaksi
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default Payment;
