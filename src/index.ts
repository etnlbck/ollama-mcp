#!/usr/bin/env node

import express from 'express';
import { randomUUID } from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  InitializeRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { OllamaClient, ChatMessage } from './ollama-client.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const ollama = new OllamaClient(OLLAMA_BASE_URL);

class OllamaMCPServer {
  private server: Server;

  constructor() {
    this.server = this.createServer();
  }

  private createServer(): Server {
    const server = new Server(
      {
        name: 'ollama-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers(server);
    this.setupErrorHandling(server);

    return server;
  }

  private setupErrorHandling(server: Server): void {
    server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(server: Server): void {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
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
        ] satisfies Tool[],
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ollama_list_models': {
            const models = await ollama.listModels();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(models, null, 2),
                },
              ],
            };
          }

          case 'ollama_chat': {
            const { model, messages } = args as {
              model: string;
              messages: ChatMessage[];
            };

            const response = await ollama.chat(model, messages);
            return {
              content: [
                {
                  type: 'text',
                  text: response.message.content,
                },
              ],
            };
          }

          case 'ollama_generate': {
            const { model, prompt } = args as {
              model: string;
              prompt: string;
            };

            const response = await ollama.generateResponse(model, prompt);
            return {
              content: [
                {
                  type: 'text',
                  text: response,
                },
              ],
            };
          }

          case 'ollama_pull_model': {
            const { model } = args as { model: string };

            await ollama.pullModel(model);
            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully pulled model: ${model}`,
                },
              ],
            };
          }

          case 'ollama_delete_model': {
            const { model } = args as { model: string };

            await ollama.deleteModel(model);
            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully deleted model: ${model}`,
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private isInitializeRequest(payload: unknown): payload is InitializeRequest {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'method' in payload &&
      (payload as { method: string }).method === 'initialize'
    );
  }

  async run(): Promise<void> {
    const transportType = (process.env.MCP_TRANSPORT || 'stdio').toLowerCase();

    if (transportType === 'http' || transportType === 'streamable') {
      await this.runHttpServer();
      return;
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Ollama MCP Server running on stdio');
  }

  private async runHttpServer(): Promise<void> {
    const host = process.env.MCP_HTTP_HOST || '0.0.0.0';
    const port = Number(process.env.PORT ?? process.env.MCP_HTTP_PORT ?? 8080);

    if (Number.isNaN(port) || port <= 0) {
      throw new Error('Invalid HTTP port specified for MCP server');
    }

    const allowedOrigins = process.env.MCP_HTTP_ALLOWED_ORIGINS
      ?.split(',')
      .map((origin: string) => origin.trim())
      .filter(Boolean);

    const app = express();
    app.use(express.json());

    const transports: Record<string, StreamableHTTPServerTransport> = {};

    app.post('/mcp', async (req: express.Request, res: express.Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport | undefined;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && this.isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id: string) => {
            if (id) {
              transports[id] = transport as StreamableHTTPServerTransport;
            }
          },
          allowedOrigins,
          enableDnsRebindingProtection:
            process.env.MCP_HTTP_ENABLE_DNS_PROTECTION === 'true',
        });

        transport.onclose = () => {
          if (transport?.sessionId) {
            delete transports[transport.sessionId];
          }
        };

        const server = this.createServer();
        await server.connect(transport);
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
    });

    const handleSessionRequest = async (
      req: express.Request,
      res: express.Response
    ) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    };

    app.get('/mcp', handleSessionRequest);
    app.delete('/mcp', handleSessionRequest);
    app.get('/healthz', (_req: express.Request, res: express.Response) => {
      res.status(200).json({ status: 'ok' });
    });

    app.listen(port, host, () => {
      console.error(
        `Ollama MCP Server running on Streamable HTTP at http://${host}:${port}/mcp`
      );
    });
  }
}

const server = new OllamaMCPServer();
server.run().catch(console.error);