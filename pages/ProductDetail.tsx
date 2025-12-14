import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Loader, ShieldCheck, Zap } from 'lucide-react';
import { getProductById, getSiteConfig } from '../services/dataService';
import { Product } from '../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (id) {
        const [productData, configData] = await Promise.all([
          getProductById(parseInt(id)),
          getSiteConfig()
        ]);
        setProduct(productData || null);
        setConfig(configData);
      }
      setLoading(false);
    };
    fetch();
    window.scrollTo(0, 0);
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Produk tidak ditemukan</h2>
        <Link to="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2">
          <ArrowLeft size={20} /> Kembali ke Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 md:mb-8 transition-colors text-sm md:text-base font-medium">
          <ArrowLeft size={20} /> Kembali
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
             {product.original_price && product.original_price > product.price && (
               <div className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-lg shadow-lg z-10 text-sm">
                 HEMAT {Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
               </div>
            )}
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl -z-10 rounded-full"></div>
            <img 
              src={product.image_url} 
              alt={product.title} 
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-blue-500/10"
            />
          </motion.div>

          {/* Content Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-6">
              {config['product_badge_text'] && (
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs md:text-sm font-medium border border-blue-200 dark:border-blue-800 mb-4">
                  {config['product_badge_text']}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">{product.title}</h1>
              <div className="flex items-center gap-3 mb-6">
                {product.original_price && product.original_price > product.price && (
                    <span className="text-xl md:text-2xl text-slate-400 dark:text-slate-500 line-through decoration-2 decoration-red-500">
                        {formatPrice(product.original_price)}
                    </span>
                )}
                <p className="text-2xl md:text-3xl text-blue-600 dark:text-blue-400 font-bold">{formatPrice(product.price)}</p>
              </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 mb-8">
              <p className="text-base md:text-lg leading-relaxed mb-4">{product.description}</p>
              <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-slate-900 dark:text-white font-semibold mb-3">Deskripsi Lengkap:</h3>
                <p className="whitespace-pre-wrap text-sm md:text-base">{product.content || product.description}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <a 
                href={product.link}
                target="_blank"
                rel="noopener noreferrer" 
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
              >
                <ShoppingCart size={20} /> {product.button_text || 'Beli Sekarang'}
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <ShieldCheck className="text-green-500 flex-shrink-0" size={24} />
                <div>
                  <h4 className="text-slate-900 dark:text-white font-medium text-sm">{config['detail_feature_1_title'] || ''}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{config['detail_feature_1_desc'] || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <Zap className="text-yellow-500 flex-shrink-0" size={24} />
                <div>
                  <h4 className="text-slate-900 dark:text-white font-medium text-sm">{config['detail_feature_2_title'] || ''}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{config['detail_feature_2_desc'] || ''}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;