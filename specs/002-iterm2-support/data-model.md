# Data Model: Dedicated iTerm2 Support on macOS

**Branch**: `002-iterm2-support` | **Date**: 2026-03-09

## Updated Entities

### MacTerminalApp (new type)

A discriminated union identifying which named macOS terminal application is selected.

| Value | Meaning |
|-------|---------|
| `'terminal'` | Use built-in Terminal.app AppleScript template |
| `'iterm2'` | Use built-in iTerm2 AppleScript template |
| `'custom'` | Use the raw `terminalCommand` string from settings |

### LauncherSettings (updated)

The persisted settings object stored in Obsidian's `data.json`.

| Field | Type | Required | Default (macOS) | Default (other) | Notes |
|-------|------|----------|-----------------|-----------------|-------|
| `terminalCommand` | `string` | Yes | Terminal.app osascript template | Platform-appropriate command | Used when `macTerminalApp === 'custom'` or on non-macOS |
| `claudeCommand` | `string` | Yes | `'claude-code'` | `'claude-code'` | The Claude Code executable |
| `additionalArgs` | `string` | Yes | `''` | `''` | Extra CLI args |
| `macTerminalApp` | `MacTerminalApp` | No | `'terminal'` | N/A (ignored) | macOS-only selector |

### LaunchContext (unchanged)

The runtime context passed to `launchTerminal`. The `terminalCommand` field is now populated by `buildLaunchContext` using the built-in template (for `terminal`/`iterm2`) or from settings (for `custom` / non-macOS).

| Field | Type | Source |
|-------|------|--------|
| `workingDirectory` | `string` | Resolved from vault path + file parent |
| `command` | `string` | `claudeCommand` + `additionalArgs` |
| `terminalCommand` | `string` | Resolved from `macTerminalApp` or `settings.terminalCommand` |

## Built-in AppleScript Templates

These are resolved in `buildLaunchContext` with `{DIR}` and `{CMD}` replaced before use in `launchTerminal`.

### Terminal.app template (existing, unchanged)
```
osascript -e 'tell application "Terminal" to do script "cd \"{DIR}\" && {CMD}"'
```

### iTerm2 template (new)
```
osascript -e 'tell application "iTerm2" to create window with default profile command "cd \"{DIR}\" && {CMD}"'
```

## Settings Persistence & Migration

- `macTerminalApp` is optional in `LauncherSettings` (using TypeScript `?` optional)
- On first install (no saved data), `getDefaultSettings()` returns `macTerminalApp: 'terminal'` on macOS
- On upgrade from v0.0.x (saved data has no `macTerminalApp`), `Object.assign({}, defaults, loaded)` produces `macTerminalApp: 'terminal'` (default wins when key is absent in loaded data)
- Saved `terminalCommand` is preserved in `data.json` even when `macTerminalApp !== 'custom'`, allowing seamless re-activation of custom mode

## Validation Rules

- `macTerminalApp` is ignored (not validated) on non-macOS platforms
- When `macTerminalApp === 'custom'`, `terminalCommand` MUST contain `{DIR}` and `{CMD}` — same validation as current
- When `macTerminalApp` is `'terminal'` or `'iterm2'`, the `terminalCommand` field is not used at launch time (no validation needed for it)
