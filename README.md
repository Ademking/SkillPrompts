<p align="center">
  <img src="assets/icon.png" alt="SkillPrompts Logo" width="100">
</p>

<h1 align="center">SkillPrompts</h1>

A browser extension to create, organize, and reuse customizable AI prompts across multiple AI chat platforms for faster, more efficient interactions.

## Features

- Create and manage a library of AI skill prompts with customizable variables.
- Quickly insert prompts into ChatGPT and other supported sites.
- Contains a variety of pre-built prompts for different use cases.
- Variables and reusable blocks for dynamic and flexible prompt creation. (Variables are placeholders that you can fill in with specific values when inserting a prompt, while reusable blocks are fixed pieces of text that you can manage and insert across multiple prompts.)

## Demo

https://github.com/user-attachments/assets/cb51fa3c-1dd8-44b9-80d8-9dbb0e39a983

## Supported Sites

This extension is designed to work on various AI chat platforms. The following sites are currently supported:

- [x] https://chatgpt.com
- [x] https://gemini.google.com

These are not supported yet but are on the roadmap:

- [ ] https://copilot.microsoft.com
- [ ] https://huggingface.co/chat
- [ ] https://chat.mistral.ai
- [ ] https://poe.com
- [ ] https://www.perplexity.ai
- [ ] https://chat.deepseek.com
- [ ] https://kimi.com/
- [ ] https://v0.app/
- [ ] https://github.com/copilot/
- [ ] https://grok.com/
- [ ] https://cursor.com/agents
- [ ] https://claude.ai/

> More to be added based on user demand and feasibility.

## Installation

### Chromium-based browsers (Chrome, Edge, Brave, etc.):

1. Download the Chrome version from the releases page. [Click here to download](https://github.com/Ademking/SkillPrompts/releases/download/1.1.0/chrome-mv3-prod.zip)
2. Unzip the downloaded file to a location on your computer.
3. Open your browser and navigate to `chrome://extensions/`.
4. Enable "Developer mode" using the toggle in the top right corner.
5. Click "Load unpacked" and select the unzipped folder.
6. The extension should now be installed and active. Go to a supported site and type `/` to see the prompt library.

### Firefox:

1. Download the Firefox version from the releases page. [Click here to download](https://github.com/Ademking/SkillPrompts/releases/download/1.1.0/firefox-mv3-prod.zip)
2. Unzip the downloaded file to a location on your computer.
3. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
4. Click "Load Temporary Add-on" and select the `manifest.json` file from the unzipped folder.
5. The extension should now be installed and active. Go to a supported site and type `/` to see the prompt library.

## Changelog

### v1.1.0 (2026-05-13)

- Added Prompt preview: Users can now preview the full prompt with variables before inserting it, ensuring they select the right one for their needs.
- Added Import/Export functionality: Users can now easily back up their prompt library or transfer it to another device by exporting and importing their prompts as JSON files.
- Added Favorites system: Users can now mark prompts as favorites for quick access, making it easier to find and use their most commonly used prompts.
- Add Reusable blocks: Users can now create reusable blocks of text or variables that can be easily inserted into multiple prompts, saving time and ensuring consistency across prompts. Unlike variables, blocks have fixed values that you manage. Use them to store common instructions, context, or any text snippets you want to reuse across multiple prompts.
- Fixed various bugs and added instructions for using variables / blocks.

### v1.0.0 (2026-05-11)

- Initial release

## Contributing

Contributions are welcome! If you have ideas for new features, improvements, or bug fixes, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

Adem Kouki
[GitHub](https://github.com/Ademking) - [LinkedIn](https://www.linkedin.com/in/ademkouki/)
