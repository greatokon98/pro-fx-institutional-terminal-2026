
import React, { useState, useEffect } from 'react';
import { SESSIONS } from '../constants';

const SessionTracker: React.FC = () => {
  const [utcTime, setUtcTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WAT is UTC + 1
  const getWATTime = () => {
    const wat = new Date(utcTime.getTime() + (1 * 60 * 60 * 1000));
    return wat.toISOString().substr(11, 8);
  };

  const isSessionOpen = (start: string, end: string) => {
    const currentHour = utcTime.getUTCHours();
    const [startH] = start.split(':').map(Number);
    const [endH] = end.split(':').map(Number);
    
    if (startH < endH) {
      return currentHour >= startH && currentHour < endH;
    } else {
      return currentHour >= startH || currentHour < endH;
    }
  };

  return (
    <div className="bg-neutral-900/40 p-4 rounded-2xl border border-white/5 space-y-4 backdrop-blur-md">
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Global Time Protocols</h3>
        <div className="grid grid-cols-1 gap-1">
          <div className="flex justify-between items-center bg-black/60 px-3 py-2 rounded-lg border border-white/5">
            <span className="text-[9px] mono text-neutral-500 font-bold uppercase">WAT (NGN)</span>
            <span className="text-sm mono text-emerald-400 font-black tracking-wider">{getWATTime()}</span>
          </div>
          <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-[9px] mono text-neutral-600 font-bold uppercase">UTC (ZULU)</span>
            <span className="text-xs mono text-blue-500/80 font-bold tracking-wider">{utcTime.toISOString().substr(11, 8)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-white/5">
        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Liquidity Windows</h3>
        {SESSIONS.map((session) => {
          const open = isSessionOpen(session.start, session.end);
          return (
            <div key={session.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-neutral-800'}`} />
                <span className={`text-[10px] font-bold tracking-tight transition-colors ${open ? 'text-neutral-200' : 'text-neutral-600'}`}>
                  {session.name.toUpperCase()}
                </span>
              </div>
              <span className={`text-[9px] mono transition-colors ${open ? 'text-neutral-400' : 'text-neutral-700'}`}>
                {session.start}-{session.end}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionTracker;
