import React, { useState } from 'react';
import { usePlantStore } from '../store';
import { analyzePlantMood } from '../geminiService';
import { MoodReport } from '../types';
import { ChevronLeft, Smile, Droplets, Sun, Thermometer, Wind, Zap, Activity, CheckCircle } from 'lucide-react';

interface Props {
  plantId: string;
  onBack: () => void;
}

export const PlantMood: React.FC<Props> = ({ plantId, onBack }) => {
  const { getPlant, addMoodReportToPlant } = usePlantStore();
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

  if (!plant) return <div>Plant not found</div>;

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
      alert("Mood analysis failed. Please try again.");
      setStep('input');
    }
  };

  const getSeriousnessColor = (level: string) => {
    if (level === 'High') return 'bg-red-500 shadow-red-500/50';
    if (level === 'Medium') return 'bg-yellow-500 shadow-yellow-500/50';
    return 'bg-green-500 shadow-green-500/50';
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <ChevronLeft />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-yellow-400" />
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                PlantMood AI
              </h1>
            </div>
            <p className="text-slate-400 text-sm">Emotional inference based on biological signals</p>
          </div>
        </div>

        {step === 'input' && (
          <div className="animate-fade-in space-y-6">
             {latestImage ? (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-4 items-center">
                   <img src={latestImage} alt="Plant" className="w-16 h-16 rounded-lg object-cover" />
                   <p className="text-sm text-slate-300">Using latest photo for visual cues.</p>
                </div>
             ) : (
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl text-red-200 text-sm">
                   No image available. Please take a photo in the main dashboard first.
                </div>
             )}

             <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Sensor Data Input
                </h3>
                
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                     <Droplets className="w-4 h-4 text-blue-400" /> Soil Moisture
                   </label>
                   <select 
                     value={sensors.soilMoisture}
                     onChange={e => setSensors({...sensors, soilMoisture: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                   >
                     <option value="Bone Dry">Bone Dry</option>
                     <option value="Dry">Dry</option>
                     <option value="Moist">Moist</option>
                     <option value="Wet">Wet</option>
                     <option value="Soggy">Soggy</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                     <Sun className="w-4 h-4 text-yellow-400" /> Light Exposure
                   </label>
                   <select 
                     value={sensors.lightLevel}
                     onChange={e => setSensors({...sensors, lightLevel: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-yellow-500"
                   >
                     <option value="Low Light">Low Light / Shade</option>
                     <option value="Medium Indirect">Medium Indirect</option>
                     <option value="Bright Indirect">Bright Indirect</option>
                     <option value="Direct Sun">Direct Sun</option>
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-400" /> Temp (°C)
                      </label>
                      <input 
                        type="number"
                        value={sensors.temperature}
                        onChange={e => setSensors({...sensors, temperature: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Wind className="w-4 h-4 text-cyan-400" /> Humidity (%)
                      </label>
                      <input 
                        type="number"
                        value={sensors.humidity}
                        onChange={e => setSensors({...sensors, humidity: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none"
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
                   <input 
                     type="text" 
                     placeholder="e.g. Dropping leaves lately..."
                     value={sensors.notes}
                     onChange={e => setSensors({...sensors, notes: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none"
                   />
                </div>
             </div>

             <div className="flex justify-end">
               <button 
                 onClick={handleAnalyze}
                 disabled={!latestImage}
                 className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-900/40 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Detect Mood <Zap className="w-5 h-5 fill-white" />
               </button>
             </div>
          </div>
        )}

        {step === 'loading' && (
           <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
             <div className="relative">
               <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center animate-bounce">
                  <Smile className="w-12 h-12 text-yellow-400" />
               </div>
               <Activity className="w-8 h-8 text-blue-400 absolute -bottom-2 -right-2 animate-pulse" />
             </div>
             <h2 className="text-2xl font-bold text-white mt-8">Reading Biosignals...</h2>
             <p className="text-slate-400 mt-2 max-w-md">
               Combining visual leaf posture with your sensor data to infer emotional state.
             </p>
           </div>
        )}

        {step === 'result' && moodReport && (
          <div className="space-y-6 animate-fade-in">
             
             {/* Mood Hero Card */}
             <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500" />
                
                <div className="text-8xl mb-4 transform hover:scale-110 transition-transform duration-300 cursor-default">
                   {moodReport.moodEmoji}
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                  "{moodReport.moodTitle}"
                </h2>
                
                <p className="text-lg text-slate-300 italic max-w-xl mx-auto leading-relaxed">
                   "{moodReport.moodDescription}"
                </p>

                <div className="mt-6 flex justify-center gap-2">
                   {moodReport.biologicalSignals.map((signal, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-900 rounded-full text-xs font-bold text-slate-400 border border-slate-700">
                         {signal}
                      </span>
                   ))}
                </div>

                <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${getSeriousnessColor(moodReport.seriousness)}`}>
                   Stress Level: {moodReport.seriousness}
                </div>
             </div>

             {/* Action Plan */}
             <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                   <CheckCircle className="w-6 h-6 text-green-400" />
                   How to Cheer Me Up
                </h3>
                
                <div className="space-y-4">
                   {moodReport.actionPlan.map((action, i) => (
                      <div key={i} className="bg-slate-900 p-4 rounded-xl border-l-4 border-green-500 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                                  {action.category}
                               </span>
                               <span className="text-xs text-green-400 font-medium">
                                  {action.timeline}
                               </span>
                            </div>
                            <h4 className="font-bold text-white text-lg">{action.action}</h4>
                            <p className="text-slate-400 text-sm mt-1">{action.reason}</p>
                         </div>
                         <div className="text-right hidden md:block">
                            <span className="text-xs text-slate-500 block mb-1">Expected Result</span>
                            <span className="text-sm font-bold text-green-300">{action.expectedImprovement}</span>
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