import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, ArrowRight } from 'lucide-react';

export const EmailConfirmed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center animate-in zoom-in-95 duration-500">
            
            {/* Success Icon */}
            <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Founder Spot Secured!
            </h2>
            
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Your email is verified and your pre-order is confirmed.<br/>
                You are officially on the <b>Founder List</b>.
            </p>

            {/* WICHTIGE INFO BOX */}
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 mb-8 text-left flex items-start gap-4">
                <div className="bg-white p-2 rounded-lg border border-brand-100 shadow-sm text-brand-600">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 text-sm">Next Step: February 1st</h4>
                    <p className="text-sm text-gray-600 mt-1">
                        You will receive an email with your login credentials and Pro Access as soon as we launch.
                    </p>
                </div>
            </div>

            <button 
                onClick={() => navigate('/demo')}
                className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
                Back to Homepage
            </button>
        </div>
    </div>
  );
};