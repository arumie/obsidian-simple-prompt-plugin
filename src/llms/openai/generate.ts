import { Notice } from "obsidian";
import OpenAI from "openai";
import { LlmStreamingResponseFn, SimplePromptPluginSettings } from "src/types";

export async function generate(
    settings: SimplePromptPluginSettings,
    prompt: string,
    onSuccess: (result: string) => void,
) {
    const openai = new OpenAI({
        apiKey: settings.apiKey ?? "",
        dangerouslyAllowBrowser: true,
    });

    const response = await openai.chat.completions
        .create({
            model: settings.model,
            messages: [{ role: "user", content: prompt }],
        })
        .catch((e) => {
            console.error(e);
            new Notice(`Error generating content: ${e}`);
            return null;
        });

    if (response?.choices[0]?.message.content) {
        onSuccess(response.choices[0].message.content);
    }
}

export async function generateStreaming(
    settings: SimplePromptPluginSettings,
    prompt: string,
    onChunk: LlmStreamingResponseFn,
    onStart?: () => void,
    onEnd?: () => void,
) {
    const openai = new OpenAI({
        apiKey: settings.apiKey ?? "",
        dangerouslyAllowBrowser: true,
    });

    const stream = await openai.chat.completions
        .create({
            model: settings.model,
            messages: [{ role: "user", content: prompt }],
            stream: true,
        })
        .catch((e) => {
            console.error(e);
            new Notice(`Error generating content: ${e}`);
            return null;
        });
    if (stream) {
        if (onStart) {
            onStart();
        }
        for await (const chunk of stream) {
            onChunk(chunk.choices[0].delta.content ?? "");
        }
        if (onEnd) {
            onEnd();
        }
    }
}
