# Ollama MCP Server

An MCP (Model Context Protocol) server that provides tools to interact with Ollama models running on your local machine.

## Features

- **List Models**: Get all available Ollama models
- **Chat**: Interactive chat with conversation history
- **Generate**: Single prompt generation
- **Pull Models**: Download new models from Ollama registry
- **Delete Models**: Remove models from local installation

## Prerequisites

- [Ollama](https://ollama.ai/) installed and running locally
- Node.js 18+ and npm

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

1. Build the project:

```bash
npm run build
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

- Set `MCP_TRANSPORT=stdio` (default) to run via stdio.
- Set `MCP_TRANSPORT=http` to expose the MCP server via the Streamable HTTP transport. Optional overrides:
  - `MCP_HTTP_PORT` (defaults to `8080`, Railway’s `PORT` is respected automatically)
  - `MCP_HTTP_HOST` (defaults to `0.0.0.0`)
  - `MCP_HTTP_ALLOWED_ORIGINS` (comma-separated list)

### Deploying with Docker

```bash
npm run docker:build
npm run docker:run
```

This container image installs Ollama, exposes the Ollama API on port `11434`, and expects a volume mounted at `/data/ollama` to persist models.

### Deploying on Railway

1. Install the Railway CLI and log in:
   ```bash
   npm install -g @railway/cli
   railway login
   ```
2. Create (or attach) a persistent volume for your models:
   ```bash
   railway volume add --mount-path /data/ollama
   ```
3. Deploy:
   ```bash
   railway up
   ```

Railway uses the included `Dockerfile`, mounts the `ollama-models` volume defined in `railway.json`, and exposes port `11434` so your MCP server and Ollama API run together. Be sure to pin bigger model downloads or add the volume to keep models between deploys.

The Railway deployment automatically uses HTTP (Streamable) transport instead of stdio. The MCP server will be available at:

- **MCP Endpoint**: `https://your-app.railway.app/mcp`
- **Health Check**: `https://your-app.railway.app/healthz`
- **Ollama API**: `https://your-app.railway.app:11434` (if exposed)

For local development, you can still use stdio mode by default, or switch to HTTP mode with:

```bash
MCP_TRANSPORT=http npm start
```

### Using with Claude Desktop

Add this server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ollama": {
      "command": "node",
      "args": ["/path/to/ollama-mcp/dist/index.js"]
    }
  }
}
```

### Using with Cursor

If you're using [Cursor](https://cursor.com/), add the server to your MCP configuration file at `~/.cursor/mcp/config.json`:

```json
{
  "mcpServers": {
    "ollama": {
      "command": "node",
      "args": ["/path/to/ollama-mcp/dist/index.js"]
    }
  }
}
```

Alternatively, you can copy the ready-made config shipped with this repo:

```bash
mkdir -p ~/.cursor/mcp
cp /path/to/ollama-mcp/mcp.config.json ~/.cursor/mcp/config.json
```

## Available Tools

### `ollama_list_models`

Lists all available Ollama models on your system.

### `ollama_chat`

Chat with a model using conversation history.

- `model`: Name of the Ollama model
- `messages`: Array of message objects with `role` ('system', 'user', 'assistant') and `content`

### `ollama_generate`

Generate a response from a single prompt.

- `model`: Name of the Ollama model
- `prompt`: The input prompt

### `ollama_pull_model`

Download a model from the Ollama registry.

- `model`: Name of the model to download

### `ollama_delete_model`

Remove a model from your local installation.

- `model`: Name of the model to delete

## Configuration

Set the `OLLAMA_BASE_URL` environment variable to change the Ollama server URL (default: `http://localhost:11434`).

## License

MIT
