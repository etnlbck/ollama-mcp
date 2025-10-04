#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { OllamaClient } from './ollama-client.js';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const ollama = new OllamaClient(OLLAMA_BASE_URL);
class OllamaMCPServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'ollama-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'ollama_list_models',
                        description: 'List all available Ollama models on the local machine',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                    {
                        name: 'ollama_chat',
                        description: 'Chat with an Ollama model using conversation history',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                model: {
                                    type: 'string',
                                    description: 'The name of the Ollama model to use',
                                },
                                messages: {
                                    type: 'array',
                                    description: 'Array of chat messages with role and content',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            role: {
                                                type: 'string',
                                                enum: ['system', 'user', 'assistant'],
                                                description: 'The role of the message sender',
                                            },
                                            content: {
                                                type: 'string',
                                                description: 'The content of the message',
                                            },
                                        },
                                        required: ['role', 'content'],
                                    },
                                },
                            },
                            required: ['model', 'messages'],
                        },
                    },
                    {
                        name: 'ollama_generate',
                        description: 'Generate a response from an Ollama model with a single prompt',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                model: {
                                    type: 'string',
                                    description: 'The name of the Ollama model to use',
                                },
                                prompt: {
                                    type: 'string',
                                    description: 'The prompt to send to the model',
                                },
                            },
                            required: ['model', 'prompt'],
                        },
                    },
                    {
                        name: 'ollama_pull_model',
                        description: 'Pull/download a model from the Ollama registry',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                model: {
                                    type: 'string',
                                    description: 'The name of the model to pull (e.g., llama2, mistral)',
                                },
                            },
                            required: ['model'],
                        },
                    },
                    {
                        name: 'ollama_delete_model',
                        description: 'Delete a model from the local Ollama installation',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                model: {
                                    type: 'string',
                                    description: 'The name of the model to delete',
                                },
                            },
                            required: ['model'],
                        },
                    },
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'ollama_list_models': {
                        const models = await ollama.listModels();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(models, null, 2),
                                },
                            ],
                        };
                    }
                    case 'ollama_chat': {
                        const { model, messages } = args;
                        const response = await ollama.chat(model, messages);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: response.message.content,
                                },
                            ],
                        };
                    }
                    case 'ollama_generate': {
                        const { model, prompt } = args;
                        const response = await ollama.generateResponse(model, prompt);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: response,
                                },
                            ],
                        };
                    }
                    case 'ollama_pull_model': {
                        const { model } = args;
                        await ollama.pullModel(model);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Successfully pulled model: ${model}`,
                                },
                            ],
                        };
                    }
                    case 'ollama_delete_model': {
                        const { model } = args;
                        await ollama.deleteModel(model);
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Successfully deleted model: ${model}`,
                                },
                            ],
                        };
                    }
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Ollama MCP Server running on stdio');
    }
}
const server = new OllamaMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map