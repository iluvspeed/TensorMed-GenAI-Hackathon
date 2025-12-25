
import React, { useState, useEffect } from 'react';
import { analyzeReport } from './services/gemini';
import { HealthAnalysis, PatientRecord, AppView, AuthData } from './types';
import Header from './components/Header';
import ReportUpload from './components/ReportUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import HistoryTrends from './components/HistoryTrends';
import SpecialistFinder from './components/SpecialistFinder';
import Login from './components/Login';
import HealthChatbot from './components/HealthChatbot';

const App: React.FC = () => {
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<HealthAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for active session on load
  useEffect(() => {
    const activeSession = sessionStorage.getItem('medic_d_session_key');
    if (activeSession) {
      const savedData = localStorage.getItem(`medic_d_record_${activeSession}`);
      if (savedData) {
        setPatient(JSON.parse(savedData));
        setIsLoggedIn(true);
      }
    }
  }, []);

  const handleLogin = (auth: AuthData) => {
    // Generate a key based on either mobile or abhaId
    const identifier = auth.mobile || auth.abhaId || 'unknown';
    const uniqueKey = btoa(`${identifier}_${auth.name.toLowerCase().trim()}`);
    const savedData = localStorage.getItem(`medic_d_record_${uniqueKey}`);
    
    if (savedData) {
      setPatient(JSON.parse(savedData));
    } else {
      const newPatient: PatientRecord = {
        id: uniqueKey,
        name: auth.name,
        mobile: auth.mobile,
        abhaId: auth.abhaId,
        history: []
      };
      setPatient(newPatient);
      localStorage.setItem(`medic_d_record_${uniqueKey}`, JSON.stringify(newPatient));
    }
    
    sessionStorage.setItem('medic_d_session_key', uniqueKey);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('medic_d_session_key');
    setIsLoggedIn(false);
    setPatient(null);
    setCurrentAnalysis(null);
    setCurrentView('dashboard');
  };

  const handleUpload = async (contents: (string | { data: string; mimeType: string })[]) => {
    if (!patient) return;
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const historySummary = patient.history.length > 0 
        ? patient.history.map(h => `Date: ${new Date(h.timestamp).toLocaleDateString()}, Finding: ${h.keyFinding}`).join('\n')
        : "No prior facility context.";

      const newReports = await analyzeReport(contents, historySummary);
      
      if (newReports.length === 0) {
        throw new Error("No clinical data could be extracted from these documents.");
      }

      const firstReport = newReports[0];
      const newName = firstReport.patientName || patient.name;
      const newAge = firstReport.patientAge || patient.age;
      const newGender = firstReport.patientGender || patient.gender;
      
      const combinedHistory = [...newReports, ...patient.history]
        .filter((v, i, a) => a.findIndex(t => (t.reportDate === v.reportDate && t.keyFinding === v.keyFinding)) === i)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);
      
      const updatedPatient = {
        ...patient,
        name: newName,
        age: newAge,
        gender: newGender,
        history: combinedHistory
      };
      
      setPatient(updatedPatient);
      setCurrentAnalysis(newReports.sort((a, b) => b.timestamp - a.timestamp)[0]);
      localStorage.setItem(`medic_d_record_${patient.id}`, JSON.stringify(updatedPatient));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis encountered an issue. Please ensure the documents are clear.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearCurrent = () => {
    setCurrentAnalysis(null);
    setCurrentView('dashboard');
  };

  const selectRecordFromLog = (record: HealthAnalysis) => {
    setCurrentAnalysis(record);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <Header 
        patientName={patient?.name || 'Patient Profile'} 
        patientAge={patient?.age}
        patientGender={patient?.gender}
        currentView={currentView}
        setView={(v) => { setCurrentView(v); setCurrentAnalysis(null); }}
        onLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {currentView === 'records' && patient ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">Health Archives</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patient.history.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border border-slate-200 text-slate-400">
                   <p className="font-bold uppercase tracking-widest text-xs">No health records stored yet.</p>
                </div>
              ) : (
                patient.history.map((record) => (
                  <div key={record.id} onClick={() => selectRecordFromLog(record)} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-2 py-0.5 rounded text-[10px] font-black ${record.urgency === 'RED ALERT' ? 'bg-rose-100 text-rose-700' : record.urgency === 'YELLOW' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {record.urgency}
                      </div>
                      <span className="text-xs font-bold text-slate-400">{record.reportDate || new Date(record.timestamp).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-black text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors">{record.keyFinding}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{record.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : !currentAnalysis && !isAnalyzing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Welcome Note */}
              <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-left-4 duration-700">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                    Welcome back, <span className="text-indigo-600 uppercase">{patient?.name}</span>
                  </h2>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                    Your health archive contains <span className="text-indigo-600">{patient?.history.length || 0}</span> protected records.
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <i className="fa-solid fa-hand-sparkles text-xl"></i>
                </div>
              </section>

              <section className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 md:p-14">
                <div className="mb-10">
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">Proactive Intelligence</span>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Collective Intelligence</h2>
                  <p className="text-slate-500 mt-3 text-xl font-medium">Upload multiple reports or scans. Our AI cross-correlates data points to identify systemic patterns and emerging health trends.</p>
                </div>
                <ReportUpload onUpload={handleUpload} />
              </section>
              {patient && patient.history.length > 0 && <HistoryTrends history={patient.history} onSelectRecord={selectRecordFromLog} />}
            </div>
            
            <div className="space-y-6">
               <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                   <i className="fa-solid fa-language text-8xl"></i>
                 </div>
                 <h3 className="text-2xl font-black mb-4 tracking-tight">Vernacular Aware</h3>
                 <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">Reports in Hindi or Hinglish are processed with medical-grade precision. Vernacular nuances are factored into the final assessment.</p>
                 <div className="flex flex-wrap gap-2">
                    {['HINDI', 'HINGLISH', 'ENGLISH'].map(l => <span key={l} className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-lg border border-white/5 tracking-widest">{l}</span>)}
                 </div>
               </div>
               
               <div className="bg-indigo-600 text-white rounded-[2.5rem] p-10 shadow-lg relative group">
                  <h3 className="text-xl font-black mb-2">Trend Tracking</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed font-medium">Biomarkers are mapped over time. Medic AI d alerts you to subtle deviations before they impact your quality of life.</p>
                  <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Longitudinal Coverage</span>
                    <i className="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-transform"></i>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-health-entry">
             <button onClick={clearCurrent} className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest shadow-md hover:border-indigo-400 transition-all">
               <i className="fa-solid fa-arrow-left"></i> Analysis Hub
             </button>

             {isAnalyzing ? (
               <div className="flex flex-col items-center justify-center py-40">
                 <div className="relative w-24 h-24 mb-10">
                   <div className="absolute inset-0 border-[6px] border-indigo-100 rounded-full"></div>
                   <div className="absolute inset-0 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <i className="fa-solid fa-atom text-indigo-600 text-2xl animate-pulse"></i>
                   </div>
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Analyzing Collective Data</h3>
                 <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Identifying Distinct Clinical Events</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
                 <div className="lg:col-span-2">
                   <AnalysisDashboard analysis={currentAnalysis!} history={patient?.history || []} />
                 </div>
                 <div className="space-y-8">
                   <SpecialistFinder specialty={currentAnalysis!.recommendedSpecialist} issues={currentAnalysis!.potentialIssues} />
                   
                   <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                      <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600 mb-6 flex items-center gap-3">
                        <i className="fa-solid fa-leaf"></i>
                        Dietary Optimization
                      </h3>
                      <ul className="space-y-5">
                        {currentAnalysis!.dietaryRecommendations.map((rec, i) => (
                          <li key={i} className="text-sm font-bold text-slate-700 flex gap-4 leading-relaxed group">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0 group-hover:scale-125 transition-transform"></span>
                            {rec}
                          </li>
                        ))}
                        {currentAnalysis!.dietaryRecommendations.length === 0 && (
                          <p className="text-sm text-slate-400 italic">No specific dietary recommendations for this assessment.</p>
                        )}
                      </ul>
                   </div>
                 </div>
                 {/* Chatbot appears once analysis is present */}
                 <HealthChatbot analysis={currentAnalysis!} history={patient?.history || []} />
               </div>
             )}
          </div>
        )}
        
        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4">
            <i className="fa-solid fa-circle-info text-indigo-400"></i>
            <span className="text-sm font-bold">{error}</span>
            <button onClick={() => setError(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
