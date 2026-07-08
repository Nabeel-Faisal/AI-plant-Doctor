import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const mod: any = await import('groq-sdk');
    const Groq = mod.default || mod.Groq || mod;
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    res.statusCode = 200;
    res.end(JSON.stringify({
      ok: true,
      hasDefault: !!mod.default,
      moduleKeys: Object.keys(mod),
      clientType: typeof client,
      hasChat: !!client?.chat,
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({
      ok: false,
      name: err?.name,
      message: err?.message,
      stack: String(err?.stack || '').split('\n').slice(0, 8),
    }));
  }
}
