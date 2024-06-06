import { Notice } from "obsidian";

export function notice(message: string) {
    new Notice(`[Simple Prompt] ${message}`);
}
