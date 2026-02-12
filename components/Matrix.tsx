
import React from 'react';
import { TIMEFRAMES } from '../constants';
import { Timeframe } from '../types';

interface MatrixProps {
  trends: Record<Timeframe, 'UP' | 'DOWN' | 'WAIT'>;
}

const Matrix: React.FC<MatrixProps> = ({ trends }) => {
  return (
    <div className="bg-neutral-900/50 p-4 rounded-xl border border-white/5">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">MTM Matrix</h3>
      <div className="grid grid-cols-2 gap-2">
        {TIMEFRAMES.map((tf) => (
          <div key={tf} className="flex items-center justify-between bg-black/40 p-2 rounded border border-white/5">
            <span className="text-[10px] mono font-bold text-neutral-500">{tf}</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold ${
                trends[tf] === 'UP' ? 'text-emerald-500' : trends[tf] === 'DOWN' ? 'text-rose-500' : 'text-neutral-500'
              }`}>
                {trends[tf]}
              </span>
              <div className={`w-2 h-2 rounded-sm ${
                trends[tf] === 'UP' ? 'bg-emerald-500/50' : trends[tf] === 'DOWN' ? 'bg-rose-500/50' : 'bg-neutral-800'
              }`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Matrix;
