import React, { useState } from 'react';
import { SocialLink } from '../../types';
import { Link as LinkIcon, Trash2 } from 'lucide-react';
import { createSocialLink, deleteSocialLink } from '../../services/dataService';

interface SocialsManagerProps {
    socials: SocialLink[];
    fetchData: () => void;
}

const SocialsManager: React.FC<SocialsManagerProps> = ({ socials, fetchData }) => {
    const [newSocial, setNewSocial] = useState<Partial<SocialLink>>({ label: '', url: '' });
    const [loading, setLoading] = useState(false);

    const handleAddSocial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSocial.label || !newSocial.url) return;
        setLoading(true);
        try {
            await createSocialLink(newSocial as any);
            setNewSocial({ label: '', url: '' });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error adding social link');
        }
        setLoading(false);
    };

    const handleDeleteSocial = async (id: number) => {
        if (!window.confirm('Hapus link ini?')) return;
        await deleteSocialLink(id);
        fetchData();
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Media Sosial Footer</h2>

            {/* Add New Form */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tambah Media Sosial Baru</h3>
                <form onSubmit={handleAddSocial} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Label (Teks)</label>
                        <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: TikTok" value={newSocial.label} onChange={e => setNewSocial({ ...newSocial, label: e.target.value })} required />
                    </div>
                    <div className="w-full md:w-1/2">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Link URL</label>
                        <div className="flex items-center gap-2">
                            <LinkIcon size={18} className="text-slate-400 flex-shrink-0" />
                            <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: https://tiktok.com/@user" value={newSocial.url} onChange={e => setNewSocial({ ...newSocial, url: e.target.value })} required />
                        </div>
                    </div>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap h-10 w-full md:w-auto" disabled={loading}>Tambah</button>
                </form>
            </div>

            {/* List Socials */}
            <div className="grid gap-4">
                {socials.map(social => (
                    <div key={social.id} className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-800 gap-3">
                        <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                {social.label.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">{social.label}</h4>
                                <a href={social.url} target="_blank" rel="noreferrer" className="text-xs md:text-sm text-slate-500 hover:text-blue-500 truncate block">{social.url}</a>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteSocial(social.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors self-end sm:self-center w-full sm:w-auto flex justify-center"><Trash2 size={18} /></button>
                    </div>
                ))}
                {socials.length === 0 && <p className="text-slate-500 text-center py-8">Belum ada link media sosial.</p>}
            </div>
        </div>
    );
};

export default SocialsManager;
