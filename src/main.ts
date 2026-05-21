#!/usr/bin/env node

import { MCPServer } from './server/mcp-server.js';
import { StdioTransport } from './transports/stdio-transport.js';
import { HTTPTransport } from './transports/http-transport.js';
import { loadConfig, validateConfig, createOllamaClient } from './config/server-config.js';

/**
 * Main entry point for the Ollama MCP Server
 *
 * This server provides MCP (Model Context Protocol) tools for interacting with Ollama:
 * - List available models
 * - Chat with models using conversation history
 * - Generate responses with single prompts
 * - Pull/download models from registry
 * - Delete models from local installation
 *
 * Transport modes:
 * - stdio: Default mode for local development and direct integration
 * - http: HTTP/WebSocket mode for remote deployment (Railway, etc.)
 */

async function main(): Promise<void> {
  const config = loadConfig();
  validateConfig(config);

  const ollamaClient = createOllamaClient(config);

  const mcpServer = new MCPServer(
    {
      name: config.server.name,
      version: config.server.version,
      capabilities: { tools: {} },
    },
    ollamaClient
  );

  if (config.transport.type === 'http') {
    const httpConfig = config.transport.http!;
    const transport = new HTTPTransport(
      {
        host: httpConfig.host,
        port: httpConfig.port,
        allowedOrigins: httpConfig.allowedOrigins,
        enableDnsRebindingProtection: httpConfig.enableDnsRebindingProtection,
      },
      ollamaClient,
      {
        name: config.server.name,
        version: config.server.version,
      }
    );
    await transport.start();
  } else {
    const transport = new StdioTransport();
    await transport.connect(mcpServer.getServer());
  }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
