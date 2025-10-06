import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export class StdioTransport {
  private transport: StdioServerTransport;

  constructor() {
    this.transport = new StdioServerTransport();
  }

  async connect(server: Server): Promise<void> {
    await server.connect(this.transport);
    console.error('Ollama MCP Server running on stdio');
  }
}
