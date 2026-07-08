import type { IncomingMessage, ServerResponse } from 'http';
import type Groq from 'groq-sdk';

export const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Dynamic import instead of a static top-level one — under this project's
// "type": "module" setting, Vercel's per-function bundler was crashing every
// route that statically imported groq-sdk (FUNCTION_INVOCATION_FAILED before
// our own error handling even ran); a dynamic import resolves it correctly.
export async function getGroqClient(): Promise<Groq> {
  const { default: GroqClient } = await import('groq-sdk');
  return new GroqClient({ apiKey: process.env.GROQ_API_KEY });
}

type ReqWithBody = IncomingMessage & { body?: unknown };

export async function readJson(req: ReqWithBody): Promise<any> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return req.body.length ? JSON.parse(req.body) : {};
    if (Buffer.isBuffer(req.body)) return req.body.length ? JSON.parse(req.body.toString('utf8')) : {};
    return req.body;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw.length ? JSON.parse(raw) : {};
}

export function sendJson(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(body);
}

export function stripDataUrlPrefix(base64: string): string {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
}

export function toImageContentPart(base64: string) {
  const clean = stripDataUrlPrefix(base64);
  return {
    type: 'image_url' as const,
    image_url: { url: `data:image/jpeg;base64,${clean}` },
  };
}

export async function requestJsonCompletion(
  groq: Groq,
  systemInstruction: string,
  userParts: any[],
  temperature: number
): Promise<any> {
  const completion = await groq.chat.completions.create({
    model: VISION_MODEL,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userParts },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('No response from AI');
  return JSON.parse(text);
}

export async function withHandler(
  res: ServerResponse,
  fn: () => Promise<unknown>
): Promise<void> {
  try {
    const data = await fn();
    sendJson(res, 200, data);
  } catch (err: any) {
    console.error(err);
    sendJson(res, 500, { error: err?.message || 'Internal server error' });
  }
}
