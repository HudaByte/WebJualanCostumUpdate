import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getProducts, getSiteConfig } from '../services/dataService';
import { Product } from '../types';

interface NotificationData {
  name: string;
  productTitle: string;
  image: string;
}

const PurchaseNotification: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<NotificationData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [delay, setDelay] = useState(20000);

  // 1. Fetch Config Once
  useEffect(() => {
    const initData = async () => {
      try {
        const [prodData, configData] = await Promise.all([getProducts(), getSiteConfig()]);

        // Filter out manual products from fake notifications if desired, or keep all
        setProducts(prodData);

        const enabled = configData['fake_purchase_enabled'] === 'true'; // Strict check
        setIsEnabled(enabled);

        const delaySec = parseInt(configData['fake_purchase_delay'] || '20', 10);
        setDelay(delaySec * 1000);

        const namesString = configData['fake_purchase_names'] || '';
        setNames(namesString.split('\n').filter(n => n.trim() !== ''));
      } catch (e) {
        console.error("Failed to load notification config", e);
      }
    };
    initData();
  }, []);

  // 2. Manage Notification Cycle
  useEffect(() => {
    // Only on Home Page
    if (location.pathname !== '/') {
      setVisible(false);
      return;
    }

    if (!isEnabled || products.length === 0 || names.length === 0) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNext = () => {
      // Random delay between 0.8x and 1.2x of configured delay for "natural" feel
      const nextDelay = delay * (0.8 + Math.random() * 0.4);

      timeoutId = setTimeout(() => {
        showNotification();
      }, nextDelay);
    };

    const showNotification = () => {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomName = names[Math.floor(Math.random() * names.length)];

      setData({
        name: randomName,
        productTitle: randomProduct.title,
        image: randomProduct.image_url
      });
      setVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setVisible(false);
        scheduleNext(); // Schedule next one after hiding
      }, 5000);
    };

    // Initial Start
    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [isEnabled, products, names, delay, location.pathname]);

  const handleClose = () => {
    setVisible(false);
  };

  if (!isEnabled || location.pathname !== '/') return null;

  return (
    <AnimatePresence>
      {visible && data && (
        <motion.div
          initial={{ opacity: 0, x: -50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-4 left-4 z-40 max-w-[calc(100vw-2rem)] sm:max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-3 flex items-center gap-3 pr-8 will-change-transform"
          style={{ transform: "translate3d(0,0,0)" }}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
            <img
              src={data.image}
              alt={data.productTitle}
              width="48"
              height="48"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mb-0.5 truncate">
              <span className="font-bold text-slate-900 dark:text-white">{data.name}</span> membeli
            </p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-tight truncate">
              {data.productTitle}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Baru saja</p>
          </div>
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1"
            aria-label="Close Notification"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseNotification;