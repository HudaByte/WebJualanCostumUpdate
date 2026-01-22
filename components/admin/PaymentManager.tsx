import React, { useState, useEffect } from 'react';
import { Save, Loader, RefreshCw, Wallet, User, AlertCircle, Send, Search, CheckCircle, History } from 'lucide-react';
import { ConfigInput } from './ConfigInput';
import { savePaymentConfig } from '../../services/dataService';
import { testAtlanticConnection, getAtlanticProfile, getBankList, checkBankAccount, createTransfer, checkTransferStatus } from '../../services/paymentService';
import { calculateTransferFee, formatRupiah } from '../../utils/feeCalculator';

interface PaymentManagerProps {
    paymentConfig: Record<string, string>;
    setPaymentConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

interface WithdrawHistoryItem {
    id: string; // Atlantic ID
    ref_id: string; // Internal WD- ID
    date: string;
    bank_code: string;
    account_number: string;
    account_name: string;
    nominal: number;
    fee: number;
    total: number;
    status: string; // pending, success, failed
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ paymentConfig, setPaymentConfig }) => {
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'failed'>('idle');

    // Profile State
    const [profile, setProfile] = useState<{ username: string, balance: number } | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');

    // Withdraw State
    const [banks, setBanks] = useState<any[]>([]);
    const [selectedBank, setSelectedBank] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [nominal, setNominal] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [checkingAccount, setCheckingAccount] = useState(false);
    const [transferring, setTransferring] = useState(false);

    // History State
    const [history, setHistory] = useState<WithdrawHistoryItem[]>([]);

    useEffect(() => {
        // Load history from local storage
        try {
            const saved = localStorage.getItem('admin_withdraw_history');
            if (saved) {
                setHistory(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load history', e);
        }
    }, []);

    const saveHistory = (newHistory: WithdrawHistoryItem[]) => {
        setHistory(newHistory);
        localStorage.setItem('admin_withdraw_history', JSON.stringify(newHistory));
    };

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
            handleCheckProfile();
        } catch (err) {
            alert('Error saving payment config');
        }
        setLoading(false);
    };

    const handleCheckProfile = async () => {
        const apiKey = paymentConfig['atlantic_api_key'];
        if (!apiKey) return;

        setProfileLoading(true);
        setProfileError('');
        try {
            const res = await getAtlanticProfile(apiKey);
            if (res.status && res.data) {
                setProfile({
                    username: res.data.username,
                    balance: res.data.balance
                });
                setConnectionStatus('connected');
                fetchBanks(apiKey);
            } else {
                setProfileError(res.message || 'Gagal memuat profil');
                setProfile(null);
                setConnectionStatus('failed');
            }
        } catch (e) {
            setProfileError('Network Error');
            setConnectionStatus('failed');
        }
        setProfileLoading(false);
    };

    const fetchBanks = async (apiKey: string) => {
        const res = await getBankList(apiKey);
        if (res.status && res.data) {
            setBanks(res.data);
        }
    };

    const handleCheckAccount = async () => {
        if (!selectedBank || !accountNumber) {
            alert('Pilih bank dan isi nomor rekening!');
            return;
        }

        setCheckingAccount(true);
        setRecipientName('');
        const apiKey = paymentConfig['atlantic_api_key'];
        const res = await checkBankAccount(apiKey, selectedBank, accountNumber);

        if (res.status && res.data) {
            setRecipientName(res.data.nama_pemilik);
        } else {
            alert('Rekening tidak ditemukan atau salah.');
        }
        setCheckingAccount(false);
    };

    const handleWithdraw = async () => {
        if (!selectedBank || !accountNumber || !recipientName || !nominal) return;

        if (profile && Number(nominal) > Number(profile.balance)) {
            alert('Saldo tidak cukup!');
            return;
        }

        if (!confirm(`Yakin ingin transfer Rp ${new Intl.NumberFormat('id-ID').format(Number(nominal))} ke ${recipientName}?`)) return;

        setTransferring(true);
        const apiKey = paymentConfig['atlantic_api_key'];

        const res = await createTransfer(apiKey, selectedBank, accountNumber, recipientName, Number(nominal));

        if (res.status && res.data) {
            const data = res.data;
            const newItem: WithdrawHistoryItem = {
                id: data.id,
                ref_id: data.reff_id,
                date: new Date().toISOString(),
                bank_code: selectedBank,
                account_number: accountNumber,
                account_name: recipientName,
                nominal: data.nominal,
                fee: data.fee,
                total: data.total,
                status: data.status // 'pending' usually
            };

            saveHistory([newItem, ...history]);
            alert(`Transfer Berhasil! Fee: Rp ${data.fee}, Total: Rp ${data.total}`);

            setNominal('');
            handleCheckProfile();
        } else {
            alert('Transfer Gagal: ' + (res.message || 'Unknown Error'));
        }
        setTransferring(false);
    };

    const handleRefreshStatus = async (item: WithdrawHistoryItem) => {
        const apiKey = paymentConfig['atlantic_api_key'];
        if (!apiKey) return;

        const res = await checkTransferStatus(apiKey, item.id);
        if (res.status && res.data) {
            const updatedItem = {
                ...item,
                status: res.data.status,
                fee: res.data.fee,
                total: res.data.total
            };

            const newHistory = history.map(h => h.id === item.id ? updatedItem : h);
            saveHistory(newHistory);

            if (updatedItem.status !== item.status) {
                handleCheckProfile();
            }
            alert(`Status: ${updatedItem.status.toUpperCase()}`);
        } else {
            alert('Gagal cek status: ' + res.message);
        }
    };

    useEffect(() => {
        if (paymentConfig['atlantic_api_key']) {
            handleCheckProfile();
        }
    }, []);

    const handleTestConnection = async () => {
        setConnectionStatus('checking');
        try {
            const apiKey = paymentConfig['atlantic_api_key'];
            const isConnected = await testAtlanticConnection(apiKey);
            if (isConnected) {
                setConnectionStatus('connected');
                handleCheckProfile();
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

            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Wallet className="text-blue-500" /> Atlantic Pedia Account
                    </h3>
                    <button onClick={handleCheckProfile} disabled={profileLoading} className="p-2 text-slate-500 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <RefreshCw size={20} className={profileLoading ? "animate-spin" : ""} />
                    </button>
                </div>
                {profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400"><User size={24} /></div>
                            <div><p className="text-sm text-slate-500 dark:text-slate-400">Username</p><p className="font-bold text-slate-900 dark:text-white text-lg">{profile.username}</p></div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400"><Wallet size={24} /></div>
                            <div><p className="text-sm text-slate-500 dark:text-slate-400">Saldo Aktif</p><p className="font-bold text-slate-900 dark:text-white text-lg">Rp {new Intl.NumberFormat('id-ID').format(profile.balance)}</p></div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400"><p>Belum ada data profil.</p></div>
                )}
            </div>

            {/* Withdraw Form */}
            {profile && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b pb-2 dark:border-slate-700">
                        <Send className="text-purple-500" /> Withdraw / Transfer Saldo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Tujuan</label>
                                <select
                                    value={selectedBank}
                                    onChange={(e) => { setSelectedBank(e.target.value); setRecipientName(''); }}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                                >
                                    <option value="">-- Pilih Bank --</option>
                                    {banks.map((bank: any) => (
                                        <option key={bank.id} value={bank.bank_code}>{bank.bank_name} ({bank.type})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor Rekening</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => { setAccountNumber(e.target.value); setRecipientName(''); }}
                                        placeholder="Contoh: 1234567890"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                                    />
                                    <button onClick={handleCheckAccount} disabled={checkingAccount || !selectedBank || !accountNumber} className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 rounded-lg font-bold flex items-center">
                                        {checkingAccount ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
                                    </button>
                                </div>
                            </div>
                            {recipientName && (
                                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg flex items-center gap-2 border border-green-200 dark:border-green-800 animate-fade-in-up">
                                    <CheckCircle size={20} />
                                    <div><p className="text-xs opacity-70">Rekening Valid</p><p className="font-bold">{recipientName}</p></div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nominal Withdraw</label>
                                <input
                                    type="number"
                                    value={nominal}
                                    onChange={(e) => setNominal(e.target.value)}
                                    placeholder="Min. 10.000"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                                />
                                <p className="text-xs text-slate-500 mt-1">Saldo tersedia: Rp {new Intl.NumberFormat('id-ID').format(profile.balance)}</p>
                            </div>

                            {/* FEE CALCULATOR PREVIEW */}
                            {nominal && Number(nominal) > 0 && (() => {
                                const feeCalc = calculateTransferFee(Number(nominal));
                                const isSufficient = profile.balance >= feeCalc.total;

                                return (
                                    <div className={`p-4 rounded-lg border-2 ${isSufficient ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">💰 Estimasi Biaya Transfer:</p>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Nominal:</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{formatRupiah(feeCalc.nominal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Fee Transfer:</span>
                                                <span className="font-medium text-orange-600 dark:text-orange-400">{formatRupiah(feeCalc.fee)}</span>
                                            </div>
                                            <div className="border-t border-slate-300 dark:border-slate-600 pt-1 mt-1"></div>
                                            <div className="flex justify-between">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">Total Dipotong:</span>
                                                <span className={`font-bold text-lg ${isSufficient ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {formatRupiah(feeCalc.total)}
                                                </span>
                                            </div>
                                        </div>
                                        {!isSufficient && (
                                            <div className="mt-2 flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                                <span className="font-medium">Saldo tidak cukup! Kurang {formatRupiah(feeCalc.total - profile.balance)}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <button onClick={handleWithdraw} disabled={transferring || !recipientName || !nominal} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4">
                                {transferring ? <Loader className="animate-spin" /> : <Send size={20} />} Transfer Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8 shadow-sm overflow-hidden">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b pb-2 dark:border-slate-700">
                    <History className="text-orange-500" /> Riwayat Withdraw
                </h3>
                {history.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3">Tanggal</th>
                                    <th className="px-6 py-3">Bank/E-Wallet</th>
                                    <th className="px-6 py-3">Tujuan</th>
                                    <th className="px-6 py-3">Nominal</th>
                                    <th className="px-6 py-3">Fee</th>
                                    <th className="px-6 py-3">Total</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item) => (
                                    <tr key={item.id} className="bg-white border-b dark:bg-slate-900 dark:border-slate-700">
                                        <td className="px-6 py-4">{new Date(item.date).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-medium">{item.bank_code.toUpperCase()}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{item.account_name}</div>
                                            <div className="text-xs opacity-70">{item.account_number}</div>
                                        </td>
                                        <td className="px-6 py-4">Rp {item.nominal.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-red-500">Rp {item.fee.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-bold">Rp {item.total.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'success' ? 'bg-green-100 text-green-700' :
                                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleRefreshStatus(item)}
                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-bold"
                                            >
                                                <RefreshCw size={14} /> Cek
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <History className="mx-auto mb-3 opacity-30" size={48} />
                        <p className="font-medium">Belum ada riwayat withdraw</p>
                        <p className="text-sm mt-1">Transfer pertama Anda akan muncul di sini</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSavePaymentConfig} className="max-w-3xl space-y-6">
                {/* Config Form Content */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Atlantic Payment Gateway</h3>
                    <ConfigInput label="Atlantic API Key" confKey="atlantic_api_key" value={paymentConfig['atlantic_api_key'] || ''} onChange={(v) => handleConfigChange('atlantic_api_key', v)} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-600">Manual Payment (WhatsApp)</h3>
                    <ConfigInput label="Nomor WhatsApp Admin (contoh: 628123456789)" confKey="admin_wa_number" value={paymentConfig['admin_wa_number'] || ''} onChange={(v) => handleConfigChange('admin_wa_number', v)} />
                    <div className="flex items-center gap-4 mt-2">
                        <button type="button" onClick={handleTestConnection} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-bold transition-colors disabled:opacity-50" disabled={connectionStatus === 'checking'}>{connectionStatus === 'checking' ? 'Testing...' : 'Test Connection'}</button>
                        {connectionStatus === 'connected' && <span className="text-green-500 font-bold text-sm">✓ Terhubung</span>}
                        {connectionStatus === 'failed' && <span className="text-red-500 font-bold text-sm">✗ Gagal Terhubung</span>}
                    </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors sticky bottom-4 shadow-xl" disabled={loading}>{loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />} Simpan Konfigurasi Payment</button>
            </form>
        </div>
    );
};

export default PaymentManager;
