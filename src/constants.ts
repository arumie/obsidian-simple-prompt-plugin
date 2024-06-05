import { CommandType, SimplePromptPluginSettings } from "./types";

// PROMPTS
export const DEFAULT_CURSOR_PROMPT_TEMPLATE = `
You are a helpful AI assistant that can, given a piece of text and a request generate an answer using markdown.
Include headers, lists, checkboxes, and other markdown elements in your answer when it makes sense.

====================================
Examples:

Request:
==================
Generate a shopping list with items for Spagetthi Carbonara
==================
Answer:
# Shopping list

- [ ] Pasta
- [ ] Eggs
- [ ] Parmesan cheese
- [ ] Pancetta
====================================

Request:
==================
Give me a good knock-knock joke
==================
Answer:
Knock, knock. Who's there? Lettuce. Lettuce who? Lettuce in, it's cold out here!
====================================    

Request: 
==================
<QUERY>
==================
Answer:`;

export const DEFAULT_SELECTION_PROMPT_TEMPLATE = `
You are a helpful AI assistant that can, given a piece of text and a request generate an answer using markdown.
====================================
Example:

Text:
==================
# TODO list
- Find out what is the capital of France?
==================
Request:
==================
Add 2 more items to the list with other questions about France
==================
Answer:
# TODO list
- Find out what is the capital of France?
- Find out what is the population of France?
- Find out what is the area of France?
====================================    

Text: 
==================
<SELECTION>
==================
Request: 
==================
<REQUEST>
==================
Answer:`;

export const DEFAULT_REWRITE_DOCUMENT_TEMPLATE = `
You are a helpful AI assistant who is an expert in rewriting text. Given a markdown document and a request, you can generate a new version of the document.

====================================
Example:

Document:
==================
# TODO list
- Find out what is the capital of France?
==================
Request:
==================
Add 2 more items to the list with other questions about France
==================
Answer:
# TODO list
- Find out what is the capital of France?
- Find out what is the population of France?
- Find out what is the area of France?
====================================    

Document: 
==================
<DOCUMENT>
==================
Request: 
==================
<REQUEST>
==================
Answer:`;

export const DEFAULT_YT_TRANSCRIPT_PROMPT_TEMPLATE = `
You are a helpful AI assistant that can, given a transcript from a YouTube video and a request generate an answer using markdown.
Include headers, lists, checkboxes, and other markdown elements in your answer when it makes sense.

Example:
====================================
Title: History of the Roman Empire
Author: History Buff
Keywords: Rome, Empire, History
Transcript:
==================
Hello guys, welcome to my channel. Today we are going to talk about the history of the Roman Empire [...] Remember to like and subscribe to my channel.
==================
Request:
==================
Summarize the main points
==================
Answer:
# History of the Roman Empire

- The Roman Empire was one of the largest empires in history
- It was founded in 27 BC and lasted until 476 AD
[...]
- Testudo formation was a military tactic used by the Romans
====================================

Title: <TITLE>
Author: <AUTHOR>
Keywords: <KEYWORDS>
Transcript:
==================
<TRANSCRIPT>
==================
Request:
==================
<REQUEST>
==================
Answer:`;

// PROMPT COMMANDS
export const SELECTION_COMMAND_NAME = "Rewrite selection";
export const DOC_COMMAND_NAME = "Rewrite document";
export const CURSOR_COMMAND_NAME = "Generate content at cursor";
export const YT_TRANSCRIPT_COMMAND_NAME = "Generate from YouTube link";

export const SELECTION_COMMAND_SUBTITLE =
    "Write your prompt to rewrite the selected text. Ex. 'Add more options', 'summarize the text', etc.";
export const DOC_COMMAND_SUBTITLE =
    "Write you request to rewrite the entire document. Ex. 'Structure the document better', 'Add more examples', etc.";
export const CURSOR_COMMAND_SUBTITLE =
    "Give request to generate content at the cursor. Ex. 'Write a joke', 'Explain the concept of ...', etc.";
export const YT_TRANSCRIPT_COMMAND_SUBTITLE =
    "Add link to a YouTube video and write your request. Be aware that the transcription from the YouTube video is used, so make sure that this is available or viable. Ex. 'Summarize the main points', 'Write down the recipe for ...', etc.";

export const PROMPT_COMMANDS: {
    name: string;
    id: string;
    type: CommandType;
}[] = [
    {
        name: SELECTION_COMMAND_NAME,
        id: "prompt-generate-content-from-selection",
        type: "selection",
    },
    {
        name: CURSOR_COMMAND_NAME,
        id: "prompt-generate-content-at-cursor",
        type: "cursor",
    },
    {
        name: DOC_COMMAND_NAME,
        id: "prompt-rewrite-document",
        type: "document",
    },
    {
        name: YT_TRANSCRIPT_COMMAND_NAME,
        id: "prompt-generate-from-yt-transcript",
        type: "youtube",
    },
];

// SETTINGS
export const DEFAULT_SETTINGS: SimplePromptPluginSettings = {
    apiKey: null,
    model: "gpt-3.5-turbo",
    recentPrompts: [],
    recentsLimit: 5,
    recentPromptsEnabled: true,
    promptTemplates: {
        selection: DEFAULT_SELECTION_PROMPT_TEMPLATE,
        cursor: DEFAULT_CURSOR_PROMPT_TEMPLATE,
        document: DEFAULT_REWRITE_DOCUMENT_TEMPLATE,
        youtube: DEFAULT_YT_TRANSCRIPT_PROMPT_TEMPLATE,
    },
    streaming: false,
};

// SETTINGS COMMANDS
export const SETTINGS_TOGGLE_STREAMING_COMMAND_NAME = "Toggle streaming";
export const SETTINGS_TOGGLE_RECENT_PROMPTS_COMMAND_NAME =
    "Toggle Enable/Disable Recent Prompts";
