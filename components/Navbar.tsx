import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, Sun, Moon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { getSiteConfig } from '../services/dataService';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [brandName, setBrandName] = useState('Tidak tersedia');
  const [logoUrl, setLogoUrl] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isHome = location.pathname === '/';

  useEffect(() => {
    // 3. Hindari "Heavy Logic" di Event Scroll - Use Intersection Observer
    const sentinel = document.getElementById('navbar-sentinel');

    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // If sentinel is NOT intersecting (scrolled past), set scrolled to true
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-20px 0px 0px 0px' } // Trigger when scrolled 20px
    );

    observer.observe(sentinel);

    // Defer config loading
    setTimeout(() => {
      getSiteConfig().then(config => {
        if (config['brand_name']) setBrandName(config['brand_name']);
        if (config['brand_logo_url']) setLogoUrl(config['brand_logo_url']);
      });
    }, 100);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsOpen(false);

    if (href.startsWith('#')) {
      if (isHome) {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/');
        // Use requestAnimationFrame for smoother transition after nav
        requestAnimationFrame(() => {
          setTimeout(() => {
            const element = document.querySelector(href);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }, 300);
        });
      }
    } else {
      navigate(href);
    }
  };

  // Admin link removed from public navigation
  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Produk', href: '#produk' },
    { name: 'Gratis', href: '#gratis' },
    { name: 'Join Reseller', href: '#channel-wa' },
  ];

  return (
    <>
      {/* Sentinel for IntersectionObserver */}
      <div id="navbar-sentinel" className="absolute top-0 left-0 w-full h-[1px] pointer-events-none opacity-0" />

      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${scrolled || !isHome || isOpen
          ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-blue-100 dark:border-slate-800 py-3 shadow-sm'
          : 'bg-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer z-50 group">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} width="32" height="32" className="w-8 h-8 object-contain rounded-lg" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)] group-hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-shadow">
                  <ShoppingBag size={18} className="text-white" />
                </div>
              )}
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                {brandName}
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <div className="ml-10 flex items-baseline space-x-8">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>

            <div className="-mr-2 flex md:hidden items-center gap-4 z-50">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                aria-label="Toggle Theme Mobile"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 focus:outline-none"
                aria-label="Menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-blue-100 dark:border-slate-800 shadow-xl animate-fade-in">
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block px-4 py-3 rounded-md text-base font-medium cursor-pointer border-l-4 transition-all text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 border-transparent hover:border-blue-400"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;