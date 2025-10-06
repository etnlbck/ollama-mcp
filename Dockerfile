# syntax=docker/dockerfile:1.7

FROM node:20-bookworm

ENV OLLAMA_VERSION=0.12.3 \
    NODE_ENV=production

WORKDIR /usr/src/app

# Install Ollama
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://github.com/ollama/ollama/releases/download/v${OLLAMA_VERSION}/ollama-linux-amd64.tgz -o /tmp/ollama.tgz \
    && tar -xzvf /tmp/ollama.tgz -C /usr/local \
    && ln -s /usr/local/bin/ollama /usr/local/bin/ollama-cli \
    && rm /tmp/ollama.tgz \
    && adduser --system --group --no-create-home ollama \
    && mkdir -p /data/ollama && chown -R ollama:ollama /data/ollama

# Copy project files
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Build the project
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

EXPOSE 11434 8080

ENV OLLAMA_HOST=0.0.0.0:11434 \
    OLLAMA_MODELS=/data/ollama \
    MCP_TRANSPORT=http \
    MCP_HTTP_PORT=8080

ENTRYPOINT ["/bin/bash", "-lc"]
CMD ["ollama serve & sleep 5 && ollama pull tinyllama & npm start"]

