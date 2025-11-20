import React, { useState } from 'react';
import { Brain, Sparkles, AlertCircle } from 'lucide-react';
import { RasterStats } from '../types';
import { analyzeRasterMetadata } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AnalysisPanelProps {
  activeStats: RasterStats | undefined;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ activeStats }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!activeStats) return;
    setLoading(true);
    const result = await analyzeRasterMetadata(activeStats);
    setAnalysis(result);
    setLoading(false);
  };

  if (!activeStats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center">
        <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
        <p>Select a layer to enable AI analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-900 to-gis-800 p-4 rounded-lg border border-indigo-500/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-full">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Gemini GIS Assistant</h3>
        </div>
        <p className="text-xs text-indigo-200 mb-3">
          Use Gemini 2.5 Flash to interpret metadata, spatial extent, and band information.
        </p>
        
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generate Report
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400 animate-pulse">Analyzing spatial metadata...</span>
        </div>
      )}

      {analysis && (
        <div className="bg-gis-800 p-4 rounded-lg border border-gis-700 max-h-[60vh] overflow-y-auto custom-scrollbar">
           <div className="prose prose-invert prose-sm max-w-none">
             <ReactMarkdown>{analysis}</ReactMarkdown>
           </div>
           <button 
             onClick={() => setAnalysis(null)}
             className="mt-4 text-xs text-gray-500 hover:text-white underline"
           >
             Clear Analysis
           </button>
        </div>
      )}
    </div>
  );
};
