export interface Product {
  id: number;
  title: string;
  description: string;
  content?: string; // Long description for detail page
  price: number;
  original_price?: number; // Harga Coret (Diskon)
  image_url: string;
  link: string;
  button_text?: string; // Custom text for the CTA button
  created_at?: string;
}

export interface Freebie {
  id: number;
  title: string;
  description: string;
  image_url: string;
  link: string;
  button_text?: string; // Custom text for the Download button
  created_at?: string;
}

export interface SiteConfig {
  key: string;
  value: string;
}

export interface SocialLink {
  id: number;
  label: string;
  url: string;
  created_at?: string;
}

export interface NavItem {
  label: string;
  href: string;
}

declare global {
  interface Window {
    __LOAD_META_CONFIG__?: (supabaseUrl: string, supabaseKey: string) => void;
  }
}