import type { IncomingMessage, ServerResponse } from 'http';
import { getGroqClient, readJson, requestJsonCompletion, toImageContentPart, withHandler } from './_util';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await withHandler(res, async () => {
    const { imageBase64 } = await readJson(req);
    if (!imageBase64) throw new Error('imageBase64 is required');

    const groq = getGroqClient();
    const parts: any[] = [
      toImageContentPart(imageBase64),
      {
        type: 'text',
        text: `
          You are a highly accurate Plant Identification Assistant.

          TASK:
          1. Analyze the image carefully.
          2. Identify the plant species.
          3. Determine key characteristics and current health condition (healthy, yellowing, wilted, etc.) based ONLY on the visual evidence.
          4. Provide a full profile with care instructions.

          If the image is unclear or not a plant, indicate this in the description.
          Tone: Friendly, simple, and helpful for beginners.

          Respond ONLY with a JSON object matching this exact shape:
          {
            "commonName": string,
            "scientificName": string,
            "description": string,
            "care": { "watering": string, "sunlight": string, "soil": string, "temperature": string, "humidity": string, "fertilizer": string },
            "healthStatusFromImage": string,
            "commonIssues": string,
            "beginnerTips": string
          }
        `,
      },
    ];

    return await requestJsonCompletion(
      groq,
      'You are an expert botanist. Identify plants accurately. Never guess wildly. If uncertain, provide the most likely family or genus and mention the uncertainty. Always respond with valid JSON only.',
      parts,
      0.3
    );
  });
}
