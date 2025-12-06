const fs = require('fs');
const path = require('path');

// This script calculates the 1s and 0s from the restricted area GeoTIFF files
// Note: This requires the georaster library to be available
// For now, we'll create a script that can be run in the browser console or as a Node script

// Since we can't easily process GeoTIFF files in Node without additional libraries,
// we'll create a browser-based script that can be run in the console

const browserScript = `
// Run this in the browser console after the page loads
// It will calculate stats from loaded layers and output JSON

async function calculateRestrictedStats() {
  const stats = {};
  
  // Get all restricted area layers
  const restrictedLayers = window.layers?.filter(l => 
    l.name.includes('airfields') ||
    l.name.includes('military') ||
    l.name.includes('Railroads') ||
    l.name.includes('Roads')
  ) || [];
  
  for (const layer of restrictedLayers) {
    if (!layer.georaster) continue;
    
    const georaster = layer.georaster;
    const rawBandData = georaster.values[0];
    const noDataValue = georaster.noDataValue;
    
    let ones = 0;
    let zeros = 0;
    let totalLen = 0;
    let is2D = false;
    
    // Detect structure
    if (Array.isArray(rawBandData) && rawBandData.length > 0) {
      if (typeof rawBandData[0] !== 'number') {
        is2D = true;
        for (let i = 0; i < rawBandData.length; i++) {
          totalLen += rawBandData[i].length;
        }
      } else {
        totalLen = rawBandData.length;
      }
    } else if (rawBandData && rawBandData.length !== undefined) {
      totalLen = rawBandData.length;
    }
    
    // Use sampling to avoid memory issues
    const sampleRate = Math.max(1, Math.floor(totalLen / 100000));
    
    const processValue = (val) => {
      const isValid = 
        (noDataValue === null || noDataValue === undefined || val !== noDataValue) &&
        !isNaN(val) && 
        isFinite(val);
      
      if (isValid) {
        if (val === 1) ones++;
        else if (val === 0) zeros++;
      }
    };
    
    // Sample the data
    if (is2D) {
      let globalIndex = 0;
      let nextSampleIndex = 0;
      
      for (let r = 0; r < rawBandData.length; r++) {
        const row = rawBandData[r];
        const rowLen = row.length;
        const rowEnd = globalIndex + rowLen;
        
        while (nextSampleIndex < rowEnd) {
          const localIndex = nextSampleIndex - globalIndex;
          if (localIndex >= 0 && localIndex < rowLen) {
            processValue(row[localIndex]);
          }
          nextSampleIndex += sampleRate;
        }
        globalIndex += rowLen;
      }
    } else if (Array.isArray(rawBandData)) {
      for (let i = 0; i < rawBandData.length; i += sampleRate) {
        processValue(rawBandData[i]);
      }
    } else if (rawBandData && rawBandData.length !== undefined) {
      for (let i = 0; i < rawBandData.length; i += sampleRate) {
        processValue(rawBandData[i]);
      }
    }
    
    // Scale up based on sampling
    const estimatedOnes = Math.round(ones * sampleRate);
    const estimatedZeros = Math.round(zeros * sampleRate);
    const total = estimatedOnes + estimatedZeros;
    const percentage = total > 0 ? (estimatedOnes / total) * 100 : 0;
    
    stats[layer.name] = {
      ones: estimatedOnes,
      zeros: estimatedZeros,
      percentage: percentage.toFixed(2)
    };
    
    console.log(\`Processed \${layer.name}: \${percentage.toFixed(2)}%\`);
  }
  
  console.log('\\n=== JSON Output ===');
  console.log(JSON.stringify(stats, null, 2));
  
  return stats;
}

// Make it available globally
window.calculateRestrictedStats = calculateRestrictedStats;
console.log('Run calculateRestrictedStats() to compute stats');
`;

// Write the browser script to a file
fs.writeFileSync(
  path.join(__dirname, '../public/calculateStats.js'),
  browserScript
);

console.log('Browser script created at public/calculateStats.js');
console.log('Load this script in the browser and run calculateRestrictedStats()');

