import {
    Editor,
    MarkdownView,
    Notice,
    Plugin
} from "obsidian";
import {
    CURSOR_COMMAND_NAME,
    DEFAULT_SETTINGS,
    DOC_COMMAND_NAME,
    SELECTION_COMMAND_NAME,
} from "./constants";
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
                "[Simple Prompt Plugin] Please enter your API key in the settings"
            );
        }

        // this.addCommand({
        //     id: "debug",
        //     name: "Debug",
        //     callback: () => {
        //         console.log(this.settings);
        //     },
        // });

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
