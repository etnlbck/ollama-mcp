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
