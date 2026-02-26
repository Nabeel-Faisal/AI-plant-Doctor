export interface PlantHealthMetrics {
  rootRot: number;
  nutrientDeficiency: number;
  underwatering: number;
  overwatering: number;
  pestInfection: number;
  fungalGrowth: number;
  lightBurn: number;
}

export interface Recommendation {
  category: 'Watering' | 'Fertilizer' | 'Sunlight' | 'Repotting' | 'General';
  action: string;
  reason: string;
  expectedImprovement: string;
  timeline: string;
}

export interface ForecastDay {
  day: string; // "Day 1", "Day 2", etc.
  healthScore: number; // 0-100
  riskDescription: string;
}

export interface AnalysisResult {
  date: string; // ISO string
  healthScore: number; // 0-100
  overallStatus: 'Healthy' | 'Warning' | 'Critical';
  identifiedSymptoms: string[];
  hiddenRisks: string[]; // "Micro-patterns detected"
  riskProbabilities: PlantHealthMetrics;
  forecast: ForecastDay[];
  recommendations: Recommendation[];
  rawAnalysisText: string;
}

export interface PlantLog {
  id: string;
  date: string;
  imageUrl: string;
  thumbnailUrl: string; // Small version for list
  notes?: string;
  analysis?: AnalysisResult;
}

// --- Digital Twin / Growth Simulation Types ---

export interface EnvironmentData {
  soilQuality: 'Good' | 'Medium' | 'Poor';
  sunlightHours: string;
  sunlightType: 'Direct' | 'Indirect' | 'Grow Light';
  temperature: string;
  humidity: string;
  wateringFrequency: string;
  fertilizer: string;
}

export interface GrowthPhase {
  day: number; // 14, 30, 60
  title: string; // e.g., "Vegetative Expansion"
  heightEstimate: string;
  visualDescription: string; // Detailed visual look
  healthScorePrediction: number;
  keyChanges: string[]; // "New leaf unfurling", "Stem thickening"
  risks: string[];
}

export interface SimulationResult {
  id: string;
  date: string;
  plantIdentity: string;
  naturalGrowthPattern: string;
  currentStressAnalysis: string;
  phases: GrowthPhase[];
  smartCareRecommendations: Recommendation[];
  environmentUsed: EnvironmentData;
}

// --- Plant Mood Types ---

export interface MoodReport {
  id: string;
  date: string;
  moodEmoji: string; // 🌤️, 💧, etc.
  moodTitle: string; // "Happy", "Thirsty"
  moodDescription: string; // "I'm feeling a bit parched..."
  biologicalSignals: string[]; // "Leaf droop detected", "Soil moisture low"
  seriousness: 'Low' | 'Medium' | 'High';
  actionPlan: Recommendation[];
}

// --- Plant Identifier Types ---

export interface PlantIdentificationResult {
  commonName: string;
  scientificName: string;
  description: string;
  care: {
    watering: string;
    sunlight: string;
    soil: string;
    temperature: string;
    humidity: string;
    fertilizer: string;
  };
  healthStatusFromImage: string;
  commonIssues: string;
  beginnerTips: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  dateAdded: string;
  logs: PlantLog[];
  simulations?: SimulationResult[];
  moodHistory?: MoodReport[];
}