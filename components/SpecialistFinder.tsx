
import React, { useState } from 'react';
import { findSpecialists } from '../services/gemini';
import { Specialist } from '../types';

interface SpecialistFinderProps {
  specialty: string;
  issues: string[];
}

const SpecialistFinder: React.FC<SpecialistFinderProps> = ({ specialty, issues }) => {
  const [loading, setLoading] = useState(false);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [manualArea, setManualArea] = useState('');
  const [isShowingManualInput, setIsShowingManualInput] = useState(false);

  const searchWithGPS = async () => {
    setLoading(true);
    setLocationError(null);
    setSearchStatus('Acquiring GPS Signal...');
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported. Please enter your area manually.");
      setIsShowingManualInput(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setSearchStatus(`Analyzing clinics within 5-7km...`);
        try {
          const results = await findSpecialists(specialty, issues, { 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          });
          setSpecialists(results.links);
        } catch (err) {
          setLocationError("Nearby search failed. Try entering your area manually.");
          setIsShowingManualInput(true);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLocationError("GPS access denied. Please specify your locality below.");
        setIsShowingManualInput(true);
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const searchWithManualArea = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualArea.trim()) return;

    setLoading(true);
    setLocationError(null);
    setSearchStatus(`Searching for experts in ${manualArea}...`);
    
    try {
      const results = await findSpecialists(specialty, issues, manualArea);
      setSpecialists(results.links);
    } catch (err) {
      setLocationError("Could not find specialists in that area.");
    } finally {
      setLoading(false);
    }
  };

  const getPractoUrl = (name: string) => {
    const cleanName = name.split('|')[0].trim();
    return `https://www.practo.com/search/doctors?results_type=doctor&q=${encodeURIComponent(cleanName)}`;
  };

  const formatTitle = (title: string) => {
    const parts = title.split('|');
    return {
      name: parts[0]?.trim() || title,
      location: parts[1]?.trim() || 'Address available in Maps'
    };
  };

  return (
    <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 overflow-hidden relative group">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-slate-900 flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <i className="fa-solid fa-user-doctor"></i>
          </div>
          Clinical Matching
        </h3>
        <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">
          {specialty}
        </span>
      </div>

      {specialists.length === 0 && !loading ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm text-slate-500 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
            To provide 5-7km vicinity results, Medic AI d needs to know your general location.
          </p>
          
          <div className="grid gap-3">
            <button 
              onClick={searchWithGPS}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-lg uppercase tracking-widest text-[11px]"
            >
              <i className="fa-solid fa-location-crosshairs"></i>
              Use My Current GPS
            </button>
            
            <div className="relative py-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <span className="relative px-3 bg-white text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">OR</span>
            </div>

            <form onSubmit={searchWithManualArea} className="space-y-3">
              <input 
                type="text" 
                value={manualArea}
                onChange={(e) => setManualArea(e.target.value)}
                placeholder="Enter Suburb (e.g. Malad, Mumbai)"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm text-slate-800 placeholder:text-slate-300 transition-all"
              />
              <button 
                type="submit"
                disabled={!manualArea.trim()}
                className="w-full py-4 border-2 border-slate-200 text-slate-900 rounded-2xl font-black hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] disabled:opacity-30"
              >
                Find Specialists in Area
              </button>
            </form>
          </div>
        </div>
      ) : loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-xs text-slate-900 font-black uppercase tracking-widest animate-pulse">{searchStatus}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Filtering for maximum proximity...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              Grounded Vicinity Results
            </span>
            <button 
              onClick={() => setSpecialists([])}
              className="text-[9px] font-black text-indigo-600 uppercase underline"
            >
              Change Location
            </button>
          </div>
          
          <div className="grid gap-4">
            {specialists.map((spec, i) => {
              const { name, location } = formatTitle(spec.title);
              return (
                <div 
                  key={i} 
                  className="group/item block p-6 border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10 rounded-[2rem] transition-all"
                >
                  <div className="mb-4">
                    <span className="text-[15px] font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors block leading-snug">{name}</span>
                    <div className="flex items-start gap-2 mt-2">
                      <i className="fa-solid fa-location-dot text-[11px] text-rose-500 mt-1"></i>
                      <p className="text-[12px] text-slate-500 font-bold leading-relaxed">
                        {location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href={getPractoUrl(spec.title)}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                    >
                      <i className="fa-solid fa-calendar-check"></i>
                      Practo
                    </a>
                    <a 
                      href={spec.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
                    >
                      <i className="fa-solid fa-map-location-dot"></i>
                      Maps
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {specialists.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs font-bold text-slate-400">No matching specialists found in the selected radius.</p>
              <button onClick={() => setSpecialists([])} className="mt-2 text-indigo-600 font-black text-[10px] uppercase">Try different location</button>
            </div>
          )}
        </div>
      )}

      {locationError && (
        <div className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-100 animate-in shake">
           <p className="text-[10px] text-rose-700 font-bold leading-relaxed flex gap-3">
            <i className="fa-solid fa-circle-exclamation text-rose-500 shrink-0 mt-0.5"></i>
            <span>{locationError}</span>
          </p>
        </div>
      )}
    </section>
  );
};

export default SpecialistFinder;
