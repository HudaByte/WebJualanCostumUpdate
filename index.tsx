import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Load meta tags from database before React mounts (for SEO)
(function() {
  const getEnv = (key: string) => {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env[key] || import.meta.env[`VITE_${key}`];
      }
    } catch(e) {}
    return undefined;
  };
  
  const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY');
  
  if (supabaseUrl && supabaseKey && typeof window !== 'undefined' && window.__LOAD_META_CONFIG__) {
    window.__LOAD_META_CONFIG__(supabaseUrl, supabaseKey);
  }
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);