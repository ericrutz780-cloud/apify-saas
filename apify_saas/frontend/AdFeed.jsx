import React, { useEffect, useState } from 'react';
import { supabase } from './services/supabaseClient';
import { cleanAndTransformData } from './adAdapter';
import MetaAdCard from './components/MetaAdCard'; 
import AdDetailModal from './components/AdDetailModal'; 
import { Loader2 } from 'lucide-react'; // Optional: Für ein Spinner-Icon

const AdFeed = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0); // NEU: Fortschritt in %
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdGroup, setSelectedAdGroup] = useState([]);

  // Konfiguration für den Ladebalken
  const targetCount = 100; // Hier das erwartete Limit eintragen (oder als Prop übergeben)

  // 1. Fortschrittsbalken-Logik (Deine Formel)
  useEffect(() => {
    if (!loading) {
      setProgress(100);
      return;
    }

    setProgress(0);

    // DEINE MESSWERTE:
    // 40 Sekunden Basis-Wartezeit (Scraper Start)
    // + 0.21 Sekunden pro Ad
    const estimatedTotalSeconds = 40 + (targetCount * 0.21); 
    
    // Berechnen, wie viel % pro 100ms Tick hinzugefügt werden
    const percentPerTick = 100 / (estimatedTotalSeconds * 10);

    const interval = setInterval(() => {
      setProgress(prev => {
        // Wir bremsen bei 95% ab, bis die echten Daten da sind
        if (prev >= 95) return 95; 
        return prev + percentPerTick;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [loading, targetCount]);

  // 2. Daten laden
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        
        // Hier laden wir die Daten aus Supabase
        const { data, error } = await supabase
          .from('ad_results')
          .select('data')
          .limit(targetCount); 

        if (error) throw error;

        const safeAds = cleanAndTransformData(data);
        safeAds.sort((a, b) => (b.efficiency_score || 0) - (a.efficiency_score || 0));
        setAds(safeAds);

      } catch (err) {
        console.error("Ladefehler:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []); // Leeres Array = Nur beim Mounten ausführen

  const handleCardClick = (ad) => {
      setSelectedAdGroup([ad]);
      setIsModalOpen(true);
  };

  // 3. Loading UI mit Fortschrittsbalken
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="relative w-20 h-20">
            {/* Optionaler Spinner Ring */}
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-brand-700">
                {Math.round(progress)}%
            </div>
        </div>
        
        <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Searching Ads...</span>
                <span>~{(40 + targetCount * 0.21).toFixed(0)}s expected</span>
            </div>
            {/* Der eigentliche Balken */}
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-brand-600 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-xs text-center text-gray-400">
                Analysing creative patterns & viral scores
            </p>
        </div>
      </div>
    );
  }

  if (ads.length === 0) return <div className="p-10 text-center text-gray-500">Keine Daten gefunden.</div>;

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