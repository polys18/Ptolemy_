import React from 'react';
import { Layers, Activity, Eye, EyeOff, Trash2, UploadCloud, Server, Shield, BarChart3, FileText } from 'lucide-react';
import { LayerData, PanelView } from '../types';
import { StatisticsDashboard } from './StatisticsDashboard';

interface RestrictedAreaStats {
  [filename: string]: {
    ones: number;
    zeros: number;
    percentage: number;
  };
}

interface SidebarProps {
  layers: LayerData[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleVisibility: (id: string) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onRemoveLayer: (id: string) => void;
  activePanel: PanelView;
  setActivePanel: (view: PanelView) => void;
  activeLayerId: string | null;
  setActiveLayerId: (id: string) => void;
  restrictedAreaStats: RestrictedAreaStats;
  onToggleSummary?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  layers,
  onUpload,
  onToggleVisibility,
  onUpdateOpacity,
  onRemoveLayer,
  activePanel,
  setActivePanel,
  activeLayerId,
  setActiveLayerId,
  restrictedAreaStats,
  onToggleSummary
}) => {
  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];

  return (
    <div className="w-80 h-full bg-gis-900 flex flex-col border-r border-gis-800 flex-shrink-0 z-20 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gis-800 flex items-center justify-between bg-gis-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg text-white tracking-tight">Ptolemy</h1>
        </div>
        {onToggleSummary && (
          <button
            onClick={onToggleSummary}
            className="p-1.5 hover:bg-gis-700 rounded text-gray-400 hover:text-brand-400 transition-colors"
            title="Toggle Summary Panel"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gis-800">
        <button
          onClick={() => setActivePanel(PanelView.LAYERS)}
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${
            activePanel === PanelView.LAYERS 
              ? 'text-brand-500 border-b-2 border-brand-500 bg-gis-800/50' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gis-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Layers
        </button>
        <button
          onClick={() => setActivePanel(PanelView.DATA_CENTERS)}
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${
            activePanel === PanelView.DATA_CENTERS
              ? 'text-brand-500 border-b-2 border-brand-500 bg-gis-800/50' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gis-800'
          }`}
        >
          <Server className="w-4 h-4" /> Data Centers
        </button>
        <button
          onClick={() => setActivePanel(PanelView.RESTRICTED_AREAS)}
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${
            activePanel === PanelView.RESTRICTED_AREAS
              ? 'text-brand-500 border-b-2 border-brand-500 bg-gis-800/50' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gis-800'
          }`}
        >
          <Shield className="w-4 h-4" /> Restricted
        </button>
        <button
          onClick={() => setActivePanel(PanelView.STATISTICS)}
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${
            activePanel === PanelView.STATISTICS
              ? 'text-brand-500 border-b-2 border-brand-500 bg-gis-800/50' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gis-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Stats
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        {activePanel === PanelView.LAYERS && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-gis-800 p-4 rounded-lg border border-dashed border-gis-600 hover:border-brand-500 transition-colors group cursor-pointer relative">
              <input 
                type="file" 
                accept=".tif,.tiff" 
                onChange={onUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-gis-700 rounded-full flex items-center justify-center mb-2 group-hover:bg-brand-600 transition-colors">
                  <UploadCloud className="w-5 h-5 text-gray-300 group-hover:text-white" />
                </div>
                <p className="text-sm font-medium text-white">Upload GeoTIFF</p>
                <p className="text-xs text-gray-500 mt-1">Supports .tif, .tiff (Local Processing)</p>
              </div>
            </div>

            {/* Layer List */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Layers</h2>
              {layers.length === 0 && (
                <p className="text-xs text-gray-600 italic">No layers loaded.</p>
              )}
              
              {layers.map((layer) => (
                <div 
                  key={layer.id} 
                  className={`bg-gis-800 rounded-lg border p-3 transition-all ${
                    activeLayerId === layer.id ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-gis-700'
                  }`}
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-200 truncate max-w-[140px]" title={layer.name}>
                      {layer.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                        className="p-1.5 hover:bg-gis-700 rounded text-gray-400 hover:text-white"
                      >
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id); }}
                        className="p-1.5 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Opacity Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Opacity</span>
                      <span>{Math.round(layer.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={layer.opacity}
                      onChange={(e) => onUpdateOpacity(layer.id, parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-1.5 bg-gis-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePanel === PanelView.DATA_CENTERS && (
          <div className="space-y-6">
             <div className="mb-4">
               <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Data Center Layers</h2>
               <p className="text-xs text-gray-500">
                 Data center layers are automatically loaded and visualized on startup.
               </p>
             </div>

             {/* Screening Criteria Table */}
             <div className="bg-gis-800 rounded-lg border border-gis-700 p-4">
               <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Screening Criteria</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-xs border-collapse">
                   <thead>
                     <tr>
                       <th rowSpan={2} className="border border-gis-700 bg-gis-900 px-2 py-2 text-gray-300 font-semibold text-left">
                         Screening Criteria
                       </th>
                       <th colSpan={4} className="border border-gis-700 bg-gis-900 px-2 py-2 text-gray-300 font-semibold">
                         Screening Color Category
                       </th>
                     </tr>
                     <tr>
                       <th className="border border-gis-700 bg-blue-900/30 px-2 py-1 text-blue-400 font-medium">Blue</th>
                       <th className="border border-gis-700 bg-cyan-900/30 px-2 py-1 text-cyan-400 font-medium">Cyan</th>
                       <th className="border border-gis-700 bg-yellow-900/30 px-2 py-1 text-yellow-400 font-medium">Yellow</th>
                       <th className="border border-gis-700 bg-red-900/30 px-2 py-1 text-red-400 font-medium">Red</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Roads (miles)</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;50</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;30</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;25</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;10</td>
                     </tr>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Fiber Line (miles)</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;30</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;20</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;15</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;10</td>
                     </tr>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Transmission Line (miles)</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;30</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;20</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;15</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;10</td>
                     </tr>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Substation (miles)</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;30</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;20</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;15</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;10</td>
                     </tr>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Gas Pipeline (miles)</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;30</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;20</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;15</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;10</td>
                     </tr>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Carbon Storage (miles)</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;50</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;30</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;25</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;10</td>
                     </tr>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Gas Storage (miles)</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;50</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;30</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;25</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;10</td>
                     </tr>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Urban Areas (miles)</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;30</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;20</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;15</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;10</td>
                     </tr>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Land Cost ($k/acre)</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;319</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">319</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">130</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">60</td>
                     </tr>
                     <tr>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Data Center Employees</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;20</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;20</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;100</td>
                       <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&gt;200</td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>

             <div className="space-y-3">
               {layers.filter(l => l.name.toLowerCase().includes('data center')).length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center border border-dashed border-gis-700 rounded-lg">
                   <Server className="w-12 h-12 mb-3 opacity-20" />
                   <p className="text-sm">No data center layers loaded.</p>
                   <p className="text-xs mt-1">Check the DataCenters directory.</p>
                 </div>
               ) : (
                 layers
                   .filter(l => l.name.toLowerCase().includes('data center'))
                   .map((layer) => (
                     <div 
                       key={layer.id} 
                       className={`bg-gis-800 rounded-lg border p-3 transition-all ${
                         activeLayerId === layer.id ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-gis-700'
                       }`}
                       onClick={() => setActiveLayerId(layer.id)}
                     >
                       <div className="flex items-center justify-between mb-3">
                         <span className="text-sm font-medium text-gray-200 truncate max-w-[200px]" title={layer.name}>
                           {layer.name}
                         </span>
                         <div className="flex items-center gap-1">
                           <button 
                             onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                             className="p-1.5 hover:bg-gis-700 rounded text-gray-400 hover:text-white"
                           >
                             {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                           </button>
                         </div>
                       </div>
                       
                       <div className="space-y-1">
                         <div className="flex justify-between text-xs text-gray-500">
                           <span>Opacity</span>
                           <span>{Math.round(layer.opacity * 100)}%</span>
                         </div>
                         <input
                           type="range"
                           min="0"
                           max="1"
                           step="0.1"
                           value={layer.opacity}
                           onChange={(e) => onUpdateOpacity(layer.id, parseFloat(e.target.value))}
                           onClick={(e) => e.stopPropagation()}
                           className="w-full h-1.5 bg-gis-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                         />
                       </div>
                     </div>
                   ))
               )}
             </div>
          </div>
        )}

        {activePanel === PanelView.RESTRICTED_AREAS && (() => {
          const restrictedLayers = layers.filter(l => 
            l.name.includes('airfields') ||
            l.name.includes('military') ||
            l.name.includes('Railroads') ||
            l.name.includes('Roads')
          );
          
          // Get stats from pre-computed JSON file and sum percentages
          let totalPercentage = 0;
          
          const layerPercentages = restrictedLayers.map(layer => {
            const fileName = layer.name;
            const stats = restrictedAreaStats[fileName];
            
            if (stats) {
              totalPercentage += stats.percentage;
              return {
                name: layer.name,
                percentage: stats.percentage
              };
            }
            return { name: layer.name, percentage: 0 };
          });
          
          const avgRedPct = totalPercentage;
          
          const layersWithStats = restrictedLayers.filter(layer => {
            const fileName = layer.name;
            return restrictedAreaStats[fileName] !== undefined;
          });
          
          return (
            <div className="space-y-6">
             <div className="mb-4">
               <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Restricted Area Layers</h2>
               <p className="text-xs text-gray-500 mb-3">
                 Restricted area layers are automatically loaded and visualized on startup.
               </p>

               {/* Screening Criteria Table */}
               <div className="bg-gis-800 rounded-lg border border-gis-700 p-4 mb-4">
                 <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Screening Criteria</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-xs border-collapse">
                     <thead>
                       <tr>
                         <th className="border border-gis-700 bg-gis-900 px-2 py-2 text-gray-300 font-semibold text-left">
                           Screening Criteria
                         </th>
                         <th className="border border-gis-700 bg-gis-900 px-2 py-2 text-gray-300 font-semibold text-center">
                           Buffer Distance / Condition
                         </th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Military Sites</td>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;1000m</td>
                       </tr>
                       <tr>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Airfield & Runways</td>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;1000m</td>
                       </tr>
                       <tr>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Slope</td>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;10 degrees</td>
                       </tr>
                       <tr>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Protected Areas</td>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">Inclusive</td>
                       </tr>
                       <tr>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300">EPA Non Attainment Area</td>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">Optional Screen - Only if DC wants to site with gas</td>
                       </tr>
                       <tr>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Open Mining Claims</td>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">Inclusive</td>
                       </tr>
                       <tr>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Major Railroad</td>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;150 meters</td>
                       </tr>
                       <tr>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300">Population Density</td>
                         <td className="border border-gis-700 px-2 py-1.5 text-gray-300 text-center">&lt;250 meters</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </div>
               
               {/* Red Area Percentage Statistic */}
               {layersWithStats.length > 0 && (
                 <div className="bg-gis-800 rounded-lg border border-gis-700 p-4">
                   <div className="flex items-center justify-between mb-3">
                     <div>
                       <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Map Coverage</p>
                       <p className="text-2xl font-bold text-red-400">{avgRedPct.toFixed(1)}%</p>
                       <p className="text-xs text-gray-500 mt-1">Red (Restricted) Areas</p>
                       <p className="text-[10px] text-gray-600 mt-1 italic">
                         Sum of coverage percentages across {layersWithStats.length} layer{layersWithStats.length !== 1 ? 's' : ''}
                       </p>
                     </div>
                     <div className="relative w-16 h-16">
                       <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                         <circle
                           cx="32"
                           cy="32"
                           r="28"
                           stroke="#334155"
                           strokeWidth="6"
                           fill="none"
                         />
                         <circle
                           cx="32"
                           cy="32"
                           r="28"
                           stroke="#ef4444"
                           strokeWidth="6"
                           fill="none"
                           strokeDasharray={`${2 * Math.PI * 28}`}
                           strokeDashoffset={`${2 * Math.PI * 28 * (1 - avgRedPct / 100)}`}
                           strokeLinecap="round"
                         />
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-xs font-bold text-red-400">{avgRedPct.toFixed(0)}%</span>
                       </div>
                     </div>
                   </div>
                   {/* Per-layer breakdown */}
                   <div className="mt-3 pt-3 border-t border-gis-700">
                     <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Per Layer:</p>
                     <div className="space-y-1.5">
                       {layerPercentages.map((layerPct, idx) => (
                         <div key={layersWithStats[idx]?.id || idx} className="flex items-center justify-between text-xs">
                           <span className="text-gray-400 truncate max-w-[140px]" title={layerPct.name}>
                             {layerPct.name.length > 20 ? layerPct.name.substring(0, 20) + '...' : layerPct.name}
                           </span>
                           <span className="text-red-400 font-medium ml-2">
                             {layerPct.percentage.toFixed(1)}%
                           </span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
             </div>

             <div className="space-y-3">
               {restrictedLayers.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center border border-dashed border-gis-700 rounded-lg">
                   <Shield className="w-12 h-12 mb-3 opacity-20" />
                   <p className="text-sm">No restricted area layers loaded.</p>
                   <p className="text-xs mt-1">Check the Restrictions directory.</p>
                 </div>
               ) : (
                 restrictedLayers
                   .map((layer) => (
                     <div 
                       key={layer.id} 
                       className={`bg-gis-800 rounded-lg border p-3 transition-all ${
                         activeLayerId === layer.id ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-gis-700'
                       }`}
                       onClick={() => setActiveLayerId(layer.id)}
                     >
                       <div className="flex items-center justify-between mb-3">
                         <span className="text-sm font-medium text-gray-200 truncate max-w-[200px]" title={layer.name}>
                           {layer.name}
                         </span>
                         <div className="flex items-center gap-1">
                           <button 
                             onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                             className="p-1.5 hover:bg-gis-700 rounded text-gray-400 hover:text-white"
                           >
                             {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                           </button>
                         </div>
                       </div>
                       
                       <div className="space-y-1">
                         <div className="flex justify-between text-xs text-gray-500">
                           <span>Opacity</span>
                           <span>{Math.round(layer.opacity * 100)}%</span>
                         </div>
                         <input
                           type="range"
                           min="0"
                           max="1"
                           step="0.1"
                           value={layer.opacity}
                           onChange={(e) => onUpdateOpacity(layer.id, parseFloat(e.target.value))}
                           onClick={(e) => e.stopPropagation()}
                           className="w-full h-1.5 bg-gis-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                         />
                       </div>
                     </div>
                   ))
               )}
             </div>
          </div>
          );
        })()}

        {activePanel === PanelView.STATISTICS && (
          <StatisticsDashboard
            layers={layers}
            activeLayerId={activeLayerId}
            setActiveLayerId={setActiveLayerId}
          />
        )}

      </div>
      
      {/* Footer info */}
      <div className="p-3 border-t border-gis-800 text-[10px] text-gray-600 text-center bg-gis-900">
        Powered by React Leaflet
      </div>
    </div>
  );
};