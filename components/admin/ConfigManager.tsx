import React, { useState } from 'react';
import { Settings, Save, Upload } from 'lucide-react';
import { ConfigInput } from './ConfigInput';
import { saveSiteConfig, uploadImage } from '../../services/dataService';

interface ConfigManagerProps {
    config: Record<string, string>;
    setConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    fetchData: () => void;
}

const ConfigManager: React.FC<ConfigManagerProps> = ({ config, setConfig, fetchData }) => {
    const [loading, setLoading] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);

    const handleConfigChange = (key: string, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploadingImg(true);
        try {
            const publicUrl = await uploadImage(file);
            if (type === 'logo') {
                setConfig(prev => ({ ...prev, brand_logo_url: publicUrl }));
            } else if (type === 'hero') {
                setConfig(prev => ({ ...prev, hero_image_url: publicUrl }));
            }
        } catch (error) {
            alert("Gagal upload gambar.");
        } finally {
            setUploadingImg(false);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            for (const [key, value] of Object.entries(config)) {
                await saveSiteConfig(key, value as string);
            }
            alert('Config Saved!');
        } catch (err) {
            alert('Error saving config');
        }
        setLoading(false);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Konfigurasi Website</h2>
            <form onSubmit={handleSaveConfig} className="space-y-6 max-w-3xl">
                {/* Brand Section */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Settings size={18} /> Branding</h3>
                    <ConfigInput label="Nama Brand" confKey="brand_name" value={config['brand_name'] || ''} onChange={(v) => handleConfigChange('brand_name', v)} />

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Logo URL</label>
                        <div className="flex gap-2">
                            <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={config['brand_logo_url'] || ''} onChange={(e) => handleConfigChange('brand_logo_url', e.target.value)} />
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                                {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />} <span className="hidden sm:inline">Upload</span> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                            </label>
                        </div>
                        {config['brand_logo_url'] && <img src={config['brand_logo_url']} alt="Logo Preview" className="h-12 mt-2 object-contain bg-slate-200 dark:bg-slate-900 rounded p-1" />}
                    </div>
                </div>

                {/* Hero Section */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Settings size={18} /> Hero Section</h3>
                    <ConfigInput label="Hero Badge Text" confKey="hero_badge_text" value={config['hero_badge_text'] || ''} onChange={(v) => handleConfigChange('hero_badge_text', v)} />
                    <ConfigInput label="Hero Title" confKey="hero_title" value={config['hero_title'] || ''} onChange={(v) => handleConfigChange('hero_title', v)} />
                    <ConfigInput label="Hero Subtitle" confKey="hero_subtitle" type="textarea" value={config['hero_subtitle'] || ''} onChange={(v) => handleConfigChange('hero_subtitle', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <ConfigInput label="Primary Button" confKey="hero_btn_primary" value={config['hero_btn_primary'] || ''} onChange={(v) => handleConfigChange('hero_btn_primary', v)} />
                        <ConfigInput label="Secondary Button" confKey="hero_btn_secondary" value={config['hero_btn_secondary'] || ''} onChange={(v) => handleConfigChange('hero_btn_secondary', v)} />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Hero Image URL</label>
                        <div className="flex gap-2">
                            <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={config['hero_image_url'] || ''} onChange={(e) => handleConfigChange('hero_image_url', e.target.value)} />
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                                {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />} <span className="hidden sm:inline">Upload</span> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Other Sections */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Product Section</h3>
                    <ConfigInput label="Title" confKey="products_title" value={config['products_title'] || ''} onChange={(v) => handleConfigChange('products_title', v)} />
                    <ConfigInput label="Subtitle" confKey="products_subtitle" value={config['products_subtitle'] || ''} onChange={(v) => handleConfigChange('products_subtitle', v)} />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Freebies Section</h3>
                    <ConfigInput label="Badge Text" confKey="freebies_badge_text" value={config['freebies_badge_text'] || ''} onChange={(v) => handleConfigChange('freebies_badge_text', v)} />
                    <ConfigInput label="Title" confKey="freebies_title" value={config['freebies_title'] || ''} onChange={(v) => handleConfigChange('freebies_title', v)} />
                    <ConfigInput label="Subtitle" confKey="freebies_subtitle" value={config['freebies_subtitle'] || ''} onChange={(v) => handleConfigChange('freebies_subtitle', v)} />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">WhatsApp Section</h3>
                    <ConfigInput label="Title" confKey="wa_section_title" value={config['wa_section_title'] || ''} onChange={(v) => handleConfigChange('wa_section_title', v)} />
                    <ConfigInput label="Description" confKey="wa_section_desc" type="textarea" value={config['wa_section_desc'] || ''} onChange={(v) => handleConfigChange('wa_section_desc', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <ConfigInput label="Button Text" confKey="wa_btn_text" value={config['wa_btn_text'] || ''} onChange={(v) => handleConfigChange('wa_btn_text', v)} />
                        <ConfigInput label="WA Number/Link" confKey="wa_link" value={config['wa_link'] || ''} onChange={(v) => handleConfigChange('wa_link', v)} />
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Footer</h3>
                    <ConfigInput label="Footer Text" confKey="footer_text" type="textarea" value={config['footer_text'] || ''} onChange={(v) => handleConfigChange('footer_text', v)} />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Fake Purchase Notification</h3>
                    <ConfigInput label="Enabled (true/false)" confKey="fake_purchase_enabled" value={config['fake_purchase_enabled'] || ''} onChange={(v) => handleConfigChange('fake_purchase_enabled', v)} />
                    <ConfigInput label="Delay (seconds)" confKey="fake_purchase_delay" value={config['fake_purchase_delay'] || ''} onChange={(v) => handleConfigChange('fake_purchase_delay', v)} />
                    <ConfigInput label="Names (comma separated)" confKey="fake_purchase_names" type="textarea" value={config['fake_purchase_names'] || ''} onChange={(v) => handleConfigChange('fake_purchase_names', v)} />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors sticky bottom-4 shadow-xl" disabled={loading}>
                    <Save size={20} /> Simpan Konfigurasi
                </button>
            </form>
        </div>
    );
};

export default ConfigManager;
