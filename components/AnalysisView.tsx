import React from 'react';
import { AnalysisResult } from '../types';
import { HealthChart } from './HealthChart';
import { AlertTriangle, CheckCircle, Droplets, Sun, Sprout, Bug, ThermometerSun, BrainCircuit } from 'lucide-react';

interface Props {
  result: AnalysisResult;
}

export const AnalysisView: React.FC<Props> = ({ result }) => {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskColor = (prob: number) => {
    if (prob < 30) return 'bg-slate-700 text-slate-300';
    if (prob < 70) return 'bg-yellow-900/50 text-yellow-200 border-yellow-700';
    return 'bg-red-900/50 text-red-200 border-red-700';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Health Score Card */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BrainCircuit size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                result.overallStatus === 'Healthy' ? 'bg-green-900/30 border-green-500 text-green-400' :
                result.overallStatus === 'Warning' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400' :
                'bg-red-900/30 border-red-500 text-red-400'
              }`}>
                {result.overallStatus}
              </span>
              <span className="text-slate-400 text-xs">AI Confidence: High</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Plant Health Score</h2>
            <p className="text-slate-400 mt-1">Based on micro-pattern analysis</p>
          </div>
          <div className="flex items-center">
            <span className={`text-5xl md:text-6xl font-black ${getScoreColor(result.healthScore)}`}>
              {result.healthScore}
            </span>
            <span className="text-2xl text-slate-500 ml-1">/100</span>
          </div>
        </div>
      </div>

      {/* Hidden Risks Section - The "Micro Deviation" magic */}
      {result.hiddenRisks.length > 0 && (
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-indigo-400 w-5 h-5" />
            <h3 className="font-semibold text-indigo-100">Hidden Risks Detected (Pre-Symptomatic)</h3>
          </div>
          <ul className="space-y-2">
            {result.hiddenRisks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-indigo-200">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Forecast Chart */}
      <HealthChart forecast={result.forecast} />

      {/* Detailed Risk Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Root Rot', val: result.riskProbabilities.rootRot, icon: Sprout },
          { label: 'Nutrients', val: result.riskProbabilities.nutrientDeficiency, icon: Leaf }, // Using Leaf as generic for nutrients
          { label: 'Water', val: result.riskProbabilities.underwatering, icon: Droplets },
          { label: 'Pests', val: result.riskProbabilities.pestInfection, icon: Bug },
          { label: 'Fungus', val: result.riskProbabilities.fungalGrowth, icon: Sprout },
          { label: 'Light', val: result.riskProbabilities.lightBurn, icon: Sun },
          { label: 'Env Stress', val: result.riskProbabilities.overwatering, icon: ThermometerSun },
        ].map((item, i) => (
          <div key={i} className={`p-3 rounded-lg border flex flex-col items-center text-center gap-2 ${getRiskColor(item.val)}`}>
            {/* 
              Note: Using the imported icons dynamically requires type assertion or a map. 
              For simplicity in this constrained output, I'll just render the Lucide components directly above if mapped, 
              or just use the component passed in the array.
            */}
            <item.icon className="w-5 h-5 opacity-80" />
            <span className="text-xs font-medium">{item.label}</span>
            <span className="text-lg font-bold">{item.val}%</span>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CheckCircle className="text-green-500 w-5 h-5" />
          Treatment Plan
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {result.recommendations.map((rec, idx) => (
            <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                  {rec.category}
                </span>
                <span className="text-xs text-green-400 font-medium">{rec.timeline}</span>
              </div>
              <h4 className="font-bold text-slate-100 mb-1">{rec.action}</h4>
              <p className="text-sm text-slate-400 mb-2">{rec.reason}</p>
              <div className="text-xs text-emerald-500 bg-emerald-900/20 px-2 py-1.5 rounded inline-block">
                Expected: {rec.expectedImprovement}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple Icon wrapper for map above if needed, but I used components directly.
const Leaf: React.FC<any> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 13-11 18z"/><path d="M11 20a7 7 0 0 1-7-12c.5-1 1-2.5 1-2.5 3 0 10 3 17 14.5"/></svg>;