
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
      tasks: [
        { name: "Setup project", status: "done" },
        { name: "Build core feature", status: "building" },
        { name: "Write tests", status: "todo" },
        { name: "Deploy", status: "todo" }
      ]
    };
    const str = JSON.stringify(template, null, 2);
    setJsonInput(str);
    onUpdate(template);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tasks (JSON)</label>
          <button
            onClick={copyTemplate}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-mono"
          >
            [TEMPLATE]
          </button>
        </div>

        <div className="relative group">
          <textarea
            value={jsonInput}
            onChange={handleInputChange}
            className={`w-full h-48 bg-neutral-900/50 border ${error ? 'border-red-500' : 'border-neutral-800'} rounded-lg p-4 font-mono text-[11px] text-neutral-300 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none transition-all`}
            spellCheck={false}
          />
          <div className="absolute bottom-3 right-3 text-[9px] text-neutral-600 font-mono pointer-events-none uppercase">
            {error ? '✗ error' : '✓ valid'}
          </div>
        </div>

        {error && (
          <div className="p-2 bg-red-950/30 border border-red-900/50 rounded text-[9px] text-red-400 font-mono">
            {error}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-neutral-800 space-y-2">
        <h3 className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Status types</h3>
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="text-emerald-400">done ✓</span>
          <span className="text-amber-400">building ▸</span>
          <span className="text-neutral-500">todo ○</span>
        </div>
      </div>
    </div>
  );
};
