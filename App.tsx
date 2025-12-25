
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Overlay } from './components/Overlay';
import { ControlPanel } from './components/ControlPanel';
import { StreamData, INITIAL_DATA } from './types';

const API_URL = '/api/config';
const SSE_URL = '/api/stream';

// Hook to get current path and listen for changes
const useRoute = () => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return path;
};

// Hook to manage synced stream data via server API + SSE
const useSyncedStreamData = (isStatusPage: boolean = false) => {
  const [streamData, setStreamData] = useState<StreamData>(INITIAL_DATA);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE for real-time updates
    const connectSSE = () => {
      eventSourceRef.current = new EventSource(SSE_URL);

      eventSourceRef.current.onopen = () => {
        setIsConnected(true);
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStreamData(data);
        } catch (e) {
          console.error('Failed to parse SSE data', e);
        }
      };

      eventSourceRef.current.onerror = () => {
        setIsConnected(false);
        eventSourceRef.current?.close();
        // Reconnect after 2 seconds
        setTimeout(connectSSE, 2000);
      };
    };

    connectSSE();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  // Function to update data via API (broadcasts to all clients via SSE)
  const updateData = useCallback(async (newData: StreamData) => {
    // Optimistically update local state
    setStreamData(newData);

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    } catch (e) {
      console.error('Failed to update config', e);
    }
  }, []);

  return { streamData, updateData, isConnected };
};

// Status-only page component (for OBS browser source)
const StatusPage: React.FC = () => {
  const { streamData } = useSyncedStreamData();

  useEffect(() => {
    // Set transparent background for OBS
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
  }, []);

  return (
    <div className="min-h-screen flex items-start justify-start p-4 bg-transparent">
      <Overlay data={streamData} />
    </div>
  );
};

// Main control panel page
const MainPage: React.FC = () => {
  const { streamData, updateData } = useSyncedStreamData();
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-purple-500 rounded-full blur-[100px]" />
      </div>

      {/* Control Panel */}
      {showControls && (
        <div className="w-full md:w-[400px] border-b md:border-b-0 md:border-r border-neutral-800 bg-black/60 backdrop-blur-xl z-20 flex flex-col h-screen">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
            <a
              href="/status"
              target="_blank"
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest font-bold"
            >
              Open /status →
            </a>
            <button
              onClick={() => setShowControls(false)}
              className="text-xs text-neutral-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
            >
              Hide Panel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <ControlPanel data={streamData} onUpdate={updateData} />
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
            <Overlay data={streamData} />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const path = useRoute();

  if (path === '/status') {
    return <StatusPage />;
  }

  return <MainPage />;
};

export default App;
