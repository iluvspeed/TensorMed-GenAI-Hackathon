
import React, { useState } from 'react';
import { UploadMode } from '../types';

interface ReportUploadProps {
  onUpload: (contents: (string | { data: string; mimeType: string })[]) => void;
}

const ReportUpload: React.FC<ReportUploadProps> = ({ onUpload }) => {
  const [mode, setMode] = useState<UploadMode>('image');
  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState<{ id: string; preview: string; data: string; mimeType: string; name: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFiles(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          preview: reader.result as string,
          data: base64,
          mimeType: file.type,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = () => {
    if (mode === 'text' && textContent.trim()) {
      onUpload([textContent]);
    } else if (mode === 'image' && files.length > 0) {
      onUpload(files.map(f => ({ data: f.data, mimeType: f.mimeType })));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
        <button 
          onClick={() => setMode('image')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'image' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-file-medical mr-2"></i>
          Scans / Reports
        </button>
        <button 
          onClick={() => setMode('text')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <i className="fa-solid fa-align-left mr-2"></i>
          Clinical Text
        </button>
      </div>

      {mode === 'image' ? (
        <div className="space-y-4">
          <div className={`border-2 border-dashed rounded-[2rem] p-10 transition-colors text-center ${files.length > 0 ? 'border-indigo-200 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/5'}`}>
            <input 
              type="file" 
              multiple
              accept="image/*,.pdf" 
              onChange={handleFileChange} 
              className="hidden" 
              id="report-input" 
            />
            <label htmlFor="report-input" className="cursor-pointer block">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-600 rotate-3 group-hover:rotate-0 transition-transform">
                  <i className="fa-solid fa-file-arrow-up text-3xl"></i>
                </div>
                <div>
                  <p className="text-slate-900 text-xl font-black tracking-tight">Upload medical reports here</p>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Select all relevant images or PDFs for analysis</p>
                </div>
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2">
              {files.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                    {file.mimeType.includes('pdf') ? (
                      <div className="h-full flex flex-col items-center justify-center bg-slate-50">
                        <i className="fa-solid fa-file-pdf text-red-500 text-3xl"></i>
                        <span className="text-[9px] font-bold text-slate-400 mt-2 truncate max-w-[80%] px-2">{file.name}</span>
                      </div>
                    ) : (
                      <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <textarea 
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste medical notes, lab results, or clinical findings..."
          className="w-full h-48 p-8 rounded-[2rem] border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all text-slate-700 font-medium bg-white shadow-inner"
        ></textarea>
      )}

      <button 
        disabled={(mode === 'text' && !textContent) || (mode === 'image' && files.length === 0)}
        onClick={handleSubmit}
        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 disabled:shadow-none disabled:pointer-events-none flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
      >
        <i className="fa-solid fa-bolt text-indigo-200"></i>
        Start Clinical Analysis
      </button>
    </div>
  );
};

export default ReportUpload;
