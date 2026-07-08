import { AnalysisResult, EnvironmentData, SimulationResult, MoodReport, PlantIdentificationResult } from "./types";

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // response wasn't JSON, keep default message
    }
    throw new Error(message);
  }

  return response.json();
}

export async function analyzePlantImage(
  currentImageBase64: string,
  previousImageBase64?: string,
  plantDetails?: string
): Promise<AnalysisResult> {
  return postJson<AnalysisResult>('/api/analyze-plant', {
    currentImageBase64,
    previousImageBase64,
    plantDetails,
  });
}

export async function generateGrowthSimulation(
  imageBase64: string,
  envData: EnvironmentData
): Promise<Omit<SimulationResult, 'id' | 'date' | 'environmentUsed'>> {
  return postJson('/api/growth-simulation', { imageBase64, envData });
}

export async function analyzePlantMood(
  imageBase64: string,
  sensorData: Record<string, string>
): Promise<Omit<MoodReport, 'id' | 'date'>> {
  return postJson('/api/plant-mood', { imageBase64, sensorData });
}

export async function identifyPlant(imageBase64: string): Promise<PlantIdentificationResult> {
  return postJson('/api/identify-plant', { imageBase64 });
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
