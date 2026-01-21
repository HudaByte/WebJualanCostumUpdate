import React from 'react';

interface ConfigInputProps {
    label: string;
    confKey: string;
    type?: string;
    help?: string;
    value: string;
    onChange: (value: string) => void;
}

export const ConfigInput: React.FC<ConfigInputProps> = React.memo(({ label, confKey, type = "text", help, value, onChange }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
        {type === 'textarea' ? (
            <textarea
                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={5}
            />
        ) : (
            <input
                type={type}
                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        )}
        {help && <p className="text-xs text-slate-400 mt-1">{help}</p>}
    </div>
));

ConfigInput.displayName = 'ConfigInput';
