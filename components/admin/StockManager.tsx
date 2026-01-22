import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Edit2, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Product } from '../../types';
import { getProductStockCount, getProductStocksList, addProductStocks, updateProductStock, deleteProductStock } from '../../services/dataService';

interface StockManagerProps {
    product: Product;
    onBack: () => void;
}

const StockManager: React.FC<StockManagerProps> = ({ product, onBack }) => {
    const [stockList, setStockList] = useState<any[]>([]);
    const [stockCount, setStockCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filter & Pagination
    const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Add State
    const [stockInput, setStockInput] = useState('');

    // Edit State
    const [editingStockId, setEditingStockId] = useState<number | null>(null);
    const [editingStockContent, setEditingStockContent] = useState('');

    useEffect(() => {
        fetchStockData();
    }, [product]);

    const fetchStockData = async () => {
        setLoading(true);
        const count = await getProductStockCount(product.id);
        const list = await getProductStocksList(product.id);
        setStockCount(count);
        setStockList(list);
        setLoading(false);
    };

    const handleAddStocks = async () => {
        if (!stockInput.trim()) return;
        setLoading(true);

        try {
            // Parse input: ONLY support pipe (|) as delimiter
            const rawInput = stockInput.trim();

            // Split by pipe and filter empty strings
            const items = rawInput
                .split('|')
                .map(item => item.trim())
                .filter(item => item.length > 0);

            if (items.length === 0) {
                alert('Tidak ada stok valid untuk ditambahkan');
                setLoading(false);
                return;
            }

            // Add all items
            await addProductStocks(product.id, items);
            setStockInput('');
            await fetchStockData();

            alert(`Berhasil menambahkan ${items.length} stok!`);
        } catch (e) {
            alert('Gagal menambah stok');
        }
        setLoading(false);
    };

    const handleUpdateStock = async (stockId: number) => {
        if (!editingStockContent.trim()) return;
        setLoading(true);
        try {
            await updateProductStock(stockId, editingStockContent);
            setEditingStockId(null);
            await fetchStockData();
        } catch (e) {
            alert('Gagal update stok');
        }
        setLoading(false);
    };

    const handleDeleteStock = async (stockId: number) => {
        if (!window.confirm("Hapus stok ini?")) return;
        setLoading(true);
        try {
            await deleteProductStock(stockId);
            await fetchStockData();
        } catch (e) {
            alert('Gagal hapus stok');
        }
        setLoading(false);
    };

    // --- DERIVED DATA (Filter -> Sort -> Paginate) ---
    const processedStocks = useMemo(() => {
        let data = [...stockList];

        // 1. Filter
        if (filterStatus === 'available') {
            data = data.filter(s => !s.is_claimed);
        } else if (filterStatus === 'sold') {
            data = data.filter(s => s.is_claimed);
        }

        // 2. Sort (Available first, then by ID desc)
        data.sort((a, b) => {
            if (a.is_claimed === b.is_claimed) {
                return b.id - a.id; // Newest first
            }
            return a.is_claimed ? 1 : -1; // Available (false) before Sold (true)
        });

        return data;
    }, [stockList, filterStatus]);

    const totalPages = Math.ceil(processedStocks.length / itemsPerPage);
    const paginatedStocks = processedStocks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kelola Stok</h1>
                        <p className="text-slate-500 text-sm">Produk: <span className="font-semibold text-blue-600 dark:text-blue-400">{product.title}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase font-bold">Stok Tersedia</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none">{stockCount}</p>
                    </div>
                </div>
            </div>

            {/* ADD FORM */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-white"><Plus className="text-green-500" /> Tambah Stok Baru</h3>
                <textarea
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4 transition-all"
                    rows={3}
                    placeholder="Paste data akun/voucher di sini..."
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                ></textarea>
                <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">💡 Tips: Pisahkan dengan <strong className="text-blue-600">|</strong> (pipe). Contoh: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">stock1|stock2|stock3</code></p>
                    <button
                        onClick={handleAddStocks}
                        disabled={!stockInput.trim() || loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                    >
                        <Save size={18} /> Simpan Stok
                    </button>
                </div>
            </div>

            {/* FILTER & LIST */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Daftar Stok <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{processedStocks.length} Item</span>
                    </h3>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {(['all', 'available', 'sold'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => { setFilterStatus(f); setCurrentPage(1); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === f
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {f === 'all' ? 'Semua' : f === 'available' ? 'Tersedia' : 'Terjual'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="p-4 w-16 text-center">No.</th>
                                <th className="p-4">Konten Stok</th>
                                <th className="p-4 w-32 text-center">Status</th>
                                <th className="p-4 w-32 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {paginatedStocks.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Tidak ada data stok.</td></tr>
                            ) : (
                                paginatedStocks.map((stock, index) => {
                                    const realIndex = (currentPage - 1) * itemsPerPage + index + 1;
                                    return (
                                        <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="p-4 text-center text-slate-400 text-xs">{realIndex}</td>
                                            <td className="p-4 align-top">
                                                {editingStockId === stock.id ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            className="w-full bg-white dark:bg-slate-800 border border-blue-500 rounded p-2 font-mono text-xs focus:outline-none"
                                                            rows={3}
                                                            value={editingStockContent}
                                                            onChange={(e) => setEditingStockContent(e.target.value)}
                                                            autoFocus
                                                        ></textarea>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleUpdateStock(stock.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200">Simpan</button>
                                                            <button onClick={() => setEditingStockId(null)} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-200">Batal</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`font-mono text-sm whitespace-pre-wrap break-all ${stock.is_claimed ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {stock.content}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center align-top">
                                                {stock.is_claimed ? (
                                                    <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">
                                                        <XCircle size={12} /> Terjual
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-bold">
                                                        <CheckCircle size={12} /> Tersedia
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center align-top">
                                                {editingStockId !== stock.id && (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => { setEditingStockId(stock.id); setEditingStockContent(stock.content); }}
                                                            disabled={stock.is_claimed}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStock(stock.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Prev
                        </button>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockManager;
