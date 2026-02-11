# Plugin API Contract: Claude Code Launcher

**Feature Branch**: `001-claude-code-launcher`
**Date**: 2026-02-11

This document defines the internal API contracts for the Claude Code Launcher plugin.

---

## Overview

This plugin exposes internal modules with clear responsibilities. While this is not a public API (Obsidian plugins don't typically expose public APIs), these contracts define the interfaces between internal modules.

---

## Module: `main.ts` (Plugin Lifecycle)

### Class: `ClaudeCodeLauncherPlugin`

**Extends**: `Plugin` (from Obsidian API)

**Responsibilities**:
- Plugin lifecycle management (onload, onunload)
- Register context menu handlers
- Initialize settings
- Coordinate between modules

#### Methods

##### `async onload(): Promise<void>`

**Description**: Initialize plugin, load settings, register event handlers.

**Behavior**:
1. Load settings from data.json
2. Register settings tab
3. Register file-menu event handler (file explorer context menu)
4. Register editor-menu event handler (editor tab context menu)

**Error Handling**: Logs errors but does not throw (plugin should load even if setup partially fails)

---

##### `onunload(): void`

**Description**: Cleanup resources (handled automatically by `registerEvent()`).

**Behavior**: No explicit cleanup needed; Obsidian handles event unregistration.

---

##### `async loadSettings(): Promise<void>`

**Description**: Load settings from data.json, merge with platform-specific defaults.

**Behavior**:
1. Call `await this.loadData()`
2. Merge result with `getDefaultSettings()`
3. Store in `this.settings`

**Error Handling**: Falls back to defaults if loadData() fails

---

##### `async saveSettings(): Promise<void>`

**Description**: Persist current settings to data.json.

**Behavior**: Call `await this.saveData(this.settings)`

**Error Handling**: Logs error but does not throw

---

## Module: `settings.ts` (Settings Management)

### Interface: `LauncherSettings`

**Properties**:

```typescript
interface LauncherSettings {
  terminalCommand: string;
  claudeCommand: string;
  additionalArgs: string;
}
```

---

### Function: `getDefaultSettings()`

**Signature**:
```typescript
function getDefaultSettings(): LauncherSettings
```

**Description**: Returns platform-specific default settings.

**Parameters**: None

**Returns**: `LauncherSettings` object with defaults for current platform

**Behavior**:
1. Detect platform using `process.platform`
2. Return appropriate defaults:
   - **macOS**: Terminal.app with AppleScript
   - **Windows**: cmd.exe with start command
   - **Linux**: gnome-terminal
   - **Unknown**: Falls back to Linux defaults

**Error Handling**: Never throws; always returns valid defaults

---

### Class: `LauncherSettingTab`

**Extends**: `PluginSettingTab` (from Obsidian API)

**Responsibilities**:
- Render settings UI
- Handle user input
- Save settings on change

#### Methods

##### `display(): void`

**Description**: Render settings UI in Obsidian settings panel.

**Behavior**:
1. Clear container element
2. Add "Terminal command" text input with description
3. Add "Claude Code command" text input with description
4. Add "Additional arguments" text input with description
5. Each input has onChange handler that:
   - Updates `plugin.settings`
   - Calls `plugin.saveSettings()`

**Error Handling**: UI rendering errors are logged

---

## Module: `commands/launch-claude.ts` (Command Logic)

### Function: `registerLaunchCommand()`

**Signature**:
```typescript
function registerLaunchCommand(plugin: Plugin): void
```

**Description**: Register context menu handlers for launching Claude Code.

**Parameters**:
- `plugin: Plugin` - The plugin instance

**Behavior**:
1. Register `file-menu` event handler
2. Register `editor-menu` event handler
3. Both handlers:
   - Check if file is CLAUDE.md (case-insensitive)
   - Add menu item with "Launch Claude Code" title
   - Add menu item with "terminal" icon
   - Set onClick handler to call `launchClaudeCode()`

**Error Handling**: Registration errors are logged

---

### Function: `launchClaudeCode()`

**Signature**:
```typescript
async function launchClaudeCode(
  app: App,
  file: TFile,
  settings: LauncherSettings
): Promise<void>
```

**Description**: Launch Claude Code in terminal for the given file's directory.

**Parameters**:
- `app: App` - Obsidian app instance
- `file: TFile` - The CLAUDE.md file
- `settings: LauncherSettings` - User settings

**Returns**: Promise that resolves when launch is complete

**Behavior**:
1. Validate file and directory
2. Build `LaunchContext` from file path and settings
3. Call `launchTerminal()` from `utils/terminal.ts`
4. Show success notice if launch succeeds
5. Show error notice if launch fails

**Error Handling**:
- Shows user-friendly error notice
- Logs detailed error to console
- Never throws

**Validation**:
- File must be instance of `TFile`
- File must have parent directory
- Vault adapter must be `FileSystemAdapter`
- Directory path must not contain path traversal attempts

---

## Module: `utils/terminal.ts` (Terminal Launcher)

### Interface: `LaunchContext`

**Properties**:

```typescript
interface LaunchContext {
  workingDirectory: string;
  command: string;
  terminalCommand: string;
}
```

---

### Function: `launchTerminal()`

**Signature**:
```typescript
function launchTerminal(context: LaunchContext): Promise<LaunchResult>
```

**Description**: Spawn terminal process with given context.

**Parameters**:
- `context: LaunchContext` - Launch parameters

**Returns**: Promise resolving to `LaunchResult`

**Behavior**:
1. Replace `{DIR}` placeholder with `context.workingDirectory`
2. Replace `{CMD}` placeholder with `context.command`
3. Parse terminal command into executable and arguments
4. Call `spawnTerminal()` with parsed command
5. Return success or error result

**Error Handling**:
- Catches all spawn errors
- Returns `LaunchResult` with success=false and error message
- Never throws

---

### Function: `spawnTerminal()`

**Signature**:
```typescript
function spawnTerminal(
  executable: string,
  args: string[]
): Promise<LaunchResult>
```

**Description**: Spawn detached child process for terminal.

**Parameters**:
- `executable: string` - Terminal executable path or command
- `args: string[]` - Command-line arguments

**Returns**: Promise resolving to `LaunchResult`

**Behavior**:
1. Validate executable path (basic validation, no path traversal)
2. Spawn process using `child_process.spawn()` with:
   - `detached: true` (runs independently)
   - `stdio: 'ignore'` (don't pipe output)
   - `windowsHide: true` (no console window on Windows)
   - `shell: false` (direct execution, more secure)
3. Call `child.unref()` to allow parent to exit
4. Listen for `error` event (100ms timeout)
5. Return success if no immediate error
6. Return failure if error event fires

**Error Handling**:
- Catches spawn errors (command not found, permission denied)
- Returns detailed error in `LaunchResult.error`
- Never throws

**Security**:
- Uses `spawn()` not `exec()` (no shell interpretation)
- Arguments passed as array (no string concatenation)
- Basic path validation (no `..` sequences)

---

### Function: `buildLaunchContext()`

**Signature**:
```typescript
function buildLaunchContext(
  app: App,
  file: TFile,
  settings: LauncherSettings
): LaunchContext
```

**Description**: Build launch context from file and settings.

**Parameters**:
- `app: App` - Obsidian app instance
- `file: TFile` - The CLAUDE.md file
- `settings: LauncherSettings` - User settings

**Returns**: `LaunchContext` object

**Behavior**:
1. Get vault base path from `app.vault.adapter.getBasePath()`
2. Get file's parent directory path
3. Join paths to get absolute working directory
4. Build command string from `claudeCommand` + `additionalArgs`
5. Return LaunchContext with all fields

**Error Handling**:
- Throws if vault adapter is not FileSystemAdapter
- Throws if file has no parent directory

---

## Module: `types.ts` (Type Definitions)

### Exports

```typescript
// Settings
export interface LauncherSettings {
  terminalCommand: string;
  claudeCommand: string;
  additionalArgs: string;
}

// Launch context
export interface LaunchContext {
  workingDirectory: string;
  command: string;
  terminalCommand: string;
}

// Launch result
export interface LaunchResult {
  success: boolean;
  error?: string;
}

// Platform types
export type SupportedPlatform = 'darwin' | 'win32' | 'linux';
export type Platform = SupportedPlatform | 'unknown';
```

---

## Error Codes & Messages

| Error Code | Message | User Action |
|------------|---------|-------------|
| `COMMAND_NOT_FOUND` | Claude Code not found. Ensure it is installed and in your PATH. | Install Claude Code CLI |
| `PERMISSION_DENIED` | Permission denied. Check your terminal settings and system permissions. | Check system permissions |
| `INVALID_PATH` | Invalid directory path. Cannot launch Claude Code. | Check file location |
| `PLATFORM_UNSUPPORTED` | Your platform is not currently supported. | Use supported OS |
| `SPAWN_FAILED` | Failed to launch terminal: [details] | Check terminal settings |
| `NOT_DESKTOP` | This feature is only available on desktop. | Use desktop version |

---

## Event Flow

### File Explorer Context Menu

```
User right-clicks CLAUDE.md in file explorer
  ↓
Obsidian fires "file-menu" event
  ↓
Plugin's registered handler receives (menu, file)
  ↓
Handler checks: file instanceof TFile && file.name.toLowerCase() === "claude.md"
  ↓
Handler adds menu item: "Launch Claude Code"
  ↓
User clicks menu item
  ↓
onClick handler calls launchClaudeCode(app, file, settings)
  ↓
buildLaunchContext(app, file, settings) → LaunchContext
  ↓
launchTerminal(context) → LaunchResult
  ↓
Show Notice (success or error)
```

### Editor Tab Context Menu

```
User right-clicks CLAUDE.md tab in editor
  ↓
Obsidian fires "editor-menu" event
  ↓
Plugin's registered handler receives (menu, editor, view)
  ↓
Handler gets file: view.file
  ↓
Handler checks: file && file.name.toLowerCase() === "claude.md"
  ↓
Handler adds menu item: "Launch Claude Code"
  ↓
[Same as file explorer flow from here]
```

---

## Security Considerations

### Command Injection Prevention

- **Never use `exec()`**: Always use `spawn()` with argument arrays
- **No string concatenation**: Arguments passed as separate array elements
- **Path validation**: Check for `..` sequences, validate paths
- **No shell interpretation**: `shell: false` in spawn options

### User Input Handling

- **Settings validation**: Validate template placeholders on load
- **Path sanitization**: Normalize and validate all file paths
- **Whitelist approach**: No arbitrary command execution beyond configured terminals

### Desktop-Only Restriction

- Plugin manifest sets `isDesktopOnly: true`
- No mobile device support (terminal APIs not available)

---

## Performance Considerations

### Startup (onload)

- **Target**: <100ms
- **Actions**: Load settings, register events (lightweight)
- **No blocking operations**: Settings load is async

### Context Menu Display

- **Target**: <50ms
- **Actions**: Filter filename, add menu item
- **Early return**: Skip non-matching files immediately

### Launch Action

- **Target**: <500ms to spawn terminal
- **Actions**: Build context, spawn process, show notice
- **Fire-and-forget**: Don't wait for terminal to finish

### Memory Footprint

- **Target**: <1MB
- **Minimal state**: Only stores settings object
- **No caching**: No history or persistent state beyond settings

---

## Testing Recommendations

### Unit Tests (Out of Scope for MVP)

- `getDefaultSettings()`: Returns correct defaults per platform
- `buildLaunchContext()`: Builds correct paths and commands
- `validatePath()`: Rejects path traversal attempts
- Settings validation: Detects missing placeholders

### Integration Tests (Out of Scope for MVP)

- Context menu registration: Items appear for CLAUDE.md files
- Launch flow: Terminal spawns with correct working directory
- Error handling: Shows appropriate notices for various error conditions

### Manual Testing (Required for MVP)

- Test on macOS, Windows, Linux
- Test with spaces in paths
- Test with multiple CLAUDE.md files
- Test error conditions (Claude Code not installed, permission denied)
- Test settings changes
- Test file explorer and editor tab context menus

---

## Dependencies

### External Dependencies

- **Obsidian API** (`obsidian` package):
  - `Plugin` base class
  - `PluginSettingTab` for settings UI
  - `TFile`, `TAbstractFile` for file handling
  - `App` for vault access
  - `Notice` for user notifications
  - `FileSystemAdapter` for absolute paths

- **Node.js Built-ins**:
  - `child_process` for spawning terminals
  - `path` for cross-platform path handling

### No External npm Dependencies

- Plugin uses only Obsidian API and Node.js built-ins
- No additional packages required
- Everything bundles into main.js

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-11 | Initial API contract for MVP |
