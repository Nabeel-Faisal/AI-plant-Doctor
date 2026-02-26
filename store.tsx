import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Plant, PlantLog, SimulationResult, MoodReport } from './types';

interface PlantContextType {
  plants: Plant[];
  addPlant: (plant: Plant) => void;
  addLogToPlant: (plantId: string, log: PlantLog) => void;
  addSimulationToPlant: (plantId: string, simulation: SimulationResult) => void;
  addMoodReportToPlant: (plantId: string, report: MoodReport) => void;
  getPlant: (id: string) => Plant | undefined;
  deletePlant: (id: string) => void;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

const STORAGE_KEY = 'plant_doctor_data_v2';

export const PlantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state synchronously from LocalStorage to avoid race conditions
  const [plants, setPlants] = useState<Plant[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse local storage", e);
      return [];
    }
  });

  const isFirstRender = useRef(true);

  // Save to local storage on any change to plants
  useEffect(() => {
    // Skip saving on the very first render to avoid unnecessary writes, 
    // though safe because state matches storage on init.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert("Storage Limit Reached! The app cannot save new photos. Please delete some old plants to free up space.");
        console.error("LocalStorage quota exceeded", e);
      } else {
        console.error("Error saving to local storage", e);
      }
    }
  }, [plants]);

  const addPlant = (plant: Plant) => {
    setPlants(prev => [...prev, plant]);
  };

  const addLogToPlant = (plantId: string, log: PlantLog) => {
    setPlants(prev => prev.map(p => {
      if (p.id === plantId) {
        // Sort logs chronologically
        const newLogs = [...p.logs, log].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { ...p, logs: newLogs };
      }
      return p;
    }));
  };

  const addSimulationToPlant = (plantId: string, simulation: SimulationResult) => {
    setPlants(prev => prev.map(p => {
      if (p.id === plantId) {
        const newSimulations = [simulation, ...(p.simulations || [])];
        return { ...p, simulations: newSimulations };
      }
      return p;
    }));
  };

  const addMoodReportToPlant = (plantId: string, report: MoodReport) => {
    setPlants(prev => prev.map(p => {
      if (p.id === plantId) {
        const newHistory = [report, ...(p.moodHistory || [])];
        return { ...p, moodHistory: newHistory };
      }
      return p;
    }));
  };

  const getPlant = (id: string) => plants.find(p => p.id === id);

  const deletePlant = (id: string) => {
    setPlants(prev => prev.filter(p => p.id !== id));
  };

  return (
    <PlantContext.Provider value={{ plants, addPlant, addLogToPlant, addSimulationToPlant, addMoodReportToPlant, getPlant, deletePlant }}>
      {children}
    </PlantContext.Provider>
  );
};

export const usePlantStore = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error("usePlantStore must be used within a PlantProvider");
  }
  return context;
};