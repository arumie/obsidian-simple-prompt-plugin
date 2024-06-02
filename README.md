# Simple Prompt

This is a plugin for Obsidian (https://obsidian.md).

## What is Simple Prompt?

Simple Prompt is a plugin for Obsidian that allows you generate content in your notes using LLMs.

The commands open a modal that allows you to write a query and generate content based on the query.

It provides the following commands:

- **Generate content at your cursor**: This command will generate content at the cursor position.
- **Rewrite selection**: This command will replace the selected text with the generated content.
- **Rewrite document**: This command will replace the entire document with the generated content.

It also gives the following options:

- **Pick which LLM to use**: Choose from a list of LLMs to generate content.
  - *Currently, only OpenAI models are supported*
- **Customize Prompt Templates**: You can customize the prompt templates to generate content based on your needs.
- **Recent prompts**: You can view the recent prompts you have used and reuse them.

## Future Features

- Add support for other LLMs (Anthropic Claude, Cohere Aya, Ollama, Llama-files etc.)
- Add "**Generate image**" command to generate images using LLMs.
- Add "**Generate content som YouTube link**" command to generate content based on a YouTube link.
- Add support for **indexing all documents in the vault** and generating content based on the index.
- Add encryption for the saved API key.
- Add support for adding custom actions and templates

## How to use

- Clone this repo into your Obsidian vault's plugins folder.
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.
- `npm run build:css` to build the css.

### Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/simple-prompt-plugin/`.
- Reload Obsidian.

**Note**: The plugin saves the API key in the Obsidian vault settings. Make sure to keep your API key safe. 
- If using Git plugin. Add .gitignore with `.obsidian/plugins/simple-prompt-plugin/data.json` to the vault to avoid pushing the API key to your repository.

## Demo

![Demo](./assets/SimplePromptDocument3.gif)