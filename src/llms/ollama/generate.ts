import { requestUrl } from "obsidian";
import { SimplePromptPluginSettings } from "src/types";

export async function generate(
    settings: SimplePromptPluginSettings,
    prompt: string,
    onSuccess: (result: string) => void,
) {
    const response = await requestUrl({
        url: "http://localhost:11434/api/generate",
        method: "POST",
        body: JSON.stringify({
            prompt,
            model: settings.model.ollama,
            stream: false,
        }),
    });

    if (response.json["response"]) {
        onSuccess(response.json["response"]);
    }
}
