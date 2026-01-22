export interface Product {
  id: number;
  title: string;
  description: string;
  content?: string; // Long description for detail page
  price: number;
  original_price?: number; // Harga Coret (Diskon)
  image_url: string;
  link?: string;
  button_text?: string; // Custom text for the CTA button
  created_at?: string;
  payment_type?: 'AUTO' | 'MANUAL'; // 'AUTO' (QRIS) or 'MANUAL' (WA)
  stock_count?: number; // Optional: For display purposes
  sold_count?: number; // Jumlah terjual (Edited by admin or auto-increment)
  manual_stock?: number; // Stok untuk produk manual (Edited by admin)
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

// --- NEW PAYMENT & STOCK TYPES ---

export interface ProductStock {
  id: number;
  product_id: number;
  content: string;
  is_claimed: boolean;
  created_at?: string;
}

export type TransactionStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export interface Transaction {
  id: string; // UUID
  created_at?: string;
  ref_id?: string;
  product_id: number;
  product_title: string;
  price: number;
  fee?: number;
  get_balance?: number; // Merchant receives from Atlantic (nominal - fee)
  unique_code?: number; // Random unique number (1-999) for payment verification
  atlantic_id?: string;
  buyer_email: string;
  buyer_phone?: string;
  payment_method: 'MANUAL' | 'ATLANTIC_QRIS';
  status: TransactionStatus;
  payment_url?: string; // QRIS URL
  invoice_url?: string; // Generated after payment success
  stock_content?: string; // Delivered content
  reserved_stock_id?: number; // Stock ID reserved for this transaction
  expired_at?: string; // Expiration time from Payment Gateway
  quantity?: number; // Number of items purchased
  reserved_stock_ids?: number[]; // IDs of reserved stocks (for multiple items)
}

export interface PaymentConfig {
  key: string;
  value: string;
}

declare global {
  interface Window {
    __LOAD_META_CONFIG__?: (supabaseUrl: string, supabaseKey: string) => void;
  }
}