import {
    Editor,
    MarkdownView,
    Notice,
    Plugin
} from "obsidian";
import {
    DEFAULT_SETTINGS,
    PROMPT_COMMANDS,
    SETTINGS_CHANGE_LLM_MODEL_COMMAND_NAME,
    SETTINGS_SET_API_KEY_COMMAND_NAME,
    SETTINGS_TOGGLE_RECENT_PROMPTS_COMMAND_NAME,
    SETTINGS_TOGGLE_STREAMING_COMMAND_NAME
} from "./constants";
import ApiKeyModal from "./modals/api-key-modal";
import ModelModal from "./modals/model-modal";
import PromptModal from "./modals/prompt-modal";
import SimplePromptSettingTab from "./settings";
import {
    SimplePromptPluginSettings
} from "./types";

export default class SimplePromptPlugin extends Plugin {
    settings: SimplePromptPluginSettings;

    async onload() {
        await this.loadSettings();
        if (!this.settings.apiKey) {
            new Notice(
                "[Simple Prompt] Please enter your API key in the settings or with the command 'Set API key'"
            );
        }

        this.addCommand({
            id: "settings-set-api-key",
            name: SETTINGS_SET_API_KEY_COMMAND_NAME,
            callback: () => {
                new ApiKeyModal(this).open();
            },
        });

        this.addCommand({
            id: "settings-change-llm-model",
            name: SETTINGS_CHANGE_LLM_MODEL_COMMAND_NAME,
            callback: () => {
                new ModelModal(this).open();
            },
        });

        this.addCommand({
            id: "settings-toggle-llm-streaming",
            name: SETTINGS_TOGGLE_STREAMING_COMMAND_NAME,
            callback: async () => { 
                this.settings.streaming = !this.settings.streaming;
                await this.saveSettings();
                new Notice(`Streaming LLM responses is now ${this.settings.streaming ? "enabled" : "disabled"}`)
            },
        });

        this.addCommand({
            id: "settings-toggle-recent-prompts",
            name: SETTINGS_TOGGLE_RECENT_PROMPTS_COMMAND_NAME,
            callback: async () => { 
                this.settings.recentPromptsEnabled = !this.settings.recentPromptsEnabled;
                await this.saveSettings();
                new Notice(`Recent prompts are now ${this.settings.recentPromptsEnabled ? "enabled" : "disabled"}`)
            },
        });

        for (const c of PROMPT_COMMANDS) {
            this.addCommand({
                id: c.id,
                name: c.name,
                editorCallback: (editor: Editor, _: MarkdownView) => {
                    new PromptModal(this, editor, c.type).open();
                },
            });
        }

        this.addSettingTab(new SimplePromptSettingTab(this.app, this));
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
