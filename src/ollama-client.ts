import fetch from 'node-fetch';

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
}

export interface OllamaClientOptions {
  baseUrl?: string;
  apiKey?: string;
  cloudBaseUrl?: string;
}

export class OllamaClient {
  private baseUrl: string;
  private apiKey?: string;
  private cloudBaseUrl: string;

  constructor(baseUrlOrOptions: string | OllamaClientOptions = 'http://localhost:11434') {
    if (typeof baseUrlOrOptions === 'string') {
      this.baseUrl = baseUrlOrOptions.replace(/\/$/, '');
      this.cloudBaseUrl = 'https://ollama.com';
      return;
    }

    const options = baseUrlOrOptions;
    this.baseUrl = (options.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.cloudBaseUrl = (options.cloudBaseUrl || 'https://ollama.com').replace(/\/$/, '');
  }

  static isCloudModel(model: string): boolean {
    return model.endsWith('-cloud') || model.endsWith(':cloud');
  }

  static normalizeCloudModelForRemoteApi(model: string): string {
    if (model.endsWith('-cloud')) {
      return model.slice(0, -'-cloud'.length);
    }
    if (model.endsWith(':cloud')) {
      return model.slice(0, -':cloud'.length);
    }
    return model;
  }

  private getHeaders(includeAuth: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (includeAuth && this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private resolveEndpoint(model?: string): { baseUrl: string; model?: string; useAuth: boolean } {
    if (model && this.apiKey && OllamaClient.isCloudModel(model)) {
      return {
        baseUrl: this.cloudBaseUrl,
        model: OllamaClient.normalizeCloudModelForRemoteApi(model),
        useAuth: true,
      };
    }
    const useAuth = Boolean(this.apiKey && this.baseUrl === this.cloudBaseUrl);
    return { baseUrl: this.baseUrl, model, useAuth };
  }

  private formatHttpError(status: number, context: string): string {
    if (status === 401 || status === 403) {
      return (
        `${context}: Cloud access denied (HTTP ${status}). ` +
        'Set OLLAMA_API_KEY for ollama.com, or run `ollama signin` for local *-cloud models.'
      );
    }
    return `${context}: HTTP error! status: ${status}`;
  }

  private async request<T>(
    path: string,
    init: { method: string; body?: string },
    options?: { model?: string; errorContext: string }
  ): Promise<T> {
    const { baseUrl, model, useAuth } = this.resolveEndpoint(options?.model);
    const url = `${baseUrl}${path}`;

    let body = init.body;
    if (body && model !== undefined && options?.model !== undefined) {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      parsed.model = model;
      body = JSON.stringify(parsed);
    }

    const response = await fetch(url, {
      method: init.method,
      body,
      headers: this.getHeaders(useAuth),
    });

    if (!response.ok) {
      throw new Error(this.formatHttpError(response.status, options?.errorContext ?? 'Request failed'));
    }

    return response.json() as Promise<T>;
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const data = await this.request<{ models: OllamaModel[] }>(
        '/api/tags',
        { method: 'GET' },
        { errorContext: 'Failed to list models' }
      );
      return data.models || [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : `Failed to list models: ${String(error)}`
      );
    }
  }

  async chat(model: string, messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      return await this.request<ChatResponse>(
        '/api/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            model,
            messages,
            stream: false,
          }),
        },
        { model, errorContext: 'Failed to chat with model' }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : `Failed to chat with model: ${String(error)}`
      );
    }
  }

  async pullModel(model: string): Promise<void> {
    try {
      await this.request(
        '/api/pull',
        {
          method: 'POST',
          body: JSON.stringify({ name: model }),
        },
        { errorContext: 'Failed to pull model' }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : `Failed to pull model: ${String(error)}`
      );
    }
  }

  async deleteModel(model: string): Promise<void> {
    try {
      await this.request(
        '/api/delete',
        {
          method: 'DELETE',
          body: JSON.stringify({ name: model }),
        },
        { errorContext: 'Failed to delete model' }
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : `Failed to delete model: ${String(error)}`
      );
    }
  }

  async generateResponse(model: string, prompt: string): Promise<string> {
    try {
      const data = await this.request<{ response: string }>(
        '/api/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
          }),
        },
        { model, errorContext: 'Failed to generate response' }
      );
      return data.response;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : `Failed to generate response: ${String(error)}`
      );
    }
  }
}
