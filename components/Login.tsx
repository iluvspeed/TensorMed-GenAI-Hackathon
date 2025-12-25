
import React, { useState } from 'react';
import { AuthData } from '../types';

interface LoginProps {
  onLogin: (data: AuthData) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [abhaId, setAbhaId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && (mobile.trim() || abhaId.trim())) {
      onLogin({ 
        name, 
        mobile: mobile.trim() || undefined, 
        abhaId: abhaId.trim() || undefined 
      });
    }
  };

  const isFormValid = name.trim() !== '' && (mobile.trim() !== '' || abhaId.trim() !== '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 md:p-14 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-xl mb-6">
            <i className="fa-solid fa-dna text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1">Medic-AI-d</h1>
          <p className="text-indigo-600 font-black text-sm uppercase tracking-[0.15em] mb-1">Prescribing Action to Data</p>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Identity-Protected Health Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mobile Number</label>
              <input 
                type="tel" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
              />
            </div>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative px-4 bg-white text-[10px] font-black text-slate-300 uppercase tracking-widest">OR</span>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ABHA ID (Health ID)</label>
              <input 
                type="text" 
                value={abhaId}
                onChange={(e) => setAbhaId(e.target.value)}
                placeholder="e.g. 12-3456-7890-1234"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={!isFormValid}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 hover:-translate-y-1 transition-all active:translate-y-0 flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none"
          >
            Access My Records
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-slate-400 font-bold leading-relaxed">
          <i className="fa-solid fa-shield-halved mr-2 text-indigo-400"></i>
          Encryption active. Your health history is isolated using your unique identity profile.
        </p>
      </div>
    </div>
  );
};

export default Login;