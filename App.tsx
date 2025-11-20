import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapViewer } from './components/MapViewer';
import { LayerData, PanelView } from './types';
import { processGeoTiff } from './utils/tiffUtils';
import { Toaster, toast } from 'react-hot-toast';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [activePanel, setActivePanel] = useState<PanelView>(PanelView.LAYERS);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Processing ${file.name}...`);
    setLoading(true);

    try {
      const { georaster, stats } = await processGeoTiff(file);
      
      const newLayer: LayerData = {
        id: generateId(),
        name: file.name,
        file,
        opacity: 1,
        visible: true,
        georaster,
        stats
      };

      setLayers(prev => [newLayer, ...prev]);
      setActiveLayerId(newLayer.id);
      toast.success('Layer added successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to parse GeoTIFF. Ensure it is a valid format.', { id: toastId });
    } finally {
      setLoading(false);
      // Reset input
      e.target.value = '';
    }
  }, []);

  const handleToggleVisibility = (id: string) => {
    setLayers(prev => prev.map(l => 
      l.id === id ? { ...l, visible: !l.visible } : l
    ));
  };

  const handleUpdateOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => 
      l.id === id ? { ...l, opacity } : l
    ));
  };

  const handleRemoveLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(null);
    }
  };

  return (
    <div className="flex w-full h-screen bg-gis-900 text-white overflow-hidden">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155'
          }
        }}
      />
      
      <Sidebar 
        layers={layers}
        onUpload={handleUpload}
        onToggleVisibility={handleToggleVisibility}
        onUpdateOpacity={handleUpdateOpacity}
        onRemoveLayer={handleRemoveLayer}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        activeLayerId={activeLayerId}
        setActiveLayerId={setActiveLayerId}
      />

      <div className="flex-1 relative h-full w-full">
        {loading && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <div className="text-white font-medium animate-pulse">Processing GeoData...</div>
          </div>
        )}
        <MapViewer layers={layers} />
      </div>
    </div>
  );
}

export default App;
