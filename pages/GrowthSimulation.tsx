import React, { useState } from 'react';
import { usePlantStore } from '../store';
import { EnvironmentData, SimulationResult } from '../types';
import { generateGrowthSimulation } from '../groqService';
import { ChevronLeft, Sprout, Sun, Droplets, Thermometer, ArrowRight, Sparkles, CheckCircle, Leaf } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

interface Props {
  plantId: string;
  onBack: () => void;
}

export const GrowthSimulation: React.FC<Props> = ({ plantId, onBack }) => {
  const { getPlant, addSimulationToPlant } = usePlantStore();
  const { showToast } = useToast();
  const plant = getPlant(plantId);

  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input');
  const [formData, setFormData] = useState<EnvironmentData>({
    soilQuality: 'Medium',
    sunlightHours: '6',
    sunlightType: 'Indirect',
    temperature: '22°C',
    humidity: '50%',
    wateringFrequency: 'Weekly',
    fertilizer: 'None'
  });
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  if (!plant) return <div className="text-fg">Plant not found</div>;
  const latestImage = plant.logs[0]?.imageUrl;

  const handleSimulate = async () => {
    if (!latestImage) return;
    setStep('loading');

    try {
      const resultData = await generateGrowthSimulation(latestImage, formData);
      const fullResult: SimulationResult = {
        ...resultData,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        environmentUsed: formData
      };

      addSimulationToPlant(plantId, fullResult);
      setSimulation(fullResult);
      setStep('result');
    } catch (e) {
      console.error(e);
      showToast('Simulation failed. Please try again.', 'error');
      setStep('input');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden pb-4">

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-surface rounded-full text-muted transition-colors flex-shrink-0"
          >
            <ChevronLeft />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <h1 className="font-display text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 truncate">
                Digital Twin Engine
              </h1>
            </div>
            <p className="text-muted text-xs md:text-sm truncate">Predictive growth simulation for {plant.name}</p>
          </div>
        </div>

        {step === 'input' && (
          <div className="animate-fade-in space-y-6">
            <div className="glass p-4 md:p-6 rounded-2xl">
              <h3 className="font-display text-lg font-semibold text-fg mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-blue-400" />
                Environment Parameters
              </h3>
              <p className="text-muted mb-6 text-sm">
                To generate an accurate digital twin, the AI needs to know the conditions your plant lives in.
              </p>

              <div className="flex flex-col gap-6">

                {/* Section 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-fg/80 mb-2 flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-accent" /> Soil Quality
                    </label>
                    <select
                      value={formData.soilQuality}
                      onChange={e => setFormData({...formData, soilQuality: e.target.value as any})}
                      className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg focus:ring-2 focus:ring-purple-400 outline-none appearance-none"
                    >
                      <option value="Good">Good (Nutrient Rich)</option>
                      <option value="Medium">Medium (Standard Mix)</option>
                      <option value="Poor">Poor (Compacted/Old)</option>
                    </select>
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-fg/80 mb-2 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-warning" /> Sunlight Exposure
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.sunlightHours}
                        onChange={e => setFormData({...formData, sunlightHours: e.target.value})}
                        className="w-20 bg-bg border border-border rounded-xl p-3.5 text-fg focus:ring-2 focus:ring-purple-400 outline-none text-center"
                        placeholder="Hrs"
                      />
                      <select
                        value={formData.sunlightType}
                        onChange={e => setFormData({...formData, sunlightType: e.target.value as any})}
                        className="flex-1 bg-bg border border-border rounded-xl p-3.5 text-fg focus:ring-2 focus:ring-purple-400 outline-none appearance-none min-w-0"
                      >
                        <option value="Direct">Direct Sun</option>
                        <option value="Indirect">Indirect Bright</option>
                        <option value="Grow Light">Grow Light</option>
                        <option value="Low Light">Low Light</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="w-full">
                     <label className="block text-sm font-medium text-fg/80 mb-2 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-400" /> Watering Frequency
                     </label>
                     <input
                        type="text"
                        placeholder="e.g. Every 5 days"
                        value={formData.wateringFrequency}
                        onChange={e => setFormData({...formData, wateringFrequency: e.target.value})}
                        className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                  </div>

                  <div className="w-full">
                     <label className="block text-sm font-medium text-fg/80 mb-2 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-danger" /> Room Temp & Humidity
                     </label>
                     <div className="flex gap-2">
                       <input
                          type="text"
                          placeholder="22°C"
                          value={formData.temperature}
                          onChange={e => setFormData({...formData, temperature: e.target.value})}
                          className="flex-1 bg-bg border border-border rounded-xl p-3.5 text-fg focus:ring-2 focus:ring-purple-400 outline-none min-w-0"
                        />
                        <input
                          type="text"
                          placeholder="50%"
                          value={formData.humidity}
                          onChange={e => setFormData({...formData, humidity: e.target.value})}
                          className="flex-1 bg-bg border border-border rounded-xl p-3.5 text-fg focus:ring-2 focus:ring-purple-400 outline-none min-w-0"
                        />
                     </div>
                  </div>
                </div>

                <div className="w-full">
                   <label className="block text-sm font-medium text-fg/80 mb-2 flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-accent" /> Fertilizer Use
                   </label>
                   <input
                      type="text"
                      placeholder="e.g. Liquid fertilizer once a month"
                      value={formData.fertilizer}
                      onChange={e => setFormData({...formData, fertilizer: e.target.value})}
                      className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg focus:ring-2 focus:ring-purple-400 outline-none"
                    />
                </div>

              </div>
            </div>

            <div className="sm:flex sm:justify-end">
              <button
                onClick={handleSimulate}
                disabled={!latestImage}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!latestImage ? "No Image Available" : "Generate Simulation"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'loading' && (
           <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse px-4">
             <div className="relative">
               <Sprout className="w-24 h-24 text-purple-400 animate-bounce" />
               <Sparkles className="w-10 h-10 text-pink-400 absolute -top-2 -right-2 animate-spin-slow" />
             </div>
             <h2 className="font-display text-2xl font-bold text-fg mt-8">Building Digital Twin...</h2>
             <p className="text-muted mt-2 max-w-xs mx-auto">
               Groq is simulating photosynthesis, root expansion, and cellular growth based on your environment data.
             </p>
           </div>
        )}

        {step === 'result' && simulation && (
          <div className="space-y-8 animate-fade-in">

            {/* Identity Card */}
            <div className="glass rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                 <img src={latestImage} alt="Current" className="w-full h-48 object-cover rounded-xl border border-border" />
                 <p className="text-center text-xs text-muted mt-2">Base Image for Simulation</p>
              </div>
              <div className="w-full md:w-2/3">
                <div className="inline-block px-3 py-1 bg-purple-500/15 border border-purple-500/40 rounded-full text-purple-300 text-xs font-bold mb-3">
                  {simulation.plantIdentity}
                </div>
                <h3 className="font-display text-xl font-bold text-fg mb-2">Growth Analysis</h3>
                <p className="text-fg/80 text-sm mb-4 leading-relaxed">{simulation.naturalGrowthPattern}</p>
                <div className="bg-bg/60 p-3 rounded-lg border border-border">
                  <span className="text-muted text-xs font-bold uppercase block mb-1">Current Stress Level</span>
                  <p className="text-fg/80 text-sm">{simulation.currentStressAnalysis}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-display text-lg font-bold text-fg mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success" />
                Projected Growth Timeline
              </h3>
              <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto no-scrollbar snap-x-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
                {simulation.phases.map((phase) => (
                  <div key={phase.day} className="glass rounded-2xl p-5 min-w-[85%] sm:min-w-[320px] md:min-w-0 snap-center flex-shrink-0 hover:-translate-y-0.5 transition-transform">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-3xl font-display font-black text-fg">{phase.day}<span className="text-sm font-normal text-muted ml-1">Days</span></span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        phase.healthScorePrediction > 80 ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                      }`}>
                        Score: {phase.healthScorePrediction}
                      </span>
                    </div>
                    <h4 className="font-bold text-purple-300 mb-2">{phase.title}</h4>
                    <p className="text-sm text-fg/80 mb-4 leading-relaxed">
                      {phase.visualDescription}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-border">
                       <div className="flex items-center gap-2 text-xs text-muted">
                          <ArrowRight className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="font-medium text-fg/80">Height:</span> {phase.heightEstimate}
                       </div>
                       {phase.keyChanges.slice(0, 2).map((change, i) => (
                         <div key={i} className="flex items-center gap-2 text-xs text-muted">
                            <Sparkles className="w-3 h-3 text-warning flex-shrink-0" />
                            <span>{change}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="glass rounded-2xl p-4 md:p-6">
              <h3 className="font-display text-lg font-bold text-fg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Optimized Care Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {simulation.smartCareRecommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-bg/60 rounded-lg">
                    <div className="mt-1 flex-shrink-0">
                      {rec.category === 'Watering' && <Droplets className="w-5 h-5 text-blue-400" />}
                      {rec.category === 'Sunlight' && <Sun className="w-5 h-5 text-warning" />}
                      {rec.category === 'Fertilizer' && <Sprout className="w-5 h-5 text-accent" />}
                      {rec.category === 'Repotting' && <Leaf className="w-5 h-5 text-amber-600" />}
                      {rec.category === 'General' && <CheckCircle className="w-5 h-5 text-muted" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-fg text-sm">{rec.action}</h4>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
    </div>
  );
};
