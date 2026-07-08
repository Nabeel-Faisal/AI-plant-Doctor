import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const API_ROUTES = [
  'ping',
  'ping-groq',
  'analyze-plant',
  'growth-simulation',
  'plant-mood',
  'identify-plant',
  'voice-transcribe',
  'voice-chat',
  'voice-speak',
];

// Runs the exact same /api/*.ts handlers Vercel will use in production,
// so `npm run dev` (including phone LAN testing) exercises real code paths.
function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url || '';
        const match = API_ROUTES.find(route => url === `/api/${route}` || url.startsWith(`/api/${route}?`));
        if (!match) {
          next();
          return;
        }
        try {
          const mod = await server.ssrLoadModule(path.resolve(__dirname, `api/${match}.ts`));
          await mod.default(req, res);
        } catch (err) {
          console.error(`[api-dev-middleware] /api/${match} failed:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    // loadEnv() only returns parsed .env values, it doesn't populate process.env itself —
    // the /api dev-middleware handlers below need it there (Vercel does this automatically in prod).
    const env = loadEnv(mode, '.', '');
    if (!process.env.GROQ_API_KEY && env.GROQ_API_KEY) {
      process.env.GROQ_API_KEY = env.GROQ_API_KEY;
    }
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        apiDevMiddleware(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icons/apple-touch-icon.png'],
          manifest: {
            name: 'AI Plant Doctor',
            short_name: 'Plant Doctor',
            description: 'Predictive AI plant health, growth simulation, and live voice care — powered by Groq Vision.',
            start_url: '/',
            display: 'standalone',
            background_color: '#0a1210',
            theme_color: '#0a1410',
            orientation: 'portrait',
            icons: [
              { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
              { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
          },
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
