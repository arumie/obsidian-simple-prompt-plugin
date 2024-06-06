import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import {
    DEFAULT_SETTINGS,
    PROMPT_COMMANDS,
    SETTINGS_TOGGLE_RECENT_PROMPTS_COMMAND_NAME,
    SETTINGS_TOGGLE_STREAMING_COMMAND_NAME,
} from "./constants";
import PromptModal from "./modals/prompt-modal";
import SimplePromptSettingTab from "./settings";
import { SimplePromptPluginSettings } from "./types";
import { data } from "autoprefixer";

export default class SimplePromptPlugin extends Plugin {
    settings: SimplePromptPluginSettings;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: "settings-toggle-llm-streaming",
            name: SETTINGS_TOGGLE_STREAMING_COMMAND_NAME,
            callback: async () => {
                this.settings.streaming = !this.settings.streaming;
                await this.saveSettings();
                new Notice(
                    `Streaming LLM responses is now ${
                        this.settings.streaming ? "enabled" : "disabled"
                    }`,
                );
            },
        });

        this.addCommand({
            id: "settings-toggle-recent-prompts",
            name: SETTINGS_TOGGLE_RECENT_PROMPTS_COMMAND_NAME,
            callback: async () => {
                this.settings.recentPromptsEnabled =
                    !this.settings.recentPromptsEnabled;
                await this.saveSettings();
                new Notice(
                    `Recent prompts are now ${
                        this.settings.recentPromptsEnabled
                            ? "enabled"
                            : "disabled"
                    }`,
                );
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
        const userData = await this.loadData();
        if (userData.settingsVersion !== DEFAULT_SETTINGS.settingsVersion) {
            console.log(
                "Settings version mismatch, resetting to default. Previous version: ",
                userData,
            );
            this.settings = DEFAULT_SETTINGS;
            this.saveSettings();
            new Notice(
                "[Simple Prompt] Due to updated version, settings have been reset to default. Please reconfigure API keys in the settings",
            );
        } else {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, userData);
        }

        for (const c of PROMPT_COMMANDS) {
            if (this.settings.promptTemplates[c.type] === undefined) {
                this.settings.promptTemplates[c.type] =
                    DEFAULT_SETTINGS.promptTemplates[c.type];
                this.saveSettings();
            }
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
