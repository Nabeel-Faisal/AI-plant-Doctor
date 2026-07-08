import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, node: process.version, hasGroqKey: !!process.env.GROQ_API_KEY }));
}
