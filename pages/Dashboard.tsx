import React, { useState } from 'react';
import { usePlantStore } from '../store';
import { ArrowRight, Plus, Droplets, Calendar, Camera, Mic } from 'lucide-react';
import { Plant } from '../types';

export const Dashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { plants, addPlant } = usePlantStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantSpecies, setNewPlantSpecies] = useState('');

  const handleCreatePlant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantName) return;
    
    const newPlant: Plant = {
      id: crypto.randomUUID(),
      name: newPlantName,
      species: newPlantSpecies || 'Unknown',
      dateAdded: new Date().toISOString(),
      logs: []
    };
    
    addPlant(newPlant);
    setShowAddModal(false);
    setNewPlantName('');
    setNewPlantSpecies('');
    navigate(`/plant/${newPlant.id}`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
        
        {/* Mission Statement */}
        <div className="bg-gradient-to-br from-green-900/40 to-slate-900 border border-green-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Reactive → Predictive Plant Care</h2>
            <p className="text-slate-300 mb-6 max-w-xl">
              Most apps tell you when your plant is already dying. AI Plant Doctor uses Gemini 3 Vision to detect micro-deviations days before symptoms appear.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-green-900/50 flex items-center justify-center gap-2"
              >
                Start Tracking <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigate('#/voice')}
                className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" /> Talk to Plants
              </button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Droplets size={180} />
          </div>
        </div>

        {/* Plant List */}
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center justify-between">
            <span>Your Garden</span>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{plants.length} Plants</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.map(plant => (
              <div 
                key={plant.id}
                onClick={() => navigate(`/plant/${plant.id}`)}
                className="group bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-green-500/50 transition-all cursor-pointer hover:shadow-xl hover:shadow-green-900/10 active:scale-[0.98]"
              >
                <div className="h-48 bg-slate-700 relative overflow-hidden">
                  {plant.logs.length > 0 ? (
                    <img 
                      src={plant.logs[0].thumbnailUrl} 
                      alt={plant.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 flex-col gap-2">
                      <Camera className="w-8 h-8 opacity-50" />
                      <span className="text-xs uppercase tracking-wider font-semibold">No Photos Yet</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3">
                    <h4 className="text-white font-bold text-lg">{plant.name}</h4>
                    <p className="text-slate-300 text-sm">{plant.species}</p>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center text-sm text-slate-400 bg-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(plant.dateAdded).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${plant.logs.length > 0 ? 'bg-green-500' : 'bg-slate-500'}`} />
                    <span>{plant.logs.length} Updates</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add New Card */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="h-full min-h-[250px] border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-green-400 hover:border-green-500/50 hover:bg-slate-800/50 transition-all"
            >
              <div className="bg-slate-800 p-3 rounded-full">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium">Add Plant</span>
            </button>
          </div>
        </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Register New Plant</h3>
            <form onSubmit={handleCreatePlant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nickname</label>
                <input 
                  type="text" 
                  value={newPlantName}
                  onChange={e => setNewPlantName(e.target.value)}
                  placeholder="e.g. My Monstera"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Species (Optional)</label>
                <input 
                  type="text" 
                  value={newPlantSpecies}
                  onChange={e => setNewPlantSpecies(e.target.value)}
                  placeholder="e.g. Monstera Deliciosa"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!newPlantName}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Monitoring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};