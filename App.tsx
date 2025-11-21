import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapViewer } from './components/MapViewer';
import { LayerData, PanelView } from './types';
import { processGeoTiff } from './utils/tiffUtils';
import { Toaster, toast } from 'react-hot-toast';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Data Centers files to load on startup
const DATA_CENTER_FILES = [
  `${import.meta.env.BASE_URL}DataCenters/data center.tif`,
  `${import.meta.env.BASE_URL}DataCenters/data center with gas CCS.tif`
  // DC Screened.tif removed - too large (65MB) for browser memory limits
];

// Restricted Areas files to load on startup
const RESTRICTED_AREA_FILES = [
  `${import.meta.env.BASE_URL}Restrictions/airfields_screen.tiff`,
  `${import.meta.env.BASE_URL}Restrictions/military_sites_screen.tiff`,
  `${import.meta.env.BASE_URL}Restrictions/Railroads_screen.tiff`,
  `${import.meta.env.BASE_URL}Restrictions/Roads.tiff`
];

// Module-level flags to prevent duplicate loads (persists across React StrictMode remounts)
let dataCentersLoading = false;
let dataCentersLoaded = false;
let restrictedAreasLoading = false;
let restrictedAreasLoaded = false;

function App() {
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [activePanel, setActivePanel] = useState<PanelView>(PanelView.LAYERS);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load Data Centers files on startup
  useEffect(() => {
    const loadDataCenters = async () => {
      // Check if already loading or already loaded
      if (dataCentersLoading || dataCentersLoaded) {
        console.log('Data centers already loading or loaded, skipping');
        return;
      }
      
      console.log('Starting to load data centers:', DATA_CENTER_FILES);
      dataCentersLoading = true;
      setLoading(true);
      const loadedLayers: LayerData[] = [];

      for (let i = 0; i < DATA_CENTER_FILES.length; i++) {
        const filePath = DATA_CENTER_FILES[i];
        const fileName = filePath.split('/').pop() || filePath;
        try {
          console.log(`[${i + 1}/${DATA_CENTER_FILES.length}] Fetching: ${fileName}...`);
          const response = await fetch(filePath);
          if (!response.ok) {
            console.warn(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
            continue;
          }

          console.log(`Downloading ${fileName} (this may take a while for large files)...`);
          const blob = await response.blob();
          const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(1);
          console.log(`File size: ${fileSizeMB} MB`);
          
          // Warn if file is very large (over 50MB)
          if (blob.size > 50 * 1024 * 1024) {
            console.warn(`⚠️ ${fileName} is very large (${fileSizeMB} MB) and may cause memory issues`);
            toast.loading(`Processing large file: ${fileName} (${fileSizeMB} MB)...`, { id: `loading-${i}` });
          }
          
          const file = new File([blob], fileName, { type: 'image/tiff' });

          console.log(`Processing ${fileName} (this may take a while)...`);
          const { georaster, stats } = await processGeoTiff(file);
          
          const newLayer: LayerData = {
            id: generateId(),
            name: fileName,
            file,
            opacity: 1,
            visible: true,
            georaster,
            stats
          };

          loadedLayers.push(newLayer);
          toast.dismiss(`loading-${i}`);
          console.log(`✓ Successfully loaded ${fileName} (${i + 1}/${DATA_CENTER_FILES.length})`);
        } catch (error: any) {
          toast.dismiss(`loading-${i}`);
          if (error?.message?.includes('Array buffer allocation failed') || error?.name === 'RangeError') {
            console.error(`❌ ${fileName} is too large to process in browser memory`);
            toast.error(`${fileName} is too large (memory limit exceeded). Try a smaller file or process server-side.`);
          } else {
            console.error(`Error loading ${filePath}:`, error);
            toast.error(`Failed to load ${fileName}`);
          }
        }
      }

      console.log(`Loaded ${loadedLayers.length} data center layers`);

      if (loadedLayers.length > 0) {
        setLayers(prev => {
          // Double-check we're not adding duplicates by checking layer names
          const existingNames = new Set(prev.map(l => l.name));
          const newLayers = loadedLayers.filter(l => !existingNames.has(l.name));
          if (newLayers.length === 0) {
            return prev; // All layers already exist
          }
          return [...newLayers, ...prev];
        });
        setActiveLayerId(prevId => prevId || loadedLayers[0]?.id || null);
        toast.success(`Loaded ${loadedLayers.length} data center layer(s)`);
      } else {
        console.warn('No data center layers were loaded');
      }
      
      dataCentersLoaded = true;
      dataCentersLoading = false;
      setLoading(false);
    };

    loadDataCenters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Load Restricted Areas files on startup
  useEffect(() => {
    const loadRestrictedAreas = async () => {
      // Check if already loading or already loaded
      if (restrictedAreasLoading || restrictedAreasLoaded) return;
      
      restrictedAreasLoading = true;
      setLoading(true);
      const loadedLayers: LayerData[] = [];

      for (const filePath of RESTRICTED_AREA_FILES) {
        try {
          const response = await fetch(filePath);
          if (!response.ok) {
            console.warn(`Failed to load ${filePath}: ${response.statusText}`);
            continue;
          }

          const blob = await response.blob();
          const fileName = filePath.split('/').pop() || filePath;
          const file = new File([blob], fileName, { type: 'image/tiff' });

          const { georaster, stats } = await processGeoTiff(file);
          
          const newLayer: LayerData = {
            id: generateId(),
            name: fileName,
            file,
            opacity: 1,
            visible: true,
            georaster,
            stats
          };

          loadedLayers.push(newLayer);
        } catch (error) {
          console.error(`Error loading ${filePath}:`, error);
        }
      }

      if (loadedLayers.length > 0) {
        setLayers(prev => {
          // Double-check we're not adding duplicates by checking layer names
          const existingNames = new Set(prev.map(l => l.name));
          const newLayers = loadedLayers.filter(l => !existingNames.has(l.name));
          if (newLayers.length === 0) {
            return prev; // All layers already exist
          }
          return [...newLayers, ...prev];
        });
        setActiveLayerId(prevId => prevId || loadedLayers[0]?.id || null);
        toast.success(`Loaded ${loadedLayers.length} restricted area layer(s)`);
      }
      
      restrictedAreasLoaded = true;
      restrictedAreasLoading = false;
      setLoading(false);
    };

    loadRestrictedAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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
        <MapViewer layers={layers} activePanel={activePanel} />
      </div>
    </div>
  );
}

export default App;
