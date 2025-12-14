import { supabase, isSupabaseConfigured } from './supabase';
import { Product, Freebie, SiteConfig, SocialLink } from '../types';

// --- MOCK CONFIG (EMPTY DEFAULT) ---
// Used only to define keys, values are empty to trigger "Tidak tersedia" in UI
const MOCK_CONFIG: SiteConfig[] = [
  // General
  { key: 'brand_name', value: '' },
  { key: 'brand_logo_url', value: '' },
  
  // SEO (Defaulting to generic if empty is usually better, but per request will leave empty)
  { key: 'seo_site_title', value: '' },
  { key: 'seo_description', value: '' },
  { key: 'seo_keywords', value: '' },
  { key: 'seo_author', value: '' },
  { key: 'seo_google_verification', value: '' },
  { key: 'seo_bing_verification', value: '' },
  { key: 'seo_yandex_verification', value: '' },
  { key: 'seo_og_image', value: '' },

  // Hero
  { key: 'hero_badge_text', value: '' }, // ADDED: Badge Text
  { key: 'hero_title', value: '' },
  { key: 'hero_subtitle', value: '' },
  { key: 'hero_btn_primary', value: '' },
  { key: 'hero_btn_secondary', value: '' },
  { key: 'hero_image_url', value: '' },

  // Products Section
  { key: 'products_title', value: '' },
  { key: 'products_subtitle', value: '' },

  // Freebies Section
  { key: 'freebies_badge_text', value: '' }, // ADDED: Badge Text
  { key: 'freebies_title', value: '' },
  { key: 'freebies_subtitle', value: '' },

  // WhatsApp Section
  { key: 'wa_section_title', value: '' },
  { key: 'wa_section_desc', value: '' },
  { key: 'wa_btn_text', value: '' },
  { key: 'wa_link', value: '' },

  // Footer
  { key: 'footer_text', value: '' },

  // Fake Purchase Notification
  { key: 'fake_purchase_enabled', value: 'false' }, // Disabled by default if no data
  { key: 'fake_purchase_delay', value: '20' },
  { key: 'fake_purchase_names', value: '' },
  
  // Product Detail
  { key: 'product_badge_text', value: '' },
  
  // Detail Page Features
  { key: 'detail_feature_1_title', value: '' },
  { key: 'detail_feature_1_desc', value: '' },
  { key: 'detail_feature_2_title', value: '' },
  { key: 'detail_feature_2_desc', value: '' },
];

// --- STORAGE OPERATIONS ---

export const uploadImage = async (file: File): Promise<string> => {
  // If no Supabase, return a local Object URL for preview purposes
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured. Using local object URL for preview.");
    return URL.createObjectURL(file);
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('images') // Pastikan bucket 'images' sudah dibuat di Supabase
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading image:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
};

// --- READ OPERATIONS ---

export const getProducts = async (): Promise<Product[]> => {
  // Return empty array if not configured to show "No Data" state in UI
  if (!isSupabaseConfigured()) return []; 
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
};

export const getProductById = async (id: number): Promise<Product | undefined> => {
  if (!isSupabaseConfigured()) return undefined;
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) { console.error(error); return undefined; }
  return data;
};

export const getFreebies = async (): Promise<Freebie[]> => {
  // Return empty array if not configured to show "No Data" state in UI
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('freebies').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
};

export const getSocialLinks = async (): Promise<SocialLink[]> => {
  // Return empty array if not configured to show "No Data" state in UI
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.from('social_links').select('*').order('id', { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
};

export const getSiteConfig = async (): Promise<Record<string, string>> => {
  // Return empty values if not configured, prompting UI to use "Tidak tersedia" defaults
  if (!isSupabaseConfigured()) {
    return {};
  }
  const { data, error } = await supabase.from('site_config').select('*');
  if (error) { console.error(error); return {}; }
  return (data || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
};

// --- WRITE OPERATIONS (ADMIN) ---

export const saveSiteConfig = async (key: string, value: string) => {
  if (!isSupabaseConfigured()) { console.log(`Mock Save Config: ${key} = ${value}`); return; }
  const { error } = await supabase.from('site_config').upsert({ key, value });
  if (error) throw error;
};

// Product CRUD
export const createProduct = async (product: Omit<Product, 'id' | 'created_at'>) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('products').insert(product);
  if (error) throw error;
};

export const updateProduct = async (id: number, product: Partial<Product>) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('products').update(product).eq('id', id);
  if (error) throw error;
};

export const deleteProduct = async (id: number) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

// Freebie CRUD
export const createFreebie = async (freebie: Omit<Freebie, 'id' | 'created_at'>) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('freebies').insert(freebie);
  if (error) throw error;
};

export const updateFreebie = async (id: number, freebie: Partial<Freebie>) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('freebies').update(freebie).eq('id', id);
  if (error) throw error;
};

export const deleteFreebie = async (id: number) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('freebies').delete().eq('id', id);
  if (error) throw error;
};

// Social Links CRUD
export const createSocialLink = async (link: Omit<SocialLink, 'id' | 'created_at'>) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('social_links').insert(link);
  if (error) throw error;
};

export const deleteSocialLink = async (id: number) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('social_links').delete().eq('id', id);
  if (error) throw error;
};