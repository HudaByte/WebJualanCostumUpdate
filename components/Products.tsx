import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { ShoppingCart, Loader, Eye, PackageOpen } from 'lucide-react';
import { getProducts, getSiteConfig, getProductStockCount } from '../services/dataService';
import { Product } from '../types';
import { Link } from 'react-router-dom';

// OPTIMIZATION: Move static objects outside component to prevent recreation on render
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [prodData, configData] = await Promise.all([getProducts(), getSiteConfig()]);

      // Fetch stock counts for AUTO products
      const productsWithStock = await Promise.all(prodData.map(async (p) => {
        if (!p.payment_type || p.payment_type === 'AUTO') {
          const count = await getProductStockCount(p.id);
          return { ...p, stock_count: count };
        }
        return p;
      }));

      setProducts(productsWithStock);
      setConfig(configData);
      setLoading(false);
    };
    fetch();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const title = config['products_title'] || 'Tidak tersedia';
  const subtitle = config['products_subtitle'] || 'Tidak tersedia';

  const renderTitle = (text: string) => {
    const parts = text.split('"');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-blue-600 dark:text-blue-400">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <section id="produk" className="py-20 relative bg-white dark:bg-slate-900 transition-colors duration-300 content-visibility-auto contain-content">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {renderTitle(title)}
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin text-blue-500" size={40} />
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
              <PackageOpen size={48} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Produk Tidak tersedia</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
              Tidak tersedia
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                variants={cardVariants}
                className="group relative bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden hover:border-blue-200 dark:hover:border-blue-800 transition-colors duration-300 hover:shadow-lg flex flex-col"
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                    {(!product.payment_type || product.payment_type === 'AUTO') && product.stock_count === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 rounded-xl sm:rounded-2xl">
                        <span className="text-white font-bold text-sm sm:text-2xl border-2 sm:border-4 border-white px-3 sm:px-6 py-1 sm:py-2 rounded-lg sm:rounded-xl transform -rotate-12 uppercase tracking-wider">
                          HABIS
                        </span>
                      </div>
                    )}
                    <img
                      src={product.image_url}
                      alt={product.title}
                      loading="lazy"
                      width="400"
                      height="300"
                      decoding="async"
                      style={{ aspectRatio: '4/3' }}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 bg-slate-200 dark:bg-slate-800"
                    />
                    {/* Discount Badge */}
                    {product.original_price && product.original_price > product.price && (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded shadow-md z-10">
                        -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center hidden sm:flex">
                      <div className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <Eye size={16} /> Lihat
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="p-3 sm:p-5 flex-1 flex flex-col">
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 line-clamp-2 sm:line-clamp-1 leading-tight">
                    <Link to={`/product/${product.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {product.title}
                    </Link>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-2 hidden sm:block">{product.description}</p>

                  <div className="mt-auto flex items-end justify-between gap-2">
                    <div className="flex flex-col">
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs line-through decoration-red-400">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-lg">{formatPrice(product.price)}</span>
                      <div className="flex flex-col gap-1.5 mt-2 w-full">
                        {/* Sold Badge */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] sm:text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800 flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start">
                            🔥 Terjual {product.sold_count || 0}
                          </span>
                        </div>

                        {/* Stock Badge */}
                        <div className="flex items-center gap-1">
                          {product.payment_type === 'MANUAL' ? (
                            <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 w-full sm:w-auto text-center sm:text-left">
                              Stock {product.manual_stock ?? 100}
                            </span>
                          ) : (
                            <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded border w-full sm:w-auto text-center sm:text-left ${product.stock_count && product.stock_count > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                              Stock {product.stock_count ?? 0}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Hide button if Auto & Stock 0 */}
                    {!((!product.payment_type || product.payment_type === 'AUTO') && product.stock_count === 0) && (
                      (!product.payment_type || product.payment_type === 'AUTO') ? (
                        <Link
                          to={`/product/${product.id}`}
                          className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white rounded-lg sm:rounded-xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 shadow-sm"
                          title="Beli Sekarang"
                        >
                          <ShoppingCart size={16} className="sm:w-5 sm:h-5" />
                        </Link>
                      ) : (
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white rounded-lg sm:rounded-xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 shadow-sm"
                          title={product.button_text || 'Beli Sekarang'}
                        >
                          <ShoppingCart size={16} className="sm:w-5 sm:h-5" />
                        </a>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;