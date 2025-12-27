import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './services/api';
import { Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // NEU: Success State
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        await api.register(email, password);
        // HIER: Keine Weiterleitung mehr, sondern Success-Status setzen
        setSuccess(true);
    } catch (err: any) {
        setError(err.message || 'Registration failed.');
    } finally {
        setLoading(false);
    }
  };

  // WENN ERFOLGREICH: Zeige diese Nachricht an
  if (success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Check your Email</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    We've sent a confirmation link to <span className="font-semibold text-gray-900">{email}</span>.<br/>
                    Please click the link in that email to activate your account.
                </p>
                <button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Back to Login
                </button>
            </div>
        </div>
      );
  }

  // NORMALES FORMULAR
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center">
           <div className="mx-auto h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
             <CheckCircle2 className="h-6 w-6 text-brand-600" />
           </div>
           <h2 className="mt-6 text-2xl font-semibold text-gray-900">Create your Account</h2>
           <p className="mt-2 text-sm text-gray-600">
             <span className="font-bold text-gray-900">Important:</span> Please use the <br/>
             <span className="underline decoration-brand-300 decoration-2">SAME Email Address</span> you used for payment.
           </p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email (same as payment)</label>
              <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all shadow-xs" placeholder="Enter your email" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Choose Password</label>
              <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all shadow-xs" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};