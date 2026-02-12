
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Target, BrainCircuit, Activity, 
  BarChart3, ShieldAlert, Zap, Layers, Wallet, ShoppingCart, AlertTriangle, Crosshair 
} from 'lucide-react';
import { ASSETS, TIMEFRAMES } from './constants';
import { AssetData, PricePoint, Timeframe, AnalysisResult, Order, Zone } from './types';
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
  const [logs, setLogs] = useState<string[]>(["[SMC-CORE] Neural Engine Engaged.", "[SYSTEM] Monitoring Liquidity Sweeps..."]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  // SMC Strategy Logic
  const detectReversal = (history: PricePoint[], zones: Zone[]): 'BUY' | 'SELL' | null => {
    if (history.length < 5) return null;
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    
    // Strategy 1: SMA Crossover (Fast crosses Slow)
    const crossUp = prev.smaFast <= prev.smaSlow && last.smaFast > last.smaSlow;
    const crossDown = prev.smaFast >= prev.smaSlow && last.smaFast < last.smaSlow;

    // Strategy 2: SMC Zone Mitigation + RSI/Vol Reversal
    const nearDemand = zones.some(z => z.type === 'DEMAND' && Math.abs(last.price - z.price) / z.price < 0.001);
    const nearSupply = zones.some(z => z.type === 'SUPPLY' && Math.abs(last.price - z.price) / z.price < 0.001);

    if ((crossUp || nearDemand) && last.price > last.smaFast) return 'BUY';
    if ((crossDown || nearSupply) && last.price < last.smaFast) return 'SELL';
    
    return null;
  };

  // Mock engine for real-time tick data simulation with SMC logic
  useEffect(() => {
    const asset = ASSETS.find(a => a.symbol === selectedSymbol);
    if (!asset) return;

    let currentPrice = asset.initial;
    
    // Generate static Demand/Supply Zones
    const zones: Zone[] = [
      { type: 'SUPPLY', price: currentPrice * 1.02, strength: 0.9 },
      { type: 'DEMAND', price: currentPrice * 0.98, strength: 0.85 }
    ];

    const initialHistory: PricePoint[] = Array.from({ length: 150 }).map((_, i) => {
      const p = currentPrice + (Math.random() - 0.5) * (currentPrice * 0.002);
      currentPrice = p;
      return {
        time: new Date(Date.now() - (150 - i) * 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: p,
        ema: p,
        smaFast: p,
        smaSlow: p,
        volume: Math.floor(Math.random() * 10000)
      };
    });

    setAssetData({
      symbol: asset.symbol,
      name: asset.name,
      currentPrice: currentPrice,
      change24h: 0.45,
      history: initialHistory,
      zones: zones
    });

    const interval = setInterval(() => {
      setAssetData(prev => {
        if (!prev) return prev;
        const volatility = selectedSymbol.includes('V75') ? 0.001 : 0.0004;
        const newPrice = prev.currentPrice + (Math.random() - 0.5) * (prev.currentPrice * volatility);
        const lastPoint = prev.history[prev.history.length - 1];
        
        // SMA Calculation
        const fAlpha = 0.2; // 20 period approx
        const sAlpha = 0.05; // 50 period approx
        const newFast = (newPrice * fAlpha) + (lastPoint.smaFast * (1 - fAlpha));
        const newSlow = (newPrice * sAlpha) + (lastPoint.smaSlow * (1 - sAlpha));

        const signal = detectReversal(prev.history, prev.zones);
        if (signal) addLog(`[STRATEGY] Potential ${signal} Signal Detected on ${selectedSymbol}`);

        const newPoint: PricePoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: newPrice,
          ema: newFast,
          smaFast: newFast,
          smaSlow: newSlow,
          volume: Math.floor(Math.random() * 12000),
          isReversal: signal
        };

        // Update existing orders PnL
        setOrders(currentOrders => currentOrders.map(o => {
          if (o.status === 'OPEN') {
            const diff = o.type === 'BUY' ? newPrice - o.entry : o.entry - newPrice;
            const pnl = diff * (o.lots * 100000); // Standard lot sizing
            
            // Auto-Close on SL/TP
            if (o.type === 'BUY' && (newPrice <= o.sl || newPrice >= o.tp)) return { ...o, pnl, status: 'CLOSED' };
            if (o.type === 'SELL' && (newPrice >= o.sl || newPrice <= o.tp)) return { ...o, pnl, status: 'CLOSED' };
            
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
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const executeTrade = (type: 'BUY' | 'SELL') => {
    if (!assetData) return;
    const entry = assetData.currentPrice;
    const isGold = selectedSymbol.includes('XAU');
    const slDist = isGold ? 5.0 : 0.0020;
    const tpDist = isGold ? 15.0 : 0.0060;

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedSymbol,
      type: type,
      entry: entry,
      sl: type === 'BUY' ? entry - slDist : entry + slDist,
      tp: type === 'BUY' ? entry + tpDist : entry - tpDist,
      lots: 0.1,
      pnl: 0,
      status: 'OPEN'
    };

    setOrders(prev => [newOrder, ...prev]);
    addLog(`[ORDER] ${type} position opened at ${entry.toFixed(4)}`);
  };

  const handleAnalyze = useCallback(async () => {
    if (!assetData) return;
    setIsAnalyzing(true);
    const res = await getInstitutionalAnalysis(assetData.name, assetData.currentPrice, matrixTrends);
    setAnalysis(res);
    setIsAnalyzing(false);
  }, [assetData, matrixTrends]);

  const totalPnL = useMemo(() => orders.reduce((acc, o) => acc + o.pnl, 0), [orders]);

  return (
    <div className="flex h-screen bg-[#020202] text-neutral-400 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* SIDEBAR */}
      <aside className="w-[320px] border-r border-white/5 flex flex-col p-6 bg-[#080808] z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Target className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white uppercase leading-none">ALPHA TERMINAL</h1>
            <span className="text-[9px] font-bold text-neutral-600 tracking-[0.3em] uppercase">QUANT ENGINE v7</span>
          </div>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
          <div className="bg-neutral-900/40 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Equity Management</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] text-neutral-600 font-bold uppercase block">Balance</span>
                <span className="text-xl font-black text-white mono">${balance.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-600 font-bold uppercase block">Floating PnL</span>
                <span className={`text-sm font-black mono ${totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <SessionTracker />
          
          <div>
            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-3">High Volatility Universe</label>
            <div className="grid grid-cols-1 gap-2">
              {ASSETS.map(asset => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedSymbol(asset.symbol)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-[11px] transition-all border ${
                    selectedSymbol === asset.symbol 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold">{asset.name}</span>
                  <Activity size={12} className={selectedSymbol === asset.symbol ? 'text-emerald-500' : 'text-neutral-700'} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {isAnalyzing ? <Activity className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
            Run Neural Analysis
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Current Instrument</span>
              <h2 className="text-2xl font-black text-white tracking-tighter">{assetData?.name}</h2>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex gap-4">
              {['15M', '1H', '4H'].map(tf => (
                <div key={tf} className="bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-white/5 flex flex-col items-center">
                  <span className="text-[8px] font-bold text-neutral-600 uppercase">{tf}</span>
                  <span className="text-[10px] font-black text-emerald-500">BULLISH</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => executeTrade('SELL')}
              className="px-8 py-3 bg-rose-600/10 border border-rose-600/40 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg"
            >
              Sell Order
            </button>
            <button 
              onClick={() => executeTrade('BUY')}
              className="px-8 py-3 bg-emerald-600/10 border border-emerald-600/40 text-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg"
            >
              Buy Order
            </button>
          </div>
        </header>

        {/* CHART & SMC GRID */}
        <div className="flex-1 grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 relative flex flex-col shadow-inner overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">SMA Cross-v</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
                  <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">SMC OrderBlocks</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-neutral-500">Live Tick Flow</span>
              </div>
            </div>
            <div className="flex-1">
              {assetData && <TradingChart data={assetData.history} zones={assetData.zones} symbol={assetData.symbol} />}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Live Positions */}
            <div className="bg-neutral-900/20 border border-white/5 rounded-[2.5rem] p-6 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                  <ShoppingCart size={14} /> Live Positions
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {orders.filter(o => o.status === 'OPEN').map(o => (
                  <div key={o.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center group">
                    <div>
                      <span className={`text-[10px] font-black ${o.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{o.type} {o.lots}L</span>
                      <div className="text-[9px] text-neutral-600 mono">{o.symbol} @ {o.entry.toFixed(4)}</div>
                    </div>
                    <span className={`text-xs font-black mono ${o.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {o.pnl >= 0 ? '+' : ''}{o.pnl.toFixed(2)}
                    </span>
                  </div>
                ))}
                {orders.filter(o => o.status === 'OPEN').length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <Crosshair size={32} className="mb-2" />
                    <span className="text-[10px] font-black uppercase">No Active Positions</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signal Alert Panel */}
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="text-rose-500" size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500">Risk Sentinel</h3>
              </div>
              <p className="text-[11px] text-rose-500/70 leading-relaxed font-bold">
                {totalPnL < -200 ? "WARNING: MAX DRAWDOWN REACHED. LIQUIDITY EXHAUSTION DETECTED." : "RISK PARITY STABLE. MONITORING FOR FAIR VALUE GAPS."}
              </p>
            </div>
          </div>
        </div>

        {/* LOGS / SYSTEM FEED */}
        <div className="h-40 bg-[#080808] border border-white/5 rounded-[2.5rem] p-6 flex gap-6">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={12} className="text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Quantum Feed</span>
            </div>
            <div className="flex-1 overflow-y-auto mono text-[9px] text-neutral-600 space-y-1 pr-2 scrollbar-hide">
              {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
          <div className="w-1/3 bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-[10px] font-black text-amber-500 uppercase">Analysis Engine</span>
             </div>
             <p className="text-[10px] text-neutral-500 italic">
               {analysis?.reasoning || "Initiating SMC cross-verification... Confirming HTF bias before suggesting LTF entry."}
             </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
