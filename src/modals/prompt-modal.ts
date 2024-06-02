import { Editor, Modal, Notice, Setting } from "obsidian";
import { generate, generateStreaming } from "src/llms/openai/generate";
import SimplePromptPlugin from "src/main";
import {
    CURSOR_COMMAND_NAME,
    CURSOR_COMMAND_SUBTITLE,
    DOC_COMMAND_NAME,
    DOC_COMMAND_SUBTITLE,
    SELECTION_COMMAND_NAME,
    SELECTION_COMMAND_SUBTITLE,
} from "../constants";
import { CommandType } from "../types";

export default class PromptModal extends Modal {
    editor: Editor;
    plugin: SimplePromptPlugin;
    type: CommandType;
    constructor(
        plugin: SimplePromptPlugin,
        editor: Editor,
        type?: CommandType
    ) {
        super(plugin.app);
        this.editor = editor;
        this.plugin = plugin;
        this.type = type ?? "selection";
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        modalEl.addClasses(["pr-w-1/2"]);
        const wrapper = contentEl.createEl("div");
        wrapper.addClasses(["pr-flex", "pr-flex-col", "pr-p-5"]);

        const title = wrapper.createEl("span", { text: this.getTitle() });
        title.addClasses(["pr-text-lg", "pr-font-semibold"]);

        const subtitle = wrapper.createEl("span", { text: this.getSubtitle() });
        subtitle.addClasses([
            "pr-text-sm",
            "pr-font-normal",
            "pr-mb-10",
            "pr-opacity-50",
        ]);

        const { textarea } = this.buildPromptFields(wrapper);

        const button = wrapper.createEl("button", { text: "Generate!" });
        button.addClasses([
            "!pr-bg-emerald-600",
            "pr-text-white",
            "hover:!pr-bg-emerald-700",
            "pr-mt-5",
            "pr-font-semibold",
            "pr-text-base",
        ]);
        button.addEventListener("click", async () => {
            if (textarea.value === "") {
                new Notice("Please enter a prompt");
                return;
            }
            wrapper.empty();
            const loader = wrapper.createEl("span");
            wrapper.addClasses(["pr-flex", "pr-flex-col", "pr-items-center"]);
            loader.addClasses(["loading", "dots", "pr-text-xl"]);
            switch (this.type) {
                case "document":
                    await this.generateForDocument(textarea);
                    break;
                case "cursor":
                    await this.generateAtCursor(textarea);
                    break;
                case "selection":
                    await this.generateForSelection(textarea);
                    break;
            }

            this.close();
        });

        button.addClasses(["pr-p-5", "pr-rounded-md", "pr-cursor-pointer"]);

        textarea.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                button.click();
            }
        });
    }

    private getTitle(): string | DocumentFragment | undefined {
        switch (this.type) {
            case "cursor":
                return CURSOR_COMMAND_NAME;
            case "selection":
                return SELECTION_COMMAND_NAME;
            case "document":
                return DOC_COMMAND_NAME;
            default:
                return "Generate content";
        }
    }

    private getSubtitle(): string | DocumentFragment | undefined {
        switch (this.type) {
            case "cursor":
                return CURSOR_COMMAND_SUBTITLE;
            case "selection":
                return SELECTION_COMMAND_SUBTITLE;
            case "document":
                return DOC_COMMAND_SUBTITLE;
            default:
                return "Generate content";
        }
    }

    private buildPromptFields(wrapper: HTMLDivElement): {
        textarea: HTMLTextAreaElement;
    } {
        const promptWrapper = wrapper.createEl("div");
        promptWrapper.addClasses([
            "pr-w-full",
            "pr-flex",
            "pr-gap-5",
            "pr-mb-5",
        ]);

        const textarea = promptWrapper.createEl("textarea", {
            placeholder: "Write your prompt here",
        });

        textarea.addClasses([
            "pr-p-2",
            "pr-border",
            "pr-rounded-md",
            "pr-w-full",
            "pr-min-h-40",
            "pr-h-auto",
            "pr-resize-none",
            "pr-text-base",
        ]);

        textarea.focus();
        const recentPrompts = this.plugin.settings.recentPrompts;
        if (
            recentPrompts.length === 0 ||
            !this.plugin.settings.recentPromptsEnabled
        ) {
            return { textarea };
        }

        const recentPromptSelector = new Setting(wrapper)
            .setDesc("Recent prompts")
            .addDropdown((dropdown) => {
                let i = 0;
                for (const prompt of this.plugin.settings.recentPrompts) {
                    dropdown.addOption(
                        `${i}`,
                        `${
                            prompt.length > 50
                                ? prompt.substring(0, 50) + "...  "
                                : prompt
                        }`
                    );
                    const option = dropdown.selectEl.options[i];
                    option.addClasses(["pr-text-xs"]);
                    option.ariaLabel = prompt;
                    i++;
                }
                dropdown.setValue("");
                dropdown.onChange(async (value) => {
                    dropdown.setValue("");
                    textarea.value =
                        this.plugin.settings.recentPrompts[parseInt(value)];
                });
            });
        recentPromptSelector.descEl.addClasses([
            "pr-text-base",
            "pr-font-semibold",
        ]);
        recentPromptSelector.settingEl.addClasses([
            "pr-py-5",
            "pr-border-0",
            "pr-border-y",
            "pr-border-solid",
            "pr-border-y-slate-200",
        ]);
        return { textarea };
    }

    private async generateForDocument(textarea: HTMLTextAreaElement) {
        const prompt = this.plugin.settings.promptTemplates.document
            .replace("<DOCUMENT>", `${this.editor.getValue()}`)
            .replace("<REQUEST>", `${textarea.value}`);

        if (this.plugin.settings.streaming) {
            const onStart = () => {
                this.editor.setValue("");
                this.close();
            };
            const onEnd = () => {
                this.saveRecentPrompt(textarea);
                new Notice("Action complete!");
            };
            await generateStreaming(
                this.plugin.settings,
                prompt,
                (chunk) => this.handleChunk(chunk),
                onStart,
                onEnd
            );
        } else {
            await generate(this.plugin.settings, prompt, (result) => {
                this.editor.setValue(result);
                this.saveRecentPrompt(textarea);
            });
        }
    }

    private async generateAtCursor(textarea: HTMLTextAreaElement) {
        const prompt = this.plugin.settings.promptTemplates.cursor.replace(
            "<QUERY>",
            `${textarea.value}`
        );

        if (this.plugin.settings.streaming) {
            const onStart = () => {
                this.close();
            };
            const onEnd = () => {
                this.saveRecentPrompt(textarea);
                new Notice("Action complete!");
            };
            await generateStreaming(
                this.plugin.settings,
                prompt,
                (chunk) => this.handleChunk(chunk),
                onStart,
                onEnd
            );
        } else {
            await generate(this.plugin.settings, prompt, (result) => {
                this.editor.replaceRange(
                    result,
                    this.editor.getCursor(),
                    this.editor.getCursor()
                );
            });
        }
    }

    private async generateForSelection(textarea: HTMLTextAreaElement) {
        const prompt = this.plugin.settings.promptTemplates.selection
            .replace("<SELECTION>", `${this.editor.getSelection()}`)
            .replace("<REQUEST>", `${textarea.value}`);
        if (this.plugin.settings.streaming) {
            const onStart = () => {
                this.editor.replaceSelection("");
                this.close();
            };
            const onEnd = () => {
                this.saveRecentPrompt(textarea);
                new Notice("Action complete!");
            };
            await generateStreaming(
                this.plugin.settings,
                prompt,
                (chunk) => this.handleChunk(chunk),
                onStart,
                onEnd
            );
        } else {
            await generate(this.plugin.settings, prompt, (result) => {
                this.editor.replaceSelection(result);
                this.saveRecentPrompt(textarea);
            });
        }
    }

    private handleChunk(chunk: string) {
        const cursorPos = this.editor.getCursor();
        this.editor.replaceRange(chunk, cursorPos, cursorPos);
        this.editor.setCursor(cursorPos.line, cursorPos.ch + chunk.length);
    }

    private saveRecentPrompt(textarea: HTMLTextAreaElement) {
        if (textarea.value !== "") {
            if (!this.plugin.settings.recentPrompts.includes(textarea.value)) {
                const newLength = this.plugin.settings.recentPrompts.unshift(
                    textarea.value
                );
                if (newLength > this.plugin.settings.recentsLimit) {
                    this.plugin.settings.recentPrompts.pop();
                }
            } else {
                const index = this.plugin.settings.recentPrompts.indexOf(
                    textarea.value
                );
                this.plugin.settings.recentPrompts.splice(index, 1);
                this.plugin.settings.recentPrompts.unshift(textarea.value);
            }
            this.plugin.saveSettings();
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
