
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Target, BrainCircuit, Activity, BarChart3, ShieldAlert, Zap, Layers } from 'lucide-react';
import { ASSETS, TIMEFRAMES } from './constants';
import { AssetData, PricePoint, Timeframe, AnalysisResult } from './types';
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
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Engine v4.2.0 initialized.", "[SYSTEM] Awaiting market feed..."]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  // Mock engine for real-time tick data simulation
  useEffect(() => {
    const asset = ASSETS.find(a => a.symbol === selectedSymbol);
    if (!asset) return;

    let currentPrice = asset.initial;
    const initialHistory: PricePoint[] = Array.from({ length: 120 }).map((_, i) => {
      const p = currentPrice + (Math.random() - 0.5) * (currentPrice * 0.001);
      const v = Math.floor(Math.random() * 6000) + 1000;
      currentPrice = p;
      return {
        time: new Date(Date.now() - (120 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: p,
        ema: p,
        volume: v
      };
    });

    setAssetData({
      symbol: asset.symbol,
      name: asset.name,
      currentPrice: currentPrice,
      change24h: 0.28,
      history: initialHistory
    });

    const interval = setInterval(() => {
      setAssetData(prev => {
        if (!prev) return prev;
        const vol = 0.0004;
        const newPrice = prev.currentPrice + (Math.random() - 0.5) * (prev.currentPrice * vol);
        const newVolume = Math.floor(Math.random() * 9000) + 500;
        const lastPoint = prev.history[prev.history.length - 1];
        
        const alpha = 0.15;
        const newEma = (newPrice * alpha) + (lastPoint.ema * (1 - alpha));

        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: newPrice,
          ema: newEma,
          volume: newVolume
        };

        return {
          ...prev,
          currentPrice: newPrice,
          history: [...prev.history.slice(1), newPoint]
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Confluence engine for timeframe matrix
  useEffect(() => {
    if (!assetData) return;
    const last = assetData.history[assetData.history.length - 1];
    const isUp = last.price > last.ema;
    
    setMatrixTrends(prev => {
      const next = { ...prev };
      TIMEFRAMES.forEach(tf => {
        const roll = Math.random();
        next[tf] = roll > 0.15 ? (isUp ? 'UP' : 'DOWN') : (roll < 0.05 ? (isUp ? 'DOWN' : 'UP') : 'WAIT');
      });
      return next;
    });
  }, [assetData]);

  const handleAnalyze = useCallback(async () => {
    if (!assetData) return;
    setIsAnalyzing(true);
    addLog(`Decrypting ${assetData.name} institutional footprint...`);
    
    const res = await getInstitutionalAnalysis(
      assetData.name, 
      assetData.currentPrice, 
      matrixTrends
    );
    
    setAnalysis(res);
    setIsAnalyzing(false);
    addLog(`Neural scan locked: ${res.bias} confirmed.`);
  }, [assetData, matrixTrends]);

  return (
    <div className="flex h-screen bg-[#050505] text-neutral-300 overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* NAVIGATION SIDEBAR */}
      <aside className="w-[300px] border-r border-white/5 flex flex-col p-5 bg-[#0a0a0a]/90 backdrop-blur-2xl z-20 shadow-2xl">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Zap className="text-white" size={22} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase leading-none text-white">TERMINAL</h1>
            <span className="text-[9px] font-bold text-emerald-500 tracking-[0.3em] uppercase">INSTITUTIONAL v4</span>
          </div>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          <div>
            <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-3 px-2">Watchlist Matrix</label>
            <div className="space-y-1.5">
              {ASSETS.map(asset => (
                <button
                  key={asset.symbol}
                  onClick={() => {
                    setSelectedSymbol(asset.symbol);
                    setAnalysis(null);
                    addLog(`Switched to ${asset.name} feed.`);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all border flex items-center justify-between ${
                    selectedSymbol === asset.symbol 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-inner shadow-emerald-500/5' 
                    : 'bg-transparent border-transparent text-neutral-500 hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold tracking-tight">{asset.name}</span>
                  <span className="mono text-[9px] opacity-40">{asset.symbol.split('=')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <SessionTracker />
          <Matrix trends={matrixTrends} />

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black tracking-widest transition-all shadow-2xl active:scale-[0.97] group border ${
              isAnalyzing 
                ? 'bg-neutral-900 border-white/5 text-neutral-600 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-emerald-500 hover:text-white border-white/10'
            }`}
          >
            {isAnalyzing ? <Activity className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
            {isAnalyzing ? 'DECRYPTING ORDERFLOW' : 'EXECUTE NEURAL SCAN'}
          </button>
        </div>

        {/* FEED LOG */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3 px-2">
            <Layers size={12} className="text-blue-500" />
            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Live Engine Feed</span>
          </div>
          <div className="bg-black/60 p-3 rounded-xl h-28 overflow-y-auto mono text-[9px] text-neutral-500 border border-white/5 space-y-1 scrollbar-hide">
            {logs.map((log, i) => (
              <div key={i} className="leading-relaxed border-l border-white/10 pl-2">{log}</div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN COMMAND CENTER */}
      <main className="flex-1 flex flex-col p-8 bg-[#050505] relative overflow-y-auto">
        {/* TOP HUD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-neutral-900/20 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-sm">
            <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block mb-1.5">Live Market Price</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black mono tracking-tighter text-white">
                {assetData?.currentPrice.toFixed(selectedSymbol.includes('JPY') ? 3 : 5)}
              </span>
              <span className={`text-xs font-bold ${assetData && assetData.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {assetData && assetData.change24h >= 0 ? '▲' : '▼'} {assetData?.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div className="bg-neutral-900/20 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-sm">
            <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block mb-1.5">Sentiment Confluence</span>
            <div className="flex items-center gap-4">
              <span className={`text-3xl font-black ${
                (analysis?.score || 0) > 0 ? 'text-emerald-500' : (analysis?.score || 0) < 0 ? 'text-rose-500' : 'text-neutral-600'
              }`}>{analysis?.score !== undefined ? (analysis.score > 0 ? `+${analysis.score}` : analysis.score) : '--'}</span>
              <div className="flex-1 h-1.5 bg-neutral-800/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${
                    (analysis?.score || 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} 
                  style={{ width: `${analysis ? 50 + (analysis.score * 5) : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/20 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-sm">
            <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block mb-1.5">Institutional Bias</span>
            <div className="flex items-center gap-3">
              <span className={`text-xl font-black uppercase tracking-tight ${
                analysis?.bias === 'BULLISH' ? 'text-emerald-500' : analysis?.bias === 'BEARISH' ? 'text-rose-500' : 'text-neutral-500'
              }`}>{analysis?.bias || 'SCN PENDING'}</span>
              {analysis?.bias === 'BULLISH' ? <TrendingUp size={20} className="text-emerald-500" /> : <TrendingDown size={20} className="text-rose-500" />}
            </div>
          </div>

          <div className="bg-neutral-900/20 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block mb-1.5">Market Identifier</span>
            <span className="text-xl font-black text-white tracking-tight group-hover:text-emerald-500 transition-colors">{assetData?.name || '---'}</span>
            <Target className="absolute right-[-15px] bottom-[-15px] opacity-[0.03] rotate-12" size={80} />
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="flex-1 bg-neutral-900/10 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 relative flex flex-col overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-4 z-10 px-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <BarChart3 className="text-emerald-500" size={24} />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-200">Volume Momentum Flow</h2>
                <div className="flex gap-3 mt-1.5">
                   <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                     <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Real-time Tick Data</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                     <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">12-EMA CONFLUENCE</span>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-black/60 rounded-full border border-white/10 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,1)]" />
                <span className="text-[10px] text-white font-black uppercase tracking-[0.1em]">Engine Engaged</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[400px]">
            {assetData && <TradingChart data={assetData.history} symbol={assetData.symbol} />}
          </div>
        </div>

        {/* AI INSIGHT PANELS */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 shadow-xl relative group">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <BrainCircuit className="text-blue-400" size={22} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest text-neutral-200">Executive Reasoning Matrix</h3>
            </div>
            <p className="text-neutral-400 text-[15px] leading-[1.6] min-h-[60px] font-medium font-serif italic selection:text-white">
              {analysis ? `"${analysis.reasoning}"` : "Decrypting market structure... Initiate neural scan to identify liquidity pools and institutional stop hunts."}
            </p>
          </div>
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <ShieldAlert className="text-rose-500" size={22} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest text-neutral-200">Alert Protocol</h3>
            </div>
            <div className="space-y-4">
              {(analysis?.institutionalInsights || ["Engine sequence ready", "Volatility threshold normal", "Risk parity verification active"]).map((insight, i) => (
                <div key={i} className="flex gap-4 items-center group cursor-default">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 group-hover:bg-rose-500 transition-all shrink-0 scale-125" />
                  <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 transition-colors uppercase font-black tracking-widest leading-none">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER WATERMARK */}
      <div className="fixed bottom-6 right-10 flex items-center gap-5 z-50 pointer-events-none opacity-20">
        <span className="text-[10px] font-black tracking-[0.5em] uppercase text-neutral-500">PRO FX TERMINAL E-BUILD 2026.4</span>
        <div className="h-px w-10 bg-neutral-800" />
      </div>
    </div>
  );
};

export default App;
