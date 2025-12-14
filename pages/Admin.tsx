import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Plus, Trash2, Edit2, Save, Layout, Package, Gift, Settings, Upload, Image as ImageIcon, Share2, Link as LinkIcon, Search } from 'lucide-react';
import { getProducts, getFreebies, getSiteConfig, getSocialLinks, createProduct, updateProduct, deleteProduct, createFreebie, updateFreebie, deleteFreebie, createSocialLink, deleteSocialLink, saveSiteConfig, uploadImage } from '../services/dataService';
import { Product, Freebie, SocialLink } from '../types';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'products' | 'freebies' | 'config' | 'socials' | 'seo'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [freebies, setFreebies] = useState<Freebie[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Edit/Add State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingFreebie, setEditingFreebie] = useState<Partial<Freebie> | null>(null);
  const [newSocial, setNewSocial] = useState<Partial<SocialLink>>({ label: '', url: '' });

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
    setProducts(p);
    setFreebies(f);
    setConfig(c);
    setSocials(s);
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
        setConfig({ ...config, brand_logo_url: publicUrl });
      } else if (type === 'og') {
        setConfig({ ...config, seo_og_image: publicUrl });
      } else if (type === 'hero') {
        setConfig({ ...config, hero_image_url: publicUrl });
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
    if(!window.confirm('Yakin hapus?')) return;
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
    if(!window.confirm('Yakin hapus?')) return;
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

  // Helper component for Config Input
  const ConfigInput = ({ label, confKey, type = "text", help }: { label: string, confKey: string, type?: string, help?: string }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {type === 'textarea' ? (
         <textarea 
            className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
            value={config[confKey] || ''}
            onChange={(e) => setConfig({...config, [confKey]: e.target.value})}
            rows={5}
         />
      ) : (
        <input 
          type={type}
          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          value={config[confKey] || ''}
          onChange={(e) => setConfig({...config, [confKey]: e.target.value})}
        />
      )}
      {help && <p className="text-xs text-slate-400 mt-1">{help}</p>}
    </div>
  );

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
        </div>

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
                         <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Judul Produk" value={editingProduct.title || ''} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} required />
                      </div>
                      
                      {/* Price */}
                      <div>
                         <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Harga Jual (Final)</label>
                         <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: 150000" type="number" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value)})} required />
                      </div>

                      {/* Original Price (Coret) */}
                      <div>
                         <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Harga Coret / Asli (Opsional)</label>
                         <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: 300000" type="number" value={editingProduct.original_price || ''} onChange={e => setEditingProduct({...editingProduct, original_price: e.target.value ? parseInt(e.target.value) : undefined})} />
                      </div>

                      {/* Image Section */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Gambar Produk</label>
                        <div className="flex gap-2">
                            <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="URL Gambar" value={editingProduct.image_url || ''} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} required />
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                                {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />} <span className="hidden sm:inline">Upload</span> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} />
                            </label>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Link Tujuan</label>
                        <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Link Tujuan" value={editingProduct.link || ''} onChange={e => setEditingProduct({...editingProduct, link: e.target.value})} required />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Teks Tombol</label>
                        <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Teks Tombol (Default: Beli Sekarang)" value={editingProduct.button_text || ''} onChange={e => setEditingProduct({...editingProduct, button_text: e.target.value})} />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Deskripsi Singkat</label>
                        <textarea className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Deskripsi Singkat" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} required />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Konten Lengkap</label>
                        <textarea className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full h-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Konten Lengkap" value={editingProduct.content || ''} onChange={e => setEditingProduct({...editingProduct, content: e.target.value})} />
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
                      <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="Judul" value={editingFreebie.title || ''} onChange={e => setEditingFreebie({...editingFreebie, title: e.target.value})} required />
                       <div className="md:col-span-2 space-y-2">
                        <div className="flex gap-2">
                            <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="URL Gambar" value={editingFreebie.image_url || ''} onChange={e => setEditingFreebie({...editingFreebie, image_url: e.target.value})} required />
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                                {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />} <span className="hidden sm:inline">Upload</span> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'freebie')} />
                            </label>
                        </div>
                      </div>
                      <div className="md:col-span-2"><input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="Link Download" value={editingFreebie.link || ''} onChange={e => setEditingFreebie({...editingFreebie, link: e.target.value})} required /></div>
                       <div className="md:col-span-2"><input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="Teks Tombol (Default: Download Now)" value={editingFreebie.button_text || ''} onChange={e => setEditingFreebie({...editingFreebie, button_text: e.target.value})} /></div>
                      <textarea className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full md:col-span-2" placeholder="Deskripsi" value={editingFreebie.description || ''} onChange={e => setEditingFreebie({...editingFreebie, description: e.target.value})} required />
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
                        <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: TikTok" value={newSocial.label} onChange={e => setNewSocial({...newSocial, label: e.target.value})} required />
                    </div>
                     <div className="w-full md:w-1/2">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Link URL</label>
                        <div className="flex items-center gap-2">
                            <LinkIcon size={18} className="text-slate-400 flex-shrink-0" />
                            <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: https://tiktok.com/@user" value={newSocial.url} onChange={e => setNewSocial({...newSocial, url: e.target.value})} required />
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
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Search size={18}/> Metadata Website</h3>
                   <ConfigInput label="Judul Website (Title Tag)" confKey="seo_site_title" />
                   <ConfigInput label="Deskripsi Website (Meta Description)" confKey="seo_description" type="textarea" help="Deskripsi yang muncul di hasil pencarian Google. Usahakan 150-160 karakter." />
                   <ConfigInput label="Kata Kunci (Keywords)" confKey="seo_keywords" type="textarea" help="Pisahkan dengan koma. Contoh: jual template, aset digital, font murah" />
                   <ConfigInput label="Penulis (Author)" confKey="seo_author" />
                </div>

                {/* Open Graph / Social Sharing */}
                 <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Share2 size={18}/> Social Sharing (Open Graph)</h3>
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
                                onChange={(e) => setConfig({...config, seo_og_image: e.target.value})}
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
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Lock size={18}/> Verifikasi Search Engine</h3>
                   <ConfigInput label="Google Search Console (Meta Tag Code)" confKey="seo_google_verification" help="Masukkan kode verifikasi HTML dari Google Search Console." />
                   <ConfigInput label="Bing Webmaster Tools" confKey="seo_bing_verification" />
                   <ConfigInput label="Yandex Webmaster" confKey="seo_yandex_verification" />
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
                   <ConfigInput label="Nama Brand (Navbar)" confKey="brand_name" />
                   
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
                                onChange={(e) => setConfig({...config, brand_logo_url: e.target.value})}
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
                        <ConfigInput label="Teks Badge Produk (Contoh: Premium Asset)" confKey="product_badge_text" help="Badge yang muncul di atas judul produk di halaman detail. Kosongkan untuk menyembunyikan badge." />
                   </div>
                   
                   {/* Detail Page Features (NEW) */}
                   <div className="mt-8 border-t dark:border-slate-600 pt-6">
                        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-4">Fitur Halaman Detail Produk</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <ConfigInput label="Judul Fitur 1 (Icon Shield)" confKey="detail_feature_1_title" />
                                <ConfigInput label="Deskripsi Fitur 1" confKey="detail_feature_1_desc" />
                            </div>
                            <div>
                                <ConfigInput label="Judul Fitur 2 (Icon Petir)" confKey="detail_feature_2_title" />
                                <ConfigInput label="Deskripsi Fitur 2" confKey="detail_feature_2_desc" />
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
                                onChange={(e) => setConfig({...config, fake_purchase_enabled: e.target.checked ? 'true' : 'false'})}
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
                       />

                       <ConfigInput 
                          label="Daftar Nama Pembeli Palsu" 
                          confKey="fake_purchase_names" 
                          type="textarea" 
                          help="Nama-nama ini akan muncul di notifikasi pojok kiri bawah secara acak. Pisahkan dengan enter (baris baru)." 
                       />
                   </div>
                </div>

                {/* HERO SECTION */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Bagian Hero (Atas)</h3>
                   <ConfigInput label="Teks Badge Kecil (Atas Judul)" confKey="hero_badge_text" help="Contoh: Digital Products & Assets" />
                   <ConfigInput label="Judul Utama" confKey="hero_title" help="Gunakan tanda kutip dua (&quot;) untuk efek gradient." />
                   <ConfigInput label="Sub-judul" confKey="hero_subtitle" type="textarea" />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <ConfigInput label="Teks Tombol Utama" confKey="hero_btn_primary" />
                     <ConfigInput label="Teks Tombol Kedua" confKey="hero_btn_secondary" />
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
                                onChange={(e) => setConfig({...config, hero_image_url: e.target.value})}
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
                   <ConfigInput label="Judul Section" confKey="products_title" help="Gunakan tanda kutip dua (&quot;) untuk warna biru." />
                   <ConfigInput label="Sub-judul Section" confKey="products_subtitle" />
                </div>

                {/* FREEBIES SECTION */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Bagian Gratisan</h3>
                   <ConfigInput label="Teks Badge Kecil" confKey="freebies_badge_text" help="Contoh: Free Resources" />
                   <ConfigInput label="Judul Section" confKey="freebies_title" help="Gunakan tanda kutip dua (&quot;) untuk efek gradient." />
                   <ConfigInput label="Sub-judul Section" confKey="freebies_subtitle" />
                </div>

                {/* WHATSAPP SECTION */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Bagian WhatsApp</h3>
                   <ConfigInput label="Judul" confKey="wa_section_title" help="Gunakan tanda kutip dua (&quot;) untuk warna cyan." />
                   <ConfigInput label="Deskripsi" confKey="wa_section_desc" type="textarea" />
                   <ConfigInput label="Link WhatsApp" confKey="wa_link" />
                   <ConfigInput label="Teks Tombol" confKey="wa_btn_text" />
                </div>

                {/* FOOTER */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Footer</h3>
                   <ConfigInput label="Teks Hak Cipta" confKey="footer_text" />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors sticky bottom-4 shadow-xl">
                  <Save size={20} /> Simpan Semua Perubahan
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;