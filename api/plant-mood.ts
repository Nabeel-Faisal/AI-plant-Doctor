import type { IncomingMessage, ServerResponse } from 'http';
import { getGroqClient, readJson, requestJsonCompletion, toImageContentPart, withHandler } from './_util.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await withHandler(res, async () => {
    const { imageBase64, sensorData } = await readJson(req);
    if (!imageBase64) throw new Error('imageBase64 is required');

    const groq = await getGroqClient();
    const parts: any[] = [
      toImageContentPart(imageBase64),
      {
        type: 'text',
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

          Respond ONLY with a JSON object matching this exact shape:
          {
            "moodEmoji": string (single emoji),
            "moodTitle": string,
            "moodDescription": string,
            "biologicalSignals": string[],
            "seriousness": "Low" | "Medium" | "High",
            "actionPlan": [ { "category": "Watering"|"Fertilizer"|"Sunlight"|"Repotting"|"General", "action": string, "reason": string, "expectedImprovement": string, "timeline": string } ]
          }
        `,
      },
    ];

    return await requestJsonCompletion(
      groq,
      'You are PlantMood-AI. You translate biological signals into human-relatable emotions. Tone: Friendly, Scientific, Expressive. Always respond with valid JSON only.',
      parts,
      0.6
    );
  });
}
