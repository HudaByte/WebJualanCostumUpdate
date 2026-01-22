import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Download, Gift, Ghost } from 'lucide-react';
import { getFreebies, getSiteConfig } from '../services/dataService';
import { Freebie } from '../types';

// OPTIMIZATION: Static variants definition
const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      delay: i * 0.05
    }
  })
};

const Freebies: React.FC = () => {
  const [freebies, setFreebies] = useState<Freebie[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetch = async () => {
      const [freeData, configData] = await Promise.all([getFreebies(), getSiteConfig()]);
      setFreebies(freeData);
      setConfig(configData);
    };
    fetch();
  }, []);

  const freebiesBadge = config['freebies_badge_text'] || 'Tidak tersedia';
  const title = config['freebies_title'] || 'Tidak tersedia';
  const subtitle = config['freebies_subtitle'] || 'Tidak tersedia';

  const renderTitle = (text: string) => {
    const parts = text.split('"');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <section id="gratis" className="py-20 relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300 content-visibility-auto">
      {/* Optimized background pattern - reduced opacity for paint perf */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.04] dark:invert pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
              <Gift size={20} />
              <span className="font-semibold tracking-wider uppercase text-sm">{freebiesBadge}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              {renderTitle(title)}
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 max-w-md text-left md:text-right">
            {subtitle}
          </p>
        </div>

        {freebies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center"
          >
            <Ghost size={40} className="mx-auto text-slate-400 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Tidak tersedia</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freebies.map((item, index) => (
              <motion.div
                key={item.id}
                custom={index}
                initial="hidden"
                whileInView="visible"
                variants={cardVariants}
                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors hover:shadow-md group will-change-transform"
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  loading="lazy"
                  width="96"
                  height="96"
                  decoding="async"
                  className="w-full sm:w-24 h-48 sm:h-24 rounded-lg object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800"
                />
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-bold line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-lg sm:text-base">{item.title}</h3>
                    <p className="text-sm sm:text-xs text-slate-500 dark:text-slate-400 mt-2 sm:mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <a
                    href={item.link.match(/^[a-zA-Z]+:/) ? item.link : `https://${item.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 sm:mt-3 text-sm sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 self-start"
                  >
                    <Download size={16} className="sm:w-3.5 sm:h-3.5" /> {item.button_text || 'Download Now'}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Freebies;