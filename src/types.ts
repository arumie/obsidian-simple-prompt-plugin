export const openaiModels = ["gpt-3.5-turbo", "gpt-4-turbo", "gpt-4o"] as const;
export type OpenAIModelType = (typeof openaiModels)[number];

export const ollamaModels = [
    "llama3",
    "llama2",
    "llama2-uncensored",
    "phi3",
    "gemma",
    "codegemma",
    "codellama",
    "starcoder2",
    "mistral",
    "mixtral",
    "qwen",
    "aya",
    "tinyllama",
] as const;
export type OllamaModelType = (typeof ollamaModels)[number];

export type LlmModelType = {
    openai: OpenAIModelType;
    ollama: OllamaModelType;
};

export type LlmProviderApiKeyType = "openai";
export type LlmProviderType = "ollama" | LlmProviderApiKeyType;

export type CommandType = "selection" | "cursor" | "document" | "youtube";

export interface SimplePromptPluginSettings {
    settingsVersion: number;
    provider: LlmProviderType;
    apiKey: {
        openai: string | null;
    };
    model: LlmModelType;
    recentPrompts: string[];
    recentsLimit: number;
    recentPromptsEnabled: boolean;
    promptTemplates: Record<CommandType, string>;
    streaming: boolean;
}

/** Function with chunk of streamed response from LLM */
export type LlmStreamingResponseFn = (chunk: string) => void;

/** Function with text response from LLM */
export type LlmResponseFn = (result: string) => void;
