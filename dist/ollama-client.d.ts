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
export declare class OllamaClient {
    private baseUrl;
    constructor(baseUrl?: string);
    listModels(): Promise<OllamaModel[]>;
    chat(model: string, messages: ChatMessage[]): Promise<ChatResponse>;
    pullModel(model: string): Promise<void>;
    deleteModel(model: string): Promise<void>;
    generateResponse(model: string, prompt: string): Promise<string>;
}
//# sourceMappingURL=ollama-client.d.ts.map