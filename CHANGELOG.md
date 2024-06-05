# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.4] - 2024-06-05

### Removed
- Removed setting commands for API key and LLM model

### Changed
- Changed the API key setting to not
- Changed the minAppVersion to 1.5.12
- Various small changes to comply with Obsidian plugin guidelines

## [0.5.0] - 2024-06-04

### Added
- Command for generating content from a YouTube video URL
- Added linting and pre-commit hooks

## [0.4.1] - 2024-06-01

### Fixed

-   Centered loading spinner in prompt modal again
-   Removed fixed with for recent prompts dropdown to make it nicer on mobile

## [0.4.0] - 2024-05-31

### Changed

-   Redesign of UI for prompt modal
    -   Recent prompts are now shown in a dropdown
    -   Added subtitles
-   Optimized code for adding generation commands
-   Moved some settings around in the settings panel
-   Streamlined types for generation in preparation for more API integrations (avoiding OpenAI specific types)

### Added

-   Added command for toggling streaming responses
-   Added command for switching between LLMs
-   Added command and setting for toggling recent prompts

## [0.3.0] - 2024-05-31

### Changed

-   Refactor: Moved openai generation to separate class to prepare for more API integrations
-   Changed some texts

### Added

-   Added command for setting API key

## [0.2.4] - 2024-05-30

### Fixed

-   Fixed issue with recent prompts being set to a single one when limit was reached

## [0.2.0] - 2024-05-28

### Added

-   This changelog
-   Added support for streaming responses from LLM
-   Added "Ctrl + Enter" command to submit while in the prompt modal

### Fixed

-   Fixed typo in settings variable name

## [0.1.0] - 2024-05-26

-   Initial release
