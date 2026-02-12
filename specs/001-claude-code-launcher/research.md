# Research Document: Claude Code Launcher

**Feature Branch**: `001-claude-code-launcher`
**Date**: 2026-02-11

This document consolidates research findings for implementing the Claude Code Launcher plugin for Obsidian.

## Research Areas

1. Cross-platform terminal launching
2. Obsidian context menu implementation
3. Node.js child process best practices

---

## 1. Cross-Platform Terminal Launching

### Decision: Platform-Specific Terminal Commands

**Chosen Approach**: Detect platform and use appropriate terminal launch command with default fallbacks.

**Rationale**:
- Different operating systems require different terminal launch mechanisms
- Users may prefer different terminals (iTerm2 vs Terminal.app, Windows Terminal vs cmd.exe)
- Must support working directory specification and command execution

### Platform-Specific Implementations

#### macOS

**Default Terminal: Terminal.app**

```bash
osascript -e 'tell application "Terminal" to do script "cd /path/to/dir && claude-code"'
```

**Alternative: iTerm2**

```bash
osascript -e 'tell application "iTerm2" to create window with default profile command "cd /path/to/dir && claude-code"'
```

**Security Considerations**:
- Requires Automation permissions in System Preferences → Security & Privacy → Privacy → Automation
- First use may prompt user for permission

#### Windows

**Default Terminal: Windows Terminal**

```bash
wt.exe -w -1 new-tab -d "C:\path\to\dir" cmd /K claude-code
```

**Alternative: cmd.exe**

```bash
start /D "C:\path\to\dir" cmd /K claude-code
```

**Alternative: PowerShell**

```bash
start pwsh -NoExit -Command "Set-Location 'C:\path\to\dir'; claude-code"
```

**Notes**:
- `-w -1` creates new window instead of tab
- `/K` keeps window open after command
- Must handle path quoting for spaces

#### Linux

**Default Terminal: gnome-terminal**

```bash
gnome-terminal --working-directory="/path/to/dir" -- bash -c "claude-code; exec bash"
```

**Alternative: konsole (KDE)**

```bash
konsole --workdir "/path/to/dir" --noclose -e claude-code
```

**Alternative: xfce4-terminal**

```bash
xfce4-terminal --working-directory="/path/to/dir" --hold -e "claude-code"
```

**Terminal Detection Strategy**:
1. Check `$DESKTOP_SESSION` or `$XDG_CURRENT_DESKTOP` environment variable
2. Check `$TERMINAL` environment variable
3. Search for available terminal emulators in PATH
4. Fall back to `x-terminal-emulator` (Debian alternative system)

### Implementation Approach

```typescript
function getDefaultTerminalCommand(platform: string): string {
  switch (platform) {
    case 'darwin':
      return 'osascript -e \'tell application "Terminal" to do script "cd {DIR} && {CMD}"\'';
    case 'win32':
      return 'start cmd /K "cd /D {DIR} && {CMD}"';
    case 'linux':
      return 'gnome-terminal --working-directory="{DIR}" -- bash -c "{CMD}; exec bash"';
    default:
      throw new Error('Unsupported platform');
  }
}
```

**Alternatives Considered**:
- Using Electron's `shell.openExternal()`: Rejected - doesn't support working directory or command execution
- Using xterm.js embedded terminal: Rejected - too heavy, out of scope for MVP
- Single cross-platform solution: Rejected - no reliable way to abstract platform differences

---

## 2. Obsidian Context Menu Implementation

### Decision: Use Workspace Events with File Type Filtering

**Chosen Approach**: Register event handlers for `file-menu` and `editor-menu` events, filter for files named "CLAUDE.md".

**Rationale**:
- Official Obsidian API provides dedicated events for context menus
- Events provide all necessary context (file object, menu object)
- `registerEvent()` handles cleanup automatically (prevents memory leaks)
- Can filter by filename before adding menu items (performance)

### Implementation Pattern

#### File Explorer Context Menu

```typescript
this.registerEvent(
  this.app.workspace.on("file-menu", (menu, file) => {
    // Only show for CLAUDE.md files
    if (!(file instanceof TFile)) return;
    if (file.name.toLowerCase() !== "claude.md") return;

    menu.addItem((item) => {
      item
        .setTitle("Launch Claude Code")
        .setIcon("terminal")
        .onClick(async () => {
          await this.launchClaudeCode(file);
        });
    });
  })
);
```

#### Editor Tab Context Menu

```typescript
this.registerEvent(
  this.app.workspace.on("editor-menu", (menu, editor, view) => {
    // Check if active file is CLAUDE.md
    const file = view.file;
    if (!file) return;
    if (file.name.toLowerCase() !== "claude.md") return;

    menu.addItem((item) => {
      item
        .setTitle("Launch Claude Code")
        .setIcon("terminal")
        .onClick(async () => {
          await this.launchClaudeCode(file);
        });
    });
  })
);
```

### Getting File Paths

**Vault-Relative Path**:
```typescript
file.path // e.g., "projects/my-project/CLAUDE.md"
```

**Directory Path**:
```typescript
file.parent?.path // e.g., "projects/my-project"
```

**Absolute Vault Path**:
```typescript
const adapter = this.app.vault.adapter;
if (adapter instanceof FileSystemAdapter) {
  const vaultPath = adapter.getBasePath();
}
```

**Absolute File Directory**:
```typescript
const vaultPath = adapter.getBasePath();
const fileDir = path.join(vaultPath, file.parent?.path || '');
```

### Best Practices

1. **Always use `registerEvent()`** - Automatic cleanup prevents memory leaks
2. **Check instanceof TFile** - Prevents crashes when right-clicking folders
3. **Return early** - Don't add menu items for non-matching files
4. **Use case-insensitive comparison** - Cross-platform compatibility
5. **Keep handlers lightweight** - Defer expensive work to `onClick` callbacks
6. **Provide user feedback** - Use `new Notice()` for success/error messages

**Alternatives Considered**:
- Command palette only: Rejected - less discoverable, requires file selection
- Custom context menu system: Rejected - reinventing the wheel, harder to maintain
- Showing menu item for all files: Rejected - clutters UI, poor UX

---

## 3. Node.js Child Process Best Practices

### Decision: Use `spawn()` with Detached Mode

**Chosen Approach**: Use `child_process.spawn()` with `detached: true` and `stdio: 'ignore'` for fire-and-forget terminal launching.

**Rationale**:
- `spawn()` is more secure than `exec()` (no shell interpretation by default)
- Detached mode allows terminal to continue after Obsidian closes
- `stdio: 'ignore'` prevents the parent process from hanging
- Better cross-platform support than `exec()`

### Implementation Pattern

```typescript
import { spawn } from 'child_process';

function launchTerminal(command: string, args: string[]) {
  const child = spawn(command, args, {
    detached: true,        // Allows process to continue independently
    stdio: 'ignore',       // Don't pipe stdio (prevents hanging)
    windowsHide: true,     // No console window on Windows
    shell: false           // Direct execution (more secure)
  });

  // Unref allows parent to exit independently
  child.unref();

  // Optional: Listen for spawn errors
  child.on('error', (error) => {
    console.error('Failed to launch terminal:', error);
    throw error;
  });

  return child;
}
```

### Security Considerations

**Never concatenate strings**:
```typescript
// DANGEROUS - Command injection risk
exec(`terminal --dir "${userPath}"`, callback);

// SAFE - Arguments are properly escaped
spawn('terminal', ['--dir', userPath]);
```

**Validate paths**:
```typescript
function validatePath(filePath: string): boolean {
  const normalized = path.normalize(filePath);

  // Prevent path traversal
  if (normalized.includes('..')) return false;

  // Additional validation as needed
  return true;
}
```

**Whitelist commands**:
```typescript
const allowedCommands = [
  '/usr/bin/gnome-terminal',
  '/Applications/Terminal.app',
  'C:\\Windows\\System32\\cmd.exe'
];

if (!allowedCommands.includes(command)) {
  throw new Error('Command not allowed');
}
```

### Error Handling

**Multiple error sources**:
```typescript
const child = spawn(command, args);

// 1. Spawn errors (file not found, permission denied)
child.on('error', (error) => {
  console.error('Spawn failed:', error.message);
});

// 2. Non-zero exit codes
child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
  }
});

// 3. Process output errors
child.stderr?.on('data', (data) => {
  console.error('Process stderr:', data.toString());
});
```

### Platform-Specific Handling

```typescript
function getPlatform(): 'darwin' | 'win32' | 'linux' {
  return process.platform as 'darwin' | 'win32' | 'linux';
}

function needsShell(command: string): boolean {
  // Windows batch/cmd files require shell
  return process.platform === 'win32' &&
         (command.endsWith('.bat') || command.endsWith('.cmd'));
}

const child = spawn(command, args, {
  shell: needsShell(command),
  windowsHide: process.platform === 'win32',
  detached: true,
  stdio: 'ignore'
});
```

### Path Handling

**Always use `path` module**:
```typescript
import * as path from 'path';

// WRONG: Hard-coded separators
const wrong = 'C:\\Users\\Name\\file.txt';

// CORRECT: Use path.join()
const correct = path.join('C:', 'Users', 'Name', 'file.txt');

// CORRECT: Use path.resolve()
const absolute = path.resolve(__dirname, '..', 'file.txt');
```

**Spaces in paths** (automatically handled by `spawn()`):
```typescript
// spawn() handles spaces automatically - no manual quoting needed
const pathWithSpaces = 'C:\\Program Files\\My App\\bin\\app.exe';
spawn(pathWithSpaces, [arg1, arg2]); // Works correctly!
```

### Alternatives Considered

| Method | Pros | Cons | Decision |
|--------|------|------|----------|
| `spawn()` | Secure, streaming, cross-platform | More verbose | ✅ **Chosen** |
| `exec()` | Simple API, shell features | Security risk, no streaming | ❌ Rejected |
| `execFile()` | Secure, simpler than spawn() | No streaming, limited use cases | ⚠️ Backup option |

---

## Configuration Design

### Settings Interface

Users need to configure:
1. **Terminal application** (platform-specific default)
2. **Claude Code command** (default: `claude-code`)
3. **Additional arguments** (optional, e.g., `--verbose`)

### Default Settings by Platform

```typescript
interface LauncherSettings {
  terminalCommand: string;
  claudeCommand: string;
  additionalArgs: string;
}

function getDefaultSettings(): LauncherSettings {
  const platform = process.platform;

  let terminalCommand = '';

  switch (platform) {
    case 'darwin':
      terminalCommand = 'osascript -e \'tell application "Terminal" to do script "cd {DIR} && {CMD}"\'';
      break;
    case 'win32':
      terminalCommand = 'start cmd /K "cd /D {DIR} && {CMD}"';
      break;
    case 'linux':
      terminalCommand = 'gnome-terminal --working-directory="{DIR}" -- bash -c "{CMD}; exec bash"';
      break;
  }

  return {
    terminalCommand,
    claudeCommand: 'claude-code',
    additionalArgs: ''
  };
}
```

### Template Variables

Terminal commands use placeholders:
- `{DIR}`: Absolute path to directory containing CLAUDE.md
- `{CMD}`: Full command to execute (claudeCommand + additionalArgs)

### Settings UI

Use Obsidian's built-in settings API:

```typescript
class LauncherSettingTab extends PluginSettingTab {
  plugin: LauncherPlugin;

  constructor(app: App, plugin: LauncherPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Terminal command')
      .setDesc('Command to launch terminal. Use {DIR} for directory and {CMD} for command.')
      .addText(text => text
        .setPlaceholder('Enter terminal command')
        .setValue(this.plugin.settings.terminalCommand)
        .onChange(async (value) => {
          this.plugin.settings.terminalCommand = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Claude Code command')
      .setDesc('Command to invoke Claude Code (e.g., claude-code or npx claude-code)')
      .addText(text => text
        .setPlaceholder('claude-code')
        .setValue(this.plugin.settings.claudeCommand)
        .onChange(async (value) => {
          this.plugin.settings.claudeCommand = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Additional arguments')
      .setDesc('Optional additional arguments to pass to Claude Code')
      .addText(text => text
        .setPlaceholder('--verbose')
        .setValue(this.plugin.settings.additionalArgs)
        .onChange(async (value) => {
          this.plugin.settings.additionalArgs = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

---

## Technology Stack Summary

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Language | TypeScript 5.x (strict mode) | Type safety, Obsidian requirement |
| Build Tool | esbuild | Fast, standard for Obsidian plugins |
| Package Manager | npm | Standard, compatible with Obsidian ecosystem |
| Process Spawning | `child_process.spawn()` | Secure, cross-platform, fire-and-forget support |
| Context Menus | Obsidian workspace events | Official API, automatic cleanup |
| Settings | Obsidian PluginSettingTab | Standard UI, persistent storage |
| Path Handling | Node.js `path` module | Cross-platform compatibility |

---

## References

### Terminal Launching
- [macOS Terminal scripting - Scripting OS X](https://scriptingosx.com/2020/03/macos-shell-command-to-create-a-new-terminal-window/)
- [iTerm2 Documentation](https://iterm2.com/documentation-scripting.html)
- [Windows Terminal command line arguments | Microsoft Learn](https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments)
- [Managing gnome-terminal | Baeldung on Linux](https://www.baeldung.com/linux/gnome-terminal-command-line)

### Obsidian API
- [Obsidian Developer Documentation](https://docs.obsidian.md/)
- [Marcus Olsson's Obsidian Plugin Developer Docs](https://marcus.se.net/obsidian-plugin-docs/)
- [Obsidian API GitHub Repository](https://github.com/obsidianmd/obsidian-api)

### Node.js & Security
- [Node.js Child Process Documentation](https://nodejs.org/api/child_process.html)
- [Node.js Security Best Practices](https://www.nodejs-security.com/blog/secure-javascript-coding-practices-against-command-injection-vulnerabilities)
- [Electron Child Processes Guide](https://www.matthewslipper.com/2019/09/22/everything-you-wanted-electron-child-process.html)
- [Preventing Command Injection in Node.js](https://auth0.com/blog/preventing-command-injection-attacks-in-node-js-apps/)

### Example Plugins
- [Obsidian Syncthing Launcher](https://github.com/MattSzymonski/Obsidian-Syncthing-Launcher)
- [Obsius Plugin](https://github.com/jonstodle/obsius-obsidian-plugin)
