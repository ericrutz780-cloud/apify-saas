import React from 'react';
import { Ad } from '../types';
import { Heart, Share2, Eye, DollarSign, PlayCircle, Image as ImageIcon } from 'lucide-react';

interface AdCardProps {
  ad: Ad;
  onClick: (ad: Ad) => void;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, onClick }) => {
  const isMeta = ad.platform === 'META';

  return (
    <div 
      onClick={() => onClick(ad)}
      className={`group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full relative`}
    >
      {/* Platform Badge */}
      <div className={`absolute top-3 right-3 z-10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${isMeta ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
        {ad.platform}
      </div>

      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-50">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isMeta ? 'bg-blue-600' : 'bg-black'}`}>
          {ad.advertiserName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{ad.advertiserName}</h4>
          <p className="text-xs text-gray-500 truncate">{ad.advertiserHandle}</p>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1">
        {isMeta && ad.headline && (
          <h3 className="font-bold text-gray-800 mb-2 leading-tight line-clamp-2">{ad.headline}</h3>
        )}
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">{ad.primaryText}</p>
        
        {/* Media Preview */}
        <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${isMeta ? 'aspect-video' : 'aspect-[9/16]'} mb-3`}>
          <img src={ad.imageUrl} alt="Ad Creative" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
             {ad.format === 'VIDEO' ? <PlayCircle className="w-12 h-12 text-white opacity-80" /> : <ImageIcon className="w-10 h-10 text-white opacity-60" />}
          </div>
        </div>

        {/* CTA Button Mock */}
        <div className="bg-gray-50 border border-gray-200 text-gray-700 text-center py-2 rounded-md text-sm font-medium">
          {ad.ctaText || 'Learn More'}
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs text-gray-500">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 font-semibold text-gray-700">
            <Heart className="w-3 h-3" /> {ad.likes.toLocaleString()}
          </div>
          <span>Likes</span>
        </div>
        
        {isMeta ? (
          <>
             <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 font-semibold text-gray-700">
                <Eye className="w-3 h-3" /> {ad.impressions.toLocaleString()}
              </div>
              <span>Impr.</span>
            </div>
             <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 font-semibold text-gray-700">
                <DollarSign className="w-3 h-3" /> {ad.spend.toLocaleString()}
              </div>
              <span>Spend</span>
            </div>
          </>
        ) : (
          <>
             <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 font-semibold text-gray-700">
                <Share2 className="w-3 h-3" /> {ad.shares.toLocaleString()}
              </div>
              <span>Shares</span>
            </div>
             <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 font-semibold text-gray-700">
                <PlayCircle className="w-3 h-3" /> {ad.views.toLocaleString()}
              </div>
              <span>Views</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
