import SimplePromptPlugin from "src/main";
import { LlmStreamingResponseFn } from "src/types";
import { notice } from "src/utils";
import { generate as generateOllama } from "./ollama/generate";
import {
    generate as generateOpenai,
    generateStreaming as generateStreamingOpenai,
} from "./openai/generate";

export async function generate(
    plugin: SimplePromptPlugin,
    prompt: string,
    onSuccess: (result: string) => void,
) {
    const { settings } = plugin;
    console.log(settings.provider);
    if (settings.provider === "openai") {
        return await generateOpenai(settings, prompt, onSuccess);
    }
    if (settings.provider === "ollama") {
        return await generateOllama(settings, prompt, onSuccess);
    }
}

export async function generateStreaming(
    plugin: SimplePromptPlugin,
    prompt: string,
    onChunk: LlmStreamingResponseFn,
    onStart?: () => void,
    onEnd?: () => void,
) {
    const { settings } = plugin;
    if (settings.provider === "openai") {
        return await generateStreamingOpenai(
            settings,
            prompt,
            onChunk,
            onStart,
            onEnd,
        );
    }
    if (settings.provider === "ollama") {
        notice("Streaming is not supported for Ollama at this time.");
    }
}
