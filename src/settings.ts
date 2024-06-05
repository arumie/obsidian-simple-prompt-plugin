import {
    App,
    Notice,
    PluginSettingTab,
    Setting,
    TextAreaComponent,
} from "obsidian";
import {
    CURSOR_COMMAND_NAME,
    DEFAULT_SETTINGS,
    DOC_COMMAND_NAME,
    SELECTION_COMMAND_NAME,
    YT_TRANSCRIPT_COMMAND_NAME,
} from "./constants";
import SimplePromptPlugin from "./main";
import ApiKeyModal from "./modals/api-key-modal";
import TemplateModal from "./modals/template-modal";
import { CommandType, OpenAIModelType } from "./types";

class SimplePromptSettingTab extends PluginSettingTab {
    plugin: SimplePromptPlugin;

    constructor(app: App, plugin: SimplePromptPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl).setHeading().setName("Model");

        const apiKeySetting = new Setting(containerEl)
            .setName("API key")
            .setDesc("API key for LLM");
        apiKeySetting.addButton((btn) => {
            btn.setIcon("key")
                .setTooltip("Set API key")
                .onClick(async () => {
                    new ApiKeyModal(this.plugin).open();
                });
            return btn;
        });

        new Setting(containerEl)
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

        new Setting(containerEl)
            .setName("Streaming")
            .setDesc("Enable streaming of responses from LLMs")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.streaming)
                    .onChange(async (value) => {
                        this.plugin.settings.streaming = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl).setHeading().setName("Recent Prompts");
        new Setting(containerEl)
            .setName("Limit")
            .setDesc("How many recent prompts to store")
            .addSlider((slider) =>
                slider
                    .setLimits(1, 20, 1)
                    .setDynamicTooltip()
                    .setValue(this.plugin.settings.recentsLimit)
                    .onChange(async (value) => {
                        this.plugin.settings.recentsLimit = value;
                        this.plugin.settings.recentPrompts =
                            this.plugin.settings.recentPrompts.slice(0, value);
                        await this.plugin.saveSettings();
                    }),
            );
        new Setting(containerEl)
            .setName("Enable/Disable")
            .setDesc("Enable/Disable recent prompts")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.recentPromptsEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.recentPromptsEnabled = value;
                        await this.plugin.saveSettings();
                    }),
            );

        let currentTemplate: CommandType = "selection";
        new Setting(containerEl).setName("Prompt Templates").setHeading();

        let promptTemplateTextArea: TextAreaComponent;
        new Setting(containerEl)
            .setName("Template")
            .setDesc("Pick the template to edit")
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        selection: SELECTION_COMMAND_NAME,
                        cursor: CURSOR_COMMAND_NAME,
                        document: DOC_COMMAND_NAME,
                        youtube: YT_TRANSCRIPT_COMMAND_NAME,
                    })
                    .setValue("selection")
                    .onChange(async (value: CommandType) => {
                        currentTemplate = value;
                        if (promptTemplateTextArea != null) {
                            promptTemplateTextArea.setValue(
                                this.plugin.settings.promptTemplates[value] ??
                                    "",
                            );
                        }
                    }),
            );

        new Setting(containerEl)
            .setName("Edit")
            .setDesc("Edit the template")
            .addButton((button) =>
                button
                    .setTooltip("Edit selected template")
                    .setIcon("pencil")
                    .onClick(async () => {
                        new TemplateModal(this.plugin, currentTemplate).open();
                    }),
            );

        new Setting(containerEl)
            .setName("Restore default")
            .setDesc("Restore template to default")
            .addButton((button) =>
                button
                    .setTooltip("Revert selected template to default")
                    .setIcon("reset")
                    .onClick(async () => {
                        const defaultTemplate =
                            DEFAULT_SETTINGS.promptTemplates[currentTemplate];
                        this.plugin.settings.promptTemplates[currentTemplate] =
                            defaultTemplate;
                        new Notice("Template successfully reset!");
                        this.plugin.saveSettings();
                    }),
            );
    }
}

export default SimplePromptSettingTab;
