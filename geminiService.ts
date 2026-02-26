import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AnalysisResult, EnvironmentData, SimulationResult, MoodReport, PlantIdentificationResult } from "./types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Gemini 3 Pro Preview for complex multimodal reasoning as requested
const MODEL_NAME = 'gemini-3-pro-preview'; 

// --- HEALTH ANALYSIS SCHEMA ---
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    healthScore: { type: Type.NUMBER, description: "Overall health score from 0 to 100" },
    overallStatus: { type: Type.STRING, enum: ["Healthy", "Warning", "Critical"] },
    identifiedSymptoms: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Visible symptoms found in the image"
    },
    hiddenRisks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Micro-pattern deviations or early warning signs not easily visible"
    },
    riskProbabilities: {
      type: Type.OBJECT,
      properties: {
        rootRot: { type: Type.NUMBER },
        nutrientDeficiency: { type: Type.NUMBER },
        underwatering: { type: Type.NUMBER },
        overwatering: { type: Type.NUMBER },
        pestInfection: { type: Type.NUMBER },
        fungalGrowth: { type: Type.NUMBER },
        lightBurn: { type: Type.NUMBER },
      },
      required: ["rootRot", "nutrientDeficiency", "underwatering", "overwatering", "pestInfection", "fungalGrowth", "lightBurn"]
    },
    forecast: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          healthScore: { type: Type.NUMBER },
          riskDescription: { type: Type.STRING }
        }
      }
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ['Watering', 'Fertilizer', 'Sunlight', 'Repotting', 'General'] },
          action: { type: Type.STRING },
          reason: { type: Type.STRING },
          expectedImprovement: { type: Type.STRING },
          timeline: { type: Type.STRING }
        }
      }
    }
  },
  required: ["healthScore", "overallStatus", "riskProbabilities", "forecast", "recommendations", "identifiedSymptoms", "hiddenRisks"]
};

// --- GROWTH SIMULATION SCHEMA ---
const simulationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    plantIdentity: { type: Type.STRING, description: "Exact species name" },
    naturalGrowthPattern: { type: Type.STRING, description: "Description of how this plant naturally grows" },
    currentStressAnalysis: { type: Type.STRING, description: "Analysis of current stress based on image and inputs" },
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.NUMBER, description: "The day of the projection (14, 30, or 60)" },
          title: { type: Type.STRING },
          heightEstimate: { type: Type.STRING },
          visualDescription: { type: Type.STRING, description: "Detailed visual description of the plant at this stage" },
          healthScorePrediction: { type: Type.NUMBER },
          keyChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["day", "title", "visualDescription", "keyChanges", "risks", "heightEstimate", "healthScorePrediction"]
      }
    },
    smartCareRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ['Watering', 'Fertilizer', 'Sunlight', 'Repotting', 'General'] },
          action: { type: Type.STRING },
          reason: { type: Type.STRING },
          expectedImprovement: { type: Type.STRING },
          timeline: { type: Type.STRING }
        },
        required: ["category", "action", "reason", "expectedImprovement", "timeline"]
      }
    }
  },
  required: ["plantIdentity", "naturalGrowthPattern", "currentStressAnalysis", "phases", "smartCareRecommendations"]
};

// --- MOOD REPORT SCHEMA ---
const moodSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    moodEmoji: { type: Type.STRING, description: "Single emoji representing the mood (e.g. 🌤️, 💧, 🔥)" },
    moodTitle: { type: Type.STRING, description: "The name of the mood (e.g. 'Happy', 'Thirsty')" },
    moodDescription: { type: Type.STRING, description: "A friendly, first-person explanation of why the plant feels this way." },
    biologicalSignals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Scientific signals detected (e.g. 'Leaf droop', 'Soil cracks')" },
    seriousness: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
    actionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ['Watering', 'Fertilizer', 'Sunlight', 'Repotting', 'General'] },
          action: { type: Type.STRING },
          reason: { type: Type.STRING },
          expectedImprovement: { type: Type.STRING },
          timeline: { type: Type.STRING }
        },
        required: ["category", "action", "reason", "expectedImprovement", "timeline"]
      }
    }
  },
  required: ["moodEmoji", "moodTitle", "moodDescription", "biologicalSignals", "seriousness", "actionPlan"]
};

// --- IDENTIFICATION SCHEMA ---
const identificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    commonName: { type: Type.STRING, description: "Common name of the plant" },
    scientificName: { type: Type.STRING, description: "Scientific/Latin name" },
    description: { type: Type.STRING, description: "Short 2-3 line description of the plant" },
    care: {
      type: Type.OBJECT,
      properties: {
        watering: { type: Type.STRING, description: "Watering requirements" },
        sunlight: { type: Type.STRING, description: "Light requirements" },
        soil: { type: Type.STRING, description: "Ideal soil type" },
        temperature: { type: Type.STRING, description: "Ideal temperature range" },
        humidity: { type: Type.STRING, description: "Humidity needs" },
        fertilizer: { type: Type.STRING, description: "Fertilizer needs" }
      },
      required: ["watering", "sunlight", "soil", "temperature", "humidity", "fertilizer"]
    },
    healthStatusFromImage: { type: Type.STRING, description: "Current visible health status based on the image provided" },
    commonIssues: { type: Type.STRING, description: "Common diseases or issues this species faces and fixes" },
    beginnerTips: { type: Type.STRING, description: "Helpful tips for beginners" }
  },
  required: ["commonName", "scientificName", "description", "care", "healthStatusFromImage", "commonIssues", "beginnerTips"]
};

export async function analyzePlantImage(
  currentImageBase64: string, 
  previousImageBase64?: string,
  plantDetails?: string
): Promise<AnalysisResult> {
  
  const cleanCurrent = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  
  const parts: any[] = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanCurrent
      }
    }
  ];

  let promptText = `
    You are an AI Plant Doctor using advanced computer vision to analyze plant health.
    
    TASK:
    1. Analyze this plant image for specific disease indicators, stress patterns, and overall vitality.
    2. Detect micro-deviations in color, texture, and leaf posture that suggest early-stage issues (pre-symptomatic).
    3. Predict the health trajectory for the next 7 days based on current visual data.
    4. Provide specific treatment recommendations.
    
    Plant Details: ${plantDetails || "Unknown species"}
  `;

  if (previousImageBase64) {
    const cleanPrev = previousImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    parts.unshift({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanPrev
      }
    });
    promptText += `
    
    COMPARATIVE ANALYSIS:
    I have provided TWO images. The FIRST image is from a previous day. The SECOND image is TODAY'S image.
    Compare them meticulously.
    - Has the leaf turgidity changed?
    - Are there spreading chlorotic spots?
    - Is there new fungal growth invisible to the casual eye?
    - Calculate the rate of decline or improvement.
    `;
  }

  parts.push({ text: promptText });

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are the world's most advanced plant pathologist AI. Your goal is PREDICTIVE healthcare, not just reactive diagnosis. You must identify issues before they become fatal.",
        temperature: 0.4, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    
    return {
      ...data,
      date: new Date().toISOString(),
      rawAnalysisText: "Analysis complete."
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
}

export async function generateGrowthSimulation(
  imageBase64: string,
  envData: EnvironmentData
): Promise<Omit<SimulationResult, 'id' | 'date' | 'environmentUsed'>> {
  const cleanImage = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  
  const parts = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanImage
      }
    },
    {
      text: `
        You are an advanced Plant Digital Twin Engine powered by Gemini 3.
        Your job is to create a full AI-driven growth simulation of this plant using the image and environment data.
        
        ENVIRONMENT DATA:
        - Soil Quality: ${envData.soilQuality}
        - Sunlight: ${envData.sunlightHours} hours (${envData.sunlightType})
        - Temp/Humidity: ${envData.temperature} / ${envData.humidity}
        - Watering: ${envData.wateringFrequency}
        - Fertilizer: ${envData.fertilizer}
        
        TASK:
        A) Identify & Analyze: Identify species, natural growth pattern, and current stress.
        B) Create Digital Twin Simulation:
           - 14-Day Projection: Predicted leaf growth, color changes, early stress.
           - 30-Day Projection: Leaf expansion, stem growth, flowering probability.
           - 60-Day Projection: Full maturity shape, canopy size, root expansion, long-term health.
        C) Visual Description: Describe EXACTLY how the plant looks at each stage (Volume, orientation, color).
        D) Smart Care Recommendations: Specific to this simulation.
      `
    }
  ];

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: simulationSchema,
        systemInstruction: "You are a Digital Twin Engine. You simulate biological growth based on environmental variables. Be precise, scientific, and visually descriptive.",
        temperature: 0.5,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);

  } catch (error) {
    console.error("Growth Simulation Failed:", error);
    throw error;
  }
}

export async function analyzePlantMood(
  imageBase64: string,
  sensorData: Record<string, string>
): Promise<Omit<MoodReport, 'id' | 'date'>> {
  const cleanImage = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  
  const parts = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanImage
      }
    },
    {
      text: `
        You are PlantMood-AI, an advanced emotional-state inference engine for plants.
        
        SENSOR DATA:
        ${JSON.stringify(sensorData, null, 2)}
        
        TASK:
        1. Analyze the image for leaf posture, stem stiffness, and color deviations.
        2. Combine with sensor data to infer the plant's biological "Mood".
        3. Moods: Happy, Thirsty, Stressed, Sleepy, Nutrient Shock, Overwatered, etc.
        4. Explain WHY based on biological signals.
        5. Provide a friendly, first-person description.
        
        Make it fun, relatable, but scientifically accurate.
      `
    }
  ];

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: moodSchema,
        systemInstruction: "You are PlantMood-AI. You translate biological signals into human-relatable emotions. Tone: Friendly, Scientific, Expressive.",
        temperature: 0.6,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);

  } catch (error) {
    console.error("Mood Analysis Failed:", error);
    throw error;
  }
}

export async function identifyPlant(imageBase64: string): Promise<PlantIdentificationResult> {
  const cleanImage = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  
  const parts = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanImage
      }
    },
    {
      text: `
        You are a highly accurate Plant Identification Assistant.
        
        TASK:
        1. Analyze the image carefully.
        2. Identify the plant species.
        3. Determine key characteristics and current health condition (healthy, yellowing, wilted, etc.) based ONLY on the visual evidence.
        4. Provide a full profile with care instructions.
        
        If the image is unclear or not a plant, indicate this in the description.
        Tone: Friendly, simple, and helpful for beginners.
      `
    }
  ];

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: identificationSchema,
        systemInstruction: "You are an expert botanist. Identify plants accurately. Never guess wildly. If uncertain, provide the most likely family or genus and mention the uncertainty.",
        temperature: 0.3,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);
  } catch (error) {
    console.error("Plant Identification Failed:", error);
    throw error;
  }
}

// Helper to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper to resize image
export const resizeImage = (base64Str: string, maxWidth = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scaleSize = maxWidth / img.width;
      const finalScale = scaleSize < 1 ? scaleSize : 1; 
      canvas.width = img.width * finalScale;
      canvas.height = img.height * finalScale;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6)); 
    };
  });
};

// --- LIVE API HELPERS ---

export function b64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}