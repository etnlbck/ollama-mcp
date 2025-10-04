import fetch from 'node-fetch';
export class OllamaClient {
    baseUrl;
    constructor(baseUrl = 'http://localhost:11434') {
        this.baseUrl = baseUrl;
    }
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.models || [];
        }
        catch (error) {
            throw new Error(`Failed to list models: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async chat(model, messages) {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: false,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            throw new Error(`Failed to chat with model: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async pullModel(model) {
        try {
            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: model,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to pull model: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async deleteModel(model) {
        try {
            const response = await fetch(`${this.baseUrl}/api/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: model,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to delete model: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async generateResponse(model, prompt) {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: false,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.response;
        }
        catch (error) {
            throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
//# sourceMappingURL=ollama-client.js.map