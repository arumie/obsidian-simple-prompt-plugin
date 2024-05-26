import { App, Modal, Notice } from "obsidian";
import SimplePromptPlugin from "src/main";

export default class ApiKeyModal extends Modal {
    plugin: SimplePromptPlugin;
    constructor(app: App, plugin: SimplePromptPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        const wrapper = contentEl.createEl("div");
        wrapper.addClasses([
            "pr-flex",
            "pr-flex-col",
            "pr-p-5",
            "pr-gap-5",
            "pr-justify-center",
            "pr-items-center",
        ]);

        const title = wrapper.createEl("h3", {
            text: "Create and input your API key",
        });
        title.addClasses(["pr-text-lg", "pr-font-semibold", "pr-mb-5"]);

        const input = wrapper.createEl("input", {
            type: "text",
            placeholder: "API key",
        });

        input.addClasses(["pr-p-2", "pr-border", "pr-rounded-md", "pr-w-full"]);

        const button = wrapper.createEl("button", { text: "Submit" });
        button.addEventListener("click", async () => {
            this.plugin.settings.apiKey = input.value;
            await this.plugin.saveSettings();
            new Notice("Api key set successfully");
            this.close();
        });
        button.addClasses(["pr-p-5"]);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}