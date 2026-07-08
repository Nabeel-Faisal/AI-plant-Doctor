import React, { useState } from 'react';
import { usePlantStore } from '../store';
import { analyzePlantMood } from '../groqService';
import { MoodReport } from '../types';
import { ChevronLeft, Smile, Droplets, Sun, Thermometer, Wind, Zap, Activity, CheckCircle } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

interface Props {
  plantId: string;
  onBack: () => void;
}

export const PlantMood: React.FC<Props> = ({ plantId, onBack }) => {
  const { getPlant, addMoodReportToPlant } = usePlantStore();
  const { showToast } = useToast();
  const plant = getPlant(plantId);
  const latestImage = plant?.logs[0]?.imageUrl;

  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input');

  // Sensor Inputs (Simulated inputs for the user to fill)
  const [sensors, setSensors] = useState({
    soilMoisture: 'Dry', // Dry, Moist, Wet
    lightLevel: 'Bright Indirect', // Low, Medium, Bright, Direct
    temperature: '22',
    humidity: '40',
    notes: ''
  });

  const [moodReport, setMoodReport] = useState<MoodReport | null>(null);

  if (!plant) return <div className="text-fg">Plant not found</div>;

  const handleAnalyze = async () => {
    if (!latestImage) return;
    setStep('loading');

    try {
      const result = await analyzePlantMood(latestImage, sensors);
      const report: MoodReport = {
        ...result,
        id: crypto.randomUUID(),
        date: new Date().toISOString()
      };

      addMoodReportToPlant(plantId, report);
      setMoodReport(report);
      setStep('result');
    } catch (e) {
      console.error(e);
      showToast('Mood analysis failed. Please try again.', 'error');
      setStep('input');
    }
  };

  const getSeriousnessColor = (level: string) => {
    if (level === 'High') return 'bg-danger shadow-danger/40';
    if (level === 'Medium') return 'bg-warning shadow-warning/40';
    return 'bg-success shadow-success/40';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-surface rounded-full text-muted transition-colors flex-shrink-0"
          >
            <ChevronLeft />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-warning flex-shrink-0" />
              <h1 className="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-warning to-orange-500 truncate">
                PlantMood AI
              </h1>
            </div>
            <p className="text-muted text-sm truncate">Emotional inference based on biological signals</p>
          </div>
        </div>

        {step === 'input' && (
          <div className="animate-fade-in space-y-6">
             {latestImage ? (
                <div className="glass p-4 rounded-2xl flex gap-4 items-center">
                   <img src={latestImage} alt="Plant" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                   <p className="text-sm text-fg/80">Using latest photo for visual cues.</p>
                </div>
             ) : (
                <div className="bg-danger/10 border border-danger/30 p-4 rounded-xl text-fg text-sm">
                   No image available. Please take a photo in the main dashboard first.
                </div>
             )}

             <div className="glass p-5 sm:p-6 rounded-2xl space-y-6">
                <h3 className="font-bold text-fg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Sensor Data Input
                </h3>

                <div>
                   <label className="block text-sm font-medium text-fg/80 mb-2 flex items-center gap-2">
                     <Droplets className="w-4 h-4 text-blue-400" /> Soil Moisture
                   </label>
                   <select
                     value={sensors.soilMoisture}
                     onChange={e => setSensors({...sensors, soilMoisture: e.target.value})}
                     className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg outline-none focus:border-blue-400"
                   >
                     <option value="Bone Dry">Bone Dry</option>
                     <option value="Dry">Dry</option>
                     <option value="Moist">Moist</option>
                     <option value="Wet">Wet</option>
                     <option value="Soggy">Soggy</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-fg/80 mb-2 flex items-center gap-2">
                     <Sun className="w-4 h-4 text-warning" /> Light Exposure
                   </label>
                   <select
                     value={sensors.lightLevel}
                     onChange={e => setSensors({...sensors, lightLevel: e.target.value})}
                     className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg outline-none focus:border-warning"
                   >
                     <option value="Low Light">Low Light / Shade</option>
                     <option value="Medium Indirect">Medium Indirect</option>
                     <option value="Bright Indirect">Bright Indirect</option>
                     <option value="Direct Sun">Direct Sun</option>
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-fg/80 mb-2 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-danger" /> Temp (°C)
                      </label>
                      <input
                        type="number"
                        value={sensors.temperature}
                        onChange={e => setSensors({...sensors, temperature: e.target.value})}
                        className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg outline-none"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-fg/80 mb-2 flex items-center gap-2">
                        <Wind className="w-4 h-4 text-cyan-400" /> Humidity (%)
                      </label>
                      <input
                        type="number"
                        value={sensors.humidity}
                        onChange={e => setSensors({...sensors, humidity: e.target.value})}
                        className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg outline-none"
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-fg/80 mb-2">Notes (Optional)</label>
                   <input
                     type="text"
                     placeholder="e.g. Dropping leaves lately..."
                     value={sensors.notes}
                     onChange={e => setSensors({...sensors, notes: e.target.value})}
                     className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg outline-none"
                   />
                </div>
             </div>

             <div className="sm:flex sm:justify-end">
               <button
                 onClick={handleAnalyze}
                 disabled={!latestImage}
                 className="w-full sm:w-auto bg-gradient-to-r from-warning to-orange-500 text-bg px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Detect Mood <Zap className="w-5 h-5 fill-current" />
               </button>
             </div>
          </div>
        )}

        {step === 'loading' && (
           <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
             <div className="relative">
               <div className="w-24 h-24 rounded-full bg-warning/15 flex items-center justify-center animate-bounce">
                  <Smile className="w-12 h-12 text-warning" />
               </div>
               <Activity className="w-8 h-8 text-blue-400 absolute -bottom-2 -right-2 animate-pulse" />
             </div>
             <h2 className="font-display text-2xl font-bold text-fg mt-8">Reading Biosignals...</h2>
             <p className="text-muted mt-2 max-w-md px-4">
               Combining visual leaf posture with your sensor data to infer emotional state.
             </p>
           </div>
        )}

        {step === 'result' && moodReport && (
          <div className="space-y-6 animate-fade-in">

             {/* Mood Hero Card */}
             <div className="glass rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-warning via-orange-500 to-danger" />

                <div className="text-7xl sm:text-8xl mb-4 transform hover:scale-110 transition-transform duration-300 cursor-default">
                   {moodReport.moodEmoji}
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-black text-fg mb-2 tracking-tight">
                  "{moodReport.moodTitle}"
                </h2>

                <p className="text-base sm:text-lg text-fg/80 italic max-w-xl mx-auto leading-relaxed">
                   "{moodReport.moodDescription}"
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                   {moodReport.biologicalSignals.map((signal, i) => (
                      <span key={i} className="px-3 py-1 bg-bg/60 rounded-full text-xs font-bold text-muted border border-border">
                         {signal}
                      </span>
                   ))}
                </div>

                <div className={`absolute top-4 right-4 sm:top-6 sm:right-6 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${getSeriousnessColor(moodReport.seriousness)}`}>
                   Stress: {moodReport.seriousness}
                </div>
             </div>

             {/* Action Plan */}
             <div className="glass rounded-2xl p-5 sm:p-6">
                <h3 className="font-display text-xl font-bold text-fg mb-4 flex items-center gap-2">
                   <CheckCircle className="w-6 h-6 text-success" />
                   How to Cheer Me Up
                </h3>

                <div className="space-y-4">
                   {moodReport.actionPlan.map((action, i) => (
                      <div key={i} className="bg-bg/60 p-4 rounded-xl border-l-4 border-success flex flex-col md:flex-row gap-3 md:items-center justify-between">
                         <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                               <span className="text-xs font-bold uppercase text-muted tracking-wider">
                                  {action.category}
                               </span>
                               <span className="text-xs text-success font-medium">
                                  {action.timeline}
                               </span>
                            </div>
                            <h4 className="font-bold text-fg text-lg">{action.action}</h4>
                            <p className="text-muted text-sm mt-1">{action.reason}</p>
                         </div>
                         <div className="text-left md:text-right flex-shrink-0">
                            <span className="text-xs text-muted block mb-1">Expected Result</span>
                            <span className="text-sm font-bold text-success">{action.expectedImprovement}</span>
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
