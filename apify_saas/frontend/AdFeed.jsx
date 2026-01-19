import React, { useEffect, useState } from 'react';
import { supabase } from './services/supabaseClient';
import { cleanAndTransformData } from './adAdapter';
import MetaAdCard from './components/MetaAdCard'; 
import AdDetailModal from './components/AdDetailModal'; 

const AdFeed = ({ currentSearch }) => { // currentSearch als Prop annehmen!
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdGroup, setSelectedAdGroup] = useState([]);

  // Wir holen das Limit aus der aktuellen Suche, oder nutzen 100 als Standard
  const limit = currentSearch?.params?.limit || 100;
  // Sicherheits-Check: Falls Limit 'undefined' ist, nehmen wir 100
  const targetCount = limit > 0 ? limit : 100;

  useEffect(() => {
    if (!loading) {
      setProgress(100);
      return;
    }
    
    setProgress(0);

    // DEINE FORMEL: 40s Startzeit + 0.21s pro Ad
    // 100 Ads -> ~60s
    // 1000 Ads -> ~250s
    const estimatedTotalSeconds = 40 + (targetCount * 0.21); 
    
    // Wie viel Prozent pro 100ms Schritt?
    const percentPerTick = 100 / (estimatedTotalSeconds * 10);

    const interval = setInterval(() => {
      setProgress(prev => {
        // Langsamer werden gegen Ende (bei 90%), falls es mal länger dauert
        if (prev >= 90) {
            return prev + (percentPerTick / 5); 
        }
        // Maximal bis 99% laufen lassen
        if (prev >= 99) return 99;
        
        return prev + percentPerTick;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [loading, targetCount]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        // Wir laden nur so viele, wie wir bestellt haben
        const { data, error } = await supabase
          .from('ad_results')
          .select('data')
          .limit(targetCount)
          .order('created_at', { ascending: false }); // Neueste zuerst

        if (error) throw error;

        const safeAds = cleanAndTransformData(data);
        // Sortieren nach Score
        safeAds.sort((a, b) => (b.efficiency_score || 0) - (a.efficiency_score || 0));
        setAds(safeAds);

      } catch (err) {
        console.error("Ladefehler:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [targetCount]); // Neu laden wenn sich targetCount ändert

  const handleCardClick = (ad) => {
      setSelectedAdGroup([ad]);
      setIsModalOpen(true);
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-in fade-in duration-500">
        <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-brand-700">
                {Math.round(progress)}%
            </div>
        </div>
        
        <div className="w-full max-w-md space-y-3 px-4">
            <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>Collecting Ads...</span>
                <span>Target: {targetCount} items</span>
            </div>
            
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300 ease-linear rounded-full"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            
            <p className="text-xs text-center text-gray-400">
                AI Analysis & Scoring in progress (~{(40 + targetCount * 0.21).toFixed(0)}s)
            </p>
        </div>
      </div>
    );
  }

  if (ads.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg font-medium">Keine Ergebnisse gefunden</p>
        <p className="text-sm">Versuche einen anderen Suchbegriff.</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {ads.map((ad) => (
          <MetaAdCard key={ad.id} ad={ad} onClick={handleCardClick} />
        ))}
      </div>
      <AdDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} group={selectedAdGroup} type="meta" />
    </>
  );
};

export default AdFeed;