import React, { useState } from 'react';
import { X, Lock, CheckCircle2, Zap, ShieldCheck, Mail, Sparkles, AlertCircle } from 'lucide-react';

// URL zum Backend (gleiche Logik wie in DemoPage)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const CLEAN_BASE_URL = BASE_URL.replace(/\/$/, '');
const LEAD_API_URL = `${CLEAN_BASE_URL}/api/v1/demo/lead`;

interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [industry, setIndustry] = useState('E-Commerce Brand');
    const [goal, setGoal] = useState('Find Inspiration'); // Default Value

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // ECHTER API CALL
            const response = await fetch(LEAD_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    industry,
                    goal
                })
            });

            // Egal was passiert, wir zeigen dem User Erfolg (UX)
            // Fehler sehen wir im Backend Log
            setStep('success');
            
        } catch (error) {
            console.error("Lead save failed:", error);
            setStep('success'); // Fallback: Trotzdem Success anzeigen
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />

            {/* Modal Content */}
            <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 z-10 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {step === 'form' ? (
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-brand-50">
                                <Lock className="w-6 h-6 text-brand-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Unlock Full Ad Insights
                            </h2>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                You've tested the <b>Scout Mode</b>. Secure <b>Founder Access</b> to reveal exact copy, targeting details, and performance metrics.
                            </p>
                        </div>

                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 space-y-3">
                            <div className="flex items-start gap-2.5">
                                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-blue-900 leading-snug">
                                    <b>50% Lifetime Discount</b> on the <b>Tier 2 Plan</b>.
                                </span>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-blue-900 leading-snug">
                                    Strictly limited to the first <b>100 Founders</b>.
                                </span>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-blue-900 leading-snug">
                                    Exclusive access to <b>AI Ad Analyst Agent Beta</b>.
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                    Your Work Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input 
                                        type="email" 
                                        required 
                                        placeholder="founder@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Industry
                                    </label>
                                    <select 
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm appearance-none cursor-pointer"
                                    >
                                        <option>E-Commerce Brand</option>
                                        <option>Marketing Agency</option>
                                        <option>Affiliate Marketer</option>
                                        <option>Dropshipping</option>
                                        <option>SaaS / Tech</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                                        Goal
                                    </label>
                                    <select 
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm appearance-none cursor-pointer"
                                    >
                                        <option>Find Inspiration</option>
                                        <option>Competitor Analysis</option>
                                        <option>Winning Products</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? 'Processing...' : <>Secure Deal <Zap className="w-4 h-4 fill-white" /></>}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-50">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            You're on the list! 🚀
                        </h2>
                        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                            Your spot is reserved. Expect an email on <b>February 1st</b> with your personal Tier 2 discount code.
                        </p>
                        <button 
                            onClick={onClose} 
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
                        >
                            Back to Demo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};