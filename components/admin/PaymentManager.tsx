import React, { useState } from 'react';
import { Save, Loader } from 'lucide-react';
import { ConfigInput } from './ConfigInput';
import { savePaymentConfig } from '../../services/dataService';
import { testAtlanticConnection } from '../../services/paymentService';

interface PaymentManagerProps {
    paymentConfig: Record<string, string>;
    setPaymentConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ paymentConfig, setPaymentConfig }) => {
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'failed'>('idle');

    const handleConfigChange = (key: string, value: string) => {
        setPaymentConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSavePaymentConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            for (const [key, value] of Object.entries(paymentConfig)) {
                await savePaymentConfig(key, value as string);
            }
            alert('Payment Config Saved!');
        } catch (err) {
            alert('Error saving payment config');
        }
        setLoading(false);
    };

    const handleTestConnection = async () => {
        setConnectionStatus('checking');
        try {
            const apiKey = paymentConfig['atlantic_api_key'];
            const isConnected = await testAtlanticConnection(apiKey);
            if (isConnected) {
                setConnectionStatus('connected');
            } else {
                setConnectionStatus('failed');
                alert("Koneksi Gagal. Pastikan API Key benar.");
            }
        } catch (e) {
            setConnectionStatus('failed');
            alert("Error Checking Connection");
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Pengaturan Pembayaran</h2>
            <form onSubmit={handleSavePaymentConfig} className="max-w-3xl space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Atlantic Payment Gateway</h3>
                    <ConfigInput
                        label="Atlantic API Key"
                        confKey="atlantic_api_key"
                        value={paymentConfig['atlantic_api_key'] || ''}
                        onChange={(v) => handleConfigChange('atlantic_api_key', v)}
                    />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Manual Payment (WhatsApp)</h3>
                    <ConfigInput
                        label="Nomor WhatsApp Admin (contoh: 628123456789)"
                        confKey="admin_wa_number"
                        value={paymentConfig['admin_wa_number'] || ''}
                        onChange={(v) => handleConfigChange('admin_wa_number', v)}
                    />

                    <div className="flex items-center gap-4 mt-2">
                        <button
                            type="button"
                            onClick={handleTestConnection}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-bold transition-colors disabled:opacity-50"
                            disabled={connectionStatus === 'checking'}
                        >
                            {connectionStatus === 'checking' ? 'Testing...' : 'Test Connection'}
                        </button>
                        {connectionStatus === 'connected' && <span className="text-green-500 font-bold text-sm">✓ Terhubung</span>}
                        {connectionStatus === 'failed' && <span className="text-red-500 font-bold text-sm">✗ Gagal Terhubung</span>}
                    </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors sticky bottom-4 shadow-xl" disabled={loading}>
                    {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                    Simpan Konfigurasi Payment
                </button>
            </form>
        </div>
    );
};

export default PaymentManager;
