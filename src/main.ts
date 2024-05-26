import {
    App,
    Editor,
    MarkdownView,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TextAreaComponent,
} from "obsidian";
import {
    CURSOR_COMMAND_NAME,
    DEFAULT_SETTINGS,
    DOC_COMMAND_NAME,
    SELECTION_COMMAND_NAME,
} from "./constants";
import ApiKeyModal from "./modals/api-key-modal";
import PromptModal from "./modals/prompt-modal";
import {
    CommandTypes,
    OpenAIModelType,
    SimplePromptPluginSettings,
} from "./types";

export default class SimplePromptPlugin extends Plugin {
    settings: SimplePromptPluginSettings;

    async onload() {
        await this.loadSettings();
        if (!this.settings.apiKey) {
            new Notice(
                "[SimplePromptPlugin] Please enter your API key in the settings"
            );
        }

        this.addCommand({
            id: "prompt-generate-content-from-selection",
            name: SELECTION_COMMAND_NAME,
            editorCallback: (editor: Editor, view: MarkdownView) => {
                new PromptModal(this, editor, "selection").open();
            },
        });
        this.addCommand({
            id: "prompt-generate-content-at-cursor",
            name: CURSOR_COMMAND_NAME,
            editorCallback: (editor: Editor, view: MarkdownView) => {
                new PromptModal(this, editor, "cursor").open();
            },
        });
        this.addCommand({
            id: "prompt-rewrite-document",
            name: DOC_COMMAND_NAME,
            editorCallback: (editor: Editor, view: MarkdownView) => {
                new PromptModal(this, editor, "document").open();
            },
        });

        this.addSettingTab(new PromptSettingTab(this.app, this));
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class PromptSettingTab extends PluginSettingTab {
    plugin: SimplePromptPlugin;

    constructor(app: App, plugin: SimplePromptPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl).setHeading().setName("LLM Settings");

        const apiKeySetting = new Setting(containerEl)
            .setName("API key")
            .setDesc("API key for LLM");
        apiKeySetting.addExtraButton((btn) => {
            btn.extraSettingsEl.addClasses([
                "pr-w-20",
                "pr-border",
                "pr-border-solid",
                "pr-border-slate-200",
                "pr-shadow-sm",
                "hover:pr-bg-slate-100",
                "hover:pr-shadow-sm",
            ]);
            btn.setIcon("key")
                .setTooltip("Set API key")
                .onClick(async () => {
                    new ApiKeyModal(this.app, this.plugin).open();
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
                })
        );

        new Setting(containerEl).setHeading().setName("Recent Prompts");
        new Setting(containerEl)
            .setName("Limit")
            .setDesc("How many recent prompts to store")
            .addSlider((slider) =>
                slider
                    .setLimits(1, 10, 1)
                    .setDynamicTooltip()
                    .setValue(5)
                    .onChange(async (value) => {
                        this.plugin.settings.recentsLimit = value;
                        await this.plugin.saveSettings();
                    })
            );

        let currentTemplate: CommandTypes = "selection";
        new Setting(containerEl).setName("Prompt Templates").setHeading();

        let promptTemplateTextArea: TextAreaComponent;
        new Setting(containerEl)
            .setDesc("Pick the template to edit")
            .addButton((button) => 
                button
                .setTooltip("Revert selected template to default")
                .setIcon("reset")
                .onClick(async () => {
                    const defaultTemplate = DEFAULT_SETTINGS.prompTemplates[currentTemplate];
                    promptTemplateTextArea.setValue(defaultTemplate);
                    this.plugin.settings.prompTemplates[currentTemplate] = defaultTemplate;
                    this.plugin.saveSettings();
                })
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        selection: SELECTION_COMMAND_NAME,
                        cursor: CURSOR_COMMAND_NAME,
                        document: DOC_COMMAND_NAME,
                    })
                    .setValue("selection")
                    .onChange(async (value: CommandTypes) => {
                        currentTemplate = value;
                        if (promptTemplateTextArea != null) {
                            promptTemplateTextArea.setValue(
                                this.plugin.settings.prompTemplates[value] ?? ""
                            );
                        }
                    })
            );

        const promptTemplatesSetting = new Setting(containerEl).setDesc(
            `Define the prompt templates used for generating content.
            
             Don't delete the placeholders like <SELECTION>, <DOCUMENT>, <REQUEST>, <QUERY> etc.
            `
        );
        promptTemplatesSetting.settingEl.style.alignItems = "start";
        promptTemplatesSetting.addTextArea((textArea) => {
            promptTemplateTextArea = textArea;
            textArea.inputEl.style.minHeight = "400px";
            textArea.inputEl.style.maxHeight = "600px";
            textArea.inputEl.style.minWidth = "400px";
            textArea.inputEl.style.maxWidth = "600px";
            textArea.inputEl.onblur = () => {
                if (
                    !this.validateTemplate(textArea.getValue(), currentTemplate)
                ) {
                    return;
                }
                this.plugin.settings.prompTemplates[currentTemplate] =
                    textArea.getValue();
                this.plugin.saveSettings();
            };
            return textArea.setValue(
                this.plugin.settings.prompTemplates[
                    currentTemplate ?? "selection"
                ]
            );
        });
    }

    validateTemplate(value: string, currentTemplate: CommandTypes): boolean {
        switch (currentTemplate) {
            case "document":
                if (
                    !value.includes("<DOCUMENT>") ||
                    !value.includes("<REQUEST>")
                ) {
                    const errorMsg =
                        "Document prompt template must include <DOCUMENT> and <REQUEST>";
                    console.error(errorMsg);
                    new Notice(errorMsg);
                    return false;
                }
                break;
            case "selection":
                if (
                    !value.includes("<SELECTION>") ||
                    !value.includes("<REQUEST>")
                ) {
                    const errorMsg =
                        "Selection prompt template must include <SELECTION> and <REQUEST>";
                    console.error(errorMsg);
                    new Notice(errorMsg);
                    return false;
                }
                break;
            case "cursor":
                if (!value.includes("<QUERY>")) {
                    const errorMsg =
                        "Cursor prompt template must include <QUERY>";
                    console.error(errorMsg);
                    new Notice(errorMsg);
                    return false;
                }
                break;
        }
        return true;
    }
}
