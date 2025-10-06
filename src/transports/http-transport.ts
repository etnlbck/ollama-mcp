import express from 'express';
import { randomUUID } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { MCPServer } from '../server/mcp-server.js';
import { OllamaClient } from '../ollama-client.js';

export interface HTTPTransportConfig {
  host: string;
  port: number;
  allowedOrigins?: string[];
  enableDnsRebindingProtection?: boolean;
}

export class HTTPTransport {
  private config: HTTPTransportConfig;
  private app: express.Application;
  private sessions: Map<string, StreamableHTTPServerTransport> = new Map();

  constructor(config: HTTPTransportConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Root endpoint - Server information
    this.app.get('/', (_req: express.Request, res: express.Response) => {
      const uptime = process.uptime();
      const timestamp = new Date().toISOString();
      
      res.status(200).json({
        name: 'Ollama MCP Server',
        version: '1.0.0',
        status: 'running',
        protocol: 'MCP (Model Context Protocol)',
        endpoints: {
          mcp: 'POST /mcp - MCP protocol endpoint',
          health: 'GET /healthz - Health check',
          tools: 'GET /tools - List available tools (via MCP)',
          models: 'GET /models - List available Ollama models (via MCP)'
        },
        timestamp,
        uptime: Math.round(uptime * 1000) / 1000
      });
    });

    // Main MCP endpoint
    this.app.post('/mcp', async (req: express.Request, res: express.Response) => {
      await this.handleMCPRequest(req, res);
    });

    // Session management endpoints
    this.app.get('/mcp', async (req: express.Request, res: express.Response) => {
      await this.handleSessionRequest(req, res);
    });

    this.app.delete('/mcp', async (req: express.Request, res: express.Response) => {
      await this.handleSessionRequest(req, res);
    });

    // Health check endpoint
    this.app.get('/healthz', (_req: express.Request, res: express.Response) => {
      res.status(200).json({ status: 'ok' });
    });

    // Convenience endpoints for easy access to MCP tools
    this.app.get('/tools', async (_req: express.Request, res: express.Response) => {
      try {
        // Return the available tools directly
        const tools = [
          {
            name: 'ollama_list_models',
            description: 'List all available Ollama models on the local machine',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'ollama_chat',
            description: 'Chat with an Ollama model using conversation history',
            inputSchema: {
              type: 'object',
              properties: {
                model: {
                  type: 'string',
                  description: 'The name of the Ollama model to use',
                },
                messages: {
                  type: 'array',
                  description: 'Array of chat messages with role and content',
                  items: {
                    type: 'object',
                    properties: {
                      role: {
                        type: 'string',
                        enum: ['system', 'user', 'assistant'],
                        description: 'The role of the message sender',
                      },
                      content: {
                        type: 'string',
                        description: 'The content of the message',
                      },
                    },
                    required: ['role', 'content'],
                  },
                },
              },
              required: ['model', 'messages'],
            },
          },
          {
            name: 'ollama_generate',
            description: 'Generate a response from an Ollama model with a single prompt',
            inputSchema: {
              type: 'object',
              properties: {
                model: {
                  type: 'string',
                  description: 'The name of the Ollama model to use',
                },
                prompt: {
                  type: 'string',
                  description: 'The prompt to send to the model',
                },
              },
              required: ['model', 'prompt'],
            },
          },
          {
            name: 'ollama_pull_model',
            description: 'Pull/download a model from the Ollama registry',
            inputSchema: {
              type: 'object',
              properties: {
                model: {
                  type: 'string',
                  description: 'The name of the model to pull (e.g., llama2, mistral)',
                },
              },
              required: ['model'],
            },
          },
          {
            name: 'ollama_delete_model',
            description: 'Delete a model from the local Ollama installation',
            inputSchema: {
              type: 'object',
              properties: {
                model: {
                  type: 'string',
                  description: 'The name of the model to delete',
                },
              },
              required: ['model'],
            },
          },
        ];

        res.status(200).json({ tools });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to list tools',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    this.app.get('/models', async (_req: express.Request, res: express.Response) => {
      try {
        const ollamaClient = new OllamaClient(process.env.OLLAMA_BASE_URL || 'http://localhost:11434');
        const models = await ollamaClient.listModels();
        res.status(200).json({ models });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to list models',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }

  private async handleMCPRequest(req: express.Request, res: express.Response): Promise<void> {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport | undefined;

      if (sessionId && this.sessions.has(sessionId)) {
        transport = this.sessions.get(sessionId);
      } else if (!sessionId && this.isInitializeRequest(req.body)) {
        transport = await this.createNewSession();
      }

      if (!transport) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[MCP HTTP Error]', error);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32002,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }

  private async handleSessionRequest(req: express.Request, res: express.Response): Promise<void> {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !this.sessions.has(sessionId)) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      const transport = this.sessions.get(sessionId)!;
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('[MCP HTTP Error]', error);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32002,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }

  private async createNewSession(): Promise<StreamableHTTPServerTransport> {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id: string) => {
        if (id) {
          this.sessions.set(id, transport);
        }
      },
      allowedOrigins: this.config.allowedOrigins,
      enableDnsRebindingProtection: this.config.enableDnsRebindingProtection,
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        this.sessions.delete(transport.sessionId);
      }
    };

    // Create a new MCP server instance for this session
    const ollamaClient = new OllamaClient(process.env.OLLAMA_BASE_URL || 'http://localhost:11434');
    const mcpServer = new MCPServer(
      {
        name: 'ollama-mcp-server',
        version: '1.0.0',
        capabilities: { tools: {} },
      },
      ollamaClient
    );

    await mcpServer.getServer().connect(transport);
    return transport;
  }

  private isInitializeRequest(payload: unknown): boolean {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'method' in payload &&
      (payload as { method: string }).method === 'initialize'
    );
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, this.config.host, () => {
        console.error(
          `Ollama MCP Server running on Streamable HTTP at http://${this.config.host}:${this.config.port}/mcp`
        );
        resolve();
      });
    });
  }
}
