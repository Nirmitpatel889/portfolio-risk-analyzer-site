"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Settings2, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Globe, 
  Zap,
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  Info
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

// --- Components ---

const MetricCard = ({ title, value, sub, color = "primary", icon: Icon }: any) => {
  const colors: any = {
    primary: "text-blue-500",
    green: "text-emerald-500",
    red: "text-rose-500",
    amber: "text-amber-500",
    cyan: "text-cyan-500",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
          <h3 className={`text-2xl font-mono font-medium ${colors[color]}`}>{value}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-secondary/50 ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-[11px] font-mono text-muted-foreground">{sub}</p>
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 bg-current transition-all duration-500 group-hover:w-full ${colors[color]}`} />
    </motion.div>
  );
};

const SectionHeader = ({ title, badge }: { title: string; badge?: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">{title}</h2>
    <div className="h-[1px] w-full bg-border" />
    {badge && (
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 whitespace-nowrap">
        {badge}
      </span>
    )}
  </div>
);

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
  const [activeTab, setActiveTab] = useState("risk");
  const [allocationMode, setAllocationMode] = useState<"ticker" | "sector">("ticker");

  const runAnalysis = async () => {
    setLoading(true);
    try {
      // Run Risk Analysis
      const riskRes = await analyzePortfolio({
        tickers,
        weights,
        start_date: dateRange.start,
        end_date: dateRange.end,
        benchmark,
        rf_rate: 0.05,
        conf_level: 0.95,
        stress_level: stressLevel,
      });
      setData(riskRes);

      // Run Optimization
      const optRes = await optimizePortfolio({
        tickers,
        weights,
        start_date: dateRange.start,
        end_date: dateRange.end,
        rf_rate: 0.05,
      });
      setOptData(optRes);

      // Run Simulation
      const simRes = await simulatePortfolio({
        tickers,
        weights,
        start_date: dateRange.start,
        end_date: dateRange.end,
        n_paths: 1000,
        horizon: 252,
        start_value: 10000.0,
        stress_level: stressLevel,
        use_fhs: true,
      });
      setSimData(simRes);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateWeight = (index: number, val: number) => {
    const newWeights = [...weights];
    newWeights[index] = val;
    // Normalize? Or keep raw and let backend handle?
    // For UI simplicity, we'll keep it as is for now.
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

  return (
    <div className="flex h-screen overflow-hidden text-foreground">
      {/* --- Sidebar --- */}
      <aside className="w-[320px] bg-card border-r border-border overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center accent-glow">
            <Zap size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold font-syne tracking-tight">RISK<span className="text-blue-500">DESK</span></h1>
        </div>

        <div>
          <SectionHeader title="Portfolio Config" />
          <div className="flex flex-col gap-3">
            {tickers.map((ticker, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  value={ticker}
                  onChange={(e) => {
                    const next = [...tickers];
                    next[i] = e.target.value.toUpperCase();
                    setTickers(next);
                  }}
                  className="bg-input border border-border rounded-lg px-3 py-2 text-xs font-mono w-full focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="SYM"
                />
                <input 
                  type="number"
                  value={weights[i]}
                  onChange={(e) => updateWeight(i, parseFloat(e.target.value))}
                  className="bg-input border border-border rounded-lg px-2 py-2 text-xs font-mono w-20 focus:outline-none focus:border-blue-500 transition-colors"
                  step="0.01"
                />
                <button onClick={() => removeTicker(i)} className="text-muted-foreground hover:text-rose-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={addTicker} className="flex items-center justify-center gap-2 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:bg-secondary/30 transition-colors">
              <Plus size={14} /> Add Asset
            </button>
          </div>
        </div>

        <div>
          <SectionHeader title="Quant Tuning" />
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase">Stress Level</label>
                <span className="text-[10px] font-mono text-blue-500 font-bold">{stressLevel}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="3.0" 
                step="0.1" 
                value={stressLevel}
                onChange={(e) => setStressLevel(parseFloat(e.target.value))}
                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-[8px] text-muted-foreground">DEFENSIVE</span>
                <span className="text-[8px] text-muted-foreground">EXTREME</span>
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">Benchmark</label>
              <select 
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                className="bg-input border border-border rounded-lg px-3 py-2 text-xs font-mono w-full focus:outline-none"
              >
                <option value="SPY">SPY (S&P 500)</option>
                <option value="QQQ">QQQ (Nasdaq 100)</option>
                <option value="DIA">DIA (Dow 30)</option>
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">Start Date</label>
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-input border border-border rounded-lg px-2 py-1.5 text-[11px] font-mono w-full" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">End Date</label>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-input border border-border rounded-lg px-2 py-1.5 text-[11px] font-mono w-full" />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="mt-auto w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 accent-glow transition-all active:scale-95"
        >
          {loading ? <RefreshCw className="animate-spin text-white" size={18} /> : <>RUN ANALYSIS <ChevronRight size={18} /></>}
        </button>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
        {!data ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6"
            >
              <TrendingUp className="text-blue-500" size={32} />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4 font-syne">Institutional-grade<br/><span className="text-blue-500">Portfolio Analytics</span></h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Configure your tickers and weights in the sidebar to compute VaR, CVaR, Sharpe ratio, drawdowns, and efficient frontiers.
            </p>
            <div className="grid grid-cols-2 gap-4 w-full">
              {[
                { label: "Real-time Data", icon: Globe },
                { label: "Advanced Ratios", icon: Activity },
                { label: "Monte Carlo", icon: Zap },
                { label: "Optimization", icon: PieChart },
              ].map((item, i) => (
                <div key={i} className="glass p-4 rounded-xl flex items-center gap-3 text-left">
                  <item.icon size={18} className="text-blue-500" />
                  <span className="text-xs font-mono text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <MetricCard title="Ann. Return" value={`${(data.metrics.ann_return * 100).toFixed(1)}%`} sub={`vs ${benchmark}`} icon={TrendingUp} color="green" />
              <MetricCard title="Volatility" value={`${(data.metrics.ann_vol * 100).toFixed(1)}%`} sub="Annualized σ" icon={Activity} color="cyan" />
              <MetricCard title="Sharpe Ratio" value={data.metrics.sharpe.toFixed(2)} sub="Risk-Adj. Return" icon={BarChart3} color="primary" />
              <MetricCard title="Max Drawdown" value={`${(data.metrics.max_drawdown * 100).toFixed(1)}%`} sub="Peak-to-Trough" icon={AlertTriangle} color="red" />
              <MetricCard title="Beta" value={data.metrics.beta.toFixed(2)} sub={`Systemic Risk`} icon={Globe} color="amber" />
              <MetricCard title="VaR (95%)" value={`${(data.metrics.var_hist * 100).toFixed(1)}%`} sub="1-Day Est. Loss" icon={AlertTriangle} color="red" />
            </div>

            {/* Tabs Sidebar alternative inside main */}
            <div className="flex gap-2 p-1 bg-card rounded-xl w-fit border border-border">
              {["risk", "optimizer", "simulation"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg accent-glow' : 'text-muted-foreground hover:bg-secondary'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "risk" && (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="glass-card p-6">
                    <SectionHeader title="Cumulative Returns" badge="Time Series" />
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.cumulative_returns.x.map((x: string, i: number) => ({ date: x, val: data.cumulative_returns.y[i] }))}>
                          <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c2033" />
                          <XAxis dataKey="date" hide />
                          <YAxis domain={['auto', 'auto']} tick={{fill: '#4b5563', fontSize: 10}} tickFormatter={(v) => `$${v.toFixed(1)}`} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{backgroundColor: '#0d0f17', border: '1px solid #1c2033', fontSize: '10px'}} />
                          <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <SectionHeader title="Portfolio Drawdown" badge="Percentage" />
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.drawdown_series.x.map((x: string, i: number) => ({ date: x, val: data.drawdown_series.y[i] }))}>
                          <defs>
                            <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c2033" />
                          <XAxis dataKey="date" hide />
                          <YAxis domain={['auto', 0]} tick={{fill: '#4b5563', fontSize: 10}} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{backgroundColor: '#0d0f17', border: '1px solid #1c2033', fontSize: '10px'}} />
                          <Area type="monotone" dataKey="val" stroke="#f43f5e" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDD)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                  <div className="glass-card p-6 xl:col-span-1">
                    <div className="flex justify-between items-center mb-6">
                      <SectionHeader title="Allocation" badge={allocationMode === 'ticker' ? 'by weights' : 'by sector'} />
                      <div className="flex gap-1 p-0.5 bg-secondary rounded-lg mb-6">
                        <button onClick={() => setAllocationMode('ticker')} className={`px-2 py-1 text-[9px] font-bold rounded ${allocationMode === 'ticker' ? 'bg-blue-600 text-white' : 'text-muted-foreground'}`}>SYM</button>
                        <button onClick={() => setAllocationMode('sector')} className={`px-2 py-1 text-[9px] font-bold rounded ${allocationMode === 'sector' ? 'bg-blue-600 text-white' : 'text-muted-foreground'}`}>SEC</button>
                      </div>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={allocationMode === 'ticker' 
                              ? tickers.map((t, i) => ({ name: t, value: weights[i] }))
                              : Object.entries(data.sector_exposure).map(([s, w]: any) => ({ name: s, value: w }))
                            }
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {(allocationMode === 'ticker' ? tickers : Object.keys(data.sector_exposure)).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#f43f5e'][index % 7]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#0d0f17', border: '1px solid #1c2033', fontSize: '10px'}} />
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4 custom-scrollbar overflow-y-auto max-h-[100px]">
                         {(allocationMode === 'ticker' ? tickers : Object.keys(data.sector_exposure)).map((item, i) => (
                           <div key={i} className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#f43f5e'][i % 7]}} />
                             <span className="text-[9px] font-mono font-bold text-foreground truncate max-w-[80px]">{item}</span>
                             <span className="text-[9px] font-mono text-muted-foreground ml-auto">
                               {((allocationMode === 'ticker' ? weights[i] : data.sector_exposure[item]) * 100).toFixed(0)}%
                             </span>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 xl:col-span-2">
                    <SectionHeader title="Risk Metrics Comparison" badge="Summary" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                      {[
                        { label: "Hist. VaR", val: data.metrics.var_hist, color: "text-rose-400" },
                        { label: "Robust VaR (T)", val: data.metrics.var_student_t, color: "text-rose-400" },
                        { label: "Monte Carlo", val: data.metrics.var_mc, color: "text-rose-400" },
                        { label: "CVaR (ES)", val: data.metrics.cvar, color: "text-orange-400" },
                      ].map((m, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">{m.label}</span>
                          <span className={`text-xl font-bold font-mono ${m.color}`}>{(m.val * 100).toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                        <Info size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-syne text-orange-400 mb-1">AI Risk Insight</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Your portfolio has a 5% historical probability of losing more than <b>{(data.metrics.var_hist * 100).toFixed(2)}%</b> in a single day. 
                          The CVaR (Expected Shortfall) suggests that if that threshold is breached, the average expected loss is <b>{(data.metrics.cvar * 100).toFixed(2)}%</b>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "optimizer" && optData && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="glass-card p-6 xl:col-span-2">
                  <SectionHeader title="Efficient Frontier" badge="Modern Portfolio Theory" />
                  <div className="h-[400px] w-full mt-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart>
                           <XAxis type="number" dataKey="volatility" name="Volatility" tick={{fill: '#4b5563', fontSize: 10}} tickFormatter={(v) => `${(v*100).toFixed(0)}%`} domain={['auto', 'auto']} />
                           <YAxis type="number" dataKey="return" name="Return" tick={{fill: '#4b5563', fontSize: 10}} tickFormatter={(v) => `${(v*100).toFixed(0)}%`} domain={['auto', 'auto']} />
                           <Tooltip contentStyle={{backgroundColor: '#0d0f17', border: '1px solid #1c2033', fontSize: '10px'}} />
                           <Line data={optData.efficient_frontier} type="monotone" dataKey="return" stroke="#3b82f6" dot={false} strokeWidth={3} />
                           {/* Simplified scattering for random portfolios could go here if needed */}
                        </ReLineChart>
                     </ResponsiveContainer>
                  </div>
                </div>
                <div className="glass-card p-6">
                  <SectionHeader title="Optimized Weights" />
                  <div className="space-y-6 mt-4">
                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                       <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Max Sharpe Portfolio</h4>
                       <p className="text-xl font-mono text-emerald-500 font-bold">{(optData.max_sharpe.return * 100).toFixed(1)}% Ret / {(optData.max_sharpe.volatility * 100).toFixed(1)}% Vol</p>
                    </div>
                    <div className="space-y-3">
                       {Object.entries(optData.max_sharpe.weights).map(([ticker, w]: any) => (
                         <div key={ticker} className="flex justify-between items-center text-[11px] font-mono">
                           <span className="text-muted-foreground">{ticker}</span>
                           <span className="text-foreground">{(w * 100).toFixed(1)}%</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "simulation" && simData && (
               <div className="glass-card p-6">
                 <SectionHeader title="Monte Carlo Projection" badge="1-Year Outlook" />
                 <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={simData.median.map((m: number, i: number) => ({
                         day: i,
                         median: m,
                         p5: simData.p5[i],
                         p95: simData.p95[i],
                         p25: simData.p25[i],
                         p75: simData.p75[i],
                       }))}>
                         <XAxis dataKey="day" hide />
                         <YAxis tick={{fill: '#4b5563', fontSize: 10}} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                         <Tooltip contentStyle={{backgroundColor: '#0d0f17', border: '1px solid #1c2033', fontSize: '10px'}} />
                         <Area type="monotone" dataKey="p95" stroke="none" fill="#3b82f6" fillOpacity={0.05} />
                         <Area type="monotone" dataKey="p75" stroke="none" fill="#3b82f6" fillOpacity={0.1} />
                         <Area type="monotone" dataKey="median" stroke="#3b82f6" fill="none" strokeWidth={2} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-4 gap-4 mt-8">
                    {[
                      { label: "Median Final", val: simData.median_outcome, color: "text-blue-400" },
                      { label: "Prob. of Loss", val: simData.prob_loss * 100, unit: "%", color: "text-rose-400" },
                      { label: "Upside (95th)", val: simData.p95[simData.p95.length - 1], color: "text-emerald-400" },
                      { label: "Downside (5th)", val: simData.p5[simData.p5.length - 1], color: "text-rose-400" },
                    ].map((s, i) => (
                      <div key={i} className="glass p-4 rounded-xl">
                        <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">{s.label}</p>
                        <p className={`text-lg font-bold font-mono ${s.color}`}>
                          {s.val > 1000 ? `$${s.val.toLocaleString(undefined, {maximumFractionDigits:0})}` : `${s.val.toFixed(1)}${s.unit || ''}`}
                        </p>
                      </div>
                    ))}
                 </div>
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
