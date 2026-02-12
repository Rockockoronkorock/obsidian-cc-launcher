# obsidian-cc-launch Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-11

## Active Technologies

- TypeScript 5.x with strict mode enabled + Obsidian API (minAppVersion: 1.0.0 or higher) (001-claude-code-launcher)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x with strict mode enabled: Follow standard conventions

## Recent Changes

- 001-claude-code-launcher: Added TypeScript 5.x with strict mode enabled + Obsidian API (minAppVersion: 1.0.0 or higher)

<!-- MANUAL ADDITIONS START -->

## Implementation Complete

**Status**: ✅ MVP Implemented (All 42 tasks complete)

### File Structure
```
src/
├── main.ts              # Plugin lifecycle (25 lines)
├── settings.ts          # Settings UI and defaults (120 lines)
├── types.ts             # TypeScript interfaces (43 lines)
├── commands/
│   └── launch-claude.ts # Context menu handlers (87 lines)
└── utils/
    └── terminal.ts      # Cross-platform terminal spawning (95 lines)
```

### Key Implementation Details

**Terminal Launching:**
- Uses `child_process.spawn()` with detached mode for security
- Platform-specific command templates with {DIR} and {CMD} placeholders
- Error mapping: ENOENT → "Command not found", EACCES → "Permission denied"
- Path validation to prevent traversal attacks

**Context Menus:**
- Registered via `workspace.on('file-menu')` and `workspace.on('editor-menu')`
- Case-insensitive filename matching for CLAUDE.md
- Automatic cleanup via `registerEvent()`

**Settings:**
- Platform detection with appropriate defaults (Terminal.app, cmd.exe, gnome-terminal)
- Placeholder validation with user notifications
- Reset to defaults functionality
- Platform-specific example descriptions

**Performance:**
- Bundle size: 12.2kb (minified)
- Zero network calls (local-first)
- No blocking operations in onload
- Fire-and-forget terminal spawning

<!-- MANUAL ADDITIONS END -->
