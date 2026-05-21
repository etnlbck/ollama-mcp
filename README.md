# Ollama MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Ollama models. This server enables AI assistants to list, chat with, generate responses from, and manage Ollama models through a standardized protocol.

## 🚀 Features

- **Model Management**: List, pull, and delete Ollama models
- **Chat Interface**: Multi-turn conversations with models
- **Text Generation**: Single-prompt text generation
- **Dual Transport**: Stdio (local) and HTTP (remote) support
- **Railway Ready**: Pre-configured for Railway deployment
- **Type Safe**: Full TypeScript implementation with strict typing

## 📋 Prerequisites

- Node.js 18+ 
- Ollama installed and running locally
- For Railway deployment: Railway CLI

## 🛠️ Installation

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd ollama-mcp
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

### Using with Cursor

Add this to your Cursor MCP configuration (`~/.cursor/mcp/config.json`):

```json
{
  "mcpServers": {
    "ollama": {
      "command": "node",
      "args": ["/path/to/ollama-mcp/dist/main.js"],
      "env": {
        "OLLAMA_API_KEY": "<your-key-from-ollama.com/settings/keys>"
      }
    }
  }
}
```

**Quick setup:**
```bash
curl -sSL https://raw.githubusercontent.com/your-repo/ollama-mcp/main/config/mcp.config.json -o ~/.cursor/mcp/config.json
```

## 🏗️ Architecture

The project is structured for maximum readability and maintainability:

```
src/
├── main.ts                 # Main entry point
├── config/                 # Configuration management
├── server/                 # Core MCP server
├── tools/                  # MCP tool implementations
├── transports/             # Communication transports
└── ollama-client.ts        # Ollama API client

docs/                       # Comprehensive documentation
config/                     # Configuration files
scripts/                    # Deployment scripts
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_TRANSPORT` | Transport type (`stdio` or `http`) | `stdio` |
| `OLLAMA_BASE_URL` | Ollama API base URL | `http://localhost:11434` |
| `OLLAMA_API_KEY` | API key for Ollama Cloud (`ollama.com`); required for cloud models when not using `ollama signin` | None |
| `OLLAMA_CLOUD_BASE_URL` | Ollama Cloud API base URL (used when routing `*-cloud` models with an API key) | `https://ollama.com` |
| `MCP_HTTP_HOST` | HTTP server host (HTTP mode) | `0.0.0.0` |
| `MCP_HTTP_PORT` | HTTP server port (HTTP mode) | `8080` |
| `MCP_HTTP_ALLOWED_ORIGINS` | CORS allowed origins (HTTP mode) | None |

### Cloud models

Ollama cloud models (names ending in `-cloud`, e.g. `gpt-oss:120b-cloud`) can be used in two ways:

1. **Local Ollama** — Keep `OLLAMA_BASE_URL` at `http://localhost:11434` and run `ollama signin` so the daemon authenticates cloud requests.
2. **API key** — Set `OLLAMA_API_KEY` (from [ollama.com/settings/keys](https://ollama.com/settings/keys)). Cloud chat/generate requests are sent to `ollama.com` with a Bearer token automatically.

For cloud-only deployments (e.g. Railway without `ollama signin`), set `OLLAMA_BASE_URL=https://ollama.com` and `OLLAMA_API_KEY` as a secret.

### Transport Modes

#### Stdio Transport (Default)
Perfect for local development and direct integration:

```bash
npm start
```

#### HTTP Transport
Ideal for remote deployment and web-based clients:

```bash
MCP_TRANSPORT=http npm start
```

## 🚀 Deployment

### Railway Deployment

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy:**
   ```bash
   railway up
   ```

3. **Add models (optional):**
   ```bash
   railway shell
   # Follow instructions in docs/RAILWAY_MODELS_SETUP.md
   ```

The Railway deployment automatically uses HTTP transport and exposes:
- **MCP Endpoint**: `https://your-app.railway.app/mcp`
- **Health Check**: `https://your-app.railway.app/healthz`

### Docker Deployment

```bash
# Build the image
npm run docker:build

# Run locally
npm run docker:run

# Deploy to Railway
railway up
```

## 📚 Available Tools

The server provides 5 MCP tools for Ollama interaction:

1. **`ollama_list_models`** - List available models
2. **`ollama_chat`** - Multi-turn conversations
3. **`ollama_generate`** - Single-prompt generation
4. **`ollama_pull_model`** - Download models
5. **`ollama_delete_model`** - Remove models

See [API.md](docs/API.md) for detailed API documentation.

## 🧪 Testing

### Local Testing

```bash
# Test stdio transport
npm start

# Test HTTP transport
MCP_TRANSPORT=http npm start

# Test health check (HTTP mode)
curl http://localhost:8080/healthz
```

### Model Testing

```bash
# List available models
ollama list

# Test a model
ollama run llama2 "Hello, how are you?"
```

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md) - Detailed system architecture
- [API Reference](docs/API.md) - Complete API documentation
- [Railway Setup](docs/RAILWAY_MODELS_SETUP.md) - Model deployment guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Troubleshooting

### Common Issues

**"Cannot find module" errors:**
```bash
npm install
npm run build
```

**Ollama connection issues:**
```bash
# Check if Ollama is running
ollama list

# Check Ollama service
ollama serve
```

**Railway deployment issues:**
```bash
# Check Railway logs
railway logs

# Verify environment variables
railway variables
```

### Getting Help

- Check the [documentation](docs/)
- Review [troubleshooting guide](docs/TROUBLESHOOTING.md)
- Open an issue on GitHub

---

**Built with ❤️ for the AI community**