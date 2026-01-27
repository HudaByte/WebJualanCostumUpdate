import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, ImageOff } from 'lucide-react';
import { getSiteConfig } from '../services/dataService';

const Hero: React.FC = () => {
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    // Priority fetch for hero config
    getSiteConfig().then(setConfig);
  }, []);

  const heroBadge = config['hero_badge_text'] || 'Tidak tersedia';
  const heroTitle = config['hero_title'] || 'Tidak tersedia';
  const heroSubtitle = config['hero_subtitle'] || "Tidak tersedia";
  const btnPrimary = config['hero_btn_primary'] || "Tidak tersedia";
  const btnSecondary = config['hero_btn_secondary'] || "Tidak tersedia";
  const heroImage = config['hero_image_url'];

  const renderTitle = (text: string) => {
    const parts = text.split('"');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-400 animate-gradient-x font-extrabold">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-12 md:pt-20 md:pb-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 content-visibility-auto">
      {/* Background Glows - Reduced blur intensity for mobile performance */}
      <div className="absolute top-0 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[40px] md:blur-[100px] opacity-60 animate-pulse-slow gpu-accel pointer-events-none" style={{ transform: 'translateZ(0)' }}></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-cyan-400/20 dark:bg-cyan-600/10 rounded-full blur-[40px] md:blur-[100px] opacity-60 pointer-events-none gpu-accel" style={{ transform: 'translateZ(0)' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ transform: 'translateZ(0)' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-800 mb-6 md:mb-8 shadow-sm">
            <Zap size={16} className="text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
            <span className="text-slate-600 dark:text-slate-300 text-xs md:text-sm font-medium">{heroBadge}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1] md:leading-tight whitespace-pre-line drop-shadow-sm">
            {renderTitle(heroTitle)}
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-base md:text-xl text-slate-500 dark:text-slate-400 mb-8 md:mb-10 px-2 leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
            <a
              href="#produk"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#produk')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto group px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {btnPrimary}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#gratis"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#gratis')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-all shadow-sm hover:shadow-md text-center"
            >
              {btnSecondary}
            </a>
          </div>
        </motion.div>

        {/* Floating Element Visual */}
        <motion.div
          className="mt-12 md:mt-16 relative w-full max-w-4xl mx-auto px-2 gpu-accel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/20 blur-3xl -z-10 transform-gpu"></div>
          {(() => {
            let slides: { image: string, link: string }[] = [];
            try {
              slides = JSON.parse(config['hero_slides'] || '[]');
            } catch (e) {
              slides = [];
            }

            const activeSlides = slides.filter(s => s.image);
            const interval = parseInt(config['hero_slides_interval'] || '5000');

            // Hook for current slide index
            const [currentIndex, setCurrentIndex] = useState(0);

            useEffect(() => {
              if (activeSlides.length <= 1) return;
              const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
              }, interval);
              return () => clearInterval(timer);
            }, [activeSlides.length, interval]);

            if (activeSlides.length > 0) {
              return (
                <div className="relative w-full h-auto aspect-[2/1] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-white dark:border-slate-800 shadow-2xl animate-float ring-1 ring-slate-900/5 dark:ring-white/10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 w-full h-full"
                    >
                      {activeSlides[currentIndex].link ? (
                        <a href={activeSlides[currentIndex].link} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                          <img
                            src={activeSlides[currentIndex].image}
                            alt={`Slide ${currentIndex}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : (
                        <img
                          src={activeSlides[currentIndex].image}
                          alt={`Slide ${currentIndex}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Indicators */}
                  {activeSlides.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                      {activeSlides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // FALLBACK TO SINGLE IMAGE
            const heroLink = config['hero_image_link'];

            return heroImage ? (
              heroLink ? (
                <a href={heroLink} target="_blank" rel="noopener noreferrer" className="block w-full cursor-pointer transition-transform hover:scale-[1.01] duration-300">
                  <img
                    src={heroImage}
                    alt="Dashboard Preview"
                    width="1200"
                    height="600"
                    decoding="async"
                    fetchPriority="high"
                    style={{ aspectRatio: '2/1' }}
                    className="rounded-xl border border-white dark:border-slate-800 shadow-2xl opacity-90 animate-float w-full h-auto ring-1 ring-slate-900/5 dark:ring-white/10 bg-slate-100 dark:bg-slate-800"
                  />
                </a>
              ) : (
                <img
                  src={heroImage}
                  alt="Dashboard Preview"
                  width="1200"
                  height="600"
                  decoding="async"
                  fetchPriority="high"
                  style={{ aspectRatio: '2/1' }}
                  className="rounded-xl border border-white dark:border-slate-800 shadow-2xl opacity-90 animate-float w-full h-auto ring-1 ring-slate-900/5 dark:ring-white/10 bg-slate-100 dark:bg-slate-800"
                />
              )
            ) : (
              <div className="w-full h-[300px] md:h-[500px] bg-slate-200 dark:bg-slate-800/50 rounded-xl flex flex-col items-center justify-center border border-slate-300 dark:border-slate-700 animate-float">
                <ImageOff size={48} className="text-slate-400 mb-2" />
                <span className="text-slate-500 dark:text-slate-400 font-medium text-lg">Gambar Tidak tersedia</span>
              </div>
            );
          })()}
        </motion.div>
      </div>
    </section >
  );
};

export default Hero;