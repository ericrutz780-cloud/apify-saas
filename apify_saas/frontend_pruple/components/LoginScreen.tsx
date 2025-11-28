import React from 'react';
import { Lock, Zap } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Zap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AdSpy Pro</h1>
          <p className="text-indigo-100">Unlock your competitors' strategies</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                defaultValue="demo@adspypro.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                defaultValue="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Secure Login
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-gray-400">
            By logging in, you agree to our Terms of Service.
          </div>
        </div>
      </div>
    </div>
  );
};
