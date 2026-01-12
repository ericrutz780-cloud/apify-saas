import React, { useMemo } from 'react';
import { MetaAd } from '../types';
import { Facebook, Instagram, Info, MessageCircle, Globe, Layers, Play, Bookmark, Zap, Flame, Users } from 'lucide-react';

interface MetaAdCardProps {
  ad: MetaAd;
  versionCount?: number;
  viewMode?: 'condensed' | 'details';
  onClick: (ad: MetaAd) => void;
  platformContext?: 'facebook' | 'instagram';
  onToggleSave?: (ad: MetaAd) => void;
  isSaved?: boolean;
  actionIcon?: React.ReactNode; 
}

const MetricTag = ({ icon: Icon, value, label, iconColor, textColor }: { icon: any, value: string | number, label: string, iconColor: string, textColor: string }) => (
  <div className="group/tag relative flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold cursor-help hover:border-gray-300 hover:shadow-sm transition-all">
    <Icon className={`w-3 h-3 ${iconColor}`} />
    <span className={textColor}>{value}</span>
    
    {/* Tooltip */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tag:block whitespace-nowrap z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-gray-900/90 backdrop-blur-sm text-white text-[10px] font-medium py-1 px-2.5 rounded shadow-lg relative">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/90"></div>
      </div>
    </div>
  </div>
);

const MetaAdCard: React.FC<MetaAdCardProps> = ({ 
    ad, 
    versionCount = 1, 
    viewMode = 'details', 
    onClick, 
    platformContext, 
    onToggleSave, 
    isSaved = false,
    actionIcon 
}) => {
  const { snapshot, targeting } = ad;

  const hasVideo = snapshot.videos && snapshot.videos.length > 0;
  const mediaUrl = hasVideo ? snapshot.videos[0].video_hd_url : (snapshot.images.length > 0 ? snapshot.images[0].resized_image_url : null);
  
  const handleCardClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('button')) {
          return;
      }
      onClick(ad);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleSave) {
          onToggleSave(ad);
      }
  };

  const getDisplayDomain = (url: string) => {
    try {
        if (!url || url === '#' || url.trim() === '') return '';
        const urlToParse = url.startsWith('http') ? url : `https://${url}`;
        return new URL(urlToParse).hostname.replace('www.', '').toUpperCase();
    } catch (e) {
        return '';
    }
  };

  const { content, hashtags } = useMemo(() => {
      const text = snapshot.body.text || '';
      const words = text.replace(/\n/g, ' ').split(/\s+/);
      const tags: string[] = [];
      const contentWords: string[] = [];
      words.forEach(w => {
          if (w.startsWith('#')) tags.push(w);
          else contentWords.push(w);
      });
      return { content: contentWords.join(' '), hashtags: tags };
  }, [snapshot.body.text]);

  const platforms = ad.publisher_platform || [];
  const hasFB = platforms.includes('facebook');
  const hasIG = platforms.includes('instagram');
  const hasMessenger = platforms.includes('messenger');
  const hasAudience = platforms.includes('audience_network');

  const formattedDate = new Date(ad.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const displayLocation = targeting?.locations?.length 
    ? (targeting.locations.length > 2 ? `${targeting.locations.length} countries` : targeting.locations.join(', ')) 
    : null;

  // Metrics Logic
  const viralScore = ad.efficiency_score || 0;
  const reachVal = targeting?.reach_estimate || 0;
  const formatCompact = (num: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  
  const factor = (viralScore / 20).toFixed(1);
  const showFactor = parseFloat(factor) > 1.5;

  return (
    <div 
        onClick={handleCardClick}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md hover:border-brand-200 transition-all duration-300 cursor-pointer group relative"
    >
      {/* 1. TOP HEADER */}
      <div className="px-3 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2.5">
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-sm transition-colors ${ad.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                  <span className="font-semibold tracking-tight">{ad.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <span className="text-gray-400 font-medium">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity pr-1">
                {hasFB && <Facebook className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#1877F2] transition-colors" />}
                {hasIG && <Instagram className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#E4405F] transition-colors" />}
                {hasMessenger && <MessageCircle className="w-3.5 h-3.5 text-gray-400" />}
                {hasAudience && <Globe className="w-3.5 h-3.5 text-gray-400" />}
          </div>
      </div>

      {/* 2. IDENTITY ROW WITH METRIC TAGS */}
      <div className="p-3 flex items-start gap-3 relative">
          <div className="w-9 h-9 flex-shrink-0 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm mt-0.5">
                {ad.page_name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight hover:underline mb-1.5">
                    {ad.page_name}
                </h3>
                
                <div className="flex flex-wrap items-center gap-1.5">
                    <MetricTag icon={Zap} value={viralScore} label="Viral Score" iconColor="text-indigo-600 fill-indigo-100" textColor="text-indigo-700" />
                    <MetricTag icon={Users} value={formatCompact(reachVal)} label="Est. Reach" iconColor="text-emerald-600" textColor="text-emerald-700" />
                    {showFactor && <MetricTag icon={Flame} value={`${factor}x`} label="Growth Factor" iconColor="text-orange-500 fill-orange-100" textColor="text-orange-700" />}
                </div>
          </div>
          
          {versionCount > 1 && (
              <div className="ml-auto flex-shrink-0 cursor-help" title={`There are ${versionCount} versions of this ad`}>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm whitespace-nowrap">
                      <Layers className="w-3 h-3" /> {versionCount}
                  </span>
              </div>
          )}
      </div>

      {/* 3. MEDIA CONTENT */}
      <div className="bg-gray-100 relative w-full aspect-square border-y border-gray-100 overflow-hidden group-hover:opacity-95 transition-opacity">
        {mediaUrl ? (
          hasVideo ? (
             <div className="relative w-full h-full">
                 <video src={mediaUrl} className="w-full h-full object-cover bg-black" poster={snapshot.images[0]?.resized_image_url} muted />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
                        <Play className="w-5 h-5 text-white fill-white ml-1" />
                    </div>
                 </div>
             </div>
          ) : <img src={mediaUrl} alt="Ad Creative" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <Info className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm font-medium">No Preview</span>
          </div>
        )}

        {/* Action Button */}
        {onToggleSave && (
            <button
            onClick={handleSaveClick}
            className={`absolute top-2 right-2 z-10 p-2 rounded-full shadow-sm transition-all duration-200 ${actionIcon ? 'bg-white/90 text-red-600 hover:bg-red-50 hover:text-red-700 border border-gray-200' : isSaved ? 'bg-brand-600 text-white' : 'bg-white/90 text-gray-400 hover:text-gray-900 hover:bg-white border border-gray-200'}`}
            title={actionIcon ? "Remove" : (isSaved ? "Remove from saved" : "Save ad")}
            >
                {actionIcon || <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />}
            </button>
        )}
      </div>

      {/* 4. CTA BAR */}
      <div className="bg-white border-b border-gray-100 px-3 py-2.5 flex items-center justify-between">
          <div className="text-[10px] text-gray-500 truncate mr-2 font-medium tracking-wide">
              {getDisplayDomain(snapshot.link_url) || 'WEBSITE'}
          </div>
          <button className="flex-shrink-0 bg-gray-50 hover:bg-gray-100 text-gray-900 text-[10px] font-semibold px-3 py-1.5 rounded border border-gray-200 transition-colors shadow-sm">
              {snapshot.cta_text || 'Learn More'}
          </button>
      </div>

      {/* 5. DESCRIPTION */}
      <div className="p-3 bg-white flex-1 flex flex-col gap-1">
           <div className="text-xs text-gray-600 leading-5 font-normal line-clamp-2 h-10 overflow-hidden">
                {content || <span className="text-gray-400 italic">No description available</span>}
           </div>
           
           <div className="text-[11px] text-blue-600 font-medium leading-4 line-clamp-1 h-4 overflow-hidden">
               {hashtags.length > 0 ? hashtags.join(' ') : <span className="select-none">&nbsp;</span>}
           </div>

           {displayLocation && (
               <div className="mt-auto pt-2 border-t border-gray-50 flex items-center gap-1 text-[10px] text-gray-400">
                   <Globe className="w-3 h-3" />
                   <span className="truncate">{displayLocation}</span>
               </div>
           )}
      </div>
    </div>
  );
};

export default MetaAdCard;