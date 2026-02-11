# Data Model: Claude Code Launcher

**Feature Branch**: `001-claude-code-launcher`
**Date**: 2026-02-11

This document defines the data structures and interfaces for the Claude Code Launcher plugin.

---

## Core Entities

### 1. LauncherSettings

**Purpose**: Stores user configuration for terminal and Claude Code invocation.

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `terminalCommand` | `string` | Yes | Platform-specific | Template string for launching terminal. Uses `{DIR}` and `{CMD}` placeholders |
| `claudeCommand` | `string` | Yes | `"claude-code"` | Command to invoke Claude Code CLI |
| `additionalArgs` | `string` | No | `""` | Optional additional arguments to pass to Claude Code |

**Validation Rules**:
- `terminalCommand` must not be empty
- `terminalCommand` must contain `{DIR}` placeholder
- `terminalCommand` must contain `{CMD}` placeholder
- `claudeCommand` must not be empty
- `additionalArgs` can be empty string

**Default Values by Platform**:

```typescript
// macOS
{
  terminalCommand: 'osascript -e \'tell application "Terminal" to do script "cd {DIR} && {CMD}"\'',
  claudeCommand: 'claude-code',
  additionalArgs: ''
}

// Windows
{
  terminalCommand: 'start cmd /K "cd /D {DIR} && {CMD}"',
  claudeCommand: 'claude-code',
  additionalArgs: ''
}

// Linux
{
  terminalCommand: 'gnome-terminal --working-directory="{DIR}" -- bash -c "{CMD}; exec bash"',
  claudeCommand: 'claude-code',
  additionalArgs: ''
}
```

**Storage**: Persisted to Obsidian's data.json via `saveData()` and `loadData()` APIs.

---

### 2. LaunchContext

**Purpose**: Internal context passed to terminal launcher, derived from file and settings.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workingDirectory` | `string` | Yes | Absolute path to directory containing CLAUDE.md |
| `command` | `string` | Yes | Full command to execute (claude-code + args) |
| `terminalCommand` | `string` | Yes | Platform-specific terminal launch command |

**Derivation**:

```typescript
interface LaunchContext {
  workingDirectory: string;  // From file.parent.path + vault.adapter.basePath
  command: string;           // From settings.claudeCommand + settings.additionalArgs
  terminalCommand: string;   // From settings.terminalCommand
}
```

**State Transitions**: None (immutable, created for each launch)

---

### 3. PlatformInfo

**Purpose**: Detected platform information for terminal selection.

**Fields**:

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `platform` | `'darwin' \| 'win32' \| 'linux' \| 'unknown'` | Enum | Operating system platform |

**Derivation**: From `process.platform` Node.js API

---

## Type Definitions

```typescript
// Settings stored in data.json
interface LauncherSettings {
  terminalCommand: string;
  claudeCommand: string;
  additionalArgs: string;
}

// Runtime context for launching
interface LaunchContext {
  workingDirectory: string;
  command: string;
  terminalCommand: string;
}

// Platform detection
type SupportedPlatform = 'darwin' | 'win32' | 'linux';
type Platform = SupportedPlatform | 'unknown';

// Launch result for error handling
interface LaunchResult {
  success: boolean;
  error?: string;
}

// Default settings factory
interface DefaultSettings {
  [platform: string]: LauncherSettings;
}
```

---

## Relationships

```
User Settings (LauncherSettings)
    ↓
[User triggers context menu on CLAUDE.md]
    ↓
Launch Context Creation
    ├─ Read file.path → workingDirectory
    ├─ Read settings.claudeCommand → command
    └─ Read settings.terminalCommand → terminalCommand
    ↓
Terminal Launcher (utils/terminal.ts)
    ├─ Replace {DIR} with workingDirectory
    ├─ Replace {CMD} with command
    └─ spawn() child process
    ↓
Launch Result
    ├─ success: true → Show success notice
    └─ success: false → Show error notice with details
```

---

## Data Flow

### 1. Plugin Initialization

```
onload()
  → loadSettings()
    → Read data.json
    → Merge with defaults (platform-specific)
    → Store in this.settings
```

### 2. Context Menu Trigger

```
file-menu event
  → Filter: file.name === "CLAUDE.md"
    → Add menu item
      → onClick()
        → buildLaunchContext(file, settings)
          → Get absolute directory path
          → Build command string
          → Return LaunchContext
        → launchTerminal(context)
          → Replace placeholders
          → spawn() process
          → Return LaunchResult
        → Show notification (success or error)
```

### 3. Settings Change

```
SettingTab.display()
  → User modifies setting
    → onChange callback
      → Update this.settings
      → saveSettings()
        → Write to data.json
```

---

## Validation & Error Handling

### Settings Validation

**On Load**:
- If `terminalCommand` is empty → Use platform default
- If `terminalCommand` missing `{DIR}` → Show warning, use default
- If `terminalCommand` missing `{CMD}` → Show warning, use default
- If `claudeCommand` is empty → Use "claude-code" default

**On Save**:
- Trim whitespace from all fields
- Validate required placeholders in `terminalCommand`
- Show notice if invalid configuration detected

### Launch Validation

**Pre-Launch Checks**:
1. File is instance of TFile (not folder)
2. File has parent directory
3. Vault adapter is FileSystemAdapter (desktop only)
4. Working directory path is valid (no path traversal)

**Launch Error Handling**:
- Command not found → "Claude Code not found. Install it first."
- Permission denied → "Permission denied. Check terminal settings."
- Invalid path → "Invalid directory path."
- Platform not supported → "Your platform is not supported."
- Spawn error → "Failed to launch terminal: [error message]"

---

## Constants

```typescript
// Plugin metadata
const PLUGIN_ID = 'obsidian-cc-launch';
const PLUGIN_NAME = 'Claude Code Launcher';

// File matching
const TARGET_FILENAME = 'CLAUDE.md';
const TARGET_FILENAME_LOWER = 'claude.md';

// Command IDs (stable, never change)
const COMMAND_ID_LAUNCH = 'launch-claude-code';

// Settings keys
const SETTINGS_KEY_TERMINAL_CMD = 'terminalCommand';
const SETTINGS_KEY_CLAUDE_CMD = 'claudeCommand';
const SETTINGS_KEY_ADDITIONAL_ARGS = 'additionalArgs';

// Placeholder tokens
const PLACEHOLDER_DIR = '{DIR}';
const PLACEHOLDER_CMD = '{CMD}';

// Error messages
const ERROR_NOT_FOUND = 'Claude Code not found. Ensure it is installed and in your PATH.';
const ERROR_PERMISSION = 'Permission denied. Check your terminal settings and system permissions.';
const ERROR_INVALID_PATH = 'Invalid directory path. Cannot launch Claude Code.';
const ERROR_PLATFORM_UNSUPPORTED = 'Your platform is not currently supported.';
const ERROR_SPAWN_FAILED = 'Failed to launch terminal: ';

// Success messages
const SUCCESS_LAUNCHED = 'Claude Code launched successfully';
```

---

## Future Extensions (Not in MVP)

- **LaunchHistory**: Track recent launches for quick re-launch
- **WorkspaceConfig**: Per-vault or per-folder configuration overrides
- **TemplateVariables**: Additional placeholders (e.g., `{VAULT_PATH}`, `{FILE_PATH}`)
- **TerminalPresets**: Pre-configured terminal options (iTerm2, Windows Terminal, etc.)
- **LaunchOptions**: Pass-through flags to Claude Code based on context
