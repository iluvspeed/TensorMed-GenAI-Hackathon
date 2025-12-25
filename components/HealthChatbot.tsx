
import React, { useState, useEffect, useRef } from 'react';
import { HealthAnalysis } from '../types';
import { startChatSession } from '../services/gemini';
import { Chat, GenerateContentResponse } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface HealthChatbotProps {
  analysis: HealthAnalysis;
  history: HealthAnalysis[];
}

const HealthChatbot: React.FC<HealthChatbotProps> = ({ analysis, history }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const context = `
      Current Report Finding: ${analysis.keyFinding}
      Markers: ${analysis.markers.map(m => `${m.name}: ${m.value} ${m.unit} (${m.status})`).join(', ')}
      Historical Context: ${history.map(h => h.keyFinding).join(' -> ')}
    `;
    chatRef.current = startChatSession(context);
    setMessages([
      { role: 'model', text: `Hello. I've analyzed your ${analysis.reportType} from ${analysis.reportDate}. How can I help you understand these findings today?` }
    ]);
  }, [analysis.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatRef.current || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessageStream({ message: userMessage });
      let fullText = '';
      
      // Add an empty model message to stream into
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
        const chunkText = (chunk as GenerateContentResponse).text || '';
        fullText += chunkText;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'model', text: fullText };
          return newMsgs;
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'I encountered an error connecting to clinical services. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 ${isOpen ? 'w-[400px]' : 'w-16 h-16'}`}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
        >
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full animate-ping"></div>
          <i className="fa-solid fa-comment-medical text-2xl"></i>
        </button>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col h-[600px] overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-atom animate-spin-slow"></i>
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">Clinical Assistant</p>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active Insight Mode</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm font-medium shadow-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  {m.text || (isLoading && i === messages.length - 1 ? <i className="fa-solid fa-ellipsis fa-fade"></i> : '')}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length-1].role === 'user' && (
               <div className="flex justify-start">
                 <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm">
                   <i className="fa-solid fa-circle-notch fa-spin text-indigo-500"></i>
                 </div>
               </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your markers..."
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
          <div className="bg-slate-50 px-6 py-2">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-center">AI generated insights. Consult a doctor for final diagnosis.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthChatbot;
