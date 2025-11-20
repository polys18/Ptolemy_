import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { RasterStats } from '../types';

interface StatsChartProps {
  stats: RasterStats;
}

export const StatsChart: React.FC<StatsChartProps> = ({ stats }) => {
  
  // Use the pre-calculated percentages from the stats object
  // These are calculated based on the (p2 + p98) / 2 threshold in tiffUtils.ts
  const redPct = stats.redPct ?? 0;
  const bluePct = stats.bluePct ?? 0;

  const data = [
    { name: 'Red Areas', value: redPct, color: '#ef4444' },   // Low Values (Background/Red)
    { name: 'Blue Areas', value: bluePct, color: '#3b82f6' }  // High Values (Targets/Blue)
  ];

  return (
    <div className="w-full h-48 bg-gis-800 rounded-lg p-4 border border-gis-700 flex flex-col">
      <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Pixel Distribution</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#94a3b8' }} 
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#f1f5f9', fontSize: '12px' }}
              formatter={(value: number) => [`${value}%`, 'Coverage']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList dataKey="value" position="top" fill="#cbd5e1" fontSize={12} formatter={(val: number) => `${val}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};