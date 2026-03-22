# Claude Chat App

A desktop chat application for Claude Code with multi-session terminals, model switching, and file diffs. Built with Electron, React, and the Claude Agent SDK.

## Features

- **Multi-session terminals** — Run multiple Claude Code sessions simultaneously
- **Model switching** — Switch between Opus 4.6, Sonnet 4.6, and Haiku 4.5
- **Git integration** — View changed files and side-by-side diffs
- **Session persistence** — Chat sessions are saved locally with SQLite
- **Command palette** — Quick access to actions with Cmd+K
- **Keyboard shortcuts** — Cmd+N (new chat), Cmd+W (close), Cmd+1-9 (switch)

## Prerequisites

- Node.js 18+
- An Anthropic API key (set as `ANTHROPIC_API_KEY` environment variable)
- Claude Code CLI installed

## Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Build

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## Tech Stack

- **Electron** — Desktop app framework
- **React** — UI framework
- **Tailwind CSS v4** — Styling
- **xterm.js** — Terminal emulator
- **better-sqlite3** — Local session storage
- **zustand** — State management
- **Claude Agent SDK** — AI integration

## License

MIT
