import React from 'react';
import { TikTokAd } from '../types';
import { Heart, MessageCircle, Share2, Play, Eye, ExternalLink } from 'lucide-react';

interface TikTokAdCardProps {
  ad: TikTokAd;
}

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

const TikTokAdCard: React.FC<TikTokAdCardProps> = ({ ad }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300">
       {/* Header */}
       <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
           <div className="flex items-center gap-3 overflow-hidden">
             <img src={ad.authorMeta.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 object-cover" />
             <div className="min-w-0">
                <a href={ad.authorMeta.profileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-gray-900 hover:text-brand-600 truncate block transition-colors">
                    {ad.authorMeta.nickName}
                </a>
             </div>
           </div>
           <span className="text-xs text-gray-400 font-medium">{new Date(ad.createTimeISO).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
       </div>

       {/* Video Thumbnail Area - Phone Ratio */}
       <div className="relative aspect-[9/16] bg-gray-100 group overflow-hidden">
          <img 
            src={ad.videoMeta.coverUrl} 
            alt="TikTok Cover" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors" />
          
          <a 
            href={ad.webVideoUrl} 
            target="_blank" 
            rel="noreferrer"
            className="absolute inset-0 flex items-center justify-center group"
          >
             <div className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-transform group-hover:scale-110 border border-white/50 shadow-lg">
                <Play className="w-5 h-5 text-white fill-white ml-1" />
             </div>
          </a>
          
          {/* Overlay Stats */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent pt-12 text-white">
             <div className="flex justify-between items-end">
                <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                        <Heart className="w-5 h-5 mb-0.5 text-white drop-shadow-sm" />
                        <span className="text-[10px] font-medium">{formatNumber(ad.diggCount)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <MessageCircle className="w-5 h-5 mb-0.5 text-white drop-shadow-sm" />
                        <span className="text-[10px] font-medium">{formatNumber(ad.commentCount)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Share2 className="w-5 h-5 mb-0.5 text-white drop-shadow-sm" />
                        <span className="text-[10px] font-medium">{formatNumber(ad.shareCount)}</span>
                    </div>
                </div>
                <div className="flex items-center text-xs font-medium opacity-90">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {formatNumber(ad.playCount)}
                </div>
             </div>
          </div>
       </div>

       {/* Content */}
       <div className="p-4 flex-1 flex flex-col bg-white">
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
             {ad.text}
          </p>
          <a 
            href={ad.webVideoUrl} 
            target="_blank" 
            rel="noreferrer"
            className="mt-auto text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
          >
            Open in TikTok <ExternalLink className="w-3 h-3 ml-1" />
          </a>
       </div>
    </div>
  );
};

export default TikTokAdCard;