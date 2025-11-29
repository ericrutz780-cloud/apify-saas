import React from 'react';
import { TikTokAd } from '../types';
import { Heart, MessageCircle, Share2, Play, Bookmark, ExternalLink, Video, Clock } from 'lucide-react';

interface TikTokAdCardProps {
  ad: TikTokAd;
  viewMode?: 'condensed' | 'details';
  onClick: (ad: TikTokAd) => void;
}

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

const TikTokAdCard: React.FC<TikTokAdCardProps> = ({ ad, viewMode = 'details', onClick }) => {
  
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) {
        return;
    }
    onClick(ad);
  };

  const daysActive = Math.floor((new Date().getTime() - new Date(ad.createTimeISO).getTime()) / (1000 * 3600 * 24));

  return (
    <div 
        onClick={handleCardClick}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
       {/* 1. Media Content - Always visible */}
       <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden border-b border-gray-100">
          <img 
            src={ad.videoMeta.coverUrl} 
            alt="TikTok Cover" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors" />
          
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-transform group-hover:scale-110 border border-white/50 shadow-lg">
                <Play className="w-5 h-5 text-white fill-white ml-1" />
             </div>
          </div>

          {/* Overlays */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
               <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-gray-700 shadow-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-gray-500" />
                  {daysActive > 0 ? `${daysActive}d` : 'New'}
               </div>
          </div>
          
          <div className="absolute top-3 right-3">
              <div className="w-8 h-8 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm text-white">
                  <Video className="w-4 h-4 text-[#E4405F]" />
              </div>
          </div>
       </div>

       {/* 2. Metrics Row - Always Visible */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
            <div className="py-2.5 px-1 text-center">
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-900">{formatNumber(ad.playCount)}</span>
                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">Views</span>
                </div>
            </div>
            <div className="py-2.5 px-1 text-center">
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-900">{formatNumber(ad.diggCount)}</span>
                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">Likes</span>
                </div>
            </div>
            <div className="py-2.5 px-1 text-center">
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-900">{formatNumber(ad.shareCount)}</span>
                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">Shares</span>
                </div>
            </div>
            <div className="py-2.5 px-1 text-center">
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-900">{formatNumber(ad.collectCount)}</span>
                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">Saves</span>
                </div>
            </div>
        </div>

       {/* DETAILS VIEW ONLY - Identity & Text */}
       {viewMode === 'details' && (
            <div className="p-4 flex-1 flex flex-col gap-3">
                {/* Identity */}
                <div className="flex items-center gap-3">
                    <img src={ad.authorMeta.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 object-cover" />
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate hover:text-brand-600 transition-colors">
                            {ad.authorMeta.nickName}
                        </h3>
                    </div>
                </div>

                {/* Description - Fixed Height */}
                <div className="h-10">
                    <p className="text-sm text-gray-600 leading-snug line-clamp-2">
                        {ad.text}
                    </p>
                </div>
            </div>
       )}

       {/* 4. Footer */}
       <div className={`bg-white border-t border-gray-100 mt-auto ${viewMode === 'condensed' ? 'p-3' : 'p-4'}`}>
          <a 
            href={ad.webVideoUrl} 
            onClick={(e) => e.stopPropagation()}
            target="_blank" 
            rel="noreferrer"
            className={`group/btn flex items-center justify-center w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 font-semibold rounded-lg transition-all text-sm shadow-xs ${viewMode === 'condensed' ? 'py-2 text-xs' : 'py-2.5'}`}
          >
            Open in TikTok <ExternalLink className={`ml-2 text-gray-400 group-hover/btn:text-gray-600 transition-colors ${viewMode === 'condensed' ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </a>
       </div>
    </div>
  );
};

export default TikTokAdCard;