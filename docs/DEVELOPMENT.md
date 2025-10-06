# Development Guide

This guide helps developers understand, modify, and extend the Ollama MCP Server.

## 🏗️ Project Structure

```
src/
├── main.ts                 # Application entry point
├── config/
│   └── server-config.ts    # Configuration management
├── server/
│   └── mcp-server.ts       # Core MCP server implementation
├── tools/
│   └── tool-handlers.ts    # MCP tool implementations
├── transports/
│   ├── stdio-transport.ts  # Stdio transport
│   └── http-transport.ts   # HTTP transport
├── ollama-client.ts        # Ollama API client
└── types.d.ts             # TypeScript declarations

docs/                       # Documentation
├── ARCHITECTURE.md         # System architecture
├── API.md                  # API documentation
├── DEPLOYMENT.md           # Deployment guides
├── DEVELOPMENT.md          # This file
└── TROUBLESHOOTING.md      # Troubleshooting guide

config/                     # Configuration files
├── mcp.config.json         # MCP client config
└── railway-models/         # Model definitions

scripts/                    # Utility scripts
└── upload-models-to-railway.sh
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- TypeScript 5.0+
- Ollama installed locally
- Git

### Setup Development Environment

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd ollama-mcp
   npm install
   ```

2. **Start Ollama:**
   ```bash
   ollama serve
   ```

3. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

### Development Scripts

```bash
# Development with hot reload
npm run dev

# Development with HTTP transport
npm run dev:http

# Build the project
npm run build

# Clean build artifacts
npm run clean

# Run tests (when implemented)
npm test

# Lint code (when configured)
npm run lint
```

## 🧩 Architecture Overview

### Core Components

1. **Main Entry Point** (`src/main.ts`)
   - Application bootstrap
   - Transport selection
   - Error handling

2. **MCP Server** (`src/server/mcp-server.ts`)
   - MCP protocol implementation
   - Tool registration
   - Request handling

3. **Tool Handlers** (`src/tools/tool-handlers.ts`)
   - Individual tool implementations
   - Input validation
   - Response formatting

4. **Transports** (`src/transports/`)
   - Communication layer abstraction
   - Stdio and HTTP implementations

5. **Ollama Client** (`src/ollama-client.ts`)
   - Ollama API wrapper
   - HTTP communication
   - Error handling

### Design Patterns

- **Dependency Injection**: Components receive dependencies
- **Separation of Concerns**: Each module has single responsibility
- **Factory Pattern**: Transport creation
- **Strategy Pattern**: Different transport implementations

## 🔧 Adding New Tools

### 1. Define Tool Schema

In `src/tools/tool-handlers.ts`, add to `getAvailableTools()`:

```typescript
{
  name: 'ollama_new_tool',
  description: 'Description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description'
      }
    },
    required: ['param1']
  }
}
```

### 2. Implement Tool Handler

Add a new case in the switch statement:

```typescript
case 'ollama_new_tool': {
  return await handleNewTool(ollamaClient, args as { param1: string });
}
```

### 3. Create Handler Function

```typescript
async function handleNewTool(ollamaClient: OllamaClient, args: { param1: string }) {
  const { param1 } = args;
  
  // Implement tool logic
  const result = await ollamaClient.someMethod(param1);
  
  return {
    content: [
      {
        type: 'text',
        text: result
      }
    ]
  };
}
```

### 4. Add Ollama Client Method

In `src/ollama-client.ts`:

```typescript
async someMethod(param: string): Promise<string> {
  try {
    const response = await fetch(`${this.baseUrl}/api/endpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ param })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    throw new Error(`Failed to call someMethod: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

## 🚀 Adding New Transports

### 1. Create Transport Class

Create `src/transports/new-transport.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export class NewTransport {
  private config: NewTransportConfig;

  constructor(config: NewTransportConfig) {
    this.config = config;
  }

  async connect(server: Server): Promise<void> {
    // Implement connection logic
  }

  async start(): Promise<void> {
    // Implement startup logic
  }
}
```

### 2. Add to Main Entry Point

In `src/main.ts`, add transport selection:

```typescript
if (transportType === 'new') {
  await startNewTransport(mcpServer.getServer());
}
```

### 3. Implement Transport Function

```typescript
async function startNewTransport(server: any): Promise<void> {
  const transport = new NewTransport({
    // configuration
  });
  await transport.connect(server);
}
```

## 🧪 Testing

### Unit Testing (Future)

```bash
# Install testing framework
npm install --save-dev jest @types/jest ts-jest

# Run tests
npm test
```

### Integration Testing

```bash
# Test stdio transport
npm run start:stdio

# Test HTTP transport
npm run start:http

# Test health endpoint
curl http://localhost:8080/healthz
```

### Manual Testing

```bash
# Test Ollama integration
ollama list
ollama run llama2 "Hello"

# Test MCP tools via HTTP
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list","params":{}}'
```

## 📝 Code Style

### TypeScript Guidelines

- Use strict typing
- Prefer interfaces over types
- Use meaningful names
- Add JSDoc comments for public APIs

### File Organization

- One class per file
- Group related functionality
- Use barrel exports (`index.ts`)
- Keep files under 200 lines

### Error Handling

- Use try-catch for async operations
- Provide meaningful error messages
- Log errors appropriately
- Handle edge cases

## 🔍 Debugging

### Enable Debug Logging

```bash
# Ollama debug
export OLLAMA_DEBUG=1

# MCP debug
export DEBUG=mcp:*

# Start with debug
npm run dev
```

### Common Debug Points

1. **Transport initialization**
2. **Tool handler execution**
3. **Ollama API calls**
4. **Configuration loading**

### Debug Tools

- VS Code debugger
- Node.js inspector
- Ollama logs
- Network monitoring

## 🚀 Performance Optimization

### Memory Management

- Limit concurrent operations
- Clean up resources
- Use streaming where possible
- Monitor memory usage

### Caching

- Cache model lists
- Implement response caching
- Use appropriate TTLs

### Connection Pooling

- Reuse HTTP connections
- Implement connection limits
- Handle connection errors

## 📦 Building and Packaging

### Build Process

```bash
# Clean build
npm run clean
npm run build

# Verify build
node dist/main.js --help
```

### Docker Build

```bash
# Test Docker build
npm run docker:build

# Test Docker run
npm run docker:run
```

### Railway Deployment

```bash
# Test Railway deployment
railway up

# Check deployment
railway logs
```

## 🔄 Contributing

### Before Contributing

1. Read the architecture docs
2. Understand the codebase
3. Check existing issues
4. Discuss major changes

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Update documentation
6. Submit PR

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Error handling included
- [ ] Performance considered

## 📚 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [MCP Specification](https://modelcontextprotocol.io)
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
