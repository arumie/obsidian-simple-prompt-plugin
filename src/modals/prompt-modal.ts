import { OpenAI, SimplePrompt } from "llamaindex";
import { Editor, Modal, Notice } from "obsidian";
import {
    CURSOR_COMMAND_NAME,
    DOC_COMMAND_NAME,
    SELECTION_COMMAND_NAME,
} from "../constants";
import { CommandTypes } from "../types";
import SimplePromptPlugin from "src/main";

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

        const { textarea, recentPrompts } = this.buildPromptFields(wrapper);

        const button = wrapper.createEl("button", { text: "Submit" });
        button.addEventListener("click", async () => {
            if (textarea.value === "") {
                new Notice("Please enter a prompt");
                return;
            }
            wrapper.innerHTML = "";
            const loader = wrapper.createEl("span");
            loader.addClasses(["loading", "dots", "pr-text-xl"]);
            const llm = new OpenAI({
                model: this.plugin.settings.model,
                apiKey: this.plugin.settings.apiKey ?? "",
                additionalSessionOptions: { dangerouslyAllowBrowser: true },
            });
            switch (this.type) {
                case "document":
                    await this.generateForDocument(
                        llm,
                        textarea,
                        recentPrompts
                    );
                    break;
                case "cursor":
                    await this.generateAtCursor(llm, textarea, recentPrompts);
                    break;
                case "selection":
                    await this.generateForSelection(
                        llm,
                        textarea,
                        recentPrompts
                    );
                    break;
            }

            this.close();
        });
        button.addClasses(["pr-p-5"]);
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

    private buildPromptFields(wrapper: HTMLDivElement) {
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
        textarea.focus();

        const recentPrompts = this.plugin.settings.recentPrompts;
        const recentPromptsList = promptWrapper.createEl("ul");
        recentPromptsList.addClasses([
            "pr-w-1/4",
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

        textarea.addClasses([
            "pr-p-2",
            "pr-border",
            "pr-rounded-md",
            "pr-w-full",
            "pr-h-40",
            "pr-resize-none",
        ]);
        return { textarea, recentPrompts };
    }

    private async generateForDocument(
        llm: OpenAI,
        textarea: HTMLTextAreaElement,
        recentPrompts: string[]
    ) {
        const prompt: SimplePrompt = ({ document, request }) => {
            return this.plugin.settings.prompTemplates.document
                .replace("<DOCUMENT>", `${document}`)
                .replace("<REQUEST>", `${request}`);
        };
        await llm
            .complete({
                prompt: prompt({
                    document: this.editor.getValue(),
                    request: textarea.value,
                }),
            })
            .then((response) => {
                this.saveRecentPrompt(textarea, recentPrompts);
                this.editor.setValue(response.text);
            })
            .catch((e) => {
                console.error(e);
                new Notice(`Error generating content: ${e}`);
            });
    }

    private async generateAtCursor(
        llm: OpenAI,
        textarea: HTMLTextAreaElement,
        recentPrompts: string[]
    ) {
        const prompt: SimplePrompt = ({ query }) => {
            return this.plugin.settings.prompTemplates.cursor.replace(
                "<QUERY>",
                `${query}`
            );
        };
        await llm
            .complete({
                prompt: prompt({
                    query: textarea.value,
                    context: this.editor.getSelection(),
                }),
            })
            .then((response) => {
                this.saveRecentPrompt(textarea, recentPrompts);
                this.editor.replaceRange(
                    response.text,
                    this.editor.getCursor(),
                    this.editor.getCursor()
                );
            })
            .catch((e) => {
                console.error(e);
                new Notice(`Error generating content: ${e}`);
            });
    }

    private async generateForSelection(
        llm: OpenAI,
        textarea: HTMLTextAreaElement,
        recentPrompts: string[]
    ) {
        const prompt: SimplePrompt = ({ selection, request }) => {
            return this.plugin.settings.prompTemplates.selection
                .replace("<SELECTION>", `${selection}`)
                .replace("<REQUEST>", `${request}`);
        };
        await llm
            .complete({
                prompt: prompt({
                    query: textarea.value,
                    context: this.editor.getSelection(),
                }),
            })
            .then((response) => {
                this.saveRecentPrompt(textarea, recentPrompts);
                this.editor.replaceSelection(response.text);
            })
            .catch((e) => {
                console.error(e);
                new Notice(`Error generating content: ${e}`);
            });
    }

    private saveRecentPrompt(
        textarea: HTMLTextAreaElement,
        recentPrompts: string[]
    ) {
        if (textarea.value !== "") {
            if (!recentPrompts.includes(textarea.value)) {
                const newLength = this.plugin.settings.recentPrompts.unshift(
                    textarea.value
                );
                if (newLength > this.plugin.settings.recentsLimit) {
                    this.plugin.settings.recentPrompts.pop();
                }
            } else {
                const index = recentPrompts.indexOf(textarea.value);
                recentPrompts.splice(index, 1);
                recentPrompts.unshift(textarea.value);
            }
            this.plugin.saveSettings();
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
