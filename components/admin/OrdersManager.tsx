import React, { useState } from 'react';
import { Transaction } from '../../types';
import { Copy, CheckCircle, XCircle, Loader, CreditCard, FileText, RefreshCw } from 'lucide-react';
import { manualApproveTransaction, adminCancelTransaction, checkTransactionStatus } from '../../services/paymentService';

interface OrdersManagerProps {
    transactions: Transaction[];
    fetchData: () => void;
}

const OrdersManager: React.FC<OrdersManagerProps> = ({ transactions, fetchData }) => {
    const [loadingAction, setLoadingAction] = useState(false);
    const [checkingId, setCheckingId] = useState<string | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Disalin!');
    };

    const handleCheckStatus = async (transactionId: string) => {
        setCheckingId(transactionId);
        try {
            const updatedTrx = await checkTransactionStatus(transactionId);
            if (updatedTrx) {
                alert(`Status Terupdate: ${updatedTrx.status}`);
                fetchData();
            } else {
                alert('Tidak ada perubahan atau gagal cek status.');
            }
        } catch (error) {
            console.error(error);
            alert('Error checking status');
        }
        setCheckingId(null);
    };

    const handleManualApprove = async (transactionId: string) => {
        if (!confirm('Yakin setujui manual? Stok akan dikirim ke user.')) return;
        setLoadingAction(true);
        const success = await manualApproveTransaction(transactionId);
        if (success) {
            alert('Transaksi disetujui!');
            fetchData();
        } else {
            alert('Gagal menyetujui transaksi.');
        }
        setLoadingAction(false);
    };

    const handleCancelTransaction = async (transactionId: string) => {
        if (!confirm('Yakin batalkan transaksi ini? Stok akan dikembalikan.')) return;
        setLoadingAction(true);
        const success = await adminCancelTransaction(transactionId);
        if (success) {
            alert('Transaksi dibatalkan!');
            fetchData();
        } else {
            alert('Gagal membatalkan transaksi.');
        }
        setLoadingAction(false);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = transactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Daftar Pesanan</h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4">Ref ID</th>
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Produk</th>
                                <th className="p-4">Pembeli</th>
                                <th className="p-4">Harga</th>
                                <th className="p-4">Metode</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {paginatedTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-mono text-xs">{t.ref_id}</td>
                                    <td className="p-4 text-xs text-slate-500">{new Date(t.created_at || '').toLocaleDateString()} {new Date(t.created_at || '').toLocaleTimeString()}</td>
                                    <td className="p-4 font-medium max-w-[200px] truncate" title={t.product_title}>{t.product_title}</td>
                                    <td className="p-4 text-xs">
                                        <div>{t.buyer_email}</div>
                                        <div className="text-slate-500">{t.buyer_phone}</div>
                                    </td>
                                    <td className="p-4 font-medium">Rp {t.price.toLocaleString()}</td>
                                    <td className="p-4 text-xs uppercase">{t.payment_method === 'ATLANTIC_QRIS' ? 'QRIS Auto' : 'Manual'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1 ${t.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                t.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {t.status === 'PAID' ? <CheckCircle size={12} /> : t.status === 'CANCELLED' ? <XCircle size={12} /> : <Loader size={12} className="animate-spin" />}
                                                {t.status}
                                            </span>
                                            {t.status === 'PENDING' && t.payment_method === 'ATLANTIC_QRIS' && (
                                                <button onClick={() => handleCheckStatus(t.id)} disabled={checkingId === t.id} className="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="Cek Status Terbaru">
                                                    <RefreshCw size={14} className={checkingId === t.id ? "animate-spin" : ""} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => copyToClipboard(`${window.location.origin}/payment/${t.id}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded" title="Copy Payment URL"><CreditCard size={16} /></button>
                                            <button onClick={() => copyToClipboard(`${window.location.origin}/invoice/${t.id}`)} className="p-1.5 text-purple-600 hover:bg-purple-50 border border-purple-200 rounded" title="Copy Invoice URL"><FileText size={16} /></button>
                                            <button onClick={() => copyToClipboard(`${t.ref_id} - ${t.product_title}`)} className="p-1.5 text-slate-500 hover:text-blue-500 border rounded" title="Copy Info"><Copy size={16} /></button>

                                            {t.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleManualApprove(t.id)}
                                                        disabled={loadingAction}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 border border-green-200 rounded disabled:opacity-50"
                                                        title="Approve Manual"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelTransaction(t.id)}
                                                        disabled={loadingAction}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded disabled:opacity-50"
                                                        title="Batalkan"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500">Belum ada pesanan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50">
                    {paginatedTransactions.map(t => (
                        <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{t.ref_id}</span>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(t.created_at || '').toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1 ${t.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        t.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                        {t.status}
                                    </span>
                                    {t.status === 'PENDING' && t.payment_method === 'ATLANTIC_QRIS' && (
                                        <button onClick={() => handleCheckStatus(t.id)} disabled={checkingId === t.id} className="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="Cek Status Terbaru">
                                            <RefreshCw size={14} className={checkingId === t.id ? "animate-spin" : ""} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">{t.product_title}</h4>
                                <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">Rp {t.price.toLocaleString()}</p>
                            </div>

                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                <p><span className="font-semibold">Pembeli:</span> {t.buyer_email}</p>
                                <p><span className="font-semibold">Phone:</span> {t.buyer_phone}</p>
                                <p><span className="font-semibold">Metode:</span> {t.payment_method === 'ATLANTIC_QRIS' ? 'QRIS Auto' : 'Manual'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                                <button onClick={() => copyToClipboard(`${window.location.origin}/payment/${t.id}`)} className="py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-medium flex items-center justify-center gap-1">
                                    <CreditCard size={14} /> Copy Payment
                                </button>
                                <button onClick={() => copyToClipboard(`${window.location.origin}/invoice/${t.id}`)} className="py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded text-xs font-medium flex items-center justify-center gap-1">
                                    <FileText size={14} /> Copy Invoice
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => copyToClipboard(`${t.ref_id} - ${t.product_title}`)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium flex items-center justify-center gap-1">
                                    <Copy size={14} /> Copy Info
                                </button>
                                {t.status === 'PENDING' && (
                                    <>
                                        <button onClick={() => handleManualApprove(t.id)} disabled={loadingAction} className="flex-1 py-2 bg-green-50 text-green-600 border border-green-200 rounded text-xs font-medium flex items-center justify-center gap-1">
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                        <button onClick={() => handleCancelTransaction(t.id)} disabled={loadingAction} className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium flex items-center justify-center gap-1">
                                            <XCircle size={14} /> Batal
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {paginatedTransactions.length === 0 && (
                        <p className="text-center text-slate-500 py-8">Belum ada pesanan.</p>
                    )}
                </div>

                {/* Pagination Controls */}
                {transactions.length > ITEMS_PER_PAGE && (
                    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Halaman {currentPage} dari {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersManager;
