"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Globe, 
  Zap,
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Settings,
  X,
  PieChart as PieIcon,
  BarChart3,
  Target
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart as ReLineChart, 
  Line, 
  Cell,
  PieChart as RePieChart,
  Pie
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { analyzePortfolio, optimizePortfolio, simulatePortfolio } from "./api-client";
import SnowflakeChart from "@/components/SnowflakeChart";
import HoldingCard from "@/components/HoldingCard";
import AppSidebar from "@/components/AppSidebar";
import TickerInput from "@/components/TickerInput";

// --- Components ---

const MetricSummary = ({ label, value, sub, isPositive }: any) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-[#808080] uppercase tracking-wider font-bold mb-1">{label}</span>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-bold text-white">{value}</span>
      {sub && (
        <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
          {sub}
        </span>
      )}
    </div>
  </div>
);

const fmtPct = (v: number | null | undefined, signed = false) =>
  v == null ? "—" : `${signed && v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

// --- Main Page ---

export default function Dashboard() {
  const [tickers, setTickers] = useState(["AAPL", "MSFT", "JPM", "XOM", "GLD"]);
  const [weights, setWeights] = useState([0.2, 0.2, 0.2, 0.2, 0.2]);
  const [benchmark, setBenchmark] = useState("SPY");
  const [dateRange, setDateRange] = useState({ start: "2019-01-01", end: "2024-12-31" });
  const [stressLevel, setStressLevel] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [optData, setOptData] = useState<any>(null);
  const [simData, setSimData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const riskRes = await analyzePortfolio({
        tickers: tickers.filter(t => t !== ""),
        weights: weights.filter((_, i) => tickers[i] !== ""),
        start_date: dateRange.start,
        end_date: dateRange.end,
        benchmark,
        rf_rate: 0.05,
        conf_level: 0.95,
      });
      setData(riskRes);

      const optRes = await optimizePortfolio({
        tickers: tickers.filter(t => t !== ""),
        weights: weights.filter((_, i) => tickers[i] !== ""),
        start_date: dateRange.start,
        end_date: dateRange.end,
        rf_rate: 0.05,
      });
      setOptData(optRes);

      const simRes = await simulatePortfolio({
        tickers: tickers.filter(t => t !== ""),
        weights: weights.filter((_, i) => tickers[i] !== ""),
        start_date: dateRange.start,
        end_date: dateRange.end,
        n_paths: 1000,
        horizon: 252,
        start_value: 10000.0,
      });
      setSimData(simRes);
      
      if (showConfig) setShowConfig(false);
    } catch (err: any) {
      console.error(err);
      setError("Analysis failed. Please check your tickers (e.g., use 'AMZN' instead of 'AMAZON') and try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateWeight = (index: number, val: number) => {
    const newWeights = [...weights];
    newWeights[index] = val;
    setWeights(newWeights);
  };

  const removeTicker = (index: number) => {
    const newTickers = tickers.filter((_, i) => i !== index);
    const newWeights = weights.filter((_, i) => i !== index);
    setTickers(newTickers);
    setWeights(newWeights);
  };

  const addTicker = () => {
    setTickers([...tickers, ""]);
    setWeights([...weights, 0]);
  };

  // Map metrics to Snowflake axes
  const getSnowflakeData = () => {
    if (!data) return [];
    const m = data.metrics;
    return [
      { axis: "Returns", value: Math.min(100, Math.max(0, m.ann_return * 200)) },
      { axis: "Efficiency", value: Math.min(100, Math.max(0, m.sharpe * 33)) },
      { axis: "Stability", value: Math.min(100, Math.max(0, 100 - (m.ann_vol * 150))) },
      { axis: "Robustness", value: Math.min(100, Math.max(0, 100 - (Math.abs(m.max_drawdown) * 150))) },
      { axis: "Diversity", value: Math.min(100, tickers.length * 15) },
    ];
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#121212] font-sans">
      {/* Sidebar Navigation */}
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Header */}
        <header className="h-16 border-b border-[#2C2C2C] bg-[#121212] px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-bold">My Portfolio <span className="text-[#808080] font-normal text-sm ml-2">Main holdings</span></h2>
            <div className="h-6 w-[1px] bg-[#2C2C2C]" />
            <div className="flex gap-8">
              <MetricSummary 
                label="Total Return" 
                value={data ? `${(data.metrics.ann_return * 100).toFixed(1)}%` : "—"} 
                sub={data && data.metrics.alpha != null ? `${fmtPct(data.metrics.alpha, true)} vs market` : null}
                isPositive={data?.metrics.alpha >= 0}
              />
              <MetricSummary 
                label="Risk Score" 
                value={data ? (data.metrics.sharpe * 10).toFixed(1) : "—"} 
                sub={null}
              />
            </div>
          </div>
          <button 
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2C] hover:bg-[#333] border border-[#3A3A3A] rounded-md text-sm font-bold transition-all"
          >
            <Settings size={16} /> Configure
          </button>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!data && !loading ? (
             <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-[#1E1E1E] border border-[#2C2C2C] flex items-center justify-center mb-8 shadow-2xl">
                  <Target className="text-[#FFB946]" size={40} />
                </div>
                <h2 className="text-4xl font-black mb-4 tracking-tighter">ANALYZE YOUR <span className="text-[#FFB946]">RISK DNA</span></h2>
                <p className="text-[#A0A0A0] text-sm leading-relaxed mb-10">
                  Import your holdings to generate your investment snowflake, stress test your positions, and optimize your allocation for the current market regime.
                </p>
                <button 
                  onClick={() => setShowConfig(true)}
                  className="px-8 py-4 bg-[#FFB946] text-[#121212] font-black rounded-lg text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                >
                  Get Started
                </button>
             </div>
          ) : loading ? (
             <div className="h-full flex flex-col items-center justify-center gap-4">
                <RefreshCw size={48} className="animate-spin text-[#FFB946]" />
                <p className="text-[#808080] font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Processing Quant Models...</p>
             </div>
          ) : (
            <div className="max-w-[1400px] mx-auto space-y-12">
              
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Snowflake Section */}
                    <div className="lg:col-span-4 sws-card p-8 h-[500px] flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold uppercase text-[11px] tracking-widest text-[#808080]">Risk/Reward Snowflake</h3>
                         <Info size={14} className="text-[#555] cursor-pointer hover:text-white" />
                      </div>
                      <div className="flex-1 min-h-0">
                        <SnowflakeChart data={getSnowflakeData()} />
                      </div>
                      <div className="grid grid-cols-5 gap-1 mt-4">
                        {getSnowflakeData().map((d: any) => (
                           <div key={d.axis} className="flex flex-col items-center">
                              <div className="h-1 w-full bg-[#2C2C2C] rounded-full overflow-hidden">
                                 <div className="h-full bg-[#FFB946]" style={{ width: `${d.value}%` }} />
                              </div>
                              <span className="text-[8px] mt-1 text-[#666] uppercase">{d.axis.substring(0, 3)}</span>
                           </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats & Brief Analysis */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: "Hist. VaR", text: fmtPct(data.metrics.var_hist), color: "text-danger" },
                            { label: "Robust VaR", text: fmtPct(data.metrics.var_student_t), color: "text-danger" },
                            { label: "Beta", text: data.metrics.beta == null ? "—" : data.metrics.beta.toFixed(2), color: "text-warning" },
                            { label: "Alpha", text: fmtPct(data.metrics.alpha, true), color: data.metrics.alpha < 0 ? "text-danger" : "text-success" },
                          ].map((m, i) => (
                            <div key={i} className="sws-card p-6">
                              <p className="text-[10px] text-[#808080] uppercase font-bold mb-2">{m.label}</p>
                              <p className={`text-2xl font-black ${m.color}`}>
                                {m.text}
                              </p>
                            </div>
                          ))}
                       </div>

                       <div className="sws-card p-8">
                          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                             <BarChart3 size={18} className="text-[#FFB946]" /> Portfolio Progress
                          </h3>
                          <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={data.cumulative_returns.x.map((x: string, i: number) => ({ date: x, val: data.cumulative_returns.y[i] }))}>
                                <defs>
                                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ffb946" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#ffb946" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                <XAxis dataKey="date" hide />
                                <YAxis domain={['auto', 'auto']} tick={{fill: '#444', fontSize: 10}} tickFormatter={(v) => `$${v.toFixed(0)}`} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{backgroundColor: '#1E1E1E', border: '1px solid #2C2C2C', borderRadius: '8px', fontSize: '10px'}}
                                />
                                <Area type="monotone" dataKey="val" stroke="#ffb946" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Holdings Tab */}
              {activeTab === "holdings" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-2xl font-black">All Holdings</h2>
                        <p className="text-sm text-[#808080]">Individual analysis of {tickers.length} assets</p>
                      </div>
                      <div className="flex gap-2">
                         <button className="px-3 py-1.5 rounded bg-[#2C2C2C] text-xs font-bold hover:bg-[#333]">Export CSV</button>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {tickers.map((t, i) => (
                        <HoldingCard 
                          key={i} 
                          ticker={t} 
                          weight={weights[i]} 
                          sector={data.ticker_info[t]?.sector}
                          annReturn={0} 
                          volatility={0}
                          sharpe={0}
                        />
                      ))}
                   </div>
                </div>
              )}

              {/* Deep Analysis Tab */}
              {activeTab === "analysis" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="sws-card p-8">
                         <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                            <PieIcon size={18} className="text-[#FFB946]" /> Sector Allocation
                         </h3>
                         <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <RePieChart>
                                  <Pie
                                     data={Object.entries(data.sector_exposure).map(([name, value]) => ({ name, value }))}
                                     innerRadius={60}
                                     outerRadius={100}
                                     paddingAngle={5}
                                     dataKey="value"
                                  >
                                     {Object.entries(data.sector_exposure).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#FFB946', '#FF9F00', '#FF8500', '#FF6B00', '#E55C00'][index % 5]} />
                                     ))}
                                  </Pie>
                                  <Tooltip contentStyle={{backgroundColor: '#1E1E1E', border: 'none', borderRadius: '8px'}} />
                               </RePieChart>
                            </ResponsiveContainer>
                         </div>
                         <div className="grid grid-cols-2 gap-4 mt-4">
                            {Object.entries(data.sector_exposure).map(([sector, weight]: any, i) => (
                               <div key={sector} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#FFB946', '#FF9F00', '#FF8500', '#FF6B00', '#E55C00'][i % 5] }} />
                                  <span className="text-[10px] text-[#A0A0A0] uppercase font-bold">{sector}</span>
                                  <span className="text-[10px] text-white font-bold ml-auto">{(weight * 100).toFixed(1)}%</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="sws-card p-8">
                         <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                            <Activity size={18} className="text-[#FFB946]" /> Asset Correlations
                         </h3>
                         <div className="grid" style={{ gridTemplateColumns: `repeat(${tickers.length + 1}, 1fr)` }}>
                            <div className="h-8 w-8" />
                            {tickers.map(t => (
                               <div key={t} className="text-[8px] font-bold text-[#808080] flex items-center justify-center p-1">{t}</div>
                            ))}
                            {tickers.map((t1, i) => (
                               <React.Fragment key={t1}>
                                  <div className="text-[8px] font-bold text-[#808080] flex items-center justify-center p-1">{t1}</div>
                                  {tickers.map((t2, j) => {
                                     const val = data.correlation_matrix[t1][t2];
                                     return (
                                        <div 
                                           key={`${t1}-${t2}`} 
                                           className="aspect-square flex items-center justify-center text-[8px] border border-[#121212]"
                                           style={{ 
                                              backgroundColor: val > 0.8 ? 'rgba(255, 185, 70, 0.4)' : val > 0.5 ? 'rgba(255, 185, 70, 0.2)' : 'rgba(255,185,70,0.05)',
                                              color: val > 0.8 ? '#fff' : '#888'
                                           }}
                                        >
                                           {val.toFixed(2)}
                                        </div>
                                     );
                                  })}
                               </React.Fragment>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Optimizer Tab */}
              {activeTab === "optimizer" && optData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-8 sws-card p-8">
                         <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                            <BarChart3 size={18} className="text-[#FFB946]" /> Efficient Frontier
                         </h3>
                         <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart syncId="frontier">
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                  <XAxis 
                                     dataKey="volatility" 
                                     type="number" 
                                     domain={['auto', 'auto']} 
                                     label={{ value: 'Volatility', position: 'insideBottom', fill: '#444', fontSize: 10, offset: -5 }}
                                     tick={{fill: '#444', fontSize: 10}}
                                  />
                                  <YAxis 
                                     domain={['auto', 'auto']} 
                                     label={{ value: 'Return', angle: -90, position: 'insideLeft', fill: '#444', fontSize: 10 }}
                                     tick={{fill: '#444', fontSize: 10}}
                                     tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                  />
                                  <Tooltip contentStyle={{backgroundColor: '#1E1E1E', border: 'none', borderRadius: '8px'}} />
                                  <Area 
                                     data={optData.efficient_frontier} 
                                     type="monotone" 
                                     dataKey="return" 
                                     stroke="#FFB946" 
                                     fill="transparent" 
                                     strokeWidth={3}
                                  />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                      
                      <div className="lg:col-span-4 space-y-6">
                         {[
                            { label: "Optimal Sharpe Ratio", value: optData.max_sharpe.sharpe.toFixed(2), icon: TrendingUp },
                            { label: "Target Return", value: `${(optData.max_sharpe.return * 100).toFixed(1)}%`, icon: Target },
                            { label: "Minimized Vol", value: `${(optData.min_variance.volatility * 100).toFixed(1)}%`, icon: Activity }
                         ].map((stat, i) => (
                            <div key={i} className="sws-card p-6 flex items-center gap-4">
                               <div className="w-10 h-10 rounded-lg bg-[#FFB946]/10 flex items-center justify-center">
                                  <stat.icon size={20} className="text-[#FFB946]" />
                               </div>
                               <div>
                                  <p className="text-[10px] text-[#666] font-bold uppercase tracking-widest">{stat.label}</p>
                                  <p className="text-xl font-black">{stat.value}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {/* Simulation Tab */}
              {activeTab === "simulation" && simData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="sws-card p-8">
                      <div className="flex justify-between items-center mb-10">
                         <div>
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
                               <Zap size={18} className="text-[#FFB946]" /> Monte Carlo Projection
                            </h3>
                            <p className="text-xs text-[#666]">1,000 simulated paths based on historical regime</p>
                         </div>
                         <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded bg-[#FFB946]" />
                               <span className="text-[10px] uppercase font-bold text-[#888]">Median Outcome</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded bg-[#FFB946]/20" />
                               <span className="text-[10px] uppercase font-bold text-[#888]">95% CI</span>
                            </div>
                         </div>
                      </div>
                      <div className="h-[400px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={simData.median.map((m: any, i: number) => ({
                               index: i,
                               median: m,
                               low: simData.p5[i],
                               high: simData.p95[i]
                            }))}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                               <XAxis dataKey="index" hide />
                               <YAxis tick={{fill: '#444', fontSize: 10}} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                               <Tooltip contentStyle={{backgroundColor: '#1E1E1E', border: 'none', borderRadius: '8px'}} />
                               <Area type="monotone" dataKey="low" stackId="1" stroke="none" fill="#FFB946" fillOpacity={0.05} />
                               <Area type="monotone" dataKey="high" stackId="2" stroke="none" fill="#FFB946" fillOpacity={0.1} />
                               <Area type="monotone" dataKey="median" stroke="#FFB946" strokeWidth={3} fill="none" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-10 border-t border-[#222]">
                         <div>
                            <p className="text-[10px] text-[#666] font-bold uppercase mb-2">Current Value</p>
                            <p className="text-2xl font-black">$10,000</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-[#666] font-bold uppercase mb-2">Median 1Y Estimate</p>
                             <p className="text-2xl font-black text-white">${simData.median_outcome.toLocaleString()}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-[#666] font-bold uppercase mb-2">Prob. of Loss</p>
                             <p className={`text-2xl font-black ${simData.prob_loss > 0.3 ? 'text-danger' : 'text-success'}`}>
                                {(simData.prob_loss * 100).toFixed(1)}%
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* Slide-out Config Panel */}
      <AnimatePresence>
        {showConfig && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfig(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[400px] bg-[#1E1E1E] border-l border-[#2C2C2C] z-50 p-8 flex flex-col gap-8 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-widest">Portfolio <span className="text-[#FFB946]">DNA</span></h2>
                <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-[#2C2C2C] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-8">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-danger/10 border border-danger/20 rounded-md flex gap-3"
                    >
                      <AlertTriangle className="text-danger shrink-0" size={18} />
                      <p className="text-xs text-danger font-medium leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                  <section>
                    <label className="text-[10px] font-bold uppercase text-[#808080] tracking-widest mb-4 block">Holdings & Weights</label>
                    <div className="space-y-3">
                      {tickers.map((ticker, i) => (
                        <div key={i} className="flex gap-2">
                          <TickerInput 
                            value={ticker}
                            onChange={(val) => {
                              const next = [...tickers];
                              next[i] = val;
                              setTickers(next);
                            }}
                            placeholder="TICKER"
                          />
                          <input 
                            type="number"
                            value={weights[i]}
                            onChange={(e) => updateWeight(i, parseFloat(e.target.value))}
                            className="bg-[#121212] border border-[#2C2C2C] rounded px-2 py-2 text-xs font-bold w-24 focus:outline-none focus:border-[#FFB946]"
                            step="0.01"
                          />
                          <button onClick={() => removeTicker(i)} className="text-[#555] hover:text-danger p-2">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button onClick={addTicker} className="w-full py-2 border border-dashed border-[#2C2C2C] rounded text-[10px] font-bold uppercase text-[#808080] hover:bg-[#2C2C2C] transition-colors">
                        + Add Position
                      </button>
                    </div>
                  </section>

                  <section>
                    <label className="text-[10px] font-bold uppercase text-[#808080] tracking-widest mb-4 block">Benchmark Engine</label>
                    <select 
                      value={benchmark}
                      onChange={(e) => setBenchmark(e.target.value)}
                      className="bg-[#121212] border border-[#2C2C2C] rounded px-3 py-2 text-xs font-bold w-full focus:outline-none"
                    >
                      <option value="SPY">S&P 500 (SPY)</option>
                      <option value="QQQ">Nasdaq 100 (QQQ)</option>
                      <option value="DIA">Dow Jones (DIA)</option>
                    </select>
                  </section>

                  <section>
                    <label className="text-[10px] font-bold uppercase text-[#808080] tracking-widest mb-4 block">Date Range</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-[#121212] border border-[#2C2C2C] rounded px-3 py-2 text-xs font-bold w-full" />
                      <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-[#121212] border border-[#2C2C2C] rounded px-3 py-2 text-xs font-bold w-full" />
                    </div>
                  </section>
                </div>
              </div>

              <button 
                onClick={runAnalysis}
                disabled={loading}
                className="w-full py-4 bg-[#FFB946] text-[#121212] font-black rounded-lg text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin mx-auto" /> : "Recompute Models"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

