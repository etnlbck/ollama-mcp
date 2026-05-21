import fetch from 'node-fetch';
export class OllamaClient {
    baseUrl;
    apiKey;
    cloudBaseUrl;
    constructor(baseUrlOrOptions = 'http://localhost:11434') {
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
    static isCloudModel(model) {
        return model.endsWith('-cloud') || model.endsWith(':cloud');
    }
    static normalizeCloudModelForRemoteApi(model) {
        if (model.endsWith('-cloud')) {
            return model.slice(0, -'-cloud'.length);
        }
        if (model.endsWith(':cloud')) {
            return model.slice(0, -':cloud'.length);
        }
        return model;
    }
    getHeaders(includeAuth) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (includeAuth && this.apiKey) {
            headers.Authorization = `Bearer ${this.apiKey}`;
        }
        return headers;
    }
    resolveEndpoint(model) {
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
    formatHttpError(status, context) {
        if (status === 401 || status === 403) {
            return (`${context}: Cloud access denied (HTTP ${status}). ` +
                'Set OLLAMA_API_KEY for ollama.com, or run `ollama signin` for local *-cloud models.');
        }
        return `${context}: HTTP error! status: ${status}`;
    }
    async request(path, init, options) {
        const { baseUrl, model, useAuth } = this.resolveEndpoint(options?.model);
        const url = `${baseUrl}${path}`;
        let body = init.body;
        if (body && model !== undefined && options?.model !== undefined) {
            const parsed = JSON.parse(body);
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
        return response.json();
    }
    async listModels() {
        try {
            const data = await this.request('/api/tags', { method: 'GET' }, { errorContext: 'Failed to list models' });
            return data.models || [];
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : `Failed to list models: ${String(error)}`);
        }
    }
    async chat(model, messages) {
        try {
            return await this.request('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    model,
                    messages,
                    stream: false,
                }),
            }, { model, errorContext: 'Failed to chat with model' });
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : `Failed to chat with model: ${String(error)}`);
        }
    }
    async pullModel(model) {
        try {
            await this.request('/api/pull', {
                method: 'POST',
                body: JSON.stringify({ name: model }),
            }, { errorContext: 'Failed to pull model' });
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : `Failed to pull model: ${String(error)}`);
        }
    }
    async deleteModel(model) {
        try {
            await this.request('/api/delete', {
                method: 'DELETE',
                body: JSON.stringify({ name: model }),
            }, { errorContext: 'Failed to delete model' });
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : `Failed to delete model: ${String(error)}`);
        }
    }
    async generateResponse(model, prompt) {
        try {
            const data = await this.request('/api/generate', {
                method: 'POST',
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: false,
                }),
            }, { model, errorContext: 'Failed to generate response' });
            return data.response;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : `Failed to generate response: ${String(error)}`);
        }
    }
}
//# sourceMappingURL=ollama-client.js.map