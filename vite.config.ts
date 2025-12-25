import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Simple in-memory store for stream config
const streamConfigPlugin = (): Plugin => {
  let currentConfig = {
    tasks: [
      { name: "Auth system", status: "done" },
      { name: "API endpoints", status: "done" },
      { name: "Real-time sync", status: "building" },
      { name: "Deploy to prod", status: "todo" }
    ]
  };

  // Store SSE clients for real-time updates
  const sseClients: Set<ServerResponse> = new Set();

  const broadcastUpdate = () => {
    const data = `data: ${JSON.stringify(currentConfig)}\n\n`;
    sseClients.forEach(client => {
      client.write(data);
    });
  };

  return {
    name: 'stream-config-api',
    configureServer(server) {
      // SSE endpoint for real-time updates (must be registered BEFORE /api/config)
      server.middlewares.use('/api/stream', (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'GET') {
          next();
          return;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Send current config immediately
        res.write(`data: ${JSON.stringify(currentConfig)}\n\n`);

        sseClients.add(res);

        req.on('close', () => {
          sseClients.delete(res);
        });
      });

      // GET/POST /api/config - Get or update current config
      server.middlewares.use('/api/config', (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(currentConfig));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              currentConfig = JSON.parse(body);
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true }));
              broadcastUpdate();
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end();
          return;
        }

        next();
      });
    }
  };
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), streamConfigPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      appType: 'spa'
    };
});
