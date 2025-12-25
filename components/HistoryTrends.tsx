
import React, { useState } from 'react';
import { HealthAnalysis } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoryTrendsProps {
  history: HealthAnalysis[];
  onSelectRecord: (record: HealthAnalysis) => void;
}

const HistoryTrends: React.FC<HistoryTrendsProps> = ({ history, onSelectRecord }) => {
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const normalize = (name: string) => {
    let n = name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (n.includes('hba1c') || n.includes('hemoglobina1c')) return 'hba1c';
    if (n.includes('bloodglucose') || n.includes('bloodsugar') || n.includes('fbs')) return 'bloodglucose';
    if (n.includes('wbc') || n.includes('whiteblood')) return 'wbc';
    if (n.includes('creatinine')) return 'creatinine';
    if (n.includes('hemoglobin')) return 'hemoglobin';
    if (n.includes('tsh') || n.includes('thyroid')) return 'tsh';
    if (n.includes('totalcholesterol')) return 'totalcholesterol';
    return n;
  };

  const getAllTrackableMarkers = () => {
    const markerCounts: Record<string, number> = {};
    history.forEach(h => {
      h.markers.forEach(m => {
        const name = normalize(m.name);
        markerCounts[name] = (markerCounts[name] || 0) + 1;
      });
    });
    
    return Object.entries(markerCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  };

  const getMarkerHistory = (markerNorm: string) => {
    return history
      .filter(h => h.markers.some(m => normalize(m.name) === markerNorm))
      .map(h => {
        const m = h.markers.find(m => normalize(m.name) === markerNorm);
        return {
          date: h.reportDate || new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rawDate: h.timestamp,
          value: parseFloat(m?.value as string) || 0,
          unit: m?.unit,
          name: m?.name
        };
      })
      .sort((a, b) => a.rawDate - b.rawDate);
  };

  const handleRecordSelect = (h: HealthAnalysis) => {
    setSelectingId(h.id);
    // Brief delay to allow the scale-up animation to be felt by the user
    setTimeout(() => {
      onSelectRecord(h);
      setSelectingId(null);
    }, 250);
  };

  const trackable = getAllTrackableMarkers();
  const primaryMarkerNorm = trackable.length > 0 ? trackable[0][0] : null;
  const chartData = primaryMarkerNorm ? getMarkerHistory(primaryMarkerNorm) : [];
  const displayName = chartData.length > 0 ? chartData[0].name : 'Marker';

  return (
    <section className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-10 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
        <i className="fa-solid fa-chart-line text-9xl text-indigo-900"></i>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
             Longitudinal Health Trends
          </h2>
          <p className="text-slate-500 font-bold text-sm mt-1">Cross-referencing multiple medical reports</p>
        </div>
        {trackable.length > 0 && chartData.length > 1 && (
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
             Primary Target: {displayName}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 relative z-10">
        <div className="lg:col-span-3">
          <div className="h-72 w-full bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100/50">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} dy={10} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                    itemStyle={{ fontSize: '14px', fontWeight: '900', color: '#4f46e5' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={6} dot={{ fill: '#4f46e5', r: 6, strokeWidth: 3, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><i className="fa-solid fa-chart-area text-indigo-200 text-2xl"></i></div>
                <p className="text-sm font-black text-slate-800 tracking-tight mb-1 uppercase">Connecting dots...</p>
                <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-[280px]">Upload at least 2 reports with matching biomarkers to activate longitudinal visualization.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Chronological History</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-4 custom-scrollbar">
            {[...history].sort((a, b) => b.timestamp - a.timestamp).map((h) => {
              const isSelected = selectingId === h.id;
              const anySelected = selectingId !== null;
              
              return (
                <div 
                  key={h.id} 
                  onClick={() => handleRecordSelect(h)} 
                  className={`flex items-center justify-between p-5 bg-white rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden
                    ${isSelected 
                      ? 'border-indigo-500 shadow-2xl scale-[1.05] z-20 ring-4 ring-indigo-500/10' 
                      : anySelected 
                        ? 'border-slate-100 opacity-40 grayscale-[0.5]' 
                        : 'border-slate-100 hover:border-indigo-400 hover:shadow-xl hover:-translate-x-1'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full transition-colors ${h.urgency === 'RED ALERT' ? 'bg-rose-600' : h.urgency === 'YELLOW' ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                    <div>
                      <p className={`text-xs font-black tracking-tight transition-colors uppercase ${isSelected ? 'text-indigo-600' : 'text-slate-800 group-hover:text-indigo-600'}`}>{h.reportType}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{h.reportDate || new Date(h.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <i className={`fa-solid fa-arrow-right transition-all text-xs ${isSelected ? 'text-indigo-600 translate-x-2' : 'text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1'}`}></i>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistoryTrends;
