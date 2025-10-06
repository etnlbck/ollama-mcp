# Ollama MCP Server Architecture

## Overview

The Ollama MCP Server provides Model Context Protocol (MCP) tools for interacting with Ollama models. It's designed with modularity and readability in mind.

## Project Structure

```
src/
├── main.ts                 # Main entry point
├── config/
│   └── server-config.ts    # Configuration management
├── server/
│   └── mcp-server.ts       # Core MCP server implementation
├── tools/
│   └── tool-handlers.ts    # MCP tool implementations
├── transports/
│   ├── stdio-transport.ts  # Stdio transport for local development
│   └── http-transport.ts   # HTTP transport for remote deployment
├── ollama-client.ts        # Ollama API client
└── types.d.ts             # TypeScript type definitions

docs/
├── ARCHITECTURE.md         # This file
├── API.md                  # API documentation
└── DEPLOYMENT.md           # Deployment guides

config/
├── mcp.config.json         # MCP client configuration
└── railway-models/         # Model definitions for Railway

scripts/
└── upload-models-to-railway.sh  # Railway deployment script
```

## Core Components

### 1. MCP Server (`src/server/mcp-server.ts`)

The central component that:
- Manages the MCP protocol implementation
- Handles tool registration and execution
- Provides error handling and logging
- Manages server lifecycle

### 2. Tool Handlers (`src/tools/tool-handlers.ts`)

Implements the MCP tools:
- `ollama_list_models`: List available models
- `ollama_chat`: Chat with models using conversation history
- `ollama_generate`: Generate responses with single prompts
- `ollama_pull_model`: Download models from registry
- `ollama_delete_model`: Remove models from local storage

### 3. Transports

#### Stdio Transport (`src/transports/stdio-transport.ts`)
- Used for local development
- Direct process communication
- Default transport mode

#### HTTP Transport (`src/transports/http-transport.ts`)
- Used for remote deployment (Railway, etc.)
- WebSocket-based communication
- Session management
- Health check endpoint

### 4. Ollama Client (`src/ollama-client.ts`)

Handles communication with the Ollama API:
- Model management (list, pull, delete)
- Chat and generation requests
- Error handling and response parsing

### 5. Configuration (`src/config/server-config.ts`)

Centralized configuration management:
- Environment variable loading
- Default value handling
- Configuration validation

## Design Principles

### 1. Separation of Concerns
Each module has a single responsibility:
- Server handles MCP protocol
- Tools handle specific functionality
- Transports handle communication
- Client handles Ollama API

### 2. Dependency Injection
Components receive dependencies rather than creating them:
- Server receives Ollama client
- Transports receive server instance
- Configuration is injected where needed

### 3. Error Handling
Consistent error handling throughout:
- Try-catch blocks in all async operations
- Meaningful error messages
- Graceful degradation where possible

### 4. Type Safety
Strong typing throughout:
- TypeScript interfaces for all data structures
- Generic types for reusability
- Strict type checking enabled

## Data Flow

1. **Client Request** → Transport receives MCP request
2. **Transport** → Routes to appropriate handler
3. **Tool Handler** → Processes request and calls Ollama client
4. **Ollama Client** → Makes API call to Ollama
5. **Response** → Flows back through the chain

## Configuration

The server can be configured via environment variables:

- `MCP_TRANSPORT`: Transport type (`stdio` or `http`)
- `OLLAMA_BASE_URL`: Ollama API base URL
- `MCP_HTTP_HOST`: HTTP server host (HTTP mode)
- `MCP_HTTP_PORT`: HTTP server port (HTTP mode)
- `MCP_HTTP_ALLOWED_ORIGINS`: CORS allowed origins (HTTP mode)

## Error Handling Strategy

1. **Validation Errors**: Invalid configuration or input
2. **Network Errors**: Ollama API communication failures
3. **Protocol Errors**: MCP protocol violations
4. **System Errors**: Unexpected runtime errors

Each error type is handled appropriately with meaningful messages and proper HTTP status codes.
