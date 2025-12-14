import React, { createContext, useContext, useEffect, useState, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Products from './components/Products';
import Freebies from './components/Freebies';
import WhatsAppChannel from './components/WhatsAppChannel';
import Footer from './components/Footer';
import SEO from './components/SEO';
import PurchaseNotification from './components/PurchaseNotification';
import { getSiteConfig } from './services/dataService';

// Lazy Load Pages to reduce initial bundle size
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Admin = lazy(() => import('./pages/Admin'));

// Theme Context
type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
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
const Home = () => (
  <>
    <Hero />
    <Products />
    <Freebies />
    <WhatsAppChannel />
  </>
);

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <Loader className="animate-spin text-blue-500" size={40} />
  </div>
);

const AppContent = () => {
  const location = useLocation();
  // Check for admin path in hash router (e.g., #/adminhodewa)
  const isAdmin = location.pathname.startsWith('/adminhodewa');

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300">
      <SEO />
      {!isAdmin && <PurchaseNotification />}
      {!isAdmin && <Navbar />}
      <main>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/adminhodewa" element={<Admin />} />
          </Routes>
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