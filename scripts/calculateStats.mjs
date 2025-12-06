import { fromFile } from 'geotiff';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESTRICTED_FILES = [
  'airfields_screen.tiff',
  'military_sites_screen.tiff',
  'Railroads_screen.tiff',
  'Roads.tiff'
];

async function calculateStats() {
  const stats = {};
  const publicDir = path.join(__dirname, '../public/Restrictions');
  
  for (const fileName of RESTRICTED_FILES) {
    const filePath = path.join(publicDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }
    
    console.log(`Processing ${fileName}...`);
    
    try {
      const tiff = await fromFile(filePath);
      const image = await tiff.getImage();
      const rasters = await image.readRasters();
      
      // Get the first band
      const data = rasters[0];
      const width = image.getWidth();
      const height = image.getHeight();
      const noDataValue = image.getGDALNoData();
      
      let ones = 0;
      let zeros = 0;
      let total = 0;
      
      // Count 1s and 0s
      for (let i = 0; i < data.length; i++) {
        const val = data[i];
        
        // Check if it's valid data (not NoData)
        if (noDataValue !== null && noDataValue !== undefined && val === noDataValue) {
          continue;
        }
        
        if (!isNaN(val) && isFinite(val)) {
          total++;
          if (val === 1) {
            ones++;
          } else if (val === 0) {
            zeros++;
          }
        }
      }
      
      const percentage = total > 0 ? (ones / total) * 100 : 0;
      
      stats[fileName] = {
        ones: ones,
        zeros: zeros,
        percentage: parseFloat(percentage.toFixed(2))
      };
      
      console.log(`  ${fileName}: ${percentage.toFixed(2)}% (ones: ${ones}, zeros: ${zeros}, total: ${total})`);
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error.message);
      stats[fileName] = {
        ones: 0,
        zeros: 0,
        percentage: 0
      };
    }
  }
  
  // Write to JSON file
  const outputPath = path.join(__dirname, '../public/restrictedAreaStats.json');
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
  
  console.log('\n=== Stats calculated and saved ===');
  console.log(JSON.stringify(stats, null, 2));
  console.log(`\nSaved to: ${outputPath}`);
  
  return stats;
}

calculateStats().catch(console.error);

