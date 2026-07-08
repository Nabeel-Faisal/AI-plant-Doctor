import React, { useState } from 'react';
import { usePlantStore } from '../store';
import { ArrowRight, Plus, Droplets, Calendar, Camera, Mic, Trash2, Sprout } from 'lucide-react';
import { Plant } from '../types';
import { BottomSheet } from '../components/BottomSheet';
import { useToast } from '../components/ToastProvider';

export const Dashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { plants, addPlant, deletePlant } = usePlantStore();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantSpecies, setNewPlantSpecies] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Plant | null>(null);

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

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deletePlant(pendingDelete.id);
    showToast(`${pendingDelete.name} removed from your garden.`, 'info');
    setPendingDelete(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Mission Statement */}
      <div className="glass rounded-3xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="font-display text-2xl font-bold text-fg mb-2">Reactive → Predictive Plant Care</h2>
          <p className="text-muted mb-6 max-w-xl leading-relaxed">
            Most apps tell you when your plant is already dying. AI Plant Doctor uses Groq Vision to detect micro-deviations days before symptoms appear.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-accent text-bg px-5 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgb(var(--accent)/0.35)] active:scale-95 flex items-center justify-center gap-2"
            >
              Start Tracking <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('#/voice')}
              className="bg-surface border border-border text-fg px-5 py-3 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" /> Talk to Plants
            </button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-[0.08] pointer-events-none text-fg">
          <Droplets size={180} />
        </div>
      </div>

      {/* Plant List */}
      <div>
        <h3 className="font-display text-lg font-semibold text-fg mb-4 flex items-center justify-between">
          <span>Your Garden</span>
          <span className="text-xs text-muted bg-surface border border-border px-2.5 py-1 rounded-full">{plants.length} Plants</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plants.map(plant => (
            <div
              key={plant.id}
              className="group relative glass rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
            >
              <div
                onClick={() => navigate(`/plant/${plant.id}`)}
                role="button"
                className="h-44 bg-surface relative overflow-hidden cursor-pointer"
              >
                {plant.logs.length > 0 ? (
                  <img
                    src={plant.logs[0].thumbnailUrl}
                    alt={plant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted flex-col gap-2">
                    <Camera className="w-8 h-8 opacity-50" />
                    <span className="text-xs uppercase tracking-wider font-semibold">No Photos Yet</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-white font-display font-bold text-lg truncate">{plant.name}</h4>
                  <p className="text-white/80 text-sm truncate">{plant.species}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDelete(plant); }}
                  aria-label={`Delete ${plant.name}`}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/40 backdrop-blur text-white/80 hover:text-white hover:bg-black/60 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div
                onClick={() => navigate(`/plant/${plant.id}`)}
                className="p-3 flex justify-between items-center text-xs text-muted cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(plant.dateAdded).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${plant.logs.length > 0 ? 'bg-success' : 'bg-muted'}`} />
                  <span>{plant.logs.length} Updates</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Card */}
          <button
            onClick={() => setShowAddModal(true)}
            className="h-full min-h-[220px] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-muted hover:text-accent hover:border-accent/50 transition-all active:scale-[0.98]"
          >
            <div className="bg-surface p-3 rounded-full">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Add Plant</span>
          </button>
        </div>

        {plants.length === 0 && (
          <div className="mt-4 flex items-center gap-2 text-muted text-sm">
            <Sprout className="w-4 h-4" />
            <span>Your garden is empty — add your first plant to start tracking.</span>
          </div>
        )}
      </div>

      {/* Add Plant Sheet */}
      <BottomSheet isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register New Plant">
        <form onSubmit={handleCreatePlant} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Nickname</label>
            <input
              type="text"
              value={newPlantName}
              onChange={e => setNewPlantName(e.target.value)}
              placeholder="e.g. My Monstera"
              className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg focus:ring-2 focus:ring-accent outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Species (Optional)</label>
            <input
              type="text"
              value={newPlantSpecies}
              onChange={e => setNewPlantSpecies(e.target.value)}
              placeholder="e.g. Monstera Deliciosa"
              className="w-full bg-bg border border-border rounded-xl p-3.5 text-fg focus:ring-2 focus:ring-accent outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-3 rounded-xl text-muted hover:bg-surface font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newPlantName}
              className="flex-1 px-4 py-3 rounded-xl bg-accent text-bg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Monitoring
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Delete Confirm Sheet */}
      <BottomSheet isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Remove Plant?">
        <p className="text-muted text-sm mb-6 leading-relaxed">
          This will permanently delete <span className="text-fg font-semibold">{pendingDelete?.name}</span> and all of its history, analyses, and photos. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setPendingDelete(null)}
            className="flex-1 px-4 py-3 rounded-xl text-muted hover:bg-surface font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="flex-1 px-4 py-3 rounded-xl bg-danger text-white font-bold transition-colors active:scale-95"
          >
            Delete
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
