import React from 'react';
import { Ad } from '../types';
import { X, Save, ExternalLink, Calendar, Hash, Globe, Download } from 'lucide-react';

interface DetailModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (ad: Ad) => void;
  isSaved: boolean;
}

export const DetailModal: React.FC<DetailModalProps> = ({ ad, isOpen, onClose, onSave, isSaved }) => {
  if (!isOpen || !ad) return null;

  const isMeta = ad.platform === 'META';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-200">
        
        {/* Close Button Mobile */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden z-20 bg-white/80 p-2 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Column: Media */}
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-8 overflow-y-auto">
          <div className={`relative shadow-lg rounded-lg overflow-hidden ${isMeta ? 'w-full max-w-lg' : 'h-full max-h-[700px] aspect-[9/16]'}`}>
            <img 
              src={ad.imageUrl} 
              alt="Creative Detail" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="w-full md:w-1/2 flex flex-col bg-white h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div className="flex items-center gap-4">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${isMeta ? 'bg-blue-600' : 'bg-black'}`}>
                  {ad.advertiserName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{ad.advertiserName}</h2>
                  <p className="text-gray-500">{ad.advertiserHandle}</p>
                </div>
            </div>
            <button 
              onClick={onClose}
              className="hidden md:block text-gray-400 hover:text-gray-600"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">Format</div>
                <div className="font-semibold text-gray-900">{ad.format}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">Likes</div>
                <div className="font-semibold text-gray-900">{ad.likes.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">{isMeta ? 'Spend' : 'Shares'}</div>
                <div className="font-semibold text-gray-900">
                  {isMeta ? `$${ad.spend.toLocaleString()}` : ad.shares.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">{isMeta ? 'Impr.' : 'Views'}</div>
                <div className="font-semibold text-gray-900">
                  {isMeta ? ad.impressions.toLocaleString() : ad.views.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Ad Copy */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b pb-2">Ad Copy</h3>
              {ad.headline && (
                <div>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600 mr-2">Headline</span>
                  <span className="font-semibold text-gray-800">{ad.headline}</span>
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-wrap leading-relaxed">
                {ad.primaryText}
              </div>
            </div>

            {/* CTA */}
            <div>
              <h3 className="text-lg font-bold border-b pb-2 mb-4">Call To Action</h3>
              <div className="flex items-center gap-3">
                <div className="px-6 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-100">
                  {ad.ctaText}
                </div>
              </div>
            </div>
            
             {/* Metadata */}
            <div className="space-y-2 text-sm text-gray-500 pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> 
                First seen: {new Date(ad.timestamp).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" /> 
                ID: {ad.id}
              </div>
               <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" /> 
                Region: Global
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
             <button className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition font-medium">
                <Download className="w-4 h-4" />
                Download Media
             </button>

             <button 
              onClick={() => onSave(ad)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-sm transition transform active:scale-95 ${isSaved 
                ? 'bg-green-100 text-green-700 border border-green-200 cursor-default' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              {isSaved ? <span className="flex items-center gap-2">Saved <Save className="w-4 h-4 fill-current"/></span> : <><Save className="w-4 h-4" /> Save Creative</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
