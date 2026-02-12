
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
  Cell,
  ReferenceArea,
  Scatter
} from 'recharts';
import { PricePoint, Zone } from '../types';

interface TradingChartProps {
  data: PricePoint[];
  zones: Zone[];
  symbol: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, zones, symbol }) => {
  const displayData = data.slice(-100);

  return (
    <div className="w-full h-full relative bg-white rounded-2xl overflow-hidden shadow-inner border border-neutral-200">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={true} />
          
          <XAxis 
            dataKey="time" 
            stroke="#999" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            minTickGap={40}
          />
          
          <YAxis 
            yAxisId="price"
            domain={['auto', 'auto']} 
            orientation="right" 
            stroke="#666" 
            fontSize={10} 
            tickLine={true} 
            axisLine={false}
            tickFormatter={(val) => val.toLocaleString()}
          />

          <YAxis 
            yAxisId="volume"
            domain={[0, (data) => Math.max(...displayData.map(d => d.volume)) * 4]} 
            orientation="left" 
            hide={true}
          />

          {/* Institutional Zones: Supply (Red) and Demand (Green) */}
          {zones.map((zone, idx) => (
            <ReferenceArea
              key={idx}
              yAxisId="price"
              y1={zone.bottom}
              y2={zone.top}
              fill={zone.type === 'SUPPLY' ? '#fee2e2' : '#dcfce7'}
              stroke={zone.type === 'SUPPLY' ? '#ef4444' : '#22c55e'}
              strokeOpacity={0.3}
              strokeDasharray="4 4"
            />
          ))}

          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', fontSize: '11px', color: '#000' }}
            itemStyle={{ color: '#333' }}
            cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '5 5' }}
          />

          {/* Main Price Action */}
          <Area 
            yAxisId="price"
            type="monotone" 
            dataKey="price" 
            stroke="#2563eb" 
            strokeWidth={2} 
            fill="url(#colorPrice)" 
            animationDuration={0}
          />

          {/* SMA Strategies */}
          <Line yAxisId="price" dataKey="smaFast" stroke="#3b82f6" strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.6} />
          <Line yAxisId="price" dataKey="smaSlow" stroke="#f43f5e" strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.6} />

          {/* Market Structure Markers (BoS / ChoCh) */}
          <Scatter 
            yAxisId="price" 
            data={displayData.filter(d => d.marker)} 
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              if (!payload || !payload.marker) return <circle />;
              const marker = payload.marker;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={4} fill={marker.type === 'ChoCh' ? '#8b5cf6' : '#2563eb'} />
                  <text x={cx} y={cy - 10} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#000">
                    {marker.type}
                  </text>
                </g>
              );
            }} 
          />

          {/* Volume Delta */}
          <Bar yAxisId="volume" dataKey="volume" radius={[2, 2, 0, 0]}>
            {displayData.map((entry, index) => {
              const isUp = entry.price > (displayData[index-1]?.price || 0);
              return <Cell key={index} fill={isUp ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'} />;
            })}
          </Bar>

          {/* Reversal Indicator Arrows */}
          <Scatter 
            yAxisId="price" 
            data={displayData.filter(d => d.isReversal)} 
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              if (!payload || !payload.isReversal) return <path />;
              const isBuy = payload.isReversal === 'BUY';
              return (
                <path 
                  d={isBuy ? "M0 -10 L10 10 L-10 10 Z" : "M0 10 L10 -10 L-10 -10 Z"} 
                  transform={`translate(${cx}, ${isBuy ? cy + 15 : cy - 15})`} 
                  fill={isBuy ? '#22c55e' : '#ef4444'} 
                  stroke="#fff" 
                  strokeWidth={1}
                />
              );
            }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Watermark for Institutional Grade */}
      <div className="absolute top-4 left-6 pointer-events-none opacity-20">
        <span className="text-xs font-black tracking-widest text-neutral-400 uppercase">SMC Structural Flow Engine</span>
      </div>
    </div>
  );
};

export default TradingChart;
