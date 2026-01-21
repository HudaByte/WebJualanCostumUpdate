import React, { useEffect, useState } from 'react';
import { getSiteConfig, getSocialLinks } from '../services/dataService';
import { SocialLink } from '../types';

const Footer: React.FC = () => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [socials, setSocials] = useState<SocialLink[]>([]);

  useEffect(() => {
    getSiteConfig().then(setConfig);
    getSocialLinks().then(setSocials);
  }, []);

  // Use dynamic values from config
  const footerText = config['footer_text'] || 'Tidak tersedia';
  const brandName = config['brand_name'] || 'Tidak tersedia';

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          
          {/* Spacer for Centering (Desktop Only) */}
          <div className="hidden md:block flex-1"></div>

          {/* Center Column: Brand & Socials */}
          <div className="text-center md:flex-[2]">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{brandName}</h3>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
              {footerText}
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              {socials.map(social => (
                <a 
                    key={social.id} 
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                >
                    {social.label}
                </a>
              ))}
              {socials.length === 0 && (
                  <span className="text-slate-400 text-sm italic">Tidak tersedia</span>
              )}
            </div>
          </div>

          {/* Right Column: Payment Methods */}
          <div className="mt-8 md:mt-0 flex-1 flex flex-col items-center md:items-end">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Metode Pembayaran</h3>
            <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 w-fit">
               <img 
                 src="/qris.png" 
                 alt="QRIS Payment" 
                 className="h-10 w-auto object-contain"
               />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;