import React, { useState } from 'react';
import { Product } from '../../types';
import { Plus, Edit2, Trash2, Database, Upload } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct, uploadImage, getProductStockCount, getProductStocksList, addProductStocks, updateProductStock, deleteProductStock } from '../../services/dataService';

// Reusing the stock modal logic would be complex if not extracted too.
// For now, I'll keep the UI part here and props for stock.
// Or better, extract StockModal as a separate component.

interface ProductsManagerProps {
    products: Product[];
    fetchData: () => void;
    onStockClick: (product: Product) => void;
}

const ProductsManager: React.FC<ProductsManagerProps> = ({ products, fetchData, onStockClick }) => {
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [uploadingImg, setUploadingImg] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setLoading(true);

        try {
            if (editingProduct.id) {
                await updateProduct(editingProduct.id, editingProduct);
            } else {
                await createProduct(editingProduct as any);
            }
            setEditingProduct(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error saving product');
        }
        setLoading(false);
    };

    const handleDeleteProduct = async (id: number) => {
        if (!window.confirm('Yakin hapus?')) return;
        setLoading(true);
        await deleteProduct(id);
        setLoading(false);
        fetchData();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploadingImg(true);
        try {
            const publicUrl = await uploadImage(file);
            if (editingProduct) {
                setEditingProduct({ ...editingProduct, image_url: publicUrl });
            }
        } catch (error) {
            alert("Gagal upload gambar.");
        } finally {
            setUploadingImg(false);
        }
    };

    return (
        <div>
            {/* Product List & Form */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">List Produk</h2>
                <button onClick={() => setEditingProduct({})} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm"><Plus size={16} /> Tambah Produk</button>
            </div>

            {editingProduct && (
                <form onSubmit={handleProductSubmit} className="mb-8 bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">{editingProduct.id ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Title */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Judul Produk</label>
                            <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Judul Produk" value={editingProduct.title || ''} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} required />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Harga Jual (Final)</label>
                            <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: 150000" type="number" value={editingProduct.price || ''} onChange={e => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) })} required />
                        </div>

                        {/* Payment Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Metode Pembayaran</label>
                            <select
                                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                value={editingProduct.payment_type || 'AUTO'}
                                onChange={(e) => setEditingProduct({ ...editingProduct, payment_type: e.target.value as 'AUTO' | 'MANUAL' })}
                            >
                                <option value="AUTO">Otomatis (QRIS)</option>
                                <option value="MANUAL">Manual (WhatsApp Admin)</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Manual: User akan diarahkan ke WA Admin. Otomatis: User scan QRIS.</p>
                        </div>

                        {/* Original Price (Coret) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Harga Coret / Asli (Opsional)</label>
                            <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: 300000" type="number" value={editingProduct.original_price || ''} onChange={e => setEditingProduct({ ...editingProduct, original_price: e.target.value ? parseInt(e.target.value) : undefined })} />
                        </div>

                        {/* Image Section */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Gambar Produk</label>
                            <div className="flex gap-2">
                                <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="URL Gambar" value={editingProduct.image_url || ''} onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })} required />
                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                                    {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />} <span className="hidden sm:inline">Upload</span> <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Link Tujuan</label>
                            <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Link Tujuan" value={editingProduct.link || ''} onChange={e => setEditingProduct({ ...editingProduct, link: e.target.value })} required />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Teks Tombol</label>
                            <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Teks Tombol (Default: Beli Sekarang)" value={editingProduct.button_text || ''} onChange={e => setEditingProduct({ ...editingProduct, button_text: e.target.value })} />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Deskripsi Singkat</label>
                            <textarea className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Deskripsi Singkat" value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} required />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Konten Lengkap</label>
                            <textarea className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full h-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Konten Lengkap" value={editingProduct.content || ''} onChange={e => setEditingProduct({ ...editingProduct, content: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-2"><button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white" disabled={uploadingImg || loading}>Simpan</button><button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded text-slate-700 dark:text-slate-300">Batal</button></div>
                </form>
            )}
            {/* Product List */}
            <div className="grid gap-4">
                {products.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                            <img src={p.image_url} alt="" className="w-16 h-16 flex-shrink-0 rounded object-cover" />
                            <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 md:truncate">{p.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Rp {p.price.toLocaleString()}</span>
                                    {p.original_price ? <span className="line-through ml-2 text-red-400">Rp {p.original_price.toLocaleString()}</span> : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <button onClick={() => onStockClick(p)} className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50 flex items-center gap-1 transition-colors text-sm font-medium">
                                <Database size={16} /> Stok
                            </button>
                            <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-600 border rounded"><Edit2 size={18} /></button>
                            <button onDoubleClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-500 border rounded" title="Double Click to Delete"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
                {products.length === 0 && <p className="text-center text-slate-500">Belum ada produk.</p>}
            </div>
        </div>
    );
};

export default ProductsManager;
