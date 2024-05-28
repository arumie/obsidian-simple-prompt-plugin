

export type OpenAIModelType = "gpt-3.5-turbo" | "gpt-4-turbo" | "gpt-4o";

export type CommandTypes = "selection" | "cursor" | "document";

export interface SimplePromptPluginSettings {
    apiKey: string | null;
    model: OpenAIModelType;
    recentPrompts: string[];
    recentsLimit: number;
    promptTemplates: Record<CommandTypes, string>;
    streaming: boolean;
}