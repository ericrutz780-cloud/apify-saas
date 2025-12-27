import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const EmailConfirmed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center animate-in zoom-in-95 duration-500">
            
            {/* Success Icon */}
            <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50">
                <ShieldCheck className="h-10 w-10 text-green-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Account Activated!
            </h2>
            
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Your email has been successfully verified.<br/>
                You now have full access to your <span className="font-semibold text-gray-900">Founder Account</span>.
            </p>

            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-8 text-sm text-brand-800">
                🚀 <b>Ready to scale?</b> Your credits are active.
            </div>

            <button 
                onClick={() => navigate('/login')}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white text-lg font-semibold py-4 rounded-xl shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2 group"
            >
                Login to Dashboard 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    </div>
  );
};