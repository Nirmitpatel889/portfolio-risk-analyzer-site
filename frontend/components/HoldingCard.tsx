"use client";

import React from "react";
import { TrendingUp, TrendingDown, Info, AlertTriangle } from "lucide-react";

interface HoldingCardProps {
  ticker: string;
  weight: number;
  sector?: string;
  annReturn?: number;
  volatility?: number;
  sharpe?: number;
  price?: number;
}

export default function HoldingCard({ 
  ticker, 
  weight, 
  sector = "Technology", 
  annReturn = 0, 
  volatility = 0,
  sharpe = 0,
  price = 150.25
}: HoldingCardProps) {
  const isPositive = annReturn > 0;

  return (
    <div className="sws-card p-4 flex flex-col gap-4 group">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-lg bg-[#2C2C2C] border border-[#3A3A3A] flex items-center justify-center font-bold text-white shadow-inner group-hover:border-[#FFB946] transition-colors">
            {ticker.substring(0, 2)}
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-[#FFB946] transition-colors">{ticker}</h3>
            <p className="text-[11px] text-[#808080] uppercase tracking-wider">{sector}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-white">${price.toFixed(2)}</div>
          <div className={`text-[11px] flex items-center gap-1 justify-end ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(annReturn * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Mini Chart Area / Stats */}
      <div className="grid grid-cols-2 gap-4 py-2 border-t border-[#2C2C2C]">
        <div>
          <p className="text-[10px] text-[#808080] uppercase">Allocation</p>
          <p className="text-sm font-medium text-[#A0A0A0]">{(weight * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[10px] text-[#808080] uppercase">Sharpe Ratio</p>
          <p className="text-sm font-medium text-[#A0A0A0]">{sharpe.toFixed(2)}</p>
        </div>
      </div>

      {/* SWS Style Badges */}
      <div className="flex gap-2 pt-2">
        <div className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter bg-success-subtle text-success border border-success/20">
          HEALTHY
        </div>
        <div className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter bg-warning-subtle text-warning border border-warning/20">
          {volatility > 0.3 ? 'HIGH VOL' : 'STABLE'}
        </div>
      </div>

      {/* Hover Detail Button */}
      <button className="mt-2 w-full py-1.5 rounded bg-[#2C2C2C] text-[11px] font-bold text-[#A0A0A0] hover:bg-[#333] hover:text-white transition-all opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0">
        VIEW ANALYSIS
      </button>
    </div>
  );
}
