import { RasterStats } from '../types';

// Access global parseGeoraster loaded via script tag
declare const parseGeoraster: any;

export const processGeoTiff = async (file: File): Promise<{ georaster: any; stats: RasterStats }> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // parseGeoraster is available globally from the script tag
  const georaster = await parseGeoraster(arrayBuffer);

  // georaster.values[0] contains the data for band 0.
  // It can be:
  // 1. A simple array of numbers (Array<number>)
  // 2. A TypedArray (Float32Array, Int16Array, etc.)
  // 3. An array of arrays/TypedArrays (e.g. tiles/strips: Array<Float32Array>)
  const rawBandData = georaster.values[0];
  
  let is2D = false;
  let totalLen = 0;

  // Detect structure without triggering memory allocation
  if (Array.isArray(rawBandData) && rawBandData.length > 0) {
       // Check if elements are numbers or arrays/objects (TypedArrays are objects)
       if (typeof rawBandData[0] !== 'number') {
           is2D = true;
           // Sum lengths of inner arrays
           for(let i=0; i<rawBandData.length; i++) {
             totalLen += rawBandData[i].length;
           }
       } else {
           // Standard array of numbers
           totalLen = rawBandData.length;
       }
  } else {
      // TypedArray (does not pass Array.isArray)
      totalLen = rawBandData.length;
  }

  // Initialize stats
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;
  
  const noDataValue = georaster.noDataValue;
  
  // Target ~100k samples for histogram/percentiles to keep performance high
  const sampleRate = Math.max(1, Math.floor(totalLen / 100000)); 
  const samples: number[] = [];

  // Helper to process a single value
  const processValue = (val: number) => {
     const isValid = 
      (noDataValue === null || noDataValue === undefined || val !== noDataValue) &&
      !isNaN(val) && 
      isFinite(val);

    if (isValid) {
      if (val < min) min = val;
      if (val > max) max = val;
      sum += val;
      count++;
      samples.push(val);
    }
  };

  // Iterate Data In-Place (No Flattening)
  if (is2D) {
      // Virtual Iterator for 2D structure
      let globalIndex = 0;
      let nextSampleIndex = 0;
      
      for (let r = 0; r < rawBandData.length; r++) {
          const row = rawBandData[r];
          const rowLen = row.length;
          const rowEnd = globalIndex + rowLen;
          
          // While the next required sample falls within this current block/row
          while (nextSampleIndex < rowEnd) {
              const localIndex = nextSampleIndex - globalIndex;
              const val = row[localIndex];
              processValue(val);
              nextSampleIndex += sampleRate;
          }
          globalIndex += rowLen;
      }
  } else {
      // 1D structure (Simple Array or TypedArray)
      for (let i = 0; i < totalLen; i += sampleRate) {
          processValue(rawBandData[i]);
      }
  }
  
  // Fallback if no valid data found (e.g. all NoData)
  if (count === 0) {
    min = 0;
    max = 0;
  }

  const mean = count > 0 ? sum / count : 0;

  // Calculate Percentiles (2nd and 98th) for Contrast Stretching
  samples.sort((a, b) => a - b);
  let p2 = samples[Math.floor(samples.length * 0.02)];
  let p98 = samples[Math.floor(samples.length * 0.98)];

  // Fallback for percentiles
  if (p2 === undefined || p98 === undefined || p98 <= p2) {
      p2 = min;
      p98 = max;
  }
  
  // Calculate Red/Blue Distribution Percentages directly from samples
  // Map Logic: Low Values (<= threshold) -> Red, High Values (> threshold) -> Blue
  const threshold = (p2 + p98) / 2;
  let lowCount = 0;
  
  for (const val of samples) {
      if (val <= threshold) {
          lowCount++;
      }
  }
  
  const totalSamples = samples.length || 1;
  const redPct = Math.round((lowCount / totalSamples) * 100);
  const bluePct = 100 - redPct;

  // Histogram generation (kept for robust stats object, though chart uses percentages now)
  const binCount = 40;
  const histMin = p2;
  const histMax = p98;
  const range = histMax - histMin;
  
  let histogram: { bin: number; count: number }[] = [];

  if (range <= 0 || !isFinite(range)) {
    histogram = [{ bin: min, count: count }];
  } else {
    const binSize = range / binCount;
    
    histogram = Array.from({ length: binCount }, (_, i) => ({
      bin: Number((histMin + i * binSize).toFixed(2)),
      count: 0
    }));

    // Use samples for histogram approximation
    for (const val of samples) {
       let binIndex = Math.floor((val - histMin) / binSize);
       
       // Clamp index
       if (binIndex >= binCount) binIndex = binCount - 1;
       if (binIndex < 0) binIndex = 0;
       
       if (histogram[binIndex]) {
         histogram[binIndex].count++;
       }
    }
  }

  const stats: RasterStats = {
    min,
    max,
    mean,
    p2,
    p98,
    width: georaster.width,
    height: georaster.height,
    pixelSizeX: georaster.pixelWidth,
    pixelSizeY: georaster.pixelHeight,
    projection: georaster.projection,
    bands: georaster.numberOfRasters,
    histogram,
    redPct,
    bluePct
  };

  return { georaster, stats };
};