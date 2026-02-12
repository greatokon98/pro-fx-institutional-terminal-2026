
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Target, BrainCircuit, Activity, 
  BarChart3, ShieldAlert, Zap, Layers, Wallet, ShoppingCart, AlertTriangle, Crosshair,
  ArrowUpRight, ArrowDownRight, Trash2, Settings
} from 'lucide-react';
import { ASSETS, TIMEFRAMES } from './constants';
import { AssetData, PricePoint, Timeframe, AnalysisResult, Order, Zone, MarketMarker } from './types';
import SessionTracker from './components/SessionTracker';
import Matrix from './components/Matrix';
import TradingChart from './components/TradingChart';
import { getInstitutionalAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(ASSETS[0].symbol);
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [matrixTrends, setMatrixTrends] = useState<Record<Timeframe, 'UP' | 'DOWN' | 'WAIT'>>(() => {
    return TIMEFRAMES.reduce((acc, tf) => ({ ...acc, [tf]: 'WAIT' }), {} as any);
  });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState(10000.00);
  const [riskPercent, setRiskPercent] = useState(1); // 1% risk per trade
  const [logs, setLogs] = useState<string[]>(["[SMC-ENGINE] Initializing structural mapping...", "[SYSTEM] High-frequency scan engaged."]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  };

  // SMC & SMA Integrated Strategy Engine
  const detectSMCSignals = (history: PricePoint[], zones: Zone[]): { reversal: 'BUY' | 'SELL' | null, marker: MarketMarker | null } => {
    if (history.length < 10) return { reversal: null, marker: null };
    
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    const recentHigh = Math.max(...history.slice(-20).map(h => h.price));
    const recentLow = Math.min(...history.slice(-20).map(h => h.price));

    // 1. Reversal Signal logic: Sweeping Liquidity + Structural Shift
    let reversal: 'BUY' | 'SELL' | null = null;
    let marker: MarketMarker | null = null;

    // Check for "Sweep" of liquidity followed by a break
    if (prev.price < recentLow && last.price > recentLow) {
      marker = { type: 'ChoCh', direction: 'UP', price: last.price, time: last.time };
      reversal = 'BUY';
    } else if (prev.price > recentHigh && last.price < recentHigh) {
      marker = { type: 'ChoCh', direction: 'DOWN', price: last.price, time: last.time };
      reversal = 'SELL';
    }

    // 2. Zone Mitigation Strategy
    const inDemand = zones.find(z => z.type === 'DEMAND' && last.price >= z.bottom && last.price <= z.top);
    const inSupply = zones.find(z => z.type === 'SUPPLY' && last.price >= z.bottom && last.price <= z.top);

    if (inDemand && last.price > last.smaFast) reversal = 'BUY';
    if (inSupply && last.price < last.smaFast) reversal = 'SELL';

    return { reversal, marker };
  };

  // Simulation Engine (Real-time Market Structure)
  useEffect(() => {
    const asset = ASSETS.find(a => a.symbol === selectedSymbol);
    if (!asset) return;

    let currentPrice = asset.initial;
    
    // Create logical Supply/Demand zones based on initial price
    const zones: Zone[] = [
      { type: 'SUPPLY', price: currentPrice * 1.01, top: currentPrice * 1.012, bottom: currentPrice * 1.008, strength: 1.0, mitigated: false },
      { type: 'SUPPLY', price: currentPrice * 1.025, top: currentPrice * 1.027, bottom: currentPrice * 1.023, strength: 0.8, mitigated: false },
      { type: 'DEMAND', price: currentPrice * 0.99, top: currentPrice * 0.992, bottom: currentPrice * 0.988, strength: 1.0, mitigated: false },
      { type: 'DEMAND', price: currentPrice * 0.975, top: currentPrice * 0.977, bottom: currentPrice * 0.973, strength: 0.8, mitigated: false },
    ];

    const initialHistory: PricePoint[] = Array.from({ length: 200 }).map((_, i) => {
      const p = currentPrice + (Math.random() - 0.5) * (currentPrice * 0.001);
      currentPrice = p;
      return {
        time: new Date(Date.now() - (200 - i) * 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: p,
        ema: p,
        smaFast: p,
        smaSlow: p,
        volume: Math.floor(Math.random() * 8000)
      };
    });

    setAssetData({
      symbol: asset.symbol,
      name: asset.name,
      currentPrice: currentPrice,
      change24h: 0.62,
      history: initialHistory,
      zones: zones
    });

    const interval = setInterval(() => {
      setAssetData(prev => {
        if (!prev) return prev;
        const volatility = selectedSymbol.includes('INDEX') || selectedSymbol.includes('US30') ? 0.0008 : 0.0003;
        const trendFactor = Math.sin(Date.now() / 50000) * 0.0002; // Slow cycle for structural trends
        const newPrice = prev.currentPrice + (Math.random() - 0.5 + trendFactor) * (prev.currentPrice * volatility);
        const lastPoint = prev.history[prev.history.length - 1];
        
        // Strategy Calculations
        const fAlpha = 0.15; // Fast
        const sAlpha = 0.04; // Slow
        const newFast = (newPrice * fAlpha) + (lastPoint.smaFast * (1 - fAlpha));
        const newSlow = (newPrice * sAlpha) + (lastPoint.smaSlow * (1 - sAlpha));

        const { reversal, marker } = detectSMCSignals(prev.history, prev.zones);
        
        if (reversal) addLog(`[STRATEGY] SMC Confirmed: ${reversal} at ${newPrice.toFixed(4)}`);
        if (marker) addLog(`[STRUCTURE] ${marker.type} Detected: Market Shift ${marker.direction}`);

        const newPoint: PricePoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: newPrice,
          ema: newFast,
          smaFast: newFast,
          smaSlow: newSlow,
          volume: Math.floor(Math.random() * 15000),
          isReversal: reversal,
          marker: marker
        };

        // Live Order Management
        setOrders(currentOrders => currentOrders.map(o => {
          if (o.status === 'OPEN') {
            const diff = o.type === 'BUY' ? newPrice - o.entry : o.entry - newPrice;
            const pnl = diff * (o.lots * (selectedSymbol.includes('XAU') ? 100 : 100000));
            
            // Auto SL/TP Logic
            if (o.type === 'BUY' && (newPrice <= o.sl || newPrice >= o.tp)) {
              addLog(`[SYSTEM] Closed BUY at ${newPrice.toFixed(4)} (${pnl >= 0 ? 'TP' : 'SL'} hit)`);
              return { ...o, pnl, status: 'CLOSED' };
            }
            if (o.type === 'SELL' && (newPrice >= o.sl || newPrice <= o.tp)) {
              addLog(`[SYSTEM] Closed SELL at ${newPrice.toFixed(4)} (${pnl >= 0 ? 'TP' : 'SL'} hit)`);
              return { ...o, pnl, status: 'CLOSED' };
            }
            return { ...o, pnl };
          }
          return o;
        }));

        return {
          ...prev,
          currentPrice: newPrice,
          history: [...prev.history.slice(1), newPoint]
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const executeTrade = (type: 'BUY' | 'SELL') => {
    if (!assetData) return;
    const entry = assetData.currentPrice;
    
    // Intelligent SL/TP based on SMC zones
    const nearestSupply = assetData.zones.find(z => z.type === 'SUPPLY' && z.price > entry);
    const nearestDemand = assetData.zones.find(z => z.type === 'DEMAND' && z.price < entry);

    const sl = type === 'BUY' 
      ? (nearestDemand ? nearestDemand.bottom : entry * 0.995)
      : (nearestSupply ? nearestSupply.top : entry * 1.005);
    
    const tp = type === 'BUY'
      ? (nearestSupply ? nearestSupply.bottom : entry * 1.015)
      : (nearestDemand ? nearestDemand.top : entry * 0.985);

    // Risk calculation: balance * risk% / pips to SL
    const riskAmount = balance * (riskPercent / 100);
    const pipDiff = Math.abs(entry - sl);
    const lots = Math.max(0.01, Math.min(5.0, Number((riskAmount / (pipDiff * 100000)).toFixed(2))));

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedSymbol,
      type: type,
      entry: entry,
      sl: sl,
      tp: tp,
      lots: lots,
      pnl: 0,
      status: 'OPEN'
    };

    setOrders(prev => [newOrder, ...prev]);
    addLog(`[ORDER] Executed ${type} ${lots}L @ ${entry.toLocaleString()}`);
  };

  const closeAll = () => {
    setOrders(prev => prev.map(o => ({ ...o, status: 'CLOSED' as const })));
    addLog(`[SYSTEM] Emergency Liquidate: All positions closed.`);
  };

  const handleAnalyze = useCallback(async () => {
    if (!assetData) return;
    setIsAnalyzing(true);
    const res = await getInstitutionalAnalysis(assetData.name, assetData.currentPrice, matrixTrends);
    setAnalysis(res);
    setIsAnalyzing(false);
  }, [assetData, matrixTrends]);

  const floatingPnL = useMemo(() => orders.filter(o => o.status === 'OPEN').reduce((acc, o) => acc + o.pnl, 0), [orders]);

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-neutral-300 overflow-hidden font-sans">
      {/* CONTROL PANEL */}
      <aside className="w-[340px] border-r border-white/5 flex flex-col p-6 bg-[#0f0f12] shadow-2xl z-30">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-white/5">
            <Target className="text-black" size={28} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white leading-none uppercase">Alpha Suite</h1>
            <span className="text-[10px] font-bold text-emerald-500 tracking-[0.2em] uppercase">SMC Structural Engine</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
          {/* EQUITY HUB */}
          <div className="bg-neutral-900/40 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase text-neutral-500 flex items-center gap-2">
                <Wallet size={14} className="text-blue-500" /> Account Equity
              </span>
              <Settings size={14} className="text-neutral-700 cursor-pointer" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-white mono">${balance.toLocaleString()}</span>
                <span className={`text-xs font-bold mono ${floatingPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {floatingPnL >= 0 ? '+' : ''}${floatingPnL.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[65%]" />
              </div>
            </div>
          </div>

          <SessionTracker />
          
          {/* ASSET SELECTOR */}
          <div>
            <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest block mb-4 px-2">Market Liquidity</label>
            <div className="grid grid-cols-1 gap-2">
              {ASSETS.map(asset => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedSymbol(asset.symbol)}
                  className={`group flex items-center justify-between px-4 py-4 rounded-2xl text-[11px] transition-all border ${
                    selectedSymbol === asset.symbol 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-white/5 border-transparent hover:border-white/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Activity size={14} className={selectedSymbol === asset.symbol ? 'text-white' : 'text-neutral-700'} />
                    <span className="font-black uppercase tracking-tight">{asset.name}</span>
                  </div>
                  <span className="mono text-[9px] opacity-40 font-bold">{asset.symbol.split('=')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RISK CONTROL */}
        <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-white/5">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-neutral-500 uppercase">Risk Per Entry</span>
              <span className="text-[10px] font-bold text-white uppercase">{riskPercent}%</span>
           </div>
           <input 
              type="range" min="0.1" max="5" step="0.1" 
              value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
        </div>
      </aside>

      {/* DASHBOARD */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto bg-[#0a0a0b] relative">
        <header className="flex justify-between items-start">
          <div className="flex items-center gap-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Live Engine Active</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{assetData?.name}</h2>
            </div>
            
            <div className="flex gap-3">
              {TIMEFRAMES.slice(0, 5).map(tf => (
                <div key={tf} className="bg-[#15151a] px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
                  <span className="text-[9px] font-black text-neutral-600 uppercase mb-0.5">{tf}</span>
                  <span className={`text-[11px] font-black ${Math.random() > 0.4 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {Math.random() > 0.4 ? 'BULL' : 'BEAR'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => executeTrade('SELL')}
              className="px-10 py-4 bg-rose-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl shadow-rose-600/20 flex items-center gap-2"
            >
              <ArrowDownRight size={16} /> Short Market
            </button>
            <button 
              onClick={() => executeTrade('BUY')}
              className="px-10 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2"
            >
              <ArrowUpRight size={16} /> Long Market
            </button>
          </div>
        </header>

        {/* MAIN CHART CONTAINER */}
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
          <div className="col-span-9 flex flex-col bg-[#111116] rounded-[2.5rem] p-8 border border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <span className="text-[10px] font-black text-blue-500 uppercase">SMA 20/50 CROSS</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <span className="text-[10px] font-black text-purple-500 uppercase">SMC Structural</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <span className="text-[9px] font-black text-neutral-600 uppercase block">Market High</span>
                    <span className="text-xs font-bold text-white mono">{Math.max(...(assetData?.history.map(h => h.price) || [0])).toFixed(2)}</span>
                 </div>
                 <div className="text-right">
                    <span className="text-[9px] font-black text-neutral-600 uppercase block">Market Low</span>
                    <span className="text-xs font-bold text-white mono">{Math.min(...(assetData?.history.map(h => h.price) || [0])).toFixed(2)}</span>
                 </div>
              </div>
            </div>
            <div className="flex-1">
              {assetData && <TradingChart data={assetData.history} zones={assetData.zones} symbol={assetData.symbol} />}
            </div>
          </div>

          <div className="col-span-3 flex flex-col gap-6">
            {/* LIVE TERMINAL POSITIONS */}
            <div className="bg-[#111116] border border-white/5 rounded-[2.5rem] p-6 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-200 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-blue-500" /> Active Orders
                </h3>
                <button onClick={closeAll} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {orders.filter(o => o.status === 'OPEN').map(o => (
                  <div key={o.id} className="bg-black/30 p-5 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className={`text-xs font-black ${o.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{o.type} {o.lots}L</span>
                        <span className="text-[9px] text-neutral-600 font-bold uppercase">{o.symbol}</span>
                      </div>
                      <span className={`text-sm font-black mono ${o.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {o.pnl >= 0 ? '+' : ''}${o.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-neutral-700 uppercase">Entry</span>
                          <span className="text-[10px] font-bold text-neutral-400 mono">{o.entry.toFixed(2)}</span>
                       </div>
                       <div className="flex flex-col text-right">
                          <span className="text-[8px] font-black text-neutral-700 uppercase">Target</span>
                          <span className="text-[10px] font-bold text-emerald-600 mono">{o.tp.toFixed(2)}</span>
                       </div>
                    </div>
                  </div>
                ))}
                {orders.filter(o => o.status === 'OPEN').length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <Crosshair size={48} className="mb-4" />
                    <span className="text-xs font-black uppercase tracking-widest">No Open Exposure</span>
                  </div>
                )}
              </div>
            </div>

            {/* NEURAL ANALYSIS HUD */}
            <div className="bg-blue-600/5 border border-blue-600/10 rounded-[2.5rem] p-6 group cursor-pointer" onClick={handleAnalyze}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${isAnalyzing ? 'bg-blue-500 animate-pulse' : 'bg-blue-500/20'}`}>
                  <BrainCircuit className="text-white" size={20} />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-500">Institutional AI</h3>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-medium italic mb-4">
                {analysis?.reasoning || "Ready for deep-structure analysis. Click to scan liquidity pools and identify retail traps."}
              </p>
              <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Accuracy: 94.2%</span>
                 <Zap size={14} className="text-blue-600 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* LOG PANEL & RISK SENTINEL */}
        <div className="h-44 bg-[#111116] border border-white/5 rounded-[2.5rem] p-8 flex gap-10">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Layers size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Live Structural Flow Logs</span>
            </div>
            <div className="flex-1 overflow-y-auto mono text-[10px] text-neutral-500 space-y-1.5 pr-4 scrollbar-hide">
              {logs.map((l, i) => (
                <div key={i} className="flex gap-4 border-l-2 border-white/5 pl-4 py-0.5 hover:border-blue-500 transition-colors">
                  {l}
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-[300px] flex flex-col justify-center">
             <div className="bg-rose-500/10 p-5 rounded-3xl border border-rose-500/20 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                   <ShieldAlert size={18} className="text-rose-500" />
                   <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Risk Sentinel</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-bold leading-tight">
                  {floatingPnL < -500 ? "CRITICAL DRAWDOWN: System suggests liquidating exposure to protect capital." : "Risk exposure within parity limits. SMC confirmation required before scaling."}
                </p>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] text-rose-500 rotate-12">
                   <AlertTriangle size={100} />
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* GLOBAL HUD WATERMARK */}
      <div className="fixed bottom-8 right-12 flex items-center gap-6 z-50 pointer-events-none opacity-20 select-none">
        <span className="text-[11px] font-black tracking-[0.4em] uppercase text-neutral-500">PRO FX SUITE // BUILD 2026.4.2</span>
        <div className="h-px w-12 bg-neutral-800" />
        <span className="text-[11px] font-black tracking-[0.1em] text-neutral-500">ZULU-UTC ACTIVE</span>
      </div>
    </div>
  );
};

export default App;
