import React from 'react';
import { Layers, Activity, Eye, EyeOff, Trash2, UploadCloud, BarChart3 } from 'lucide-react';
import { LayerData, PanelView } from '../types';
import { StatsChart } from './StatsChart';

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
  setActiveLayerId
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
          onClick={() => setActivePanel(PanelView.STATS)}
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${
            activePanel === PanelView.STATS
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

        {activePanel === PanelView.STATS && (
          <div className="space-y-6">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layer Statistics</h2>
               {activeLayer && (
                 <span className="text-xs text-brand-400 font-medium truncate max-w-[120px]">
                   {activeLayer.name}
                 </span>
               )}
             </div>

             {activeLayer && activeLayer.stats ? (
                <div className="animate-fadeIn">
                  <StatsChart stats={activeLayer.stats} />
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center border border-dashed border-gis-700 rounded-lg">
                  <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                  <p>Select a layer to view distribution statistics.</p>
                </div>
             )}
          </div>
        )}

      </div>
      
      {/* Footer info */}
      <div className="p-3 border-t border-gis-800 text-[10px] text-gray-600 text-center bg-gis-900">
        Powered by React Leaflet
      </div>
    </div>
  );
};