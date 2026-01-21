import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Loader, X, QrCode, MessageCircle } from 'lucide-react';
import { getProductById, getSiteConfig, getPaymentConfig, getProductStockCount } from '../services/dataService';
import { createTransaction } from '../services/paymentService';
import { Product } from '../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [paymentConfig, setPaymentConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Checkout State
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Email, 2: Method
  const [email, setEmail] = useState('');
  const [targetLink, setTargetLink] = useState(''); // Store Link Tujuan / No. HP
  const [paymentMethod, setPaymentMethod] = useState<'MANUAL' | 'ATLANTIC_QRIS'>('ATLANTIC_QRIS');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (id) {
        const [productData, configData, paymentConfigData] = await Promise.all([
          getProductById(parseInt(id)),
          getSiteConfig(),
          getPaymentConfig()
        ]);

        let finalProduct = productData;
        if (productData && (!productData.payment_type || productData.payment_type === 'AUTO')) {
          const count = await getProductStockCount(productData.id);
          finalProduct = { ...productData, stock_count: count };
        }

        setProduct(finalProduct || null);
        setConfig(configData);
        setPaymentConfig(paymentConfigData);

        // Set default payment method based on product setting
        if (productData) {
          if (productData.payment_type === 'MANUAL') {
            setPaymentMethod('MANUAL');
          } else {
            setPaymentMethod('ATLANTIC_QRIS');
          }
        }
      }
      setLoading(false);
    };
    fetch();
    window.scrollTo(0, 0);
  }, [id]);

  const handleBuyClick = () => {
    setShowModal(true);
    setStep(1);
  };

  const handleCreateTransaction = async () => {
    if (!product || !email) return;
    setProcessing(true);
    try {
      const trx = await createTransaction(product.id, product.title, product.price, email, targetLink, paymentMethod);
      if (trx) {
        // Redirect to Persistent Payment Page
        navigate(`/payment/${trx.id}`);
      }
    } catch (e) {
      alert('Gagal membuat transaksi');
    }
    setProcessing(false);
  };

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
            {(!product.payment_type || product.payment_type === 'AUTO') && product.stock_count === 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 rounded-2xl">
                <span className="text-white font-bold text-2xl border-4 border-white px-6 py-2 rounded-xl transform -rotate-12 uppercase tracking-wider">
                  STOK HABIS
                </span>
              </div>
            )}
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
                <div className="flex flex-col">
                  {(!product.payment_type || product.payment_type === 'AUTO') && (
                    <span className={`text-lg font-medium mb-1 ${product.stock_count && product.stock_count > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      Stok Tersedia: {product.stock_count ?? '...'}
                    </span>
                  )}
                  <p className="text-2xl md:text-3xl text-blue-600 dark:text-blue-400 font-bold">{formatPrice(product.price)}</p>
                </div>
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
              {!((!product.payment_type || product.payment_type === 'AUTO') && product.stock_count === 0) && (
                <button
                  onClick={handleBuyClick}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
                >
                  <ShoppingCart size={20} /> {product.button_text || 'Beli Sekarang'}
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* CHECKOUT MODAL - Only Step 1 & 2 */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
              >
                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShoppingCart size={20} />
                    {step === 1 ? 'Data Pembeli' : 'Metode Pembayaran'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* STEP 1: EMAIL */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Masukkan email aktif untuk menerima detail pesanan dan struk pembelian.</p>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                          type="email"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="nama@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp / Link Tujuan (Opsional)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Contoh: 08123456789 atau https://instagram.com/..."
                          value={targetLink}
                          onChange={(e) => setTargetLink(e.target.value)}
                        />
                      </div>
                      <button
                        disabled={!email}
                        onClick={() => setStep(2)}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors mt-4"
                      >
                        Lanjut Pilih Pembayaran
                      </button>
                    </div>
                  )}

                  {/* STEP 2: METHOD */}
                  {step === 2 && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Pilih metode pembayaran yang diinginkan.</p>

                      {/* QRIS OPTION */}
                      {(!product?.payment_type || product.payment_type === 'AUTO') && (
                        <button
                          onClick={() => setPaymentMethod('ATLANTIC_QRIS')}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'ATLANTIC_QRIS' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded shadow-sm"><QrCode className="text-slate-900" size={24} /></div>
                            <div className="text-left">
                              <div className="font-bold text-slate-900 dark:text-white">QRIS Otomatis</div>
                              <div className="text-xs text-slate-500">Cek Otomatis + Instan</div>
                            </div>
                          </div>
                          {paymentMethod === 'ATLANTIC_QRIS' && <div className="w-4 h-4 rounded-full bg-blue-500"></div>}
                        </button>
                      )}

                      {/* MANUAL OPTION */}
                      {(product?.payment_type === 'MANUAL') && (
                        <button
                          onClick={() => setPaymentMethod('MANUAL')}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'MANUAL' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded shadow-sm"><MessageCircle className="text-green-600" size={24} /></div>
                            <div className="text-left">
                              <div className="font-bold text-slate-900 dark:text-white">Manual Admin (WA)</div>
                              <div className="text-xs text-slate-500">Konfirmasi via WhatsApp</div>
                            </div>
                          </div>
                          {paymentMethod === 'MANUAL' && <div className="w-4 h-4 rounded-full bg-blue-500"></div>}
                        </button>
                      )}

                      <button
                        onClick={handleCreateTransaction}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-4 flex justify-center items-center gap-2"
                      >
                        {processing ? <Loader className="animate-spin" size={20} /> : 'Bayar Sekarang'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductDetail;