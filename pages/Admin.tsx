import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Plus, Trash2, Edit2, Save, Layout, Package, Gift, Settings, Upload, Image as ImageIcon, Share2, Link as LinkIcon, Search, DollarSign, FileText, ShoppingBag, Database, X, Copy } from 'lucide-react';
import { getProducts, getFreebies, getSiteConfig, getSocialLinks, createProduct, updateProduct, deleteProduct, createFreebie, updateFreebie, deleteFreebie, createSocialLink, deleteSocialLink, saveSiteConfig, uploadImage, getTransactions, getPaymentConfig, savePaymentConfig, addProductStocks, getProductStockCount, getProductStocksList, updateProductStock, deleteProductStock } from '../services/dataService';
import { testAtlanticConnection, manualApproveTransaction, adminCancelTransaction } from '../services/paymentService';
import { Product, Freebie, SocialLink, Transaction, TransactionStatus } from '../types';

interface ConfigInputProps {
  label: string;
  confKey: string;
  type?: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
}

const ConfigInput: React.FC<ConfigInputProps> = React.memo(({ label, confKey, type = "text", help, value, onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
    {type === 'textarea' ? (
      <textarea
        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
      />
    ) : (
      <input
        type={type}
        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
    {help && <p className="text-xs text-slate-400 mt-1">{help}</p>}
  </div>
));

ConfigInput.displayName = 'ConfigInput';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'products' | 'freebies' | 'config' | 'socials' | 'seo' | 'orders' | 'payment'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [freebies, setFreebies] = useState<Freebie[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Edit/Add State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingFreebie, setEditingFreebie] = useState<Partial<Freebie> | null>(null);
  const [newSocial, setNewSocial] = useState<Partial<SocialLink>>({ label: '', url: '' });

  // Stock Mgmt State
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockCount, setStockCount] = useState(0);
  const [stockInput, setStockInput] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('neon_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const p = await getProducts();
    const f = await getFreebies();
    const c = await getSiteConfig();
    const s = await getSocialLinks();
    const t = await getTransactions();
    const pc = await getPaymentConfig();
    setProducts(p);
    setFreebies(f);
    setConfig(c);
    setSocials(s);
    setTransactions(t);
    setPaymentConfig(pc);
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Hudzganteng') {
      setIsAuthenticated(true);
      localStorage.setItem('neon_admin_auth', 'true');
      fetchData();
    } else {
      setError('Password salah!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('neon_admin_auth');
  };

  // --- HANDLERS ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'freebie' | 'logo' | 'og' | 'hero') => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploadingImg(true);

    try {
      const publicUrl = await uploadImage(file);
      if (type === 'product' && editingProduct) {
        setEditingProduct({ ...editingProduct, image_url: publicUrl });
      } else if (type === 'freebie' && editingFreebie) {
        setEditingFreebie({ ...editingFreebie, image_url: publicUrl });
      } else if (type === 'logo') {
        setConfig(prev => ({ ...prev, brand_logo_url: publicUrl }));
      } else if (type === 'og') {
        setConfig(prev => ({ ...prev, seo_og_image: publicUrl }));
      } else if (type === 'hero') {
        setConfig(prev => ({ ...prev, hero_image_url: publicUrl }));
      }
    } catch (error) {
      alert("Gagal mengupload gambar. Pastikan bucket 'images' ada di Supabase.");
      console.error(error);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(config)) {
        await saveSiteConfig(key, value as string);
      }
      alert('Config Saved!');
    } catch (err) {
      alert('Error saving config');
    }
    setLoading(false);
  };

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
    await deleteProduct(id);
    fetchData();
  };

  const handleFreebieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFreebie) return;
    setLoading(true);
    try {
      if (editingFreebie.id) {
        await updateFreebie(editingFreebie.id, editingFreebie);
      } else {
        await createFreebie(editingFreebie as any);
      }
      setEditingFreebie(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving freebie');
    }
    setLoading(false);
  };

  const handleDeleteFreebie = async (id: number) => {
    if (!window.confirm('Yakin hapus?')) return;
    await deleteFreebie(id);
    fetchData();
  };

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocial.label || !newSocial.url) return;
    setLoading(true);
    try {
      await createSocialLink(newSocial as any);
      setNewSocial({ label: '', url: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error adding social link');
    }
    setLoading(false);
  };

  const handleDeleteSocial = async (id: number) => {
    if (!window.confirm('Hapus link ini?')) return;
    await deleteSocialLink(id);
    fetchData();
  };

  const handleConfigChange = useCallback((key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // --- PAYMENT SETTINGS ---
  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(paymentConfig)) {
        await savePaymentConfig(key, value as string);
      }
      alert('Payment Config Saved!');
    } catch (err) {
      alert('Error saving payment config');
    }
    setLoading(false);
  };

  // --- STOCK MGMT ---
  // ... inside Admin component ...

  // ... inside Admin component ...
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'failed'>('idle');
  const [checkingConnection, setCheckingConnection] = useState(false);

  const handleTestConnection = async () => {
    setCheckingConnection(true);
    setConnectionStatus('checking');
    try {
      const apiKey = paymentConfig['atlantic_api_key'];
      const isConnected = await testAtlanticConnection(apiKey);
      if (isConnected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('failed');
        alert("Koneksi Gagal. Pastikan API Key benar.");
      }
    } catch (e) {
      setConnectionStatus('failed');
      alert("Error Checking Connection");
    }
    setCheckingConnection(false);
  };

  const [stockList, setStockList] = useState<any[]>([]);
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [editingStockContent, setEditingStockContent] = useState('');

  const fetchStockData = async (productId: number) => {
    const count = await getProductStockCount(productId);
    const list = await getProductStocksList(productId);
    setStockCount(count);
    setStockList(list);
  };

  const handleStockClick = async (product: Product) => {
    setStockProduct(product);
    setLoading(true);
    await fetchStockData(product.id);
    setLoading(false);
    setShowStockModal(true);
  };

  const handleAddStocks = async () => {
    if (!stockProduct || !stockInput.trim()) return;
    setLoading(true);
    // Treat the input as a single item (multiline supported)
    const newItem = stockInput.trim();
    try {
      await addProductStocks(stockProduct.id, [newItem]);
      setStockInput(''); // Clear input for next entry
      await fetchStockData(stockProduct.id); // Refresh List & Count
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
      if (stockProduct) await fetchStockData(stockProduct.id);
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
      if (stockProduct) await fetchStockData(stockProduct.id);
    } catch (e) {
      alert('Gagal hapus stok');
    }
    setLoading(false);
  };

  // --- REPORT ---
  const handlePrintReport = () => {
    window.print();
  };

  // --- RENDER LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-xl"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-full">
              <Lock className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-6">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-6 pt-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
            Admin Dashboard
          </h1>
          <button onClick={handleLogout} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-300 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-400 px-4 py-2 rounded-lg text-sm transition-colors">Logout</button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Package size={18} /> Produk
          </button>
          <button
            onClick={() => setActiveTab('freebies')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${activeTab === 'freebies' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Gift size={18} /> Gratisan
          </button>
          <button
            onClick={() => setActiveTab('socials')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${activeTab === 'socials' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Share2 size={18} /> Socials
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${activeTab === 'seo' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Search size={18} /> SEO
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${activeTab === 'config' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Settings size={18} /> Config
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <FileText size={18} /> Pesanan
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${activeTab === 'payment' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <DollarSign size={18} /> Payment
          </button>
        </div>

        {/* STOCK MODAL */}
        {showStockModal && stockProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-[95%] md:w-full md:max-w-4xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate pr-4">Kelola Stok: {stockProduct.title}</h3>
                <button onClick={() => setShowStockModal(false)} className="text-slate-500 hover:text-red-500 flex-shrink-0"><Trash2 size={20} className="transform rotate-45" /></button>
              </div>

              <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg mb-6 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-200">Total Stok Tersedia</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total akun/item yang belum terjual</p>
                </div>
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stockCount}</span>
              </div>

              {/* Add Stock Form */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2"><Plus size={16} /> Tambah Stok Baru</h4>
                <div className="space-y-2">
                  <textarea
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    placeholder="Masukkan data stok di sini... (Bisa multiline/banyak baris untuk 1 item)"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    rows={3}
                  ></textarea>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Tekan tombol Simpan untuk menambahkan 1 item stok ini.</p>
                    <button
                      onClick={handleAddStocks}
                      disabled={!stockInput.trim() || loading}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      <Save size={16} /> Simpan Stok
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock List */}
              <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg relative">
                <div className="min-w-[600px] md:min-w-full"> {/* Ensure table doesn't collapse on mobile */}
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold sticky top-0">
                      <tr>
                        <th className="p-3">Konten Stok</th>
                        <th className="p-3 w-24 text-center">Status</th>
                        <th className="p-3 w-32 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {stockList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400">Belum ada stok.</td>
                        </tr>
                      ) : (
                        stockList.map(stock => (
                          <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 align-top">
                              {editingStockId === stock.id ? (
                                <textarea
                                  className="w-full bg-white dark:bg-slate-900 border border-blue-300 rounded p-2 text-slate-900 dark:text-white focus:outline-none font-mono text-xs"
                                  value={editingStockContent}
                                  onChange={(e) => setEditingStockContent(e.target.value)}
                                  rows={3}
                                  autoFocus
                                />
                              ) : (
                                <div className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                                  {stock.content}
                                </div>
                              )}
                            </td>
                            <td className="p-3 align-top text-center">
                              {stock.is_claimed ? (
                                <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">Terjual</span>
                              ) : (
                                <span className="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-bold">Tersedia</span>
                              )}
                            </td>
                            <td className="p-3 align-top text-center">
                              <div className="flex justify-center gap-2">
                                {editingStockId === stock.id ? (
                                  <>
                                    <button onClick={() => handleUpdateStock(stock.id)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"><Save size={16} /></button>
                                    <button onClick={() => setEditingStockId(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><X size={16} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { setEditingStockId(stock.id); setEditingStockContent(stock.content); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" disabled={stock.is_claimed}><Edit2 size={16} /></button>
                                    <button onClick={() => handleDeleteStock(stock.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div> {/* End scroll wrapper */}
              </div> {/* End flex-1 wrapper */}

              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowStockModal(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-bold py-2 px-6 rounded-lg transition-colors">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-6 min-h-[500px] shadow-sm">
          {loading && <div className="text-center py-10">Loading...</div>}

          {/* PRODUCT TAB */}
          {!loading && activeTab === 'products' && (
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
                          {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />} <span className="hidden sm:inline">Upload</span> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} />
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
                  <div className="flex gap-2"><button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white" disabled={uploadingImg}>Simpan</button><button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded text-slate-700 dark:text-slate-300">Batal</button></div>
                </form>
              )}
              {/* Product List */}
              <div className="grid gap-4">
                {products.map(p => (
                  <div key={p.id} className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                      <img src={p.image_url} alt="" className="w-16 h-16 flex-shrink-0 rounded object-cover" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{p.title}</h4>
                        <p className="text-xs text-slate-500">
                          Rp {p.price.toLocaleString()}
                          {p.original_price ? <span className="line-through ml-2 text-red-400">Rp {p.original_price.toLocaleString()}</span> : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button onClick={() => handleStockClick(p)} className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50 flex items-center gap-1 transition-colors text-sm font-medium">
                        <Database size={16} /> Stok
                      </button>
                      <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-600 border rounded"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-500 border rounded"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FREEBIES TAB */}
          {!loading && activeTab === 'freebies' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">List Gratisan</h2>
                <button onClick={() => setEditingFreebie({})} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm"><Plus size={16} /> Tambah Gratisan</button>
              </div>

              {editingFreebie && (
                <form onSubmit={handleFreebieSubmit} className="mb-8 bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="Judul" value={editingFreebie.title || ''} onChange={e => setEditingFreebie({ ...editingFreebie, title: e.target.value })} required />
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex gap-2">
                        <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="URL Gambar" value={editingFreebie.image_url || ''} onChange={e => setEditingFreebie({ ...editingFreebie, image_url: e.target.value })} required />
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                          {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />} <span className="hidden sm:inline">Upload</span> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'freebie')} />
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-2"><input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="Link Download" value={editingFreebie.link || ''} onChange={e => setEditingFreebie({ ...editingFreebie, link: e.target.value })} required /></div>
                    <div className="md:col-span-2"><input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="Teks Tombol (Default: Download Now)" value={editingFreebie.button_text || ''} onChange={e => setEditingFreebie({ ...editingFreebie, button_text: e.target.value })} /></div>
                    <textarea className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full md:col-span-2" placeholder="Deskripsi" value={editingFreebie.description || ''} onChange={e => setEditingFreebie({ ...editingFreebie, description: e.target.value })} required />
                  </div>
                  <div className="flex gap-2"><button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white" disabled={uploadingImg}>Simpan</button><button type="button" onClick={() => setEditingFreebie(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded text-slate-700 dark:text-slate-300">Batal</button></div>
                </form>
              )}

              <div className="grid gap-4">
                {freebies.map(f => (
                  <div key={f.id} className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                      <img src={f.image_url} alt="" className="w-16 h-16 flex-shrink-0 rounded object-cover" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{f.title}</h4>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button onClick={() => setEditingFreebie(f)} className="p-2 text-blue-600 border rounded"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteFreebie(f.id)} className="p-2 text-red-500 border rounded"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOCIALS TAB */}
          {!loading && activeTab === 'socials' && (
            <div>
              <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Media Sosial Footer</h2>

              {/* Add New Form */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tambah Media Sosial Baru</h3>
                <form onSubmit={handleAddSocial} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="w-full md:w-1/3">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Label (Teks)</label>
                    <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: TikTok" value={newSocial.label} onChange={e => setNewSocial({ ...newSocial, label: e.target.value })} required />
                  </div>
                  <div className="w-full md:w-1/2">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Link URL</label>
                    <div className="flex items-center gap-2">
                      <LinkIcon size={18} className="text-slate-400 flex-shrink-0" />
                      <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: https://tiktok.com/@user" value={newSocial.url} onChange={e => setNewSocial({ ...newSocial, url: e.target.value })} required />
                    </div>
                  </div>
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap h-10 w-full md:w-auto">Tambah</button>
                </form>
              </div>

              {/* List Socials */}
              <div className="grid gap-4">
                {socials.map(social => (
                  <div key={social.id} className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
                      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                        {social.label.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">{social.label}</h4>
                        <a href={social.url} target="_blank" rel="noreferrer" className="text-xs md:text-sm text-slate-500 hover:text-blue-500 truncate block">{social.url}</a>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSocial(social.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors self-end sm:self-center w-full sm:w-auto flex justify-center"><Trash2 size={18} /></button>
                  </div>
                ))}
                {socials.length === 0 && <p className="text-slate-500 text-center py-8">Belum ada link media sosial.</p>}
              </div>
            </div>
          )}

          {/* SEO TAB */}
          {!loading && activeTab === 'seo' && (
            <div>
              <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">SEO Optimization</h2>
              <form onSubmit={handleSaveConfig} className="space-y-6 max-w-3xl">

                {/* Meta Information */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Search size={18} /> Metadata Website</h3>
                  <ConfigInput label="Judul Website (Title Tag)" confKey="seo_site_title" value={config['seo_site_title'] || ''} onChange={(v) => handleConfigChange('seo_site_title', v)} />
                  <ConfigInput label="Deskripsi Website (Meta Description)" confKey="seo_description" type="textarea" help="Deskripsi yang muncul di hasil pencarian Google. Usahakan 150-160 karakter." value={config['seo_description'] || ''} onChange={(v) => handleConfigChange('seo_description', v)} />
                  <ConfigInput label="Kata Kunci (Keywords)" confKey="seo_keywords" type="textarea" help="Pisahkan dengan koma. Contoh: jual template, aset digital, font murah" value={config['seo_keywords'] || ''} onChange={(v) => handleConfigChange('seo_keywords', v)} />
                  <ConfigInput label="Penulis (Author)" confKey="seo_author" value={config['seo_author'] || ''} onChange={(v) => handleConfigChange('seo_author', v)} />
                </div>

                {/* Open Graph / Social Sharing */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Share2 size={18} /> Social Sharing (Open Graph)</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Gambar Preview Link (OG Image)</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {config['seo_og_image'] && (
                        <div className="w-24 h-16 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700 p-1 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                          <img src={config['seo_og_image']} alt="OG Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 w-full">
                        <div className="flex gap-2">
                          <input
                            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={config['seo_og_image'] || ''}
                            onChange={(e) => handleConfigChange('seo_og_image', e.target.value)}
                            placeholder="URL Gambar"
                          />
                          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                            {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />}
                            <span className="hidden sm:inline">Upload</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'og')} />
                          </label>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Gambar yang muncul saat link website dibagikan ke WhatsApp, Facebook, atau Twitter. Ukuran rekomendasi: 1200x630px.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Engine Verification */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Lock size={18} /> Verifikasi Search Engine</h3>
                  <ConfigInput label="Google Search Console (Meta Tag Code)" confKey="seo_google_verification" help="Masukkan kode verifikasi HTML dari Google Search Console." value={config['seo_google_verification'] || ''} onChange={(v) => handleConfigChange('seo_google_verification', v)} />
                  <ConfigInput label="Bing Webmaster Tools" confKey="seo_bing_verification" value={config['seo_bing_verification'] || ''} onChange={(v) => handleConfigChange('seo_bing_verification', v)} />
                  <ConfigInput label="Yandex Webmaster" confKey="seo_yandex_verification" value={config['seo_yandex_verification'] || ''} onChange={(v) => handleConfigChange('seo_yandex_verification', v)} />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors sticky bottom-4 shadow-xl">
                  <Save size={20} /> Simpan Pengaturan SEO
                </button>
              </form>
            </div>
          )}

          {/* CONFIG TAB */}
          {!loading && activeTab === 'config' && (
            <div>
              <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Pengaturan Situs</h2>
              <form onSubmit={handleSaveConfig} className="space-y-8 max-w-3xl">

                {/* GENERAL */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Umum</h3>
                  <ConfigInput label="Nama Brand (Navbar)" confKey="brand_name" value={config['brand_name'] || ''} onChange={(v) => handleConfigChange('brand_name', v)} />

                  {/* Logo Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Logo Brand (Navbar & Favicon)</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {config['brand_logo_url'] && (
                        <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700 p-1 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                          <img src={config['brand_logo_url']} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1 w-full">
                        <div className="flex gap-2">
                          <input
                            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={config['brand_logo_url'] || ''}
                            onChange={(e) => handleConfigChange('brand_logo_url', e.target.value)}
                            placeholder="URL Logo"
                          />
                          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                            {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />}
                            <span className="hidden sm:inline">Upload</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                          </label>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Upload gambar persegi (rekomendasi 512x512px) untuk logo dan favicon.</p>
                      </div>
                    </div>
                  </div>

                  {/* Product Detail Badge */}
                  <div className="mt-8 border-t dark:border-slate-600 pt-6">
                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-4">Halaman Detail Produk</h4>
                    <ConfigInput label="Teks Badge Produk (Contoh: Premium Asset)" confKey="product_badge_text" help="Badge yang muncul di atas judul produk di halaman detail. Kosongkan untuk menyembunyikan badge." value={config['product_badge_text'] || ''} onChange={(v) => handleConfigChange('product_badge_text', v)} />
                  </div>

                  {/* Detail Page Features (NEW) */}
                  <div className="mt-8 border-t dark:border-slate-600 pt-6">
                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-4">Fitur Halaman Detail Produk</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <ConfigInput label="Judul Fitur 1 (Icon Shield)" confKey="detail_feature_1_title" value={config['detail_feature_1_title'] || ''} onChange={(v) => handleConfigChange('detail_feature_1_title', v)} />
                        <ConfigInput label="Deskripsi Fitur 1" confKey="detail_feature_1_desc" value={config['detail_feature_1_desc'] || ''} onChange={(v) => handleConfigChange('detail_feature_1_desc', v)} />
                      </div>
                      <div>
                        <ConfigInput label="Judul Fitur 2 (Icon Petir)" confKey="detail_feature_2_title" value={config['detail_feature_2_title'] || ''} onChange={(v) => handleConfigChange('detail_feature_2_title', v)} />
                        <ConfigInput label="Deskripsi Fitur 2" confKey="detail_feature_2_desc" value={config['detail_feature_2_desc'] || ''} onChange={(v) => handleConfigChange('detail_feature_2_desc', v)} />
                      </div>
                    </div>
                  </div>

                  {/* Social Proof Config */}
                  <div className="mt-8 border-t dark:border-slate-600 pt-6">
                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-4">Notifikasi Pembelian Palsu (Social Proof)</h4>

                    <div className="mb-4 flex items-center gap-4">
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={config['fake_purchase_enabled'] !== 'false'}
                          onChange={(e) => handleConfigChange('fake_purchase_enabled', e.target.checked ? 'true' : 'false')}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-300">Aktifkan Notifikasi</span>
                      </div>
                    </div>

                    <ConfigInput
                      label="Jeda Antar Notifikasi (Detik)"
                      confKey="fake_purchase_delay"
                      type="number"
                      help="Berapa detik jeda antara notifikasi satu dengan yang lainnya."
                      value={config['fake_purchase_delay'] || ''}
                      onChange={(v) => handleConfigChange('fake_purchase_delay', v)}
                    />

                    <ConfigInput
                      label="Daftar Nama Pembeli Palsu"
                      confKey="fake_purchase_names"
                      type="textarea"
                      help="Nama-nama ini akan muncul di notifikasi pojok kiri bawah secara acak. Pisahkan dengan enter (baris baru)."
                      value={config['fake_purchase_names'] || ''}
                      onChange={(v) => handleConfigChange('fake_purchase_names', v)}
                    />
                  </div>
                </div>

                {/* HERO SECTION */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Bagian Hero (Atas)</h3>
                  <ConfigInput label="Teks Badge Kecil (Atas Judul)" confKey="hero_badge_text" help="Contoh: Digital Products & Assets" value={config['hero_badge_text'] || ''} onChange={(v) => handleConfigChange('hero_badge_text', v)} />
                  <ConfigInput label="Judul Utama" confKey="hero_title" help="Gunakan tanda kutip dua (&quot;) untuk efek gradient." value={config['hero_title'] || ''} onChange={(v) => handleConfigChange('hero_title', v)} />
                  <ConfigInput label="Sub-judul" confKey="hero_subtitle" type="textarea" value={config['hero_subtitle'] || ''} onChange={(v) => handleConfigChange('hero_subtitle', v)} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ConfigInput label="Teks Tombol Utama" confKey="hero_btn_primary" value={config['hero_btn_primary'] || ''} onChange={(v) => handleConfigChange('hero_btn_primary', v)} />
                    <ConfigInput label="Teks Tombol Kedua" confKey="hero_btn_secondary" value={config['hero_btn_secondary'] || ''} onChange={(v) => handleConfigChange('hero_btn_secondary', v)} />
                  </div>
                  {/* HERO IMAGE UPLOAD */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Gambar Tengah (Hero Image)</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {config['hero_image_url'] && (
                        <div className="w-24 h-16 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700 p-1 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                          <img src={config['hero_image_url']} alt="Hero Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 w-full">
                        <div className="flex gap-2">
                          <input
                            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={config['hero_image_url'] || ''}
                            onChange={(e) => handleConfigChange('hero_image_url', e.target.value)}
                            placeholder="URL Gambar"
                          />
                          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                            {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />}
                            <span className="hidden sm:inline">Upload</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} />
                          </label>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Gambar utama yang melayang di tengah. Rekomendasi: 1200x600px, transparent PNG/WebP lebih baik.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRODUCTS SECTION */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Bagian Produk</h3>
                  <ConfigInput label="Judul Section" confKey="products_title" help="Gunakan tanda kutip dua (&quot;) untuk warna biru." value={config['products_title'] || ''} onChange={(v) => handleConfigChange('products_title', v)} />
                  <ConfigInput label="Sub-judul Section" confKey="products_subtitle" value={config['products_subtitle'] || ''} onChange={(v) => handleConfigChange('products_subtitle', v)} />
                </div>

                {/* FREEBIES SECTION */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Bagian Gratisan</h3>
                  <ConfigInput label="Teks Badge Kecil" confKey="freebies_badge_text" help="Contoh: Free Resources" value={config['freebies_badge_text'] || ''} onChange={(v) => handleConfigChange('freebies_badge_text', v)} />
                  <ConfigInput label="Judul Section" confKey="freebies_title" help="Gunakan tanda kutip dua (&quot;) untuk efek gradient." value={config['freebies_title'] || ''} onChange={(v) => handleConfigChange('freebies_title', v)} />
                  <ConfigInput label="Sub-judul Section" confKey="freebies_subtitle" value={config['freebies_subtitle'] || ''} onChange={(v) => handleConfigChange('freebies_subtitle', v)} />
                </div>

                {/* WHATSAPP SECTION */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Bagian WhatsApp</h3>
                  <ConfigInput label="Judul" confKey="wa_section_title" help="Gunakan tanda kutip dua (&quot;) untuk warna cyan." value={config['wa_section_title'] || ''} onChange={(v) => handleConfigChange('wa_section_title', v)} />
                  <ConfigInput label="Deskripsi" confKey="wa_section_desc" type="textarea" value={config['wa_section_desc'] || ''} onChange={(v) => handleConfigChange('wa_section_desc', v)} />
                  <ConfigInput label="Link WhatsApp" confKey="wa_link" value={config['wa_link'] || ''} onChange={(v) => handleConfigChange('wa_link', v)} />
                  <ConfigInput label="Teks Tombol" confKey="wa_btn_text" value={config['wa_btn_text'] || ''} onChange={(v) => handleConfigChange('wa_btn_text', v)} />
                </div>

                {/* FOOTER */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Footer</h3>
                  <ConfigInput label="Teks Hak Cipta" confKey="footer_text" value={config['footer_text'] || ''} onChange={(v) => handleConfigChange('footer_text', v)} />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors sticky bottom-4 shadow-xl">
                  <Save size={20} /> Simpan Semua Perubahan
                </button>
              </form>
            </div>
          )}

          {/* ORDERS TAB */}
          {!loading && activeTab === 'orders' && ( // <--- ORDERS
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Riwayat Transaksi</h2>
                <button onClick={handlePrintReport} className="w-full sm:w-auto bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm"><FileText size={16} /> Cetak Laporan</button>
              </div>

              <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">ID / Ref</th>
                      <th className="px-4 py-3">Produk</th>
                      <th className="px-4 py-3">Pembeli</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Metode</th>
                      <th className="px-4 py-3">Payment URL</th>
                      <th className="px-4 py-3">Invoice URL</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-8 text-slate-500">Belum ada transaksi.</td></tr>
                    ) : transactions.map(trx => (
                      <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-xs">
                          <span className="block font-bold">{trx.ref_id}</span>
                          <span className="text-slate-400">{trx.id.substring(0, 8)}...</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {trx.product_title}
                          <div className="text-xs text-slate-500">Rp {trx.price.toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-900 dark:text-white">{trx.buyer_email}</div>
                          {trx.buyer_phone && <div className="text-xs text-slate-500">{trx.buyer_phone}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${trx.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            trx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {trx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {trx.payment_method === 'ATLANTIC_QRIS' ? 'QRIS Otomatis' : 'Manual WA'}
                        </td>
                        <td className="px-4 py-3">
                          {trx.id ? (
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/payment/${trx.id}`;
                                navigator.clipboard.writeText(url);
                                alert('Link payment disalin!');
                              }}
                              className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                              title="Copy Payment URL"
                            >
                              <Copy size={14} /> Copy
                            </button>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {trx.invoice_url ? (
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}${trx.invoice_url}`;
                                navigator.clipboard.writeText(url);
                                alert('Link invoice disalin!');
                              }}
                              className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1"
                              title="Copy Invoice URL"
                            >
                              <Copy size={14} /> Copy
                            </button>
                          ) : <span className="text-slate-400 text-xs">-</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(trx.created_at || '').toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {trx.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Approve pembayaran ini?')) return;

                                  // Optimistic update
                                  setTransactions(prev => prev.map(t =>
                                    t.id === trx.id ? { ...t, status: 'PAID', invoice_url: `/invoice/${trx.id}` } : t
                                  ));

                                  const success = await manualApproveTransaction(trx.id);
                                  if (success) {
                                    alert('Transaksi berhasil diapprove!');
                                    fetchData(); // Sync with DB
                                  } else {
                                    alert('Gagal approve transaksi');
                                    fetchData(); // Revert on failure
                                  }
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Batalkan transaksi ini? Stok akan dikembalikan.')) return;

                                  // Optimistic Update
                                  setTransactions(prev => prev.map(t =>
                                    t.id === trx.id ? { ...t, status: 'CANCELLED' } : t
                                  ));

                                  console.log('[UI] Calling adminCancelTransaction for:', trx.id);
                                  const success = await adminCancelTransaction(trx.id);
                                  console.log('[UI] adminCancelTransaction result:', success);

                                  if (success) {
                                    alert('Transaksi berhasil dibatalkan!');
                                    fetchData(); // Sync with DB
                                  } else {
                                    alert('Gagal membatalkan transaksi');
                                    fetchData(); // Revert on failure
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium"
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          )}
                          {trx.status === 'PAID' && trx.invoice_url && (
                            <a
                              href={trx.invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-xs"
                            >
                              Lihat Invoice
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAYMENT SETTINGS TAB */}
          {!loading && activeTab === 'payment' && ( // <--- PAYMENT
            <div>
              <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Pengaturan Pembayaran (Atlantic Gateway)</h2>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                <div className="text-yellow-600 dark:text-yellow-400 mt-1"><Lock size={20} /></div>
                <div>
                  <h4 className="font-bold text-yellow-800 dark:text-yellow-300">Area Sensitif</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">API Key ini disimpan di database dan hanya digunakan untuk mengenerate kode pembayaran QRIS secara otomatis.</p>
                </div>
              </div>

              <form onSubmit={handleSavePaymentConfig} className="space-y-6 max-w-3xl">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Kredensial Atlantic Pedia</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">API Key</label>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          type="password"
                          className={`w-full bg-white dark:bg-slate-700 border rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono ${connectionStatus === 'connected' ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-300 dark:border-slate-600'}`}
                          value={paymentConfig['atlantic_api_key'] || ''}
                          onChange={(e) => {
                            setPaymentConfig({ ...paymentConfig, atlantic_api_key: e.target.value });
                            setConnectionStatus('idle');
                          }}
                          placeholder="Masukkan API Key Atlantic Pedia"
                        />
                        {connectionStatus === 'connected' && <div className="absolute right-3 top-2.5 text-green-500"><span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span></div>}
                      </div>
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={checkingConnection || !paymentConfig['atlantic_api_key']}
                        className={`px-4 py-2 rounded font-bold text-white transition-colors flex items-center gap-2 ${connectionStatus === 'connected' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {checkingConnection ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Checking...
                          </>
                        ) : connectionStatus === 'connected' ? (
                          <>Connected</>
                        ) : (
                          <>Test Connection</>
                        )}
                      </button>
                    </div>
                    {connectionStatus === 'failed' && <p className="text-red-500 text-xs mt-1">Koneksi gagal. Cek API Key Anda.</p>}
                    {connectionStatus === 'connected' && <p className="text-green-500 text-xs mt-1">Koneksi Berhasil! API Key valid.</p>}
                  </div>

                  <div className="mb-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Nomor WhatsApp Admin (Untuk Pembayaran Manual)</label>
                    <input
                      type="text"
                      className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={paymentConfig['admin_wa_number'] || ''}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, admin_wa_number: e.target.value })}
                      placeholder="Contoh: 6281234567890 (Gunakan format 62)"
                    />
                    <p className="text-xs text-slate-400 mt-1">Nomor ini akan digunakan sebagai tujuan saat user memilih metode pembayaran manual atau jika pembayaran otomatis gagal.</p>
                  </div>

                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Simpan Kredensial
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;