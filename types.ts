export interface LayerData {
  id: string;
  name: string;
  url?: string;
  file?: File;
  opacity: number;
  visible: boolean;
  georaster: any; // Type comes from georaster library, kept loose here for simplicity
  stats?: RasterStats;
  zoomRequestTime?: number;
}

export interface RasterStats {
  min: number;
  max: number;
  mean: number;
  p2: number; // 2nd percentile for contrast stretching
  p98: number; // 98th percentile for contrast stretching
  width: number;
  height: number;
  pixelSizeX: number;
  pixelSizeY: number;
  projection: number;
  bands: number;
  histogram: { bin: number; count: number }[];
  redPct: number;
  bluePct: number;
}

export enum PanelView {
  LAYERS = 'LAYERS',
  DATA_CENTERS = 'DATA_CENTERS',
  RESTRICTED_AREAS = 'RESTRICTED_AREAS',
  SETTINGS = 'SETTINGS'
}
