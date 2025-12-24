
import React from 'react';
import { StreamData } from '../types';

interface OverlayProps {
  data: StreamData;
}

export const Overlay: React.FC<OverlayProps> = ({ data }) => {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'LIVE': return 'from-red-600 to-red-400';
      case 'BRB': return 'from-orange-600 to-amber-400';
      case 'DEBUGGING': return 'from-blue-600 to-cyan-400';
      case 'OFFLINE': return 'from-neutral-700 to-neutral-500';
      default: return 'from-emerald-600 to-green-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status.toUpperCase()) {
      case 'LIVE': return 'bg-red-500';
      case 'BRB': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="w-fit min-w-[320px] max-w-lg bg-black/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl font-mono p-1">
      {/* Top Bar with Status and Viewers */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusBg(data.status)}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusBg(data.status)}`}></span>
          </div>
          <span className={`text-[10px] font-bold tracking-[0.2em] uppercase bg-gradient-to-r ${getStatusColor(data.status)} bg-clip-text text-transparent`}>
            {data.status}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
           <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
           </svg>
           <span className="text-[10px] text-neutral-400 font-bold">{data.viewers}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Project Section */}
        <div>
          <label className="text-[9px] text-neutral-500 uppercase tracking-widest block mb-1">Current Task</label>
          <h2 className="text-lg font-bold text-white leading-tight uppercase tracking-tight">
            {data.project}
          </h2>
        </div>

        {/* Message Section */}
        <div className="bg-neutral-900/40 p-2 border-l-2 border-white/10">
          <p className="text-[11px] text-neutral-300 italic">
            &gt; {data.message}
          </p>
        </div>

        {/* Tech Stack Tags */}
        <div className="flex flex-wrap gap-2 pt-1">
          {data.tech.map((tag, i) => (
            <span 
              key={`${tag}-${i}`} 
              className="text-[9px] px-2 py-0.5 bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-sm uppercase font-bold tracking-tighter"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="px-3 py-1.5 flex items-center justify-between border-t border-white/5 opacity-40">
        <span className="text-[8px] text-neutral-500 uppercase tracking-[0.3em]">Hacker.OS</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-neutral-700"></div>
          <div className="w-1 h-1 rounded-full bg-neutral-700"></div>
          <div className="w-1 h-1 rounded-full bg-neutral-700"></div>
        </div>
      </div>
    </div>
  );
};
