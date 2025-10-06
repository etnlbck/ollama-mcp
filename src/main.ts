#!/usr/bin/env node

import { OllamaClient } from './ollama-client.js';
import { MCPServer } from './server/mcp-server.js';
import { StdioTransport } from './transports/stdio-transport.js';
import { HTTPTransport } from './transports/http-transport.js';

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
  const transportType = (process.env.MCP_TRANSPORT || 'stdio').toLowerCase();
  
  // Initialize Ollama client
  const ollamaClient = new OllamaClient(process.env.OLLAMA_BASE_URL || 'http://localhost:11434');
  
  // Create MCP server
  const mcpServer = new MCPServer(
    {
      name: 'ollama-mcp-server',
      version: '1.0.0',
      capabilities: { tools: {} },
    },
    ollamaClient
  );

  // Start with appropriate transport
  if (transportType === 'http' || transportType === 'streamable') {
    await startHTTPTransport(mcpServer.getServer());
  } else {
    await startStdioTransport(mcpServer.getServer());
  }
}

async function startStdioTransport(server: any): Promise<void> {
  const transport = new StdioTransport();
  await transport.connect(server);
}

async function startHTTPTransport(server: any): Promise<void> {
  const host = process.env.MCP_HTTP_HOST || '0.0.0.0';
  const port = Number(process.env.PORT ?? process.env.MCP_HTTP_PORT ?? 8080);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error('Invalid HTTP port specified for MCP server');
  }

  const allowedOrigins = process.env.MCP_HTTP_ALLOWED_ORIGINS
    ?.split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean);

  const transport = new HTTPTransport({
    host,
    port,
    allowedOrigins,
    enableDnsRebindingProtection: process.env.MCP_HTTP_ENABLE_DNS_PROTECTION === 'true',
  });

  await transport.start();
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
