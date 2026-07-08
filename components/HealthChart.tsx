import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ForecastDay } from '../types';
import { useTheme } from './ThemeProvider';

interface HealthChartProps {
  forecast: ForecastDay[];
}

const THEME_COLORS = {
  dark: { line: '#34d399', grid: '#243b30', axis: '#94a3b8', tooltipBg: '#0f1e18', tooltipBorder: '#2c4b3c', tooltipText: '#f0f5f0' },
  light: { line: '#16a34a', grid: '#e5e0d0', axis: '#6b7264', tooltipBg: '#ffffff', tooltipBorder: '#d6d2c4', tooltipText: '#1e211c' },
};

export const HealthChart: React.FC<HealthChartProps> = ({ forecast }) => {
  const { resolvedTheme } = useTheme();
  const colors = THEME_COLORS[resolvedTheme];

  const data = forecast.map((f, i) => ({
    name: f.day || `Day ${i + 1}`,
    score: f.healthScore,
    risk: f.riskDescription
  }));

  return (
    <div className="w-full h-64 glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-muted mb-4">7-Day Health Forecast</h3>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.line} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={colors.line} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={colors.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={colors.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, color: colors.tooltipText, borderRadius: 12 }}
            itemStyle={{ color: colors.line }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={colors.line}
            fillOpacity={1}
            fill="url(#colorScore)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
