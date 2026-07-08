import type { IncomingMessage, ServerResponse } from 'http';
import { getGroqClient, readJson, sendJson } from './_util.js';

const TTS_MODEL = 'canopylabs/orpheus-v1-english';
const TTS_VOICE = 'austin';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const { text } = await readJson(req);
    if (!text) throw new Error('text is required');

    const groq = await getGroqClient();
    const response = await groq.audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: text,
      response_format: 'wav',
    });

    const arrayBuffer = await response.arrayBuffer();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/wav');
    res.end(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error(err);
    sendJson(res, 500, { error: err?.message || 'Speech synthesis failed' });
  }
}
