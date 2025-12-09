import React, { useMemo } from 'react';
import { MetaAd } from '../types';
import { Facebook, Instagram, Info, MessageCircle, Globe, Layers, Play, BarChart3 } from 'lucide-react';

interface MetaAdCardProps {
  ad: MetaAd;
  versionCount?: number;
  viewMode?: 'condensed' | 'details';
  onClick: (ad: MetaAd) => void;
  platformContext?: 'facebook' | 'instagram';
}

const MetaAdCard: React.FC<MetaAdCardProps> = ({ ad, versionCount = 1, onClick }) => {
  const { snapshot } = ad;
  const hasVideo = snapshot.videos && snapshot.videos.length > 0;
  const mediaUrl = hasVideo ? snapshot.videos[0].video_hd_url : (snapshot.images.length > 0 ? snapshot.images[0].resized_image_url : null);
  
  // REACH VISUALISIERUNG
  const reachCount = ad.reach || 0;

  const handleCardClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('button')) return;
      onClick(ad);
  };

  const getDisplayDomain = (url: string) => {
    try {
        if (!url || url === '#' || url.trim() === '') return '';
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        return u.hostname.replace('www.', '').toUpperCase();
    } catch { return ''; }
  };

  const { content, hashtags } = useMemo(() => {
      const text = snapshot.body.text || '';
      const words = text.replace(/\n/g, ' ').split(/\s+/);
      const tags: string[] = [];
      const contentWords: string[] = [];
      words.forEach(w => w.startsWith('#') ? tags.push(w) : contentWords.push(w));
      return { content: contentWords.join(' '), hashtags: tags };
  }, [snapshot.body.text]);

  const hasFB = ad.publisher_platform?.includes('facebook');
  const hasIG = ad.publisher_platform?.includes('instagram');
  const formattedDate = new Date(ad.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div onClick={handleCardClick} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md hover:border-brand-200 transition-all duration-300 cursor-pointer group">
      {/* 1. HEADER (Original Style) */}
      <div className="px-3 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2.5">
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-sm transition-colors ${ad.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                  <span className="font-semibold tracking-tight">{ad.isActive ? 'Aktiv' : 'Inaktiv'}</span>
              </div>
              <span className="text-gray-400 font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100">
                {hasFB && <Facebook className="w-3.5 h-3.5 text-gray-400" />}
                {hasIG && <Instagram className="w-3.5 h-3.5 text-gray-400" />}
          </div>
      </div>

      {/* 2. IDENTITY (Original Style + Reach Badge) */}
      <div className="p-3 flex items-center gap-3 relative">
          <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                {ad.avatar ? <img src={ad.avatar} className="w-full h-full object-cover" /> : <div className="font-bold text-gray-400">{ad.page_name.charAt(0)}</div>}
          </div>
          <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight hover:underline">{ad.page_name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                    {/* HIER ist die neue Reach Anzeige im alten Design */}
                    {reachCount > 0 ? (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                            <BarChart3 className="w-3 h-3" />
                            <span>{reachCount.toLocaleString()} Reach</span>
                        </div>
                    ) : (
                        <div className="text-[10px] text-gray-400 font-medium">ID: {ad.id.split('_')[1] || ad.id}</div>
                    )}
                </div>
          </div>
      </div>

      {/* 3. MEDIA (Original Style) */}
      <div className="bg-gray-100 relative w-full aspect-square border-y border-gray-100 overflow-hidden group-hover:opacity-95 transition-opacity">
        {mediaUrl ? (
          hasVideo ? (
             <div className="relative w-full h-full">
                 <video src={mediaUrl} className="w-full h-full object-cover bg-black" poster={snapshot.images[0]?.resized_image_url} muted />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50"><Play className="w-5 h-5 text-white fill-white ml-1" /></div>
                 </div>
             </div>
          ) : <img src={mediaUrl} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><Info className="w-8 h-8 mb-2 opacity-50" /><span className="text-sm font-medium">Keine Vorschau</span></div>
        )}
      </div>

      {/* 4. CTA (Original Style) */}
      <div className="bg-white border-b border-gray-100 px-3 py-2.5 flex items-center justify-between">
          <div className="text-[10px] text-gray-500 truncate mr-2 font-medium tracking-wide">{getDisplayDomain(snapshot.link_url) || 'WEBSITE'}</div>
          <button className="flex-shrink-0 bg-gray-50 hover:bg-gray-100 text-gray-900 text-[10px] font-semibold px-3 py-1.5 rounded border border-gray-200 transition-colors shadow-sm">{snapshot.cta_text || 'Mehr dazu'}</button>
      </div>

      {/* 5. TEXT (Original Style) */}
      <div className="p-3 bg-white flex-1 flex flex-col gap-1">
           <div className="text-xs text-gray-600 leading-5 font-normal line-clamp-2 h-10 overflow-hidden">{content || <span className="text-gray-400 italic">Kein Text verfügbar</span>}</div>
           <div className="text-[11px] text-blue-600 font-medium leading-4 line-clamp-1 h-4 overflow-hidden">{hashtags.join(' ')}</div>
      </div>
    </div>
  );
};

export default MetaAdCard;