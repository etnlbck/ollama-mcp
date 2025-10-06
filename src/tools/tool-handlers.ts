import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { OllamaClient, ChatMessage } from '../ollama-client.js';

export function setupToolHandlers(server: Server, ollamaClient: OllamaClient): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: getAvailableTools(),
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'ollama_list_models':
          return await handleListModels(ollamaClient);

        case 'ollama_chat':
          return await handleChat(ollamaClient, args as { model: string; messages: ChatMessage[] });

        case 'ollama_generate':
          return await handleGenerate(ollamaClient, args as { model: string; prompt: string });

        case 'ollama_pull_model':
          return await handlePullModel(ollamaClient, args as { model: string });

        case 'ollama_delete_model':
          return await handleDeleteModel(ollamaClient, args as { model: string });

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
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

function getAvailableTools(): Tool[] {
  return [
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
  ];
}

async function handleListModels(ollamaClient: OllamaClient) {
  const models = await ollamaClient.listModels();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(models, null, 2),
      },
    ],
  };
}

async function handleChat(ollamaClient: OllamaClient, args: { model: string; messages: ChatMessage[] }) {
  const { model, messages } = args;
  const response = await ollamaClient.chat(model, messages);
  return {
    content: [
      {
        type: 'text',
        text: response.message.content,
      },
    ],
  };
}

async function handleGenerate(ollamaClient: OllamaClient, args: { model: string; prompt: string }) {
  const { model, prompt } = args;
  const response = await ollamaClient.generateResponse(model, prompt);
  return {
    content: [
      {
        type: 'text',
        text: response,
      },
    ],
  };
}

async function handlePullModel(ollamaClient: OllamaClient, args: { model: string }) {
  const { model } = args;
  await ollamaClient.pullModel(model);
  return {
    content: [
      {
        type: 'text',
        text: `Successfully pulled model: ${model}`,
      },
    ],
  };
}

async function handleDeleteModel(ollamaClient: OllamaClient, args: { model: string }) {
  const { model } = args;
  await ollamaClient.deleteModel(model);
  return {
    content: [
      {
        type: 'text',
        text: `Successfully deleted model: ${model}`,
      },
    ],
  };
}
