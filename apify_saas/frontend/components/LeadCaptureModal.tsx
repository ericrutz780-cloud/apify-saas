import React, { useState } from 'react';
import { X, Lock, CheckCircle2, Zap, Mail } from 'lucide-react';

interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [industry, setIndustry] = useState('E-Commerce');
    const [usage, setUsage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Hier später deine API/Webhook einfügen
        setTimeout(() => {
            setLoading(false);
            setStep('success');
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 z-10"><X className="w-5 h-5" /></button>
                {step === 'form' ? (
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-brand-50"><Lock className="w-6 h-6 text-brand-600" /></div>
                            <h2 className="text-xl font-bold text-gray-900">Unlock Full Ad Insights</h2>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">Du hast den <b>Scout-Modus</b> getestet. Sichere dir den Founder-Zugang für alle Details.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Deine E-Mail</label><div className="relative"><Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input type="email" required placeholder="founder@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" /></div></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Branche</label><select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"><option>E-Commerce</option><option>Agentur</option><option>SaaS</option><option>Affiliate</option></select></div>
                                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Ziel</label><select value={usage} onChange={(e) => setUsage(e.target.value)} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"><option value="">Wähle...</option><option>Winning Ads</option><option>Konkurrenz</option></select></div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">{loading ? '...' : <>Deal sichern <Zap className="w-4 h-4 fill-white" /></>}</button>
                        </form>
                    </div>
                ) : (
                    <div className="p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-50"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Du bist auf der Liste! 🚀</h2>
                        <p className="text-gray-600 mb-6">Am <b>1. Februar</b> erhältst du deinen Zugang.</p>
                        <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl">Zurück zur Demo</button>
                    </div>
                )}
            </div>
        </div>
    );
};