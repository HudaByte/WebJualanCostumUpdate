import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Edit2, X, CheckCircle } from 'lucide-react';
import { getProductById, getProductStocksList, addProductStocks, updateProductStock, deleteProductStock, getProductStockCount } from '../services/dataService';
import { Product } from '../types';

const StockManager: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [stockList, setStockList] = useState<any[]>([]);
    const [stockCount, setStockCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Add State
    const [stockInput, setStockInput] = useState('');

    // Edit State
    const [editingStockId, setEditingStockId] = useState<number | null>(null);
    const [editingStockContent, setEditingStockContent] = useState('');

    useEffect(() => {
        if (id) fetchProductAndStocks(parseInt(id));
    }, [id]);

    const fetchProductAndStocks = async (productId: number) => {
        setLoading(true);
        const p = await getProductById(productId);
        if (p) {
            setProduct(p);
            await fetchStockData(productId);
        }
        setLoading(false);
    };

    const fetchStockData = async (productId: number) => {
        const count = await getProductStockCount(productId);
        const list = await getProductStocksList(productId);
        setStockCount(count);
        setStockList(list);
    };

    const handleAddStocks = async () => {
        if (!product || !stockInput.trim()) return;
        setLoading(true);
        const newItem = stockInput.trim();
        try {
            await addProductStocks(product.id, [newItem]);
            setStockInput('');
            await fetchStockData(product.id);
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
            if (product) await fetchStockData(product.id);
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
            if (product) await fetchStockData(product.id);
        } catch (e) {
            alert('Gagal hapus stok');
        }
        setLoading(false);
    };

    if (loading && !product) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">Loading...</div>;
    }

    if (!product) return <div>Product Not Found</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-900 dark:text-white pb-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/adminhodewa')} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100"><ArrowLeft size={20} /></button>
                    <h1 className="text-2xl font-bold truncate flex-1">Kelola Stok: {product.title}</h1>
                </div>

                <div className="grid gap-6">
                    {/* STATS */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">Total Stok Tersedia</h2>
                            <p className="text-sm text-slate-500">Siap dijual otomatis</p>
                        </div>
                        <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stockCount}</span>
                    </div>

                    {/* ADD FORM */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold flex items-center gap-2 mb-4"><Plus className="text-green-500" /> Tambah Stok Baru</h3>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                            rows={4}
                            placeholder="Paste data akun/voucher di sini..."
                            value={stockInput}
                            onChange={(e) => setStockInput(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end">
                            <button
                                onClick={handleAddStocks}
                                disabled={!stockInput.trim() || loading}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                <Save size={20} /> Simpan Stok
                            </button>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700">
                            Daftar Stok
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="p-4">Konten</th>
                                        <th className="p-4 w-32">Status</th>
                                        <th className="p-4 w-32 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {stockList.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-400">Belum ada stok</td></tr>
                                    ) : (
                                        stockList.map(stock => (
                                            <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                <td className="p-4 align-top">
                                                    {editingStockId === stock.id ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-blue-500 rounded p-2 font-mono text-xs focus:outline-none"
                                                                rows={3}
                                                                value={editingStockContent}
                                                                onChange={(e) => setEditingStockContent(e.target.value)}
                                                            ></textarea>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleUpdateStock(stock.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200">Simpan</button>
                                                                <button onClick={() => setEditingStockId(null)} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-200">Batal</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="font-mono text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-100 dark:border-slate-700">
                                                            {stock.content}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 align-top">
                                                    {stock.is_claimed ? (
                                                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold border border-red-200">
                                                            Terjual
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold border border-green-200">
                                                            <CheckCircle size={10} /> Tersedia
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-top text-center">
                                                    {editingStockId !== stock.id && (
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                onClick={() => { setEditingStockId(stock.id); setEditingStockContent(stock.content); }}
                                                                disabled={stock.is_claimed}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteStock(stock.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockManager;
