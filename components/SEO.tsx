import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getSiteConfig } from '../services/dataService';

const SEO: React.FC = () => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const location = useLocation();

  useEffect(() => {
    getSiteConfig().then(setConfig);
  }, []);

  const title = config['seo_site_title'] || config['brand_name'] || '';
  const description = config['seo_description'] || '';
  const keywords = config['seo_keywords'] || '';
  const author = config['seo_author'] || config['brand_name'] || '';
  const image = config['seo_og_image'] || config['brand_logo_url'] || '';
  const url = window.location.origin + location.pathname;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Search Engine Verification */}
      {config['seo_google_verification'] && (
        <meta name="google-site-verification" content={config['seo_google_verification']} />
      )}
      {config['seo_bing_verification'] && (
        <meta name="msvalidate.01" content={config['seo_bing_verification']} />
      )}
      {config['seo_yandex_verification'] && (
        <meta name="yandex-verification" content={config['seo_yandex_verification']} />
      )}
    </Helmet>
  );
};

export default SEO;