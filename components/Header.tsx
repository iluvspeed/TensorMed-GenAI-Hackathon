
import React from 'react';
import { AppView } from '../types';

interface HeaderProps {
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  currentView: AppView;
  setView: (view: AppView) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ patientName, patientAge, patientGender, currentView, setView, onLogout }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setView('dashboard')}
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <i className="fa-solid fa-dna text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Medic-AI-<span className="text-indigo-600">d</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <button 
              onClick={() => setView('dashboard')}
              className={`transition-colors flex items-center gap-2 ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <i className="fa-solid fa-chart-pie"></i>
              Dashboard
            </button>
            <button 
              onClick={() => setView('records')}
              className={`transition-colors flex items-center gap-2 ${currentView === 'records' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <i className="fa-solid fa-book-medical"></i>
              Records
            </button>
          </nav>
          
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          
          <div className="flex items-center gap-3 bg-slate-100/50 pl-4 pr-1.5 py-1.5 rounded-full border border-slate-200/50">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold text-slate-900 max-w-[120px] truncate leading-none mb-1 uppercase tracking-tight">
                {patientName}
              </p>
              <p className="text-[9px] text-slate-400 font-bold leading-none uppercase">
                Verified • {patientAge || '--'} • {patientGender || '--'}
              </p>
            </div>
            <button 
              onClick={onLogout}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm hover:border-rose-400 transition-colors group/logout"
              title="Logout"
            >
              <i className="fa-solid fa-power-off text-xs text-slate-300 group-hover/logout:text-rose-500"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;