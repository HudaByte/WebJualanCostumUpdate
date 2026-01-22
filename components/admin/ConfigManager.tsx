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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero' | 'popup') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploadingImg(true);
        try {
            const publicUrl = await uploadImage(file);
            if (type === 'logo') {
                setConfig(prev => ({ ...prev, brand_logo_url: publicUrl }));
            } else if (type === 'hero') {
                setConfig(prev => ({ ...prev, hero_image_url: publicUrl }));
            } else if (type === 'popup') {
                setConfig(prev => ({ ...prev, popup_image_url: publicUrl }));
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
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Hero Image URL (Fallback)</label>
                        <div className="flex gap-2">
                            <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={config['hero_image_url'] || ''} onChange={(e) => handleConfigChange('hero_image_url', e.target.value)} />
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                                {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />} <span className="hidden sm:inline">Upload</span> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} />
                            </label>
                        </div>
                        <div className="mt-2">
                            <ConfigInput
                                label="Link URL untuk Gambar (Opsional)"
                                confKey="hero_image_link"
                                value={config['hero_image_link'] || ''}
                                onChange={(v) => handleConfigChange('hero_image_link', v)}
                                help="Jika diisi, gambar Hero akan bisa diklik menuju link ini."
                            />
                        </div>
                    </div>

                    {/* Hero Slider Manager */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Hero Slider (Carousel)</label>
                        <p className="text-xs text-slate-500 mb-4">Tambahkan banyak gambar untuk membuat slider otomatis. Jika ini diisi, "Hero Image" di atas akan diabaikan.</p>

                        <div className="space-y-4">
                            {(() => {
                                let slides = [];
                                try {
                                    slides = JSON.parse(config['hero_slides'] || '[]');
                                } catch (e) {
                                    slides = [];
                                }

                                const updateSlides = (newSlides: any[]) => {
                                    handleConfigChange('hero_slides', JSON.stringify(newSlides));
                                };

                                return (
                                    <>
                                        {/* Slide List */}
                                        {slides.map((slide: any, index: number) => (
                                            <div key={index} className="flex gap-4 items-start bg-slate-50 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                                                <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded flex-shrink-0 overflow-hidden border border-slate-300 dark:border-slate-600">
                                                    {slide.image ? (
                                                        <img src={slide.image} alt={`Slide ${index}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500">Image URL</label>
                                                        <input
                                                            className="w-full text-xs p-1 rounded border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                            value={slide.image || ''}
                                                            onChange={(e) => {
                                                                const newSlides = [...slides];
                                                                newSlides[index].image = e.target.value;
                                                                updateSlides(newSlides);
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500">Target Link (Optional)</label>
                                                        <input
                                                            className="w-full text-xs p-1 rounded border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                            value={slide.link || ''}
                                                            placeholder="https://..."
                                                            onChange={(e) => {
                                                                const newSlides = [...slides];
                                                                newSlides[index].link = e.target.value;
                                                                updateSlides(newSlides);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newSlides = slides.filter((_: any, i: number) => i !== index);
                                                        updateSlides(newSlides);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))}

                                        {/* Add Button */}
                                        <button
                                            type="button"
                                            onClick={() => updateSlides([...slides, { image: '', link: '' }])}
                                            className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            Tambah Slide
                                        </button>

                                        {/* Delay Config */}
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <ConfigInput
                                                label="Kecepatan Slide (ms)"
                                                confKey="hero_slides_interval"
                                                type="number"
                                                value={config['hero_slides_interval'] || '5000'}
                                                onChange={(v) => handleConfigChange('hero_slides_interval', v)}
                                                help="Contoh: 3000 = 3 detik, 5000 = 5 detik"
                                            />
                                        </div>
                                    </>
                                );
                            })()}
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

                {/* Pop-up Promo/Notifikasi */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 md:p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-purple-700 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Pop-up Promo/Notifikasi
                    </h3>

                    <div className="space-y-4">
                        {/* Enable/Disable */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aktifkan Pop-up</label>
                            <select
                                value={config['popup_enabled'] || 'false'}
                                onChange={(e) => handleConfigChange('popup_enabled', e.target.value)}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="false">Non-aktif</option>
                                <option value="true">Aktif</option>
                            </select>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gambar Pop-up</label>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'popup')}
                                    className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
                                />
                                {config['popup_image_url'] && (
                                    <div className="mt-2">
                                        <img src={config['popup_image_url']} alt="Popup Preview" className="max-w-xs max-h-40 object-contain rounded border-2 border-purple-200 dark:border-purple-700 shadow-md" />
                                    </div>
                                )}
                                <p className="text-xs text-slate-500">💡 Ukuran rekomendasi: 800x600px atau 1200x800px</p>
                            </div>
                        </div>

                        {/* Text Content (Optional alternative to image) */}
                        <ConfigInput
                            label="Teks Pop-up (Alternatif gambar)"
                            confKey="popup_text"
                            type="textarea"
                            value={config['popup_text'] || ''}
                            onChange={(v) => handleConfigChange('popup_text', v)}
                            help="Jika tidak ada gambar, teks ini yang akan ditampilkan. Bisa pakai HTML sederhana."
                        />

                        {/* Repeat Mode */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mode Tampil</label>
                            <select
                                value={config['popup_repeat_mode'] || 'false'}
                                onChange={(e) => handleConfigChange('popup_repeat_mode', e.target.value)}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="false">Sekali Tampil (saat reload aja)</option>
                                <option value="true">Repeat (muncul lagi sesuai delay)</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">💡 Pilih "Sekali Tampil" jika popup hanya mau muncul 1x saat visitor pertama kali buka web</p>
                        </div>

                        {/* Link URL */}
                        <ConfigInput
                            label="Link URL (Opsional)"
                            confKey="popup_link"
                            value={config['popup_link'] || ''}
                            onChange={(v) => handleConfigChange('popup_link', v)}
                            help="Jika diisi, gambar akan bisa diklik dan menuju link ini. Contoh: https://tokopedia.com/promo"
                        />

                        {/* Delay */}
                        <ConfigInput
                            label="Delay Muncul Lagi (detik)"
                            confKey="popup_delay"
                            type="number"
                            value={config['popup_delay'] || '30'}
                            onChange={(v) => handleConfigChange('popup_delay', v)}
                            help="Berapa detik setelah popup ditutup, akan muncul lagi. Contoh: 30 = muncul tiap 30 detik"
                        />

                        <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-3 text-sm text-purple-800 dark:text-purple-200">
                            <strong>📌 Cara Kerja:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                                <li>Pop-up muncul saat pertama kali visitor buka website</li>
                                <li>Setelah ditutup, pop-up akan muncul lagi sesuai delay yang diatur</li>
                                <li>Cocok untuk promo flash sale, diskon, atau pengumuman penting</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Store Operating Hours */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 md:p-6 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-orange-700 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        🏪 Jam Operasional Toko
                    </h3>

                    <div className="space-y-4">
                        {/* Store Mode */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Toko</label>
                            <select
                                value={config['store_mode'] || 'open'}
                                onChange={(e) => handleConfigChange('store_mode', e.target.value)}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="open">🟢 Buka (Normal / Ikuti Jadwal)</option>
                                <option value="closed">🔴 Tutup (Manual)</option>
                                <option value="maintenance">🛠️ Maintenance (Perbaikan Web)</option>
                                <option value="restocking">📦 Restock (Isi Stok)</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">💡 Pilih status tampilan toko saat ini.</p>
                        </div>

                        {/* Auto Schedule Toggle */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mode Jadwal</label>
                            <select
                                value={config['store_auto_schedule'] || 'false'}
                                onChange={(e) => handleConfigChange('store_auto_schedule', e.target.value)}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="false">Manual (Selalu buka kecuali ditutup manual)</option>
                                <option value="true">Otomatis (Sesuai jam yang diatur)</option>
                            </select>
                        </div>

                        {/* Operating Hours */}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mb-4 text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                                <span className="text-lg">ℹ️</span>
                                <p>
                                    <strong>Info:</strong> Jam operasional di bawah ini digunakan untuk:<br />
                                    1. Menentukan jadwal otomatis (jika Status = <strong>"Buka"</strong> & Mode Jadwal = <strong>"Otomatis"</strong>).<br />
                                    2. Ditampilkan di halaman "Toko Tutup" sebagai informasi bagi pengunjung.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jam Buka</label>
                                    <input
                                        type="time"
                                        value={config['store_hours_open'] || '09:00'}
                                        onChange={(e) => handleConfigChange('store_hours_open', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jam Tutup</label>
                                    <input
                                        type="time"
                                        value={config['store_hours_close'] || '21:00'}
                                        onChange={(e) => handleConfigChange('store_hours_close', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Operating Days */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hari Buka</label>
                                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                                    {[
                                        { val: '1', label: 'Sen' },
                                        { val: '2', label: 'Sel' },
                                        { val: '3', label: 'Rab' },
                                        { val: '4', label: 'Kam' },
                                        { val: '5', label: 'Jum' },
                                        { val: '6', label: 'Sab' },
                                        { val: '7', label: 'Min' }
                                    ].map(day => {
                                        const days = (config['store_days'] || '1,2,3,4,5,6,7').split(',');
                                        const isSelected = days.includes(day.val);
                                        return (
                                            <button
                                                key={day.val}
                                                type="button"
                                                onClick={() => {
                                                    const currentDays = (config['store_days'] || '1,2,3,4,5,6,7').split(',').filter(Boolean);
                                                    const newDays = isSelected
                                                        ? currentDays.filter(d => d !== day.val)
                                                        : [...currentDays, day.val];
                                                    handleConfigChange('store_days', newDays.sort().join(','));
                                                }}
                                                className={`px-3 py-2 rounded font-medium text-sm transition-all ${isSelected
                                                    ? 'bg-orange-600 text-white shadow-md'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Closed Message */}
                        <ConfigInput
                            label="Pesan Toko Tutup"
                            confKey="store_closed_message"
                            type="textarea"
                            value={config['store_closed_message'] || 'Maaf, toko sedang tutup. Silakan kembali saat jam operasional.'}
                            onChange={(v) => handleConfigChange('store_closed_message', v)}
                            help="Pesan yang ditampilkan saat toko tutup"
                        />

                        {/* Contact Admin Link */}
                        <ConfigInput
                            label="Link Hubungi Admin (Opsional)"
                            confKey="store_closed_contact_link"
                            value={config['store_closed_contact_link'] || ''}
                            onChange={(v) => handleConfigChange('store_closed_contact_link', v)}
                            help="Jika diisi, akan muncul tombol 'Hubungi Admin' di halaman tutup. Contoh: https://wa.me/62812345678"
                        />

                        {/* Live Status Preview */}
                        <div className="bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
                            <strong className="text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Live Preview
                            </strong>
                            <div className="space-y-1 text-sm text-blue-900 dark:text-blue-200">
                                <p><strong>Mode:</strong> {config['store_auto_schedule'] === 'true' ? 'Otomatis' : 'Manual'}</p>
                                {config['store_auto_schedule'] === 'true' && (
                                    <>
                                        <p><strong>Jam:</strong> {config['store_hours_open'] || '09:00'} - {config['store_hours_close'] || '21:00'} WIB</p>
                                        <p><strong>Hari:</strong> {config['store_days'] || '1,2,3,4,5,6,7'}</p>
                                    </>
                                )}
                                <p className="text-xs opacity-75 mt-2">💡 Timezone: WIB (UTC+7)</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors sticky bottom-4 shadow-xl" disabled={loading}>
                    <Save size={20} /> Simpan Konfigurasi
                </button>
            </form>
        </div>
    );
};

export default ConfigManager;
