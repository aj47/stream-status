
import React from 'react';
import { StreamData, TaskStatus } from '../types';

interface OverlayProps {
  data: StreamData;
}

export const Overlay: React.FC<OverlayProps> = ({ data }) => {
  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return { color: 'text-emerald-400', icon: '✓', bg: 'bg-emerald-500' };
      case 'building':
        return { color: 'text-amber-400', icon: '▸', bg: 'bg-amber-500', pulse: true };
      case 'todo':
        return { color: 'text-neutral-500', icon: '○', bg: 'bg-neutral-600' };
    }
  };

  const activeTask = data.tasks.find(t => t.status === 'building');

  return (
    <div className="w-fit min-w-[400px] bg-black/90 backdrop-blur-md border-2 border-white/10 rounded-xl overflow-hidden shadow-2xl font-mono">
      {/* Task List */}
      <div className="p-6 space-y-3">
        {data.tasks.map((task, i) => {
          const style = getStatusStyle(task.status);
          return (
            <div
              key={i}
              className={`flex items-center gap-4 ${task.status === 'done' ? 'opacity-50' : ''}`}
            >
              <span className={`text-xl w-8 ${style.color} ${style.pulse ? 'animate-pulse' : ''}`}>
                {style.icon}
              </span>
              <span className={`text-[22px] ${task.status === 'building' ? 'text-white' : 'text-neutral-400'} ${task.status === 'done' ? 'line-through' : ''}`}>
                {task.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-base text-neutral-600 uppercase tracking-widest">sys.tasks</span>
        {activeTask && (
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span className="text-base text-amber-400/70 uppercase">building</span>
          </div>
        )}
      </div>
    </div>
  );
};
