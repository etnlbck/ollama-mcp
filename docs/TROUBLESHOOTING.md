# Troubleshooting Guide

This guide helps you resolve common issues with the Ollama MCP Server.

## 🚨 Common Issues

### 1. Build and Compilation Errors

#### TypeScript Compilation Errors
```bash
# Error: Cannot find module 'express'
# Error: Cannot find module 'crypto'
```

**Solution:**
```bash
# Clean and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Module Resolution Issues
```bash
# Error: Module not found
```

**Solution:**
Check your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  }
}
```

### 2. Runtime Errors

#### "Cannot find module" at runtime
```bash
# Error: Cannot find module './server/mcp-server.js'
```

**Solution:**
```bash
# Ensure you're running from the correct directory
cd /path/to/ollama-mcp
npm run build
npm start
```

#### Ollama Connection Errors
```bash
# Error: Failed to list models: HTTP error! status: 500
```

**Solutions:**
1. **Check if Ollama is running:**
   ```bash
   ollama list
   ```

2. **Start Ollama service:**
   ```bash
   ollama serve
   ```

3. **Check Ollama URL:**
   ```bash
   # Default is http://localhost:11434
   # For Railway: http://127.0.0.1:11434
   export OLLAMA_BASE_URL=http://localhost:11434
   ```

4. **Verify Ollama is accessible:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

### 3. Transport-Specific Issues

#### Stdio Transport Issues
```bash
# Error: Transport not initialized
```

**Solution:**
- Ensure you're not running in HTTP mode
- Check that no other process is using stdio
- Restart the server

#### HTTP Transport Issues
```bash
# Error: Invalid HTTP port specified
```

**Solutions:**
1. **Check port configuration:**
   ```bash
   echo $MCP_HTTP_PORT  # Should be a valid number
   echo $PORT           # Railway uses this
   ```

2. **Use valid port numbers:**
   ```bash
   MCP_HTTP_PORT=8080 npm start
   ```

3. **Check port availability:**
   ```bash
   lsof -i :8080  # Check if port is in use
   ```

#### CORS Issues (HTTP Transport)
```bash
# Error: CORS policy blocked
```

**Solution:**
```bash
# Add allowed origins
export MCP_HTTP_ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

### 4. Railway Deployment Issues

#### Build Failures
```bash
# Error: failed to solve: process did not complete successfully
```

**Solutions:**
1. **Check Dockerfile syntax:**
   ```bash
   docker build -t test-build .
   ```

2. **Verify Ollama download URL:**
   - Check if the URL in Dockerfile is still valid
   - Update OLLAMA_VERSION if needed

3. **Check Railway logs:**
   ```bash
   railway logs
   ```

#### Volume Issues
```bash
# Error: Volume not found
```

**Solution:**
```bash
# Create volume first
railway volume add --mount-path /data/ollama

# Then deploy
railway up
```

#### Environment Variable Issues
```bash
# Error: Invalid configuration
```

**Solution:**
```bash
# Check Railway variables
railway variables

# Set required variables
railway variables set MCP_TRANSPORT=http
railway variables set MCP_HTTP_PORT=8080
```

### 5. Model Management Issues

#### Model Not Found
```bash
# Error: model not found
```

**Solutions:**
1. **List available models:**
   ```bash
   ollama list
   ```

2. **Pull the model:**
   ```bash
   ollama pull llama2
   ```

3. **Check model name spelling:**
   ```bash
   # Use exact model name from ollama list
   ollama run llama2:latest
   ```

#### Model Download Failures
```bash
# Error: Failed to pull model
```

**Solutions:**
1. **Check internet connection**
2. **Verify model name exists:**
   ```bash
   # Check Ollama registry
   curl https://ollama.com/library
   ```

3. **Try different model:**
   ```bash
   ollama pull mistral:7b
   ```

### 6. Performance Issues

#### Slow Model Loading
```bash
# Models take too long to load
```

**Solutions:**
1. **Use smaller models for testing:**
   ```bash
   ollama pull tinyllama
   ```

2. **Check available memory:**
   ```bash
   free -h
   ```

3. **Use CPU-only mode:**
   ```bash
   export OLLAMA_HOST=0.0.0.0:11434
   ```

#### High Memory Usage
```bash
# Server uses too much memory
```

**Solutions:**
1. **Limit concurrent models:**
   ```bash
   export OLLAMA_MAX_LOADED_MODELS=1
   ```

2. **Use model quantization:**
   ```bash
   ollama pull llama2:7b-q4_0  # Quantized version
   ```

## 🔍 Debugging

### Enable Debug Logging
```bash
# Ollama debug logging
export OLLAMA_DEBUG=1
ollama serve

# MCP server debug logging
export DEBUG=mcp:*
npm start
```

### Check Server Status
```bash
# Health check (HTTP mode)
curl http://localhost:8080/healthz

# Check Ollama API
curl http://localhost:11434/api/tags
```

### Monitor Logs
```bash
# Railway logs
railway logs --follow

# Local logs
npm start 2>&1 | tee server.log
```

## 🆘 Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Verify your environment:**
   ```bash
   node --version    # Should be 18+
   npm --version
   ollama --version
   ```

3. **Check logs for error messages**
4. **Try the basic setup:**
   ```bash
   npm run clean
   npm install
   npm run build
   npm start
   ```

### When Reporting Issues

Include:
- Operating system and version
- Node.js version
- Ollama version
- Complete error message
- Steps to reproduce
- Log output

### Useful Commands

```bash
# Full reset
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build

# Test basic functionality
ollama list
curl http://localhost:11434/api/tags

# Test MCP server
npm start
# In another terminal:
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## 📚 Additional Resources

- [Ollama Documentation](https://ollama.com/docs)
- [MCP Specification](https://modelcontextprotocol.io)
- [Railway Documentation](https://docs.railway.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
