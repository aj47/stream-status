
import React, { useState, useEffect, useCallback } from 'react';
import { Overlay } from './components/Overlay';
import { ControlPanel } from './components/ControlPanel';
import { StreamData, INITIAL_DATA } from './types';

const App: React.FC = () => {
  const [streamData, setStreamData] = useState<StreamData>(INITIAL_DATA);
  const [showControls, setShowControls] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('stream_status_config');
    if (saved) {
      try {
        setStreamData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved config", e);
      }
    }
  }, []);

  const handleUpdateData = useCallback((newData: StreamData) => {
    setStreamData(newData);
    localStorage.setItem('stream_status_config', JSON.stringify(newData));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-purple-500 rounded-full blur-[100px]" />
      </div>

      {/* Control Panel - Sticky on mobile, fixed side on desktop */}
      {showControls && (
        <div className="w-full md:w-[400px] border-b md:border-b-0 md:border-r border-neutral-800 bg-black/60 backdrop-blur-xl z-20 flex flex-col h-screen">
          <div className="p-6 border-b border-neutral-800 flex justify-end items-center">
            <button 
              onClick={() => setShowControls(false)}
              className="text-xs text-neutral-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
            >
              Hide Panel
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <ControlPanel data={streamData} onUpdate={handleUpdateData} />
          </div>

          <div className="p-4 bg-neutral-900/50 text-[10px] text-neutral-800 text-center font-mono">
            V1.0.4 // SYSTEM_MINIMAL
          </div>
        </div>
      )}

      {/* Main Preview Area */}
      <main className={`flex-1 flex flex-col items-center justify-center p-4 md:p-12 transition-all duration-500 ${!showControls ? 'w-full' : ''}`}>
        {!showControls && (
          <button 
            onClick={() => setShowControls(true)}
            className="fixed top-6 left-6 z-50 bg-neutral-900 border border-neutral-800 p-3 rounded-lg text-xs font-bold uppercase tracking-tighter hover:bg-neutral-800 transition-all hover:scale-105"
          >
            Show Settings
          </button>
        )}

        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="relative group">
            {/* The actual component designed for overlay */}
            <Overlay data={streamData} />
            
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
