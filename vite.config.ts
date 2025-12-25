import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

// Types for tasks
type TaskStatus = 'done' | 'building' | 'todo';
interface Task {
  name: string;
  status: TaskStatus;
}
interface StreamConfig {
  tasks: Task[];
}

// Simple in-memory store for stream config
const streamConfigPlugin = (): Plugin => {
  let currentConfig: StreamConfig = {
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

  // Create MCP server with tools
  const createMcpServer = () => {
    const mcpServer = new McpServer({
      name: 'stream-status',
      version: '1.0.0',
    });

    // Tool: list_status - List all current tasks
    mcpServer.tool(
      'list_status',
      'List all current tasks and their statuses. Each task has a name and a status. Valid statuses are: "done" (completed), "building" (in progress), "todo" (not started).',
      {},
      async () => {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(currentConfig.tasks, null, 2)
          }]
        };
      }
    );

    // Tool: update_status - Add, remove, edit tasks
    mcpServer.tool(
      'update_status',
      'Update the task list. IMPORTANT: Status must be exactly one of: "done", "building", or "todo". No other values are accepted. Actions: "add" (add new task), "remove" (delete by name), "edit" (modify existing), "replace_all" (replace entire list).',
      {
        action: z.enum(['add', 'remove', 'edit', 'replace_all']).describe('Action: "add", "remove", "edit", or "replace_all"'),
        taskName: z.string().optional().describe('Name of the task (required for add, remove, edit)'),
        newName: z.string().optional().describe('New name for the task (optional, only for edit)'),
        status: z.enum(['done', 'building', 'todo']).optional().describe('MUST be exactly: "done", "building", or "todo". Required for add, optional for edit.'),
        tasks: z.array(z.object({
          name: z.string().describe('Task name'),
          status: z.enum(['done', 'building', 'todo']).describe('MUST be: "done", "building", or "todo"')
        })).optional().describe('Full task list (required for replace_all). Each task needs name and status ("done"/"building"/"todo").')
      },
      async ({ action, taskName, newName, status, tasks }) => {
        let message = '';

        switch (action) {
          case 'add':
            if (!taskName || !status) {
              return { content: [{ type: 'text', text: 'Error: taskName and status are required for add action' }] };
            }
            if (currentConfig.tasks.some(t => t.name === taskName)) {
              return { content: [{ type: 'text', text: `Error: Task "${taskName}" already exists` }] };
            }
            currentConfig.tasks.push({ name: taskName, status });
            message = `Added task "${taskName}" with status "${status}"`;
            break;

          case 'remove':
            if (!taskName) {
              return { content: [{ type: 'text', text: 'Error: taskName is required for remove action' }] };
            }
            const removeIndex = currentConfig.tasks.findIndex(t => t.name === taskName);
            if (removeIndex === -1) {
              return { content: [{ type: 'text', text: `Error: Task "${taskName}" not found` }] };
            }
            currentConfig.tasks.splice(removeIndex, 1);
            message = `Removed task "${taskName}"`;
            break;

          case 'edit':
            if (!taskName) {
              return { content: [{ type: 'text', text: 'Error: taskName is required for edit action' }] };
            }
            const editIndex = currentConfig.tasks.findIndex(t => t.name === taskName);
            if (editIndex === -1) {
              return { content: [{ type: 'text', text: `Error: Task "${taskName}" not found` }] };
            }
            if (newName) {
              currentConfig.tasks[editIndex].name = newName;
            }
            if (status) {
              currentConfig.tasks[editIndex].status = status;
            }
            message = `Updated task "${taskName}"${newName ? ` -> "${newName}"` : ''}${status ? ` to status "${status}"` : ''}`;
            break;

          case 'replace_all':
            if (!tasks || !Array.isArray(tasks)) {
              return { content: [{ type: 'text', text: 'Error: tasks array is required for replace_all action' }] };
            }
            currentConfig.tasks = tasks;
            message = `Replaced all tasks with ${tasks.length} new tasks`;
            break;
        }

        // Broadcast update to all SSE clients
        broadcastUpdate();

        return {
          content: [{
            type: 'text',
            text: `${message}\n\nCurrent tasks:\n${JSON.stringify(currentConfig.tasks, null, 2)}`
          }]
        };
      }
    );

    return mcpServer;
  };

  // Store active MCP transports by session ID
  const mcpTransports: Map<string, StreamableHTTPServerTransport> = new Map();

  return {
    name: 'stream-config-api',
    configureServer(server) {
      // MCP endpoint for AI agents
      server.middlewares.use('/mcp', async (req: IncomingMessage, res: ServerResponse, next) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
          res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
          res.end();
          return;
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        try {
          if (req.method === 'GET') {
            // SSE connection for server-to-client notifications
            if (!sessionId || !mcpTransports.has(sessionId)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid or missing session ID' }));
              return;
            }
            const transport = mcpTransports.get(sessionId)!;
            await transport.handleRequest(req, res);
            return;
          }

          if (req.method === 'POST') {
            // Check if this is an existing session
            if (sessionId && mcpTransports.has(sessionId)) {
              const transport = mcpTransports.get(sessionId)!;
              await transport.handleRequest(req, res);
              return;
            }

            // New session - create transport and server
            const transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: () => crypto.randomUUID(),
              onsessioninitialized: (id) => {
                mcpTransports.set(id, transport);
              }
            });

            transport.onclose = () => {
              const id = Array.from(mcpTransports.entries())
                .find(([_, t]) => t === transport)?.[0];
              if (id) mcpTransports.delete(id);
            };

            const mcpServer = createMcpServer();
            await mcpServer.connect(transport);
            await transport.handleRequest(req, res);
            return;
          }

          if (req.method === 'DELETE') {
            // Close session
            if (sessionId && mcpTransports.has(sessionId)) {
              const transport = mcpTransports.get(sessionId)!;
              await transport.close();
              mcpTransports.delete(sessionId);
              res.statusCode = 200;
              res.end();
              return;
            }
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Session not found' }));
            return;
          }

          next();
        } catch (error) {
          console.error('MCP error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });

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
