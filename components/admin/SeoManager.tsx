import React, { useState } from 'react';
import { Search, Share2, Upload, Lock, Save } from 'lucide-react';
import { ConfigInput } from './ConfigInput';
import { saveSiteConfig, uploadImage } from '../../services/dataService';

interface SeoManagerProps {
    config: Record<string, string>;
    setConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    fetchData: () => void;
}

const SeoManager: React.FC<SeoManagerProps> = ({ config, setConfig, fetchData }) => {
    const [uploadingImg, setUploadingImg] = useState(false);

    const handleConfigChange = (key: string, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'og') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploadingImg(true);
        try {
            const publicUrl = await uploadImage(file);
            if (type === 'og') {
                setConfig(prev => ({ ...prev, seo_og_image: publicUrl }));
            }
        } catch (error) {
            alert("Gagal upload gambar.");
        } finally {
            setUploadingImg(false);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            for (const [key, value] of Object.entries(config)) {
                await saveSiteConfig(key, value as string);
            }
            alert('SEO Config Saved!');
        } catch (err) {
            alert('Error saving config');
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">SEO Optimization</h2>
            <form onSubmit={handleSaveConfig} className="space-y-6 max-w-3xl">

                {/* Meta Information */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Search size={18} /> Metadata Website</h3>
                    <ConfigInput label="Judul Website (Title Tag)" confKey="seo_site_title" value={config['seo_site_title'] || ''} onChange={(v) => handleConfigChange('seo_site_title', v)} />
                    <ConfigInput label="Deskripsi Website (Meta Description)" confKey="seo_description" type="textarea" help="Deskripsi yang muncul di hasil pencarian Google. Usahakan 150-160 karakter." value={config['seo_description'] || ''} onChange={(v) => handleConfigChange('seo_description', v)} />
                    <ConfigInput label="Kata Kunci (Keywords)" confKey="seo_keywords" type="textarea" help="Pisahkan dengan koma. Contoh: jual template, aset digital, font murah" value={config['seo_keywords'] || ''} onChange={(v) => handleConfigChange('seo_keywords', v)} />
                    <ConfigInput label="Penulis (Author)" confKey="seo_author" value={config['seo_author'] || ''} onChange={(v) => handleConfigChange('seo_author', v)} />
                </div>

                {/* Open Graph / Social Sharing */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Share2 size={18} /> Social Sharing (Open Graph)</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Gambar Preview Link (OG Image)</label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {config['seo_og_image'] && (
                                <div className="w-24 h-16 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700 p-1 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                                    <img src={config['seo_og_image']} alt="OG Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 w-full">
                                <div className="flex gap-2">
                                    <input
                                        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={config['seo_og_image'] || ''}
                                        onChange={(e) => handleConfigChange('seo_og_image', e.target.value)}
                                        placeholder="URL Gambar"
                                    />
                                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                                        {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />}
                                        <span className="hidden sm:inline">Upload</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'og')} />
                                    </label>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Gambar yang muncul saat link website dibagikan ke WhatsApp, Facebook, atau Twitter. Ukuran rekomendasi: 1200x630px.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Engine Verification */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600 flex items-center gap-2"><Lock size={18} /> Verifikasi Search Engine</h3>
                    <ConfigInput label="Google Search Console (Meta Tag Code)" confKey="seo_google_verification" help="Masukkan kode verifikasi HTML dari Google Search Console." value={config['seo_google_verification'] || ''} onChange={(v) => handleConfigChange('seo_google_verification', v)} />
                    <ConfigInput label="Bing Webmaster Tools" confKey="seo_bing_verification" value={config['seo_bing_verification'] || ''} onChange={(v) => handleConfigChange('seo_bing_verification', v)} />
                    <ConfigInput label="Yandex Webmaster" confKey="seo_yandex_verification" value={config['seo_yandex_verification'] || ''} onChange={(v) => handleConfigChange('seo_yandex_verification', v)} />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors sticky bottom-4 shadow-xl">
                    <Save size={20} /> Simpan Pengaturan SEO
                </button>
            </form>
        </div>
    );
};

export default SeoManager;
