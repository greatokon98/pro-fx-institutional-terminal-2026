
import React from 'react';
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  Bar,
  Cell
} from 'recharts';
import { PricePoint } from '../types';

interface TradingChartProps {
  data: PricePoint[];
  symbol: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, symbol }) => {
  const displayData = data.slice(-60);

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={displayData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="1 6" stroke="#1f1f1f" vertical={false} />
          
          <XAxis 
            dataKey="time" 
            stroke="#404040" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            minTickGap={40}
          />
          
          <YAxis 
            yAxisId="price"
            domain={['auto', 'auto']} 
            orientation="right" 
            stroke="#404040" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(val) => val.toFixed(4)}
          />

          <YAxis 
            yAxisId="volume"
            domain={[0, (data) => Math.max(...displayData.map(d => d.volume)) * 4]} 
            orientation="left" 
            hide={true}
          />

          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222', 
              borderRadius: '12px',
              fontSize: '10px',
              color: '#fff',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}
            cursor={{ stroke: '#333', strokeWidth: 1 }}
          />

          <Area 
            yAxisId="price"
            type="monotone" 
            dataKey="price" 
            stroke="#10b981" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            animationDuration={300}
          />

          <Line 
            yAxisId="price"
            type="monotone" 
            dataKey="ema" 
            stroke="#3b82f6" 
            strokeWidth={1.5} 
            strokeDasharray="3 3" 
            dot={false}
            isAnimationActive={false}
          />

          <Bar 
            yAxisId="volume"
            dataKey="volume" 
            radius={[2, 2, 0, 0]}
          >
            {displayData.map((entry, index) => {
              const prev = displayData[index - 1];
              const isUp = !prev || entry.price >= prev.price;
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={isUp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'} 
                />
              );
            })}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.02] select-none text-center">
        <h1 className="text-9xl font-black italic tracking-tighter uppercase leading-none">PRO<br/>FX</h1>
      </div>
    </div>
  );
};

export default TradingChart;
