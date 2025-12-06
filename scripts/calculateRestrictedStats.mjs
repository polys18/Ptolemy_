import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script uses the browser's georaster library via a headless browser approach
// For now, we'll create a script that can be run in the browser console
// Or we can use a Node.js GeoTIFF library

console.log('This script needs to be run in the browser after files are loaded.');
console.log('Alternatively, install geotiff: npm install geotiff');
console.log('\nCreating browser-based calculation script...');

const browserScript = `
// Run this in the browser console after restricted area layers are loaded
// It will calculate stats and output JSON to copy

async function calculateRestrictedStats() {
  // Access layers from React DevTools or expose them globally first
  // You may need to add: window.layers = layers in App.tsx temporarily
  
  const stats = {};
  const fileNames = [
    'airfields_screen.tiff',
    'military_sites_screen.tiff', 
    'Railroads_screen.tiff',
    'Roads.tiff'
  ];
  
  // This assumes layers are available globally
  // If not, you'll need to access them from React DevTools
  const restrictedLayers = window.layers?.filter(l => 
    fileNames.some(name => l.name.includes(name))
  ) || [];
  
  console.log('Found', restrictedLayers.length, 'restricted area layers');
  
  for (const layer of restrictedLayers) {
    if (!layer.georaster) {
      console.warn('No georaster for', layer.name);
      continue;
    }
    
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
    
    console.log(\`Processing \${layer.name}: \${totalLen} total pixels\`);
    
    // Use sampling to avoid memory issues
    const sampleRate = Math.max(1, Math.floor(totalLen / 100000));
    console.log(\`Using sample rate: \${sampleRate}\`);
    
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
      percentage: parseFloat(percentage.toFixed(2))
    };
    
    console.log(\`\${layer.name}: \${percentage.toFixed(2)}% (ones: \${estimatedOnes}, zeros: \${estimatedZeros})\`);
  }
  
  console.log('\\n=== COPY THIS JSON ===');
  console.log(JSON.stringify(stats, null, 2));
  console.log('======================');
  
  return stats;
}

// Make available globally
window.calculateRestrictedStats = calculateRestrictedStats;
console.log('Run calculateRestrictedStats() in the console');
`;

fs.writeFileSync(
  path.join(__dirname, '../public/calculateStats.js'),
  browserScript
);

console.log('Browser script created at public/calculateStats.js');
console.log('\nTo calculate stats:');
console.log('1. Load the app in browser');
console.log('2. Wait for restricted area layers to load');
console.log('3. Open browser console');
console.log('4. Run: calculateRestrictedStats()');
console.log('5. Copy the JSON output and update restrictedAreaStats.json');

