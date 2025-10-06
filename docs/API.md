# Ollama MCP Server API Documentation

## Overview

The Ollama MCP Server provides Model Context Protocol (MCP) tools for interacting with Ollama models. This document describes the available tools and their usage.

## Available Tools

### 1. `ollama_list_models`

Lists all available Ollama models on the local machine.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {}
}
```

**Example Usage:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "ollama_list_models",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "[{\"name\":\"llama2:latest\",\"model\":\"llama2:latest\",\"modified_at\":\"2024-01-01T00:00:00Z\",\"size\":3825819519,\"digest\":\"sha256:...\",\"details\":{...}}]"
    }
  ]
}
```

### 2. `ollama_chat`

Chat with an Ollama model using conversation history.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "model": {
      "type": "string",
      "description": "The name of the Ollama model to use"
    },
    "messages": {
      "type": "array",
      "description": "Array of chat messages with role and content",
      "items": {
        "type": "object",
        "properties": {
          "role": {
            "type": "string",
            "enum": ["system", "user", "assistant"],
            "description": "The role of the message sender"
          },
          "content": {
            "type": "string",
            "description": "The content of the message"
          }
        },
        "required": ["role", "content"]
      }
    }
  },
  "required": ["model", "messages"]
}
```

**Example Usage:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "ollama_chat",
    "arguments": {
      "model": "llama2:latest",
      "messages": [
        {
          "role": "user",
          "content": "Hello, how are you?"
        }
      ]
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Hello! I'm doing well, thank you for asking. How can I help you today?"
    }
  ]
}
```

### 3. `ollama_generate`

Generate a response from an Ollama model with a single prompt.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "model": {
      "type": "string",
      "description": "The name of the Ollama model to use"
    },
    "prompt": {
      "type": "string",
      "description": "The prompt to send to the model"
    }
  },
  "required": ["model", "prompt"]
}
```

**Example Usage:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "ollama_generate",
    "arguments": {
      "model": "llama2:latest",
      "prompt": "Write a short story about a robot learning to paint."
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Once upon a time, in a small workshop filled with brushes and canvases..."
    }
  ]
}
```

### 4. `ollama_pull_model`

Pull/download a model from the Ollama registry.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "model": {
      "type": "string",
      "description": "The name of the model to pull (e.g., llama2, mistral)"
    }
  },
  "required": ["model"]
}
```

**Example Usage:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "ollama_pull_model",
    "arguments": {
      "model": "mistral:7b"
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully pulled model: mistral:7b"
    }
  ]
}
```

### 5. `ollama_delete_model`

Delete a model from the local Ollama installation.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "model": {
      "type": "string",
      "description": "The name of the model to delete"
    }
  },
  "required": ["model"]
}
```

**Example Usage:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "ollama_delete_model",
    "arguments": {
      "model": "llama2:latest"
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully deleted model: llama2:latest"
    }
  ]
}
```

## Error Handling

All tools return errors in a consistent format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: [error message]"
    }
  ],
  "isError": true
}
```

Common error scenarios:
- Invalid model name
- Model not found
- Network connectivity issues
- Invalid input parameters
- Ollama service unavailable

## Transport Modes

### Stdio Transport (Default)
- Used for local development
- Direct process communication
- No additional configuration required

### HTTP Transport
- Used for remote deployment
- WebSocket-based communication
- Requires HTTP server configuration
- Supports session management

## Configuration

The server can be configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_TRANSPORT` | Transport type (`stdio` or `http`) | `stdio` |
| `OLLAMA_BASE_URL` | Ollama API base URL | `http://localhost:11434` |
| `MCP_HTTP_HOST` | HTTP server host (HTTP mode) | `0.0.0.0` |
| `MCP_HTTP_PORT` | HTTP server port (HTTP mode) | `8080` |
| `MCP_HTTP_ALLOWED_ORIGINS` | CORS allowed origins (HTTP mode) | None |
| `MCP_HTTP_ENABLE_DNS_PROTECTION` | Enable DNS rebinding protection | `false` |

## HTTP Endpoints

When using HTTP transport, several endpoints are available:

### Root Endpoint

```
GET /
```

**Response:**
```json
{
  "name": "Ollama MCP Server",
  "version": "1.0.0",
  "status": "running",
  "protocol": "MCP (Model Context Protocol)",
  "endpoints": {
    "mcp": "POST /mcp - MCP protocol endpoint",
    "health": "GET /healthz - Health check",
    "tools": "GET /tools - List available tools (via MCP)",
    "models": "GET /models - List available Ollama models (via MCP)"
  },
  "timestamp": "2025-10-06T14:37:21.512Z",
  "uptime": 9.922
}
```

### Health Check

```
GET /healthz
```

**Response:**
```json
{
  "status": "ok"
}
```

### Tools List

```
GET /tools
```

**Response:**
```json
{
  "tools": [
    {
      "name": "ollama_list_models",
      "description": "List all available Ollama models on the local machine",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    },
    // ... other tools
  ]
}
```

### Models List

```
GET /models
```

**Response:**
```json
{
  "models": [
    {
      "name": "llama2:latest",
      "model": "llama2:latest",
      "modified_at": "2024-01-01T00:00:00Z",
      "size": 3825819519,
      "digest": "sha256:...",
      "details": {
        "parent_model": "",
        "format": "gguf",
        "family": "llama",
        "families": ["llama"],
        "parameter_size": "7B",
        "quantization_level": "Q4_0"
      }
    }
  ]
}
```
