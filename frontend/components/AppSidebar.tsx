"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  BarChart2, 
  Target, 
  Zap,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";

export default function AppSidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "holdings", label: "Holdings", icon: Briefcase },
    { id: "analysis", label: "Deep Analysis", icon: BarChart2 },
    { id: "optimizer", label: "Optimizer", icon: Target },
    { id: "simulation", label: "Simulator", icon: Zap },
  ];

  return (
    <aside className={cn(
      "h-screen bg-[#1A1A1A] border-r border-[#2C2C2C] flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-[80px]" : "w-[240px]"
    )}>
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#FFB946] flex items-center justify-center shrink-0">
          <Target size={20} className="text-[#121212]" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-lg tracking-tight">RISK<span className="text-[#FFB946]">ST</span></span>
        )}
      </div>

      {/* Search Placeholder */}
      <div className="px-4 mb-6">
        <div className="bg-[#2C2C2C] rounded-md p-2 flex items-center gap-2 cursor-pointer hover:bg-[#333] transition-colors">
          <Search size={16} className="text-[#808080]" />
          {!isCollapsed && <span className="text-sm text-[#808080]">Search stocks...</span>}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group",
              activeTab === item.id 
                ? "bg-[#FFB946]/10 text-[#FFB946]" 
                : "text-[#A0A0A0] hover:bg-[#2C2C2C] hover:text-white"
            )}
          >
            <item.icon size={20} className={cn(
              "shrink-0",
              activeTab === item.id ? "text-[#FFB946]" : "text-[#808080] group-hover:text-white"
            )} />
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer / Collapse */}
      <div className="p-4 border-t border-[#2C2C2C]">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded hover:bg-[#2C2C2C]"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2 text-[#808080]"><ChevronLeft size={18} /> <span className="text-sm">Collapse</span></div>}
        </button>
      </div>
    </aside>
  );
}

// Simple CN helper if lib/utils isn't present
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
