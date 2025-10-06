import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { OllamaClient } from '../ollama-client.js';
import { setupToolHandlers } from '../tools/tool-handlers.js';

export interface MCPServerConfig {
  name: string;
  version: string;
  capabilities: {
    tools: Record<string, unknown>;
  };
}

export class MCPServer {
  private server: Server;
  private ollamaClient: OllamaClient;

  constructor(config: MCPServerConfig, ollamaClient: OllamaClient) {
    this.ollamaClient = ollamaClient;
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: config.capabilities,
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    setupToolHandlers(this.server, this.ollamaClient);
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  getServer(): Server {
    return this.server;
  }
}
