import React, { useState } from 'react';
import { Freebie } from '../../types';
import { Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { createFreebie, updateFreebie, deleteFreebie, uploadImage } from '../../services/dataService';

interface FreebiesManagerProps {
    freebies: Freebie[];
    fetchData: () => void;
}

const FreebiesManager: React.FC<FreebiesManagerProps> = ({ freebies, fetchData }) => {
    const [editingFreebie, setEditingFreebie] = useState<Partial<Freebie> | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);

    const handleFreebieSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFreebie) return;
        setLoading(true);
        try {
            if (editingFreebie.id) {
                await updateFreebie(editingFreebie.id, editingFreebie);
            } else {
                await createFreebie(editingFreebie as any);
            }
            setEditingFreebie(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error saving freebie');
        }
        setLoading(false);
    };

    const handleDeleteFreebie = async (id: number) => {
        if (!window.confirm('Yakin hapus?')) return;
        await deleteFreebie(id);
        fetchData();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploadingImg(true);
        try {
            const publicUrl = await uploadImage(file);
            if (editingFreebie) {
                setEditingFreebie({ ...editingFreebie, image_url: publicUrl });
            }
        } catch (e) {
            alert("Error uploading image");
        } finally {
            setUploadingImg(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">List Gratisan</h2>
                <button onClick={() => setEditingFreebie({})} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm"><Plus size={16} /> Tambah Gratisan</button>
            </div>

            {editingFreebie && (
                <form onSubmit={handleFreebieSubmit} className="mb-8 bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="Judul" value={editingFreebie.title || ''} onChange={e => setEditingFreebie({ ...editingFreebie, title: e.target.value })} required />
                        <div className="md:col-span-2 space-y-2">
                            <div className="flex gap-2">
                                <input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="URL Gambar" value={editingFreebie.image_url || ''} onChange={e => setEditingFreebie({ ...editingFreebie, image_url: e.target.value })} required />
                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap">
                                    {uploadingImg ? <span className="animate-spin">...</span> : <Upload size={18} />} <span className="hidden sm:inline">Upload</span> <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </div>
                        <div className="md:col-span-2"><input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="Link Download" value={editingFreebie.link || ''} onChange={e => setEditingFreebie({ ...editingFreebie, link: e.target.value })} required /></div>
                        <div className="md:col-span-2"><input className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full" placeholder="Teks Tombol (Default: Download Now)" value={editingFreebie.button_text || ''} onChange={e => setEditingFreebie({ ...editingFreebie, button_text: e.target.value })} /></div>
                        <textarea className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 rounded text-slate-900 dark:text-white w-full md:col-span-2" placeholder="Deskripsi" value={editingFreebie.description || ''} onChange={e => setEditingFreebie({ ...editingFreebie, description: e.target.value })} required />
                    </div>
                    <div className="flex gap-2"><button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white" disabled={uploadingImg}>Simpan</button><button type="button" onClick={() => setEditingFreebie(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded text-slate-700 dark:text-slate-300">Batal</button></div>
                </form>
            )}

            <div className="grid gap-4">
                {freebies.map(f => (
                    <div key={f.id} className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                            <img src={f.image_url} alt="" className="w-16 h-16 flex-shrink-0 rounded object-cover" />
                            <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white truncate">{f.title}</h4>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <button onClick={() => setEditingFreebie(f)} className="p-2 text-blue-600 border rounded"><Edit2 size={18} /></button>
                            <button onClick={() => handleDeleteFreebie(f.id)} className="p-2 text-red-500 border rounded"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FreebiesManager;
