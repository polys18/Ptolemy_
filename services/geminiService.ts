import { GoogleGenAI } from "@google/genai";
import { RasterStats } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeRasterMetadata = async (stats: RasterStats): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Act as a Senior GIS Analyst. Analyze the following GeoTIFF metadata and provide a concise technical summary.
      
      Metadata:
      - Image Dimensions: ${stats.width}x${stats.height} pixels
      - Pixel Resolution: ${stats.pixelSizeX.toFixed(4)} (X), ${stats.pixelSizeY.toFixed(4)} (Y)
      - Band Count: ${stats.bands}
      - Data Range: ${stats.min.toFixed(2)} to ${stats.max.toFixed(2)}
      - Mean Value: ${stats.mean.toFixed(2)}
      - Projection ID: ${stats.projection}

      Please provide:
      1. A likely interpretation of what this data represents (e.g., elevation, satellite imagery, spectral data) based on the bands and value ranges.
      2. Comments on the spatial resolution and quality.
      3. Suggested visualization techniques (e.g., color ramps, hillshading).
      
      Keep the response formatted in Markdown.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.4,
      }
    });

    return response.text || "Analysis failed to generate text.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Unable to perform AI analysis. Please check your API Key or internet connection.";
  }
};
