
import React, { useState, useEffect } from 'react';
import { StreamData } from '../types';

interface ControlPanelProps {
  data: StreamData;
  onUpdate: (data: StreamData) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ data, onUpdate }) => {
  const [jsonInput, setJsonInput] = useState(JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJsonInput(JSON.stringify(data, null, 2));
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      // Basic validation
      if (parsed && typeof parsed === 'object') {
        onUpdate(parsed);
        setError(null);
      }
    } catch (err: any) {
      setError("Invalid JSON: " + err.message);
    }
  };

  const copyTemplate = () => {
    const template: StreamData = {
      status: "LIVE",
      project: "Building New Feature",
      tech: ["Rust", "WASM", "Next.js"],
      message: "Hardcore coding session! Come say hi.",
      viewers: 99
    };
    const str = JSON.stringify(template, null, 2);
    setJsonInput(str);
    onUpdate(template);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Update State (JSON)</label>
          <button 
            onClick={copyTemplate}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-mono"
          >
            [LOAD TEMPLATE]
          </button>
        </div>
        
        <div className="relative group">
          <textarea
            value={jsonInput}
            onChange={handleInputChange}
            className={`w-full h-64 bg-neutral-900/50 border ${error ? 'border-red-500' : 'border-neutral-800'} rounded-lg p-4 font-mono text-sm text-neutral-300 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none transition-all`}
            spellCheck={false}
          />
          <div className="absolute bottom-4 right-4 text-[10px] text-neutral-600 font-mono pointer-events-none uppercase">
            {error ? 'Parse Error' : 'JSON Valid'}
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-[10px] text-red-400 font-mono">
            {error}
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-neutral-800 space-y-4">
        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Usage Tips</h3>
        <ul className="text-[10px] text-neutral-400 space-y-2 font-mono">
          <li>• Copy the window URL into OBS Browser Source</li>
          <li>• Set background to transparent in OBS</li>
          <li>• Paste JSON above for instant updates</li>
          <li>• Use "Hide Panel" for a clean preview</li>
        </ul>
      </div>
    </div>
  );
};
