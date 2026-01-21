import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Menu, Plus, Save, Trash2, X, Edit2 } from 'lucide-react';
import { getProducts, getFreebies, getSiteConfig, getSocialLinks, getTransactions, getPaymentConfig } from '../services/dataService';
import { Product, Freebie, SocialLink, Transaction } from '../types';

// Components
import Sidebar from '../components/admin/Sidebar';
import DashboardHome from '../components/admin/DashboardHome';
import ProductsManager from '../components/admin/ProductsManager';
import FreebiesManager from '../components/admin/FreebiesManager';
import SocialsManager from '../components/admin/SocialsManager';
import SeoManager from '../components/admin/SeoManager';
import ConfigManager from '../components/admin/ConfigManager';
import OrdersManager from '../components/admin/OrdersManager';
import PaymentManager from '../components/admin/PaymentManager';
import StockManager from '../components/admin/StockManager';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [freebies, setFreebies] = useState<Freebie[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Stock Management State
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);

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
  const handleOpenStock = (product: Product) => {
    setSelectedProductForStock(product);
    setActiveTab('stock_details');
  };

  const handleBackToProducts = () => {
    setSelectedProductForStock(null);
    setActiveTab('products');
    fetchData(); // Refresh data to update stock counts if needed
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-full">
              <Lock className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-6">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Password" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white" />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">Access Dashboard</button>
          </form>
        </motion.div>
      </div>
    );
  }

  // DASHBOARD LAYOUT
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar
        activeTab={activeTab === 'stock_details' ? 'products' : activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="md:ml-64 min-h-screen p-4 md:p-8">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Admin Panel</h1>
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-600 dark:text-slate-300">
            <Menu size={24} />
          </button>
        </div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={activeTab === 'stock_details' ? "" : "bg-white dark:bg-slate-900 rounded-xl shadow-xl dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 min-h-[85vh]"}
        >
          {loading && activeTab !== 'stock_details' ? (
            <div className="flex h-64 items-center justify-center text-slate-500 font-bold text-lg">
              Loading data...
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardHome transactions={transactions} products={products} />}
              {activeTab === 'products' && <ProductsManager products={products} fetchData={fetchData} onStockClick={handleOpenStock} />}
              {activeTab === 'stock_details' && selectedProductForStock && (
                <StockManager product={selectedProductForStock} onBack={handleBackToProducts} />
              )}
              {activeTab === 'freebies' && <FreebiesManager freebies={freebies} fetchData={fetchData} />}
              {activeTab === 'socials' && <SocialsManager socials={socials} fetchData={fetchData} />}
              {activeTab === 'seo' && <SeoManager config={config} setConfig={setConfig} fetchData={fetchData} />}
              {activeTab === 'config' && <ConfigManager config={config} setConfig={setConfig} fetchData={fetchData} />}
              {activeTab === 'orders' && <OrdersManager transactions={transactions} fetchData={fetchData} />}
              {activeTab === 'payment' && <PaymentManager paymentConfig={paymentConfig} setPaymentConfig={setPaymentConfig} />}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;