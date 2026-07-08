import type { IncomingMessage, ServerResponse } from 'http';
import { getGroqClient, readJson, requestJsonCompletion, toImageContentPart, withHandler } from './_util.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await withHandler(res, async () => {
    const { imageBase64, envData } = await readJson(req);
    if (!imageBase64) throw new Error('imageBase64 is required');

    const groq = await getGroqClient();
    const parts: any[] = [
      toImageContentPart(imageBase64),
      {
        type: 'text',
        text: `
          You are an advanced Plant Digital Twin Engine.
          Your job is to create a full AI-driven growth simulation of this plant using the image and environment data.

          ENVIRONMENT DATA:
          - Soil Quality: ${envData?.soilQuality}
          - Sunlight: ${envData?.sunlightHours} hours (${envData?.sunlightType})
          - Temp/Humidity: ${envData?.temperature} / ${envData?.humidity}
          - Watering: ${envData?.wateringFrequency}
          - Fertilizer: ${envData?.fertilizer}

          TASK:
          A) Identify & Analyze: Identify species, natural growth pattern, and current stress.
          B) Create Digital Twin Simulation:
             - 14-Day Projection: Predicted leaf growth, color changes, early stress.
             - 30-Day Projection: Leaf expansion, stem growth, flowering probability.
             - 60-Day Projection: Full maturity shape, canopy size, root expansion, long-term health.
          C) Visual Description: Describe EXACTLY how the plant looks at each stage (Volume, orientation, color).
          D) Smart Care Recommendations: Specific to this simulation.

          Respond ONLY with a JSON object matching this exact shape:
          {
            "plantIdentity": string,
            "naturalGrowthPattern": string,
            "currentStressAnalysis": string,
            "phases": [ { "day": 14|30|60, "title": string, "heightEstimate": string, "visualDescription": string, "healthScorePrediction": number, "keyChanges": string[], "risks": string[] } ],
            "smartCareRecommendations": [ { "category": "Watering"|"Fertilizer"|"Sunlight"|"Repotting"|"General", "action": string, "reason": string, "expectedImprovement": string, "timeline": string } ]
          }
        `,
      },
    ];

    return await requestJsonCompletion(
      groq,
      'You are a Digital Twin Engine. You simulate biological growth based on environmental variables. Be precise, scientific, and visually descriptive. Always respond with valid JSON only.',
      parts,
      0.5
    );
  });
}
