import { Editor, Modal, Notice } from "obsidian";
import {
    CURSOR_COMMAND_NAME,
    DOC_COMMAND_NAME,
    SELECTION_COMMAND_NAME,
} from "../constants";
import { CommandTypes } from "../types";
import SimplePromptPlugin from "src/main";
import OpenAI from "openai";

export default class PromptModal extends Modal {
    editor: Editor;
    plugin: SimplePromptPlugin;
    type: CommandTypes;
    constructor(
        plugin: SimplePromptPlugin,
        editor: Editor,
        type?: CommandTypes
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
        wrapper.addClasses([
            "pr-flex",
            "pr-flex-col",
            "pr-p-5",
            "pr-gap-5",
            "pr-justify-center",
            "pr-items-center",
        ]);

        const { textarea } = this.buildPromptFields(wrapper);

        const button = wrapper.createEl("button", { text: "Generate!" });
        button.addEventListener("click", async () => {
            if (textarea.value === "") {
                new Notice("Please enter a prompt");
                return;
            }
            wrapper.innerHTML = "";
            const loader = wrapper.createEl("span");
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

        button.addClasses([
            "pr-p-5",
            "pr-rounded-md",
            "pr-cursor-pointer",
        ]);

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

    private buildPromptFields(wrapper: HTMLDivElement): {
        textarea: HTMLTextAreaElement;
    } {
        const title = wrapper.createEl("h3", { text: this.getTitle() });
        title.addClasses(["pr-text-lg", "pr-font-semibold", "pr-mb-5"]);

        const promptWrapper = wrapper.createEl("div");
        promptWrapper.addClasses([
            "pr-w-full",
            "pr-flex",
            "pr-flex-row",
            "pr-gap-5",
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
        if (recentPrompts.length === 0) {
            return { textarea };
        }
        const recentPromptsList = promptWrapper.createEl("ul");
        recentPromptsList.addClasses([
            "pr-pl-5",
            "pr-border-0",
            "pr-border-l",
            "pr-border-solid",
            "pr-border-slate-200",
            "pr-m-0",
            "pr-list-none",
        ]);
        recentPromptsList
            .createEl("li", { text: "Recent prompts" })
            .addClasses(["pr-font-semibold", "pr-mb-2"]);
        for (const prompt of recentPrompts) {
            const li = recentPromptsList.createEl("li");
            li.ariaLabel = prompt;
            li.addClasses([
                "pr-cursor-pointer",
                "pr-p-2",
                "pr-border",
                "pr-border-solid",
                "pr-my-1",
                "pr-rounded-md",
                "pr-min-w-40",
                "pr-border-slate-200",
                "hover:pr-bg-slate-100",
            ]);
            const p = li.createEl("p", { text: prompt });
            p.addClasses([
                "pr-line-clamp-1",
                "pr-m-0",
                "pr-text-xs",
                "text-slate-500",
            ]);
            li.addEventListener("click", () => {
                textarea.value = prompt;
            });
        }
        return { textarea };
    }

    private async generateForDocument(textarea: HTMLTextAreaElement) {
        const prompt = this.plugin.settings.promptTemplates.document
            .replace("<DOCUMENT>", `${this.editor.getValue()}`)
            .replace("<REQUEST>", `${textarea.value}`);

        if (this.plugin.settings.streaming) {
            await this.generateStreaming(textarea, prompt, () => {
                this.editor.setValue("");
            });
        } else {
            await this.generate(textarea, prompt, (result) => {
                this.editor.setValue(result);
            });
        }
    }

    private async generateAtCursor(textarea: HTMLTextAreaElement) {
        const prompt = this.plugin.settings.promptTemplates.cursor.replace(
            "<QUERY>",
            `${textarea.value}`
        );

        if (this.plugin.settings.streaming) {
            await this.generateStreaming(textarea, prompt);
        } else {
            await this.generate(textarea, prompt, (result) => {
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
            await this.generateStreaming(textarea, prompt, () => {
                this.editor.replaceSelection("");
            });
        } else {
            await this.generate(textarea, prompt, (result) => {
                this.editor.replaceSelection(result);
            });
        }
    }

    private async generate(
        textarea: HTMLTextAreaElement,
        prompt: string,
        fn: (result: string) => void
    ) {
        const openai = new OpenAI({
            apiKey: this.plugin.settings.apiKey ?? "",
            dangerouslyAllowBrowser: true,
        });

        await openai.chat.completions
            .create({
                model: this.plugin.settings.model,
                messages: [{ role: "user", content: prompt }],
            })
            .then((response) => {
                if (response.choices[0].message.content) {
                    this.saveRecentPrompt(textarea);
                    fn(response.choices[0].message.content);
                }
            })
            .catch((e) => {
                console.error(e);
                new Notice(`Error generating content: ${e}`);
            });
    }

    private async generateStreaming(
        textarea: HTMLTextAreaElement,
        prompt: string,
        onSuccess?: () => void
    ) {
        const openai = new OpenAI({
            apiKey: this.plugin.settings.apiKey ?? "",
            dangerouslyAllowBrowser: true,
        });

        const stream = await openai.chat.completions
            .create({
                model: this.plugin.settings.model,
                messages: [{ role: "user", content: prompt }],
                stream: true,
            })
            .catch((e) => {
                console.error(e);
                new Notice(`Error generating content: ${e}`);
                return null;
            });
        if (stream) {
            this.close();
            if (onSuccess) onSuccess();
            for await (const chunk of stream) {
                const cursorPos = this.editor.getCursor();
                const textChunk = chunk.choices[0].delta.content ?? ""
                this.editor.replaceRange(
                    textChunk,
                    cursorPos,
                    cursorPos
                );
                this.editor.setCursor(cursorPos.line, cursorPos.ch + textChunk.length);
            }
            new Notice("Action complete!");
            this.saveRecentPrompt(textarea);
        }
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
