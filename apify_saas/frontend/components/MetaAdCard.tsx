import React, { useMemo } from 'react';
import { MetaAd } from '../types';
import { Facebook, Instagram, Info, MessageCircle, Globe, Layers, Play, Zap } from 'lucide-react';

interface MetaAdCardProps {
  ad: MetaAd;
  versionCount?: number;
  viewMode?: 'condensed' | 'details';
  onClick: (ad: MetaAd) => void;
  platformContext?: 'facebook' | 'instagram';
}

const MetaAdCard: React.FC<MetaAdCardProps> = ({ ad, versionCount = 1, viewMode = 'details', onClick, platformContext }) => {
  const { snapshot, targeting } = ad;

  const hasVideo = snapshot.videos && snapshot.videos.length > 0;
  const mediaUrl = hasVideo ? snapshot.videos[0].video_hd_url : (snapshot.images.length > 0 ? snapshot.images[0].resized_image_url : null);
  
  const score = ad.efficiency_score || 0; 
  const factor = ad.viral_factor || 0;

  const handleCardClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('button')) {
          return;
      }
      onClick(ad);
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
  const formattedDate = new Date(ad.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const displayLocation = targeting?.locations?.length ? (targeting.locations.length > 2 ? `${targeting.locations.length} Standorte` : targeting.locations.join(', ')) : null;

  return (
    <div 
        onClick={handleCardClick}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md hover:border-brand-200 transition-all duration-300 cursor-pointer group"
    >
      <div className="px-3 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2.5">
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-sm transition-colors ${ad.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                  <span className="font-semibold tracking-tight">{ad.isActive ? 'Aktiv' : 'Inaktiv'}</span>
              </div>
              <span className="text-gray-400 font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                {hasFB && <Facebook className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#1877F2]" />}
                {hasIG && <Instagram className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#E4405F]" />}
          </div>
      </div>

      <div className="p-3 flex items-center gap-3 relative">
          <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                {/* @ts-ignore */}
                {ad.avatar ? <img src={ad.avatar} alt="" className="w-full h-full object-cover" /> : <div className="font-bold text-gray-400">{ad.page_name.charAt(0)}</div>}
          </div>
          <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight hover:underline">
                    {ad.page_name}
                </h3>
                
                {/* --- HIER SIND DIE BADGES --- */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    
                    {/* 1. Viral Score (0-100) - IMMER SICHTBAR wenn > 0 */}
                    {score > 0 && (
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${score >= 50 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`} title="Viralitäts-Score (0-100)">
                            <Zap className={`w-3 h-3 ${score >= 50 ? 'fill-indigo-500' : 'fill-blue-500'}`} />
                            <span>{score}</span>
                        </div>
                    )}

                    {/* 2. Faktor (Feuer) - Wenn > 1.5x */}
                    {factor > 1.5 && (
                         <div className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100" title={`${factor}x besser als der Durchschnitt`}>
                            <span className="text-[10px]">🔥</span>
                            <span>{factor}x</span>
                        </div>
                    )}
                    
                    {/* Fallback ID (nur wenn gar keine Scores da sind) */}
                    {score === 0 && factor === 0 && (
                        <div className="text-[10px] text-gray-400 font-medium">ID: {ad.id.split('_')[1] || ad.id}</div>
                    )}
                </div>
          </div>
          
          {versionCount > 1 && (
              <div className="ml-auto flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 shadow-sm whitespace-nowrap">
                      <Layers className="w-3 h-3" />
                      {versionCount}
                  </span>
              </div>
          )}
      </div>

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
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><Info className="w-8 h-8 mb-2 opacity-50" /><span className="text-sm font-medium">Keine Vorschau</span></div>
        )}
      </div>

      <div className="bg-white border-b border-gray-100 px-3 py-2.5 flex items-center justify-between">
          <div className="text-[10px] text-gray-500 truncate mr-2 font-medium tracking-wide">
              {getDisplayDomain(snapshot.link_url) || 'WEBSITE'}
          </div>
          <button className="flex-shrink-0 bg-gray-50 hover:bg-gray-100 text-gray-900 text-[10px] font-semibold px-3 py-1.5 rounded border border-gray-200 transition-colors shadow-sm">
              {snapshot.cta_text || 'Mehr dazu'}
          </button>
      </div>

      <div className="p-3 bg-white flex-1 flex flex-col gap-1">
           <div className="text-xs text-gray-600 leading-5 font-normal line-clamp-2 h-10 overflow-hidden">
                {content || <span className="text-gray-400 italic">Kein Text verfügbar</span>}
           </div>
           <div className="text-[11px] text-blue-600 font-medium leading-4 line-clamp-1 h-4 overflow-hidden">
               {hashtags.join(' ')}
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