import {
    App,
    PluginSettingTab,
    Setting,
    TextAreaComponent,
    TextComponent,
} from "obsidian";
import {
    API_KEY_PROVIDERS,
    CURSOR_COMMAND_NAME,
    DEFAULT_SETTINGS,
    DOC_COMMAND_NAME,
    SELECTION_COMMAND_NAME,
    YT_TRANSCRIPT_COMMAND_NAME,
} from "./constants";
import SimplePromptPlugin from "./main";
import TemplateModal from "./modals/template-modal";
import {
    CommandType,
    LlmProviderApiKeyType,
    LlmProviderType,
    OllamaModelType,
    OpenAIModelType,
    ollamaModels,
    openaiModels,
} from "./types";
import { notice } from "./utils";

class SimplePromptSettingTab extends PluginSettingTab {
    plugin: SimplePromptPlugin;

    constructor(app: App, plugin: SimplePromptPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    renderSettings(containerEl: HTMLElement) {
        containerEl.empty();

        new Setting(containerEl).setHeading().setName("Model");
        new Setting(containerEl)
            .setClass("provider-setting")
            .setName("Provider")
            .setDesc("Which LLM provider to use")
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        openai: "openai",
                        ollama: "ollama",
                    })
                    .setValue(this.plugin.settings.provider)
                    .onChange(async (value) => {
                        this.plugin.settings.provider =
                            value as LlmProviderType;
                        if (value === "ollama") {
                            this.plugin.settings.streaming = false;
                        }
                        await this.plugin.saveSettings();
                        this.renderSettings(containerEl);
                    }),
            );

        if (API_KEY_PROVIDERS.includes(this.plugin.settings.provider)) {
            const key =
                this.plugin.settings.apiKey[
                    this.plugin.settings.provider as LlmProviderApiKeyType
                ];
            const desc = `${key ? "Current key: " + key.substring(0, 10) + "..." : "Currently missing API key."}`;
            let apiInput: TextComponent | null = null;
            new Setting(containerEl)
                .setName("API key")
                .setDesc(desc)
                .addText((text) => {
                    text.setPlaceholder("API key");
                    apiInput = text;
                })
                .addExtraButton((button) =>
                    button
                        .setIcon("checkmark")
                        .setTooltip("Set API key")
                        .onClick(async () => {
                            if (apiInput == null) {
                                return;
                            }

                            this.plugin.settings.apiKey[
                                this.plugin.settings
                                    .provider as LlmProviderApiKeyType
                            ] = apiInput.getValue();

                            apiInput.setValue("");
                            await this.plugin.saveSettings();
                            this.renderSettings(containerEl);
                            notice("API key set successfully");
                        }),
                )
                .addExtraButton((button) =>
                    button
                        .setIcon("trash")
                        .setTooltip("Clear API key")
                        .onClick(async () => {
                            if (apiInput == null) {
                                return;
                            }

                            this.plugin.settings.apiKey[
                                this.plugin.settings
                                    .provider as LlmProviderApiKeyType
                            ] = null;

                            apiInput.setValue("");
                            await this.plugin.saveSettings();
                            this.renderSettings(containerEl);
                            notice("API key cleared");
                        }),
                );
        }

        const setModelValue = (value: OpenAIModelType | OllamaModelType) => {
            switch (this.plugin.settings.provider) {
                case "openai":
                    this.plugin.settings.model.openai =
                        value as OpenAIModelType;
                    break;
                case "ollama":
                    return (this.plugin.settings.model.ollama =
                        value as OllamaModelType);
            }
        };

        new Setting(containerEl)
            .setName("Model")
            .setDesc("Which LLM model to use")
            .addDropdown((dropdown) => {
                const options =
                    this.plugin.settings.provider === "ollama"
                        ? ollamaModels
                        : openaiModels;
                for (const option of options) {
                    dropdown.addOption(option, option);
                }
                dropdown
                    .setValue(
                        this.plugin.settings.model[
                            this.plugin.settings.provider
                        ],
                    )
                    .onChange(async (value: OpenAIModelType) => {
                        setModelValue(value);
                        await this.plugin.saveSettings();
                    });
            });

        if (this.plugin.settings.provider === "openai") {
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
        }

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
                        notice("Template successfully reset!");
                        this.plugin.saveSettings();
                    }),
            );
    }

    display(): void {
        const { containerEl } = this;
        this.renderSettings(containerEl);
    }
}

export default SimplePromptSettingTab;
