import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

export const PricingPage = () => {
    // --- HIER DEINE LINKS AUS DEM PYTHON SCRIPT EINFÜGEN ---
    const LINK_STARTER_NORMAL = "https://buy.stripe.com/test_..."; 
    const LINK_PRO_NORMAL = "https://buy.stripe.com/test_..."; 
    const LINK_AGENCY_NORMAL = "https://buy.stripe.com/test_...";
    // -------------------------------------------------------

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4">
            <div className="max-w-7xl mx-auto text-center mb-16">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Wähle deinen Plan</h1>
                <p className="text-xl text-gray-500">Starte jetzt mit professioneller Ad Intelligence.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* STARTER */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col hover:border-brand-300 transition-all">
                    <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
                    <div className="mt-4 flex items-baseline text-gray-900">
                        <span className="text-4xl font-bold tracking-tight">19€</span>
                        <span className="ml-1 text-xl font-semibold text-gray-500">/Monat</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Für Einsteiger & Dropshipper</p>
                    <ul className="mt-6 space-y-4 flex-1 text-sm text-gray-600">
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> 1.500 Credits</li>
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> Basis Filter</li>
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> Meta Ads Support</li>
                    </ul>
                    <a href={LINK_STARTER_NORMAL} className="mt-8 block w-full bg-brand-50 text-brand-700 font-bold py-3 rounded-xl hover:bg-brand-100 transition-colors text-center">
                        Jetzt Starten
                    </a>
                </div>

                {/* PRO */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-brand-600 p-8 flex flex-col relative transform scale-105 z-10">
                    <div className="absolute top-0 right-0 -mt-4 mr-4 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Empfohlen
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Pro Plan</h3>
                    <div className="mt-4 flex items-baseline text-gray-900">
                        <span className="text-4xl font-bold tracking-tight">49€</span>
                        <span className="ml-1 text-xl font-semibold text-gray-500">/Monat</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Für Agenturen & Power-User</p>
                    <ul className="mt-6 space-y-4 flex-1 text-sm text-gray-600">
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> <b>5.000 Credits</b></li>
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> TikTok & Meta Ads</li>
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> Viral Score Details</li>
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> Priority Support</li>
                    </ul>
                    <a href={LINK_PRO_NORMAL} className="mt-8 block w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20 text-center">
                        Pro Access Sichern
                    </a>
                </div>

                {/* AGENCY */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col hover:border-brand-300 transition-all">
                    <h3 className="text-xl font-semibold text-gray-900">Agency</h3>
                    <div className="mt-4 flex items-baseline text-gray-900">
                        <span className="text-4xl font-bold tracking-tight">149€</span>
                        <span className="ml-1 text-xl font-semibold text-gray-500">/Monat</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Für Teams & Skalierung</p>
                    <ul className="mt-6 space-y-4 flex-1 text-sm text-gray-600">
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> <b>15.000 Credits</b></li>
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> API Access (Beta)</li>
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> 3 User Seats</li>
                        <li className="flex"><CheckCircle2 className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0"/> Dedicated Account Manager</li>
                    </ul>
                    <a href={LINK_AGENCY_NORMAL} className="mt-8 block w-full bg-brand-50 text-brand-700 font-bold py-3 rounded-xl hover:bg-brand-100 transition-colors text-center">
                        Jetzt Starten
                    </a>
                </div>
            </div>
        </div>
    );
};