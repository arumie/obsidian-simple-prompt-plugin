

export type OpenAIModelType = "gpt-3.5-turbo" | "gpt-4-turbo" | "gpt-4o";

export type CommandType = "selection" | "cursor" | "document";

export interface SimplePromptPluginSettings {
    apiKey: string | null;
    model: OpenAIModelType;
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