
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
  ReferenceLine,
  Scatter
} from 'recharts';
import { PricePoint, Zone } from '../types';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface TradingChartProps {
  data: PricePoint[];
  zones: Zone[];
  symbol: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, zones, symbol }) => {
  const displayData = data.slice(-80);

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={displayData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="1 10" stroke="#1a1a1a" vertical={false} />
          
          <XAxis 
            dataKey="time" 
            stroke="#333" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            minTickGap={50}
          />
          
          <YAxis 
            yAxisId="price"
            domain={['auto', 'auto']} 
            orientation="right" 
            stroke="#444" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(val) => val.toLocaleString()}
          />

          <YAxis 
            yAxisId="volume"
            domain={[0, (data) => Math.max(...displayData.map(d => d.volume)) * 5]} 
            orientation="left" 
            hide={true}
          />

          {/* Supply/Demand Zones */}
          {zones.map((zone, idx) => (
            <ReferenceArea
              key={idx}
              yAxisId="price"
              y1={zone.price * 0.9995}
              y2={zone.price * 1.0005}
              fill={zone.type === 'SUPPLY' ? 'rgba(244, 63, 94, 0.05)' : 'rgba(16, 185, 129, 0.05)'}
              stroke={zone.type === 'SUPPLY' ? '#f43f5e' : '#10b981'}
              strokeOpacity={0.2}
              strokeDasharray="3 3"
            />
          ))}

          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '8px', fontSize: '10px' }}
            cursor={{ stroke: '#333' }}
          />

          <Area 
            yAxisId="price"
            type="monotone" 
            dataKey="price" 
            stroke="#555" 
            strokeWidth={1} 
            fill="url(#colorPrice)" 
            animationDuration={0}
          />

          {/* Strategy Lines */}
          <Line yAxisId="price" dataKey="smaFast" stroke="#3b82f6" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line yAxisId="price" dataKey="smaSlow" stroke="#ef4444" strokeWidth={1} dot={false} isAnimationActive={false} />

          {/* Volume bars */}
          <Bar yAxisId="volume" dataKey="volume" radius={[2, 2, 0, 0]}>
            {displayData.map((entry, index) => (
              <Cell key={index} fill={entry.price > (displayData[index-1]?.price || 0) ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'} />
            ))}
          </Bar>

          {/* Reversal Signals */}
          <Scatter 
            yAxisId="price" 
            data={displayData.filter(d => d.isReversal)} 
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.isReversal === 'BUY') {
                return <circle cx={cx} cy={cy} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />;
              }
              return <circle cx={cx} cy={cy} r={6} fill="#f43f5e" stroke="#fff" strokeWidth={2} />;
            }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingChart;
