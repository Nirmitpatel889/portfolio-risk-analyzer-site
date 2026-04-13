"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface SnowflakeData {
  axis: string;
  value: number;
}

interface SnowflakeChartProps {
  data: SnowflakeData[];
}

export default function SnowflakeChart({ data }: SnowflakeChartProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#a0a0a0", fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Portfolio"
            dataKey="value"
            stroke="#ffb946"
            strokeWidth={2}
            fill="#ffb946"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
