import React, { useEffect, useState } from 'react';
import { supabase } from './services/supabaseClient';
import { cleanAndTransformData } from './adAdapter';
import MetaAdCard from './components/MetaAdCard'; 
import AdDetailModal from './components/AdDetailModal'; 

const AdFeed = ({ currentSearch }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdGroup, setSelectedAdGroup] = useState([]);

  // 1. LIMIT & ID EXTRAHIEREN
  // Wir holen das Limit aus den Parametern oder nutzen 100 als Standard.
  const rawLimit = currentSearch?.params?.limit;
  const targetCount = (rawLimit && !isNaN(rawLimit)) ? parseInt(rawLimit) : 100;
  
  // Die Search ID, falls wir eine haben (wichtig für den DB-Filter)
  const searchId = currentSearch?.meta?.search_id || currentSearch?.search_id;

  // --- PROGRESS BAR LOGIK (DEINE FORMEL) ---
  useEffect(() => {
    if (!loading) {
      setProgress(100);
      return;
    }
    
    setProgress(0);

    // Formel: 40s Startzeit (Apify Cold Start) + 0.21s pro Ad
    const estimatedTotalSeconds = 40 + (targetCount * 0.21); 
    
    // Prozent pro Tick (100ms)
    const percentPerTick = 100 / (estimatedTotalSeconds * 10);

    const interval = setInterval(() => {
      setProgress(prev => {
        // Bremsen bei 95%, falls Backend länger braucht
        if (prev >= 95) return 95;
        return prev + percentPerTick;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [loading, targetCount]);

  // --- DATEN LADEN ---
  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);

      try {
        // FALL A: Wir haben die Daten schon direkt vom Backend bekommen (Live Search)
        // Das ist super schnell und spart den DB-Call.
        if (currentSearch?.data && Array.isArray(currentSearch.data) && currentSearch.data.length > 0) {
            console.log("⚡ Using direct data from API response");
            const safeAds = cleanAndTransformData(currentSearch.data);
            safeAds.sort((a, b) => (b.efficiency_score || 0) - (a.efficiency_score || 0));
            setAds(safeAds);
            setLoading(false);
            return;
        }

        // FALL B: Wir müssen aus der DB laden (z.B. History oder Cache)
        console.log("🔄 Fetching from Supabase...", searchId ? `ID: ${searchId}` : "No ID, loading latest");
        
        let query = supabase
          .from('ad_results')
          .select('data')
          .order('created_at', { ascending: false })
          .limit(targetCount);

        // WICHTIG: Wenn wir eine Search ID haben, filtern wir danach!
        if (searchId) {
            query = query.eq('search_ref', searchId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
            const safeAds = cleanAndTransformData(data);
            safeAds.sort((a, b) => (b.efficiency_score || 0) - (a.efficiency_score || 0));
            setAds(safeAds);
        }

      } catch (err) {
        console.error("Ladefehler:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [currentSearch, targetCount, searchId]); 

  const handleCardClick = (ad) => {
      setSelectedAdGroup([ad]);
      setIsModalOpen(true);
  };

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-in fade-in duration-500">
        <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Hintergrund Kreis */}
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            {/* Drehender Spinner */}
            <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
            {/* Prozentzahl */}
            <span className="font-bold text-xl text-brand-700">{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full max-w-md space-y-3 px-4">
            <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>Collecting {targetCount} Ads...</span>
                <span>~{(40 + targetCount * 0.21).toFixed(0)}s</span>
            </div>
            
            {/* Fortschrittsbalken */}
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300 ease-linear"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            
            <p className="text-xs text-center text-gray-400">
                AI Analysis & Scoring in progress...
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