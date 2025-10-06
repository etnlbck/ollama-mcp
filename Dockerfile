# syntax=docker/dockerfile:1.7

FROM node:20-bookworm

ENV OLLAMA_VERSION=0.4.3 \
    NODE_ENV=production

WORKDIR /usr/src/app

# Install Ollama
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://ollama.com/download/Ollama-linux-amd64.tar.gz -o /tmp/ollama.tgz \
    && tar -xzvf /tmp/ollama.tgz -C /usr/local/bin ollama \
    && rm /tmp/ollama.tgz \
    && adduser --system --group --no-create-home ollama \
    && mkdir -p /data/ollama && chown -R ollama:ollama /data/ollama

# Copy project files
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
COPY dist ./dist

RUN npm ci --omit=dev

EXPOSE 11434

ENV OLLAMA_HOST=0.0.0.0:11434 \
    OLLAMA_MODELS=/data/ollama

ENTRYPOINT ["/bin/bash", "-lc"]
CMD ["ollama serve & npm start"]

