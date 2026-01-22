import React, { createContext, useContext, useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import PageTransition from './components/PageTransition';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Products from './components/Products';
import Freebies from './components/Freebies';
import WhatsAppChannel from './components/WhatsAppChannel';
import Footer from './components/Footer';
import SEO from './components/SEO';
import PurchaseNotification from './components/PurchaseNotification';
import PromoPopup from './components/PromoPopup';
import StoreClosed from './components/StoreClosed';
import { getSiteConfig } from './services/dataService';
import { useStoreStatus } from './hooks/useStoreStatus';

// Helper to auto-reload page if chunk is missing (New Deployment)
const lazyWithReload = (componentImport: any) =>
  React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Lazy load error:', error);
      // Check if it's a chunk load error (usually network or 404)
      const isChunkError = String(error).includes('Failed to fetch dynamically imported module') ||
        String(error).includes('Importing a module script failed');

      // Prevent infinite reload loop (limit to 1 reload per session/timestamp)
      const storageKey = `reload_timestamp_${window.location.pathname}`;
      const lastReload = sessionStorage.getItem(storageKey);
      const now = Date.now();

      if (isChunkError && (!lastReload || now - parseInt(lastReload) > 10000)) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
        return { default: () => <div className="min-h-screen flex items-center justify-center">Reloading...</div> };
      }

      throw error;
    }
  });


const ProductDetail = lazyWithReload(() => import('./pages/ProductDetail'));
const Admin = lazyWithReload(() => import('./pages/Admin'));
const StockManager = lazyWithReload(() => import('./pages/StockManager'));
const Payment = lazyWithReload(() => import('./pages/Payment'));
const Invoice = lazyWithReload(() => import('./pages/Invoice'));
const Demo = lazyWithReload(() => import('./pages/Demo'));
const Maintenance = lazyWithReload(() => import('./components/Maintenance'));
const Restocking = lazyWithReload(() => import('./components/Restocking'));


// Theme Context
type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Home Component that contains the scrollable sections
const Home = () => {
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      const siteConfig = await getSiteConfig();
      setConfig(siteConfig);
    };
    fetchConfig();
  }, []);

  return (
    <>
      <Hero />
      <Products />
      <Freebies />
      <WhatsAppChannel />

      {/* Promo Popup */}
      <PromoPopup
        enabled={config.popup_enabled === 'true'}
        imageUrl={config.popup_image_url}
        text={config.popup_text}
        linkUrl={config.popup_link}
        delaySeconds={parseInt(config.popup_delay || '30')}
        repeatMode={config.popup_repeat_mode === 'true'}
      />
    </>
  );
};

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <Loader className="animate-spin text-blue-500" size={40} />
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const [config, setConfig] = useState<Record<string, string>>({});
  const { status } = useStoreStatus(config);

  // Check for admin path in browser router (e.g., /adminhodewa)
  const isAdmin = location.pathname.startsWith('/adminhodewa');

  // Load config for store status
  useEffect(() => {
    const fetchConfig = async () => {
      const siteConfig = await getSiteConfig();
      setConfig(siteConfig);
    };
    fetchConfig();
  }, []);

  // Update Favicon based on config (fallback if Helmet doesn't handle it)
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const config = await getSiteConfig();
        const logoUrl = config['brand_logo_url'];
        if (logoUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = logoUrl;
        }
      } catch (error) {
        console.error("Failed to update favicon", error);
      }
    };
    updateFavicon();
  }, []);

  // Inject Global Smooth Scroll
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // Handle various store statuses (if not admin)
  if (!isAdmin) {
    if (status === 'maintenance') {
      return <Maintenance brandName={config.brand_name} logoUrl={config.brand_logo_url} />;
    }

    if (status === 'restocking') {
      return <Restocking brandName={config.brand_name} logoUrl={config.brand_logo_url} />;
    }

    if (status === 'closed') {
      return (
        <StoreClosed
          message={config.store_closed_message}
          openTime={config.store_hours_open}
          closeTime={config.store_hours_close}
          operatingDays={config.store_days?.split(',').map(Number).filter(Boolean)}
          contactLink={config.store_closed_contact_link}
          brandName={config.brand_name}
          logoUrl={config.brand_logo_url}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300">
      <SEO />
      {!isAdmin && <PurchaseNotification />}
      {!isAdmin && <Navbar />}
      <main>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            {/* @ts-ignore - Routes supports location but Types might be strict */}
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <PageTransition>
                  <Home />
                </PageTransition>
              } />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/adminhodewa" element={<Admin />} />
              <Route path="/adminhodewa/stock/:id" element={<StockManager />} />
              <Route path="/payment/:id" element={<Payment />} />
              <Route path="/invoice/:id" element={<Invoice />} />
              <Route path="/demo" element={<Demo />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;