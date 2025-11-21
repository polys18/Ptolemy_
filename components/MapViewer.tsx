import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { LayerData, PanelView } from '../types';
import L from 'leaflet';

// Fix for default Leaflet icons in React
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Declare global GeoRasterLayer
declare const GeoRasterLayer: any;

// Component to ensure map resizes correctly
const MapResizer: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    // Force map to invalidate size when component mounts
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    // Also invalidate on window resize
    const handleResize = () => {
      map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);
  
  return null;
};

// Component to handle layer rendering inside the map
const LayerRenderer: React.FC<{ layer: LayerData; index: number; isBaseLayer: boolean; zoomRequestTime?: number }> = ({ layer, index, isBaseLayer, zoomRequestTime }) => {
  const map = useMap();
  const geoLayerRef = useRef<any>(null);
  const layerDataRef = useRef<{ georaster: any; min: number; max: number; noDataValue: any; isBaseLayer: boolean } | null>(null);

  // Handle Zoom request
  useEffect(() => {
    if (zoomRequestTime && layer.visible && layer.georaster) {
      try {
        const bounds = new L.GeoJSON(layer.georaster.toGeoJSON()).getBounds();
        map.fitBounds(bounds);
      } catch (e) {
        console.warn("Could not zoom to layer", e);
      }
    }
  }, [zoomRequestTime, layer.visible, layer.georaster, map]);

  // Create layer only once when georaster is first loaded
  useEffect(() => {
    if (!layer?.georaster) {
      // Clean up if layer is removed
      if (geoLayerRef.current) {
        try {
          map.removeLayer(geoLayerRef.current);
        } catch (e) {}
        geoLayerRef.current = null;
        layerDataRef.current = null;
      }
      return;
    }

    // Only create if georaster or isBaseLayer actually changed
    const dataChanged = !layerDataRef.current || 
      layerDataRef.current.georaster !== layer.georaster ||
      layerDataRef.current.isBaseLayer !== isBaseLayer;

    if (!dataChanged && geoLayerRef.current) {
      return;
    }

    if (typeof GeoRasterLayer === 'undefined') {
      console.error("GeoRasterLayer is not defined.");
      return;
    }

    // Clean up existing layer
    if (geoLayerRef.current) {
      try {
        map.removeLayer(geoLayerRef.current);
      } catch (e) {}
      geoLayerRef.current = null;
    }

    try {
      const min = layer.stats?.p2 ?? layer.stats?.min ?? layer.georaster.mins[0];
      const max = layer.stats?.p98 ?? layer.stats?.max ?? layer.georaster.maxs[0];
      const range = Math.max(max - min, 0.0001);
      const noDataValue = layer.georaster.noDataValue;

      // Store layer data
      layerDataRef.current = { georaster: layer.georaster, min, max, noDataValue, isBaseLayer };

      const geoLayer = new GeoRasterLayer({
        georaster: layer.georaster,
        opacity: layer.opacity,
        resolution: 128, // Reduced for better performance
        debugLevel: 0,
        pixelValuesToColorFn: (values: number[]) => {
          const val = values[0];
          if (val === noDataValue) return null;

          // Normalize 0..1
          let normalized = (val - min) / range;
          if (normalized < 0) normalized = 0;
          if (normalized > 1) normalized = 1;

          // Gradient: Red (Low) -> Yellow -> Cyan -> Blue (High)
          let r = 0, g = 0, b = 0;

          if (normalized < 0.33) {
            const t = normalized / 0.33;
            r = 255;
            g = Math.floor(t * 255);
            b = 0;
          } else if (normalized < 0.66) {
            const t = (normalized - 0.33) / 0.33;
            r = Math.floor((1 - t) * 255);
            g = 255;
            b = Math.floor(t * 255);
          } else {
            const t = (normalized - 0.66) / 0.34;
            r = 0;
            g = Math.floor((1 - t) * 255);
            b = 255;
          }

          // OR Logic Visualization (Red Dominant):
          // Low Values (Red) must be OPAQUE to cover underlying layers.
          // High Values (Blue) must be TRANSPARENT to let underlying Red (if any) show through.
          let alpha = isBaseLayer ? 1.0 : Math.pow(1 - normalized, 3);

          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
      });

      geoLayerRef.current = geoLayer;
      
      if (layer.visible) {
        geoLayer.addTo(map);
      }
    } catch (err) {
      console.error("Error creating GeoRasterLayer", err);
    }

    return () => {
      if (geoLayerRef.current) {
        try {
          map.removeLayer(geoLayerRef.current);
        } catch (e) {}
        geoLayerRef.current = null;
        layerDataRef.current = null;
      }
    };
  }, [layer?.georaster, isBaseLayer, map]);

  // Update visibility without recreating the layer
  useEffect(() => {
    if (!geoLayerRef.current) return;

    if (layer.visible) {
      if (!map.hasLayer(geoLayerRef.current)) {
        geoLayerRef.current.addTo(map);
      }
    } else {
      if (map.hasLayer(geoLayerRef.current)) {
        map.removeLayer(geoLayerRef.current);
      }
    }
  }, [layer.visible, map]);

  // Update opacity separately without recreating layer
  useEffect(() => {
    if (!geoLayerRef.current || !layer) return;
    
    if (geoLayerRef.current.setOpacity) {
      geoLayerRef.current.setOpacity(layer.opacity);
    }
  }, [layer?.opacity]);

  return null;
};

interface MapViewerProps {
  layers: LayerData[];
  activePanel: PanelView;
}

export const MapViewer: React.FC<MapViewerProps> = ({ layers, activePanel }) => {
  // Center of the United States (approximately)
  const center: [number, number] = [39.8283, -98.5795];
  const zoom = 4;
  
  // Filter layers based on active panel
  const getFilteredLayers = () => {
    if (activePanel === PanelView.DATA_CENTERS) {
      return layers.filter(l => l.name.toLowerCase().includes('data center'));
    } else if (activePanel === PanelView.RESTRICTED_AREAS) {
      return layers.filter(l => 
        l.name.includes('airfields') ||
        l.name.includes('military') ||
        l.name.includes('Railroads') ||
        l.name.includes('Roads')
      );
    }
    // For LAYERS tab, show all layers
    return layers;
  };

  const filteredLayers = getFilteredLayers();
  
  // Get visible layers in reverse order (bottom to top rendering)
  // We receive layers in Top -> Bottom order (UI order).
  // We want to render Bottom -> Top so that the Top layer is drawn last (on top).
  const visibleLayers = filteredLayers.filter(l => l.visible).reverse();
  const renderedLayers = [...filteredLayers].reverse();

  return (
    <MapContainer 
      key="main-map" // Stable key to prevent remounting
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      zoomControl={false}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      dragging={true}
      touchZoom={true}
      boxZoom={true}
      keyboard={true}
    >
      <ZoomControl position="bottomright" />
      
      <MapResizer />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
        minZoom={2}
      />

      {renderedLayers.map((layer) => {
        // Find the index of this layer among the VISIBLE layers to determine if it's base
        const visualIndex = visibleLayers.findIndex(vl => vl.id === layer.id);
        const isBaseLayer = visualIndex === 0;
        
        return (
          <LayerRenderer 
            key={layer.id} 
            layer={layer} 
            index={visualIndex}
            isBaseLayer={isBaseLayer}
            zoomRequestTime={layer.zoomRequestTime}
          />
        );
      })}
    </MapContainer>
  );
};