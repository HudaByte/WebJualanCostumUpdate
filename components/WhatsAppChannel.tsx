import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { getSiteConfig } from '../services/dataService';

const WhatsAppChannel: React.FC = () => {
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    getSiteConfig().then(setConfig);
  }, []);

  const title = config['wa_section_title'] || 'Tidak tersedia';
  const desc = config['wa_section_desc'] || 'Tidak tersedia';
  const btnText = config['wa_btn_text'] || 'Tidak tersedia';
  const waLink = config['wa_link'];

  const renderTitle = (text: string) => {
    const parts = text.split('"');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-cyan-200">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <section id="channel-wa" className="py-24 relative overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
      
      <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 p-8 md:p-12 rounded-3xl shadow-2xl shadow-blue-500/30 relative overflow-hidden"
        >
          {/* Decorative Circle */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 whitespace-pre-line">
            {renderTitle(title)}
          </h2>
          
          <p className="text-blue-50 text-lg mb-8 max-w-2xl mx-auto">
            {desc}
          </p>
          
          {waLink ? (
             <a 
              href={waLink} 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-blue-600 hover:bg-slate-50 font-bold text-lg px-8 py-4 rounded-full transition-transform hover:scale-105 shadow-lg"
            >
              <MessageCircle size={24} />
              {btnText}
            </a>
          ) : (
            <button 
              disabled
              className="inline-flex items-center gap-3 bg-white/50 text-white font-bold text-lg px-8 py-4 rounded-full cursor-not-allowed"
            >
              <MessageCircle size={24} />
              Tidak tersedia
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default WhatsAppChannel;