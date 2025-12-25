
import React from 'react';
import { HealthAnalysis, LabMarker } from '../types';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface AnalysisDashboardProps {
  analysis: HealthAnalysis;
  history: HealthAnalysis[];
}

const normalize = (name: string) => {
  let n = name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  if (n.includes('hba1c') || n.includes('hemoglobina1c')) return 'hba1c';
  if (n.includes('glucose') || n.includes('sugar') || n.includes('fbs')) return 'bloodglucose';
  if (n.includes('wbc') || n.includes('whiteblood')) return 'wbc';
  if (n.includes('creatinine')) return 'creatinine';
  if (n.includes('hemoglobin')) return 'hemoglobin';
  if (n.includes('tsh') || n.includes('thyroid')) return 'tsh';
  if (n.includes('totalcholesterol')) return 'totalcholesterol';
  return n;
};

const MarkerCard: React.FC<{ marker: LabMarker, history: HealthAnalysis[], currentId: string }> = ({ marker, history, currentId }) => {
  const status = marker.status.toLowerCase();
  const isCritical = status === 'critical';

  const icon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('glucose') || n.includes('hba1c')) return 'fa-droplet';
    if (n.includes('heart') || n.includes('cholesterol')) return 'fa-heart-pulse';
    if (n.includes('kidney') || n.includes('creatinine')) return 'fa-filter';
    if (n.includes('blood') || n.includes('wbc') || n.includes('hemoglobin')) return 'fa-vial-blood';
    return 'fa-microscope';
  };

  const statusConfig = {
    normal: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', bar: 'bg-emerald-500', color: '#10b981' },
    low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', bar: 'bg-blue-500', color: '#3b82f6' },
    high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', bar: 'bg-red-500', color: '#ef4444' },
    critical: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-600', bar: 'bg-red-600', color: '#dc2626' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.normal;

  const currentMarkerNorm = normalize(marker.name);
  const currentAnalysis = history.find(h => h.id === currentId);
  const currentTimestamp = currentAnalysis?.timestamp || Date.now();

  const prevRecord = history
    .filter(h => h.timestamp < currentTimestamp && h.markers.some(m => normalize(m.name) === currentMarkerNorm))
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  const prevMarker = prevRecord?.markers.find(m => normalize(m.name) === currentMarkerNorm);
  const currentVal = parseFloat(marker.value as string);
  const prevVal = prevMarker ? parseFloat(prevMarker.value as string) : null;
  
  let clinicalShift: 'improvement' | 'deterioration' | 'stable' | null = null;
  let deltaText = "";
  let directionArrow: React.ReactNode = null;

  if (prevVal !== null && !isNaN(currentVal) && !isNaN(prevVal)) {
    const delta = currentVal - prevVal;
    const name = marker.name.toLowerCase();
    const isBadIfHigh = name.includes('glucose') || name.includes('hba1c') || name.includes('cholesterol') || name.includes('creatinine') || name.includes('wbc');
    
    if (Math.abs(delta) < 0.001) {
      clinicalShift = 'stable';
    } else {
      const increased = delta > 0;
      clinicalShift = isBadIfHigh ? (increased ? 'deterioration' : 'improvement') : (increased ? 'improvement' : 'deterioration');
      
      const isImprovement = clinicalShift === 'improvement';
      directionArrow = (
        <span className={`flex items-center justify-center w-6 h-6 rounded-full ${isImprovement ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} shadow-sm transition-all duration-500 group-hover:scale-125`}>
          <i className={`fa-solid ${increased ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`}></i>
        </span>
      );
    }
    deltaText = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${marker.unit}`;
  }

  const fullHistoryForMarker = history
    .filter(h => h.markers.some(m => normalize(m.name) === currentMarkerNorm))
    .sort((a, b) => a.timestamp - b.timestamp);

  const sparklineData = fullHistoryForMarker.map(h => ({
      value: parseFloat(h.markers.find(m => normalize(m.name) === currentMarkerNorm)?.value as string) || 0
  }));

  return (
    <div className={`p-5 rounded-[2.5rem] border transition-all duration-500 ease-out group relative flex flex-col h-full cursor-default 
      ${isCritical 
        ? 'animate-alarm bg-red-50/50 border-red-600 shadow-xl shadow-red-200 z-10' 
        : 'bg-white border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-400 hover:-translate-y-2'
      }`}>
      
      {isCritical && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-badge-pulse z-20">
          Emergency Threshold
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 ${isCritical ? 'bg-red-600 text-white' : config.bg + ' ' + config.text} rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm`}>
          <i className={`fa-solid ${icon(marker.name)}`}></i>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${isCritical ? 'bg-red-700 text-white border-red-800' : config.bg + ' ' + config.text + ' ' + config.border}`}>
            {marker.status}
          </div>
          {clinicalShift && (
            <div className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
              clinicalShift === 'improvement' ? 'bg-emerald-50 text-emerald-700' : 
              clinicalShift === 'deterioration' ? 'bg-red-100 text-red-800' : 'bg-slate-50 text-slate-500'
            }`}>
              {clinicalShift === 'stable' ? <i className="fa-solid fa-minus"></i> : clinicalShift === 'improvement' ? <i className="fa-solid fa-caret-up"></i> : <i className="fa-solid fa-caret-down"></i>}
              {clinicalShift}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-2">
        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-0.5 truncate ${isCritical ? 'text-red-900' : 'text-slate-400 group-hover:text-indigo-500'}`}>{marker.name}</h4>
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black tracking-tight ${isCritical ? 'text-red-700' : 'text-slate-900'} group-hover:text-indigo-900`}>{marker.value}</span>
            <span className={`text-[10px] font-bold ${isCritical ? 'text-red-400' : 'text-slate-400'}`}>{marker.unit}</span>
          </div>
          {directionArrow}
        </div>
      </div>

      {sparklineData.length > 1 && (
        <div className={`h-10 w-full mt-1 mb-2 transition-opacity ${isCritical ? 'opacity-80' : 'opacity-40 group-hover:opacity-100'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} fill={config.color} fillOpacity={isCritical ? 0.3 : 0.1} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {deltaText && <p className={`text-[9px] font-bold uppercase tracking-tight mb-3 ${isCritical ? 'text-red-600' : 'text-slate-400'}`}>{deltaText} vs last report</p>}
      
      {marker.context && (
        <div className={`mt-2 mb-3 p-3 rounded-xl border ${isCritical ? 'bg-red-100/50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
          <p className={`text-[9px] leading-relaxed font-bold ${isCritical ? 'text-red-900' : 'text-slate-600'}`}>
            <i className={`fa-solid fa-link ${isCritical ? 'text-red-600' : 'text-indigo-400'} mr-1.5`}></i>
            {marker.context}
          </p>
        </div>
      )}
      
      <p className={`text-[10px] leading-relaxed font-semibold italic mt-auto ${isCritical ? 'text-red-700' : 'text-slate-500'} line-clamp-2`}>{marker.interpretation}</p>
    </div>
  );
};

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis, history }) => {
  const urgencyConfig = {
    'RED ALERT': { bg: 'bg-red-600', text: 'text-white', icon: 'fa-triangle-exclamation', accent: 'bg-white/20', label: 'Urgent Action Required' },
    'YELLOW': { bg: 'bg-amber-400', text: 'text-slate-900', icon: 'fa-eye', accent: 'bg-black/10', label: 'Monitor Findings' },
    'GREEN': { bg: 'bg-emerald-600', text: 'text-white', icon: 'fa-check-circle', accent: 'bg-white/20', label: 'System Optimal' }
  };

  const config = urgencyConfig[analysis.urgency as keyof typeof urgencyConfig] || urgencyConfig['GREEN'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className={`${config.bg} ${config.text} p-10 rounded-[3rem] shadow-2xl relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-64 h-64 ${config.accent} rounded-full -translate-y-1/2 translate-x-1/2`}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`px-4 py-1.5 rounded-full border border-current opacity-70 text-[10px] font-black uppercase tracking-[0.2em]`}>
                Report Date: {analysis.reportDate}
              </div>
              <div className={`px-4 py-1.5 rounded-full border border-current opacity-70 text-[10px] font-black uppercase tracking-[0.2em]`}>
                {config.label}
              </div>
            </div>
            {analysis.riskTrajectoryScore !== undefined && (
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Risk Trajectory</span>
                <div className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-2xl border border-white/10">
                  <span className="text-2xl font-black">{analysis.riskTrajectoryScore}</span>
                  <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${analysis.riskTrajectoryScore > 7 ? 'bg-red-400' : analysis.riskTrajectoryScore > 4 ? 'bg-amber-400' : 'bg-emerald-400'}`} 
                      style={{ width: `${analysis.riskTrajectoryScore * 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <h2 className="text-5xl font-black tracking-tighter uppercase mb-6">{analysis.urgency}</h2>
              <div className="flex items-start gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
                <div className={`w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}>
                  <i className={`fa-solid ${config.icon} text-xl`}></i>
                </div>
                <p className="text-xl font-bold leading-snug tracking-tight">{analysis.keyFinding}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm transition-all hover:shadow-lg">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600 mb-8 flex items-center gap-3">
            <i className="fa-solid fa-list-check"></i> Action Plan
          </h3>
          <div className="space-y-6">
            {analysis.correctiveMeasures.map((measure, i) => (
              <div key={i} className="flex gap-6 relative group/item">
                <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 border-2 border-white ring-4 ring-indigo-50/20 transition-all group-hover/item:bg-indigo-600 group-hover/item:text-white">
                  <i className="fa-solid fa-check text-[10px]"></i>
                </div>
                <p className="text-sm font-bold text-slate-700 pt-0.5">{measure}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 flex flex-col h-full transition-all hover:shadow-lg hover:bg-white hover:border-indigo-100">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Expert Assessment</h3>
          <div className="relative flex-1">
             <i className="fa-solid fa-quote-left absolute -top-4 -left-2 text-slate-200 text-4xl opacity-50"></i>
             <p className="text-slate-700 font-bold leading-relaxed relative z-10 pl-6 text-justify">{analysis.summary}</p>
          </div>
          {analysis.patterns && (
            <div className="mt-8 pt-8 border-t border-slate-200">
               <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02]">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-400">Trend Insight</h4>
                  <p className="text-sm font-bold leading-snug">{analysis.patterns}</p>
               </div>
            </div>
          )}
        </section>
      </div>

      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Biological Indicator Matrix</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic tracking-wider">Exhaustive clinical extraction of all {analysis.markers.length} values</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {analysis.markers.map((marker, idx) => (
            <MarkerCard key={idx} marker={marker} history={history} currentId={analysis.id} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default AnalysisDashboard;
