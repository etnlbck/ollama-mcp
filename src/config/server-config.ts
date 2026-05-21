/**
 * Server configuration management
 *
 * This module handles all configuration for the Ollama MCP Server,
 * including environment variables, defaults, and validation.
 */

import { OllamaClient, OllamaClientOptions } from '../ollama-client.js';

export interface ServerConfig {
  ollama: {
    baseUrl: string;
    apiKey?: string;
    cloudBaseUrl: string;
  };
  transport: {
    type: 'stdio' | 'http';
    http?: {
      host: string;
      port: number;
      allowedOrigins?: string[];
      enableDnsRebindingProtection: boolean;
    };
  };
  server: {
    name: string;
    version: string;
  };
}

const DEFAULT_CLOUD_BASE_URL = 'https://ollama.com';

/**
 * Load and validate server configuration from environment variables
 */
export function loadConfig(): ServerConfig {
  const transportType = (process.env.MCP_TRANSPORT || 'stdio').toLowerCase() as 'stdio' | 'http';

  const apiKey = process.env.OLLAMA_API_KEY?.trim() || undefined;

  const config: ServerConfig = {
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      apiKey,
      cloudBaseUrl: process.env.OLLAMA_CLOUD_BASE_URL || DEFAULT_CLOUD_BASE_URL,
    },
    transport: {
      type: transportType,
    },
    server: {
      name: 'ollama-mcp-server',
      version: '1.0.0',
    },
  };

  // Add HTTP-specific configuration if using HTTP transport
  if (transportType === 'http') {
    const port = Number(process.env.PORT ?? process.env.MCP_HTTP_PORT ?? 8080);

    if (Number.isNaN(port) || port <= 0) {
      throw new Error('Invalid HTTP port specified for MCP server');
    }

    const allowedOrigins = process.env.MCP_HTTP_ALLOWED_ORIGINS
      ?.split(',')
      .map((origin: string) => origin.trim())
      .filter(Boolean);

    config.transport.http = {
      host: process.env.MCP_HTTP_HOST || '0.0.0.0',
      port,
      allowedOrigins,
      enableDnsRebindingProtection: process.env.MCP_HTTP_ENABLE_DNS_PROTECTION === 'true',
    };
  }

  return config;
}

/**
 * Validate that all required configuration is present
 */
export function validateConfig(config: ServerConfig): void {
  if (!config.ollama.baseUrl) {
    throw new Error('OLLAMA_BASE_URL is required');
  }

  if (config.transport.type === 'http' && !config.transport.http) {
    throw new Error('HTTP transport configuration is required when using HTTP transport');
  }
}

export function ollamaClientOptionsFromConfig(config: ServerConfig): OllamaClientOptions {
  return {
    baseUrl: config.ollama.baseUrl,
    apiKey: config.ollama.apiKey,
    cloudBaseUrl: config.ollama.cloudBaseUrl,
  };
}

/**
 * Create an OllamaClient from server configuration
 */
export function createOllamaClient(config: ServerConfig): OllamaClient {
  return new OllamaClient(ollamaClientOptionsFromConfig(config));
}
