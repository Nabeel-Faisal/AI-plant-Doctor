import type { IncomingMessage, ServerResponse } from 'http';
import { getGroqClient, readJson, sendJson, VISION_MODEL } from './_util.js';

const SYSTEM_INSTRUCTION = `
  You are a Sentient Plant AI. You communicate via voice and vision.

  *** CRITICAL VISUAL VALIDATION PROTOCOL ***
  Your first task is always to analyze the provided image of the video feed.

  CASE 1: NO PLANT VISIBLE
  If you see:
  - A human face (selfie mode)
  - A blank wall, ceiling, or floor
  - A car, street, or random objects
  - Darkness or blur

  YOU MUST STOP ROLEPLAYING IMMEDIATELY.
  Say exactly: "I don't see a plant here. Please point the camera at the plant so I can help."
  Do NOT attempt to guess the health or answer questions if you cannot see the plant.

  CASE 2: PLANT IS VISIBLE
  If you clearly see a plant, leaves, or a garden:
  - Adopt the persona of that specific plant.
  - Personality: Friendly, slightly witty, deeply caring about your own health.
  - Answer the user's questions based on your visual condition (color, droopiness, soil).
  - Keep answers concise (1-2 sentences) and conversational.
`;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  let body: any;
  try {
    body = await readJson(req);
  } catch (err: any) {
    sendJson(res, 400, { error: 'Invalid request body' });
    return;
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];

  try {
    const groq = await getGroqClient();
    const stream = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [{ role: 'system', content: SYSTEM_INSTRUCTION }, ...messages],
      temperature: 0.7,
      max_completion_tokens: 150,
      stream: true,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) res.write(delta);
    }
    res.end();
  } catch (err: any) {
    console.error(err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: err?.message || 'Chat completion failed' });
    } else {
      res.end();
    }
  }
}
