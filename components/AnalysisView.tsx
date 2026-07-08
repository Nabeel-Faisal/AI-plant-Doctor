import React from 'react';
import { AnalysisResult } from '../types';
import { HealthChart } from './HealthChart';
import { AlertTriangle, CheckCircle, Droplets, Sun, Sprout, Bug, ThermometerSun, BrainCircuit } from 'lucide-react';

interface Props {
  result: AnalysisResult;
}

export const AnalysisView: React.FC<Props> = ({ result }) => {

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  };

  const getRiskColor = (prob: number) => {
    if (prob < 30) return 'bg-surface border-border text-fg/80';
    if (prob < 70) return 'bg-warning/10 text-fg border-warning/40';
    return 'bg-danger/10 text-fg border-danger/40';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Health Score Card */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-[0.08] text-fg pointer-events-none">
          <BrainCircuit size={120} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                result.overallStatus === 'Healthy' ? 'bg-success/10 border-success/50 text-success' :
                result.overallStatus === 'Warning' ? 'bg-warning/10 border-warning/50 text-warning' :
                'bg-danger/10 border-danger/50 text-danger'
              }`}>
                {result.overallStatus}
              </span>
              <span className="text-muted text-xs">AI Confidence: High</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-fg">Plant Health Score</h2>
            <p className="text-muted mt-1 text-sm">Based on micro-pattern analysis</p>
          </div>
          <div className="flex items-center">
            <span className={`text-5xl md:text-6xl font-display font-black ${getScoreColor(result.healthScore)}`}>
              {result.healthScore}
            </span>
            <span className="text-2xl text-muted ml-1">/100</span>
          </div>
        </div>
      </div>

      {/* Hidden Risks Section - The "Micro Deviation" magic */}
      {result.hiddenRisks.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/25 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-purple-400 w-5 h-5 flex-shrink-0" />
            <h3 className="font-semibold text-fg">Hidden Risks Detected (Pre-Symptomatic)</h3>
          </div>
          <ul className="space-y-2">
            {result.hiddenRisks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-fg/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
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
          { label: 'Nutrients', val: result.riskProbabilities.nutrientDeficiency, icon: LeafIcon },
          { label: 'Water', val: result.riskProbabilities.underwatering, icon: Droplets },
          { label: 'Pests', val: result.riskProbabilities.pestInfection, icon: Bug },
          { label: 'Fungus', val: result.riskProbabilities.fungalGrowth, icon: Sprout },
          { label: 'Light', val: result.riskProbabilities.lightBurn, icon: Sun },
          { label: 'Env Stress', val: result.riskProbabilities.overwatering, icon: ThermometerSun },
        ].map((item, i) => (
          <div key={i} className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 ${getRiskColor(item.val)}`}>
            <item.icon className="w-5 h-5 opacity-80" />
            <span className="text-xs font-medium">{item.label}</span>
            <span className="text-lg font-bold">{item.val}%</span>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-fg flex items-center gap-2">
          <CheckCircle className="text-success w-5 h-5" />
          Treatment Plan
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {result.recommendations.map((rec, idx) => (
            <div key={idx} className="glass p-4 rounded-2xl">
              <div className="flex justify-between items-start mb-2 gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted bg-bg/60 px-2 py-0.5 rounded">
                  {rec.category}
                </span>
                <span className="text-xs text-success font-medium flex-shrink-0">{rec.timeline}</span>
              </div>
              <h4 className="font-bold text-fg mb-1">{rec.action}</h4>
              <p className="text-sm text-muted mb-2">{rec.reason}</p>
              <div className="text-xs text-success bg-success/10 px-2 py-1.5 rounded inline-block">
                Expected: {rec.expectedImprovement}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LeafIcon: React.FC<any> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 13-11 18z"/><path d="M11 20a7 7 0 0 1-7-12c.5-1 1-2.5 1-2.5 3 0 10 3 17 14.5"/></svg>;
