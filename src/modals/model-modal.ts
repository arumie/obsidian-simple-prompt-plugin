import { Modal, Setting } from "obsidian";
import SimplePromptPlugin from "src/main";
import { OpenAIModelType } from "src/types";

export default class ModelModal extends Modal {
    plugin: SimplePromptPlugin;
    constructor(plugin: SimplePromptPlugin) {
        super(plugin.app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClasses(["pr-p-5", "pr-pt-10"]);
        new Setting(contentEl)
            .setName("Model")
            .setDesc("Which LLM model to use")
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        "gpt-3.5-turbo": "GPT-3.5 Turbo",
                        "gpt-4-turbo": "GPT-4 Turbo",
                        "gpt-4o": "GPT-4 Omni",
                    })
                    .setValue(this.plugin.settings.model)
                    .onChange(async (value: OpenAIModelType) => {
                        this.plugin.settings.model = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
