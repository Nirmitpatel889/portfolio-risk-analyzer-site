"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchTickers } from "@/app/api-client";
import { cn } from "@/components/AppSidebar"; // Reusing the helper

interface TickerInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TickerInput({ value, onChange, placeholder, className }: TickerInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length >= 2) {
        const results = await searchTickers(value);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        className={cn(
          "bg-[#121212] border border-[#2C2C2C] rounded px-3 py-2 text-xs font-bold w-full focus:outline-none focus:border-[#FFB946] transition-colors",
          className
        )}
        placeholder={placeholder}
      />
      
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E1E] border border-[#2C2C2C] rounded-md shadow-2xl z-50 max-h-64 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onChange(item.symbol);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#2C2C2C] flex flex-col gap-0.5 border-b border-[#2C2C2C] last:border-0"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#FFB946] text-xs leading-none">{item.symbol}</span>
                <span className="text-[10px] text-[#555] font-bold">{item.exchange}</span>
              </div>
              <span className="text-[10px] text-[#A0A0A0] truncate">{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
