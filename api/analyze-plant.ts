import type { IncomingMessage, ServerResponse } from 'http';
import { getGroqClient, readJson, requestJsonCompletion, toImageContentPart, withHandler } from './_util.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await withHandler(res, async () => {
    const { currentImageBase64, previousImageBase64, plantDetails } = await readJson(req);
    if (!currentImageBase64) throw new Error('currentImageBase64 is required');

    const groq = await getGroqClient();
    const parts: any[] = [];

    let promptText = `
      You are an AI Plant Doctor using advanced computer vision to analyze plant health.

      TASK:
      1. Analyze this plant image for specific disease indicators, stress patterns, and overall vitality.
      2. Detect micro-deviations in color, texture, and leaf posture that suggest early-stage issues (pre-symptomatic).
      3. Predict the health trajectory for the next 7 days based on current visual data.
      4. Provide specific treatment recommendations.

      Plant Details: ${plantDetails || 'Unknown species'}
    `;

    if (previousImageBase64) {
      parts.push(toImageContentPart(previousImageBase64));
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

    parts.push(toImageContentPart(currentImageBase64));

    promptText += `

      Respond ONLY with a JSON object matching this exact shape:
      {
        "healthScore": number (0-100),
        "overallStatus": "Healthy" | "Warning" | "Critical",
        "identifiedSymptoms": string[],
        "hiddenRisks": string[],
        "riskProbabilities": {
          "rootRot": number, "nutrientDeficiency": number, "underwatering": number,
          "overwatering": number, "pestInfection": number, "fungalGrowth": number, "lightBurn": number
        },
        "forecast": [ { "day": string, "healthScore": number, "riskDescription": string } ],
        "recommendations": [ { "category": "Watering"|"Fertilizer"|"Sunlight"|"Repotting"|"General", "action": string, "reason": string, "expectedImprovement": string, "timeline": string } ]
      }
    `;

    parts.push({ type: 'text', text: promptText });

    const data = await requestJsonCompletion(
      groq,
      "You are the world's most advanced plant pathologist AI. Your goal is PREDICTIVE healthcare, not just reactive diagnosis. You must identify issues before they become fatal. Always respond with valid JSON only.",
      parts,
      0.4
    );

    return {
      ...data,
      date: new Date().toISOString(),
      rawAnalysisText: 'Analysis complete.',
    };
  });
}
