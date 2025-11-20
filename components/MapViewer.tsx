import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { LayerData } from '../types';
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

interface RasterLayerProps {
  layer: LayerData;
  index: number;
  totalLayers: number;
  zoomRequestTime?: number;
}

const RasterLayerComponent: React.FC<RasterLayerProps> = ({ layer, index, totalLayers, zoomRequestTime }) => {
  const map = useMap();

  // Handle Zoom request
  useEffect(() => {
      if (zoomRequestTime && layer.visible && layer.georaster) {
          try {
              // Create a temp layer to get bounds since we might not have reference to the active GeoRasterLayer instance
               const bounds = new L.GeoJSON(layer.georaster.toGeoJSON()).getBounds();
               map.fitBounds(bounds);
          } catch (e) {
              console.warn("Could not zoom to layer", e);
          }
      }
  }, [zoomRequestTime, layer, map]);

  useEffect(() => {
    if (!layer.georaster) return;

    if (typeof GeoRasterLayer === 'undefined') {
      console.error("GeoRasterLayer is not defined.");
      return;
    }

    try {
        // Determine effective range using percentiles if available (Contrast Stretch)
        const min = layer.stats?.p2 ?? layer.stats?.min ?? layer.georaster.mins[0];
        const max = layer.stats?.p98 ?? layer.stats?.max ?? layer.georaster.maxs[0];
        const range = Math.max(max - min, 0.0001); // Prevent div by zero

        // Determine if this is the "base" layer (bottom-most visible layer)
        const isBaseLayer = index === 0;

        const geoLayer = new GeoRasterLayer({
          georaster: layer.georaster,
          opacity: layer.opacity, // Global layer opacity
          resolution: 128, 
          debugLevel: 0,
          pixelValuesToColorFn: (values: number[]) => {
            const val = values[0];
            if (val === layer.georaster.noDataValue) return null; 
            
            // Normalize 0..1
            let normalized = (val - min) / range;
            if (normalized < 0) normalized = 0;
            if (normalized > 1) normalized = 1;
            
            // Gradient Swap: Red (Low) -> Yellow -> Cyan -> Blue (High)
            // Low Value (0.0) -> RED
            // High Value (1.0) -> BLUE
            
            let r = 0, g = 0, b = 0;

            if (normalized < 0.33) {
              // Red -> Yellow
              // R: 255, G: 0->255, B: 0
              const t = normalized / 0.33;
              r = 255;
              g = Math.floor(t * 255);
              b = 0;
            } else if (normalized < 0.66) {
              // Yellow -> Cyan
              // R: 255->0, G: 255, B: 0->255
              const t = (normalized - 0.33) / 0.33;
              r = Math.floor((1 - t) * 255);
              g = 255;
              b = Math.floor(t * 255);
            } else {
              // Cyan -> Blue
              // R: 0, G: 255->0, B: 255
              const t = (normalized - 0.66) / 0.34;
              r = 0;
              g = Math.floor((1 - t) * 255);
              b = 255;
            }

            // OR Logic Visualization (Red Dominant):
            // "If it's Red in layer 1 OR layer 2, it should be visualized as Red."
            // Low Values are RED.
            // So Low Values must be OPAQUE to cover underlying layers.
            // High Values (Blue) must be TRANSPARENT to let underlying Red (if any) show through.
            
            // Opacity Logic:
            // norm=0 (Red) -> 1-0 = 1 -> 1^3 = 1 (Opaque)
            // norm=1 (Blue) -> 1-1 = 0 -> 0^3 = 0 (Transparent)
            
            let alpha = isBaseLayer ? 1.0 : Math.pow(1 - normalized, 3);
            
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }
        });
    
        if (layer.visible) {
          geoLayer.addTo(map);
        }
    
        return () => {
          try {
            map.removeLayer(geoLayer);
          } catch (e) {}
        };
    } catch (err) {
        console.error("Error creating GeoRasterLayer", err);
    }
  }, [layer.georaster, layer.opacity, layer.visible, map, layer.stats, index]);

  return null;
};

interface MapViewerProps {
  layers: LayerData[];
}

export const MapViewer: React.FC<MapViewerProps> = ({ layers }) => {
  const center: [number, number] = [0, 0]; 
  
  // We receive layers in Top -> Bottom order (UI order).
  // We want to render Bottom -> Top so that the Top layer is drawn last (on top).
  const visibleLayers = layers.filter(l => l.visible).reverse();
  const renderedLayers = [...layers].reverse();

  return (
    <MapContainer 
      center={center} 
      zoom={3} 
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {renderedLayers.map((layer, i) => {
         // Find the index of this layer among the VISIBLE layers to determine if it's base
         const visualIndex = visibleLayers.findIndex(vl => vl.id === layer.id);
         return (
            <RasterLayerComponent 
                key={layer.id} 
                layer={layer} 
                index={visualIndex}
                totalLayers={visibleLayers.length}
                zoomRequestTime={layer.zoomRequestTime}
            />
         );
      })}
    </MapContainer>
  );
};