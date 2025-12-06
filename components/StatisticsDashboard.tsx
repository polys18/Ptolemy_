import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  CartesianGrid, Area, AreaChart
} from 'recharts';
import { LayerData } from '../types';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';

interface StatisticsDashboardProps {
  layers: LayerData[];
  activeLayerId: string | null;
  setActiveLayerId: (id: string) => void;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ 
  layers, 
  activeLayerId, 
  setActiveLayerId 
}) => {
  const layersWithStats = layers.filter(l => l.stats);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    return layersWithStats.map(layer => ({
      name: layer.name.length > 20 ? layer.name.substring(0, 20) + '...' : layer.name,
      min: layer.stats!.min,
      max: layer.stats!.max,
      mean: layer.stats!.mean
    }));
  }, [layersWithStats]);

  // Prepare histogram overlay data
  const histogramData = useMemo(() => {
    if (layersWithStats.length === 0) return [];
    
    // Get the maximum bin count for normalization
    const maxCount = Math.max(
      ...layersWithStats.flatMap(l => 
        l.stats!.histogram.map(h => h.count)
      )
    );

    // Combine histograms from all layers
    const bins = new Map<number, { bin: number; [key: string]: number | string }>();
    
    layersWithStats.forEach((layer) => {
      const layerName = layer.name.length > 15 ? layer.name.substring(0, 15) + '...' : layer.name;
      layer.stats!.histogram.forEach(({ bin, count }) => {
        if (!bins.has(bin)) {
          bins.set(bin, { bin });
        }
        const entry = bins.get(bin)!;
        entry[layerName] = (count / maxCount) * 100; // Normalize to percentage
      });
    });

    return Array.from(bins.values()).sort((a, b) => a.bin - b.bin);
  }, [layersWithStats]);

  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  if (layersWithStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
        <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-medium mb-2">No Statistics Available</p>
        <p className="text-xs">Load layers with statistics to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Layer Comparison - Side by Side */}
      <div className="bg-gis-800 rounded-lg p-4 border border-gis-700">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Layer Comparison
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569', 
                color: '#f1f5f9',
                fontSize: '11px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
            <Bar dataKey="min" fill="#ef4444" name="Min" radius={[2, 2, 0, 0]} />
            <Bar dataKey="mean" fill="#3b82f6" name="Mean" radius={[2, 2, 0, 0]} />
            <Bar dataKey="max" fill="#10b981" name="Max" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          This chart compares the minimum, mean, and maximum pixel values across all loaded layers. 
          The red bars represent the lowest values found in each layer, blue bars show the average (mean) values, 
          and green bars indicate the highest values. This visualization can be used to identify which layers have 
          the widest value ranges, highest peaks, or lowest baselines, helping to understand the relative intensity 
          and distribution characteristics. This becomes particularly useful as more layer data files are added.
        </p>
      </div>

      {/* Histogram Overlays */}
      <div className="bg-gis-800 rounded-lg p-4 border border-gis-700">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Histogram Overlay
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={histogramData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="bin" 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Value', position: 'insideBottom', offset: -5, style: { fill: '#94a3b8', fontSize: '11px' } }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              label={{ value: 'Normalized Frequency (%)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '11px' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569', 
                color: '#f1f5f9',
                fontSize: '11px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
            {layersWithStats.map((layer, idx) => {
              const layerName = layer.name.length > 15 ? layer.name.substring(0, 15) + '...' : layer.name;
              return (
                <Area
                  key={layer.id}
                  type="monotone"
                  dataKey={layerName}
                  stackId="1"
                  stroke={colors[idx % colors.length]}
                  fill={colors[idx % colors.length]}
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          This stacked area chart displays the normalized frequency distribution (histogram) of pixel values 
          for all layers simultaneously. Each colored area represents one layer's value distribution, with 
          the height indicating how frequently each value range appears. Overlapping areas show where multiple 
          layers share similar value ranges. This visualization helps you identify patterns, detect outliers, 
          compare value distributions across layers, and understand whether your data follows normal, skewed, 
          or multimodal distributions. The normalization ensures fair comparison regardless of layer size differences.
        </p>
      </div>
    </div>
  );
};

