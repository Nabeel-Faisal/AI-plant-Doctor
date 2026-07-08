import type { IncomingMessage, ServerResponse } from 'http';
import { getGroqClient, readJson, withHandler } from './_util.js';

const STT_MODEL = 'whisper-large-v3-turbo';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await withHandler(res, async () => {
    const { audioBase64, mimeType } = await readJson(req);
    if (!audioBase64) throw new Error('audioBase64 is required');

    const groq = await getGroqClient();
    const buffer = Buffer.from(audioBase64, 'base64');
    const file = new File([buffer], 'speech.webm', { type: mimeType || 'audio/webm' });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: STT_MODEL,
      response_format: 'json',
    });

    return { text: (transcription.text || '').trim() };
  });
}
