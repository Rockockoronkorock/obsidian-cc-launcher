# Terminal Launcher Research for Node.js/Electron

This document provides comprehensive information on launching terminal emulators with specific working directories and commands across macOS, Windows, and Linux platforms from a Node.js/Electron context (specifically for Obsidian plugins).

## Table of Contents
- [macOS](#macos)
  - [Terminal.app](#terminalapp)
  - [iTerm2](#iterm2)
  - [Security Considerations](#macos-security-considerations)
- [Windows](#windows)
  - [Windows Terminal](#windows-terminal)
  - [PowerShell](#powershell)
  - [cmd.exe](#cmdexe)
- [Linux](#linux)
  - [gnome-terminal](#gnome-terminal)
  - [konsole](#konsole)
  - [xfce4-terminal](#xfce4-terminal)
  - [xterm](#xterm)
  - [Terminal Detection](#terminal-detection)
- [Node.js Implementation Guide](#nodejs-implementation-guide)
  - [Using child_process.spawn()](#using-child_processspawn)
  - [Security Best Practices](#security-best-practices)
  - [Error Handling](#error-handling)
  - [Obsidian Plugin Considerations](#obsidian-plugin-considerations)

---

## macOS

### Terminal.app

Terminal.app can be launched using either the `open` command or AppleScript via `osascript`.

#### Method 1: Using AppleScript (Recommended)

This method provides the most control and reliably opens a new window each time.

**Command Syntax:**
```bash
osascript -e 'tell application "Terminal" to do script "cd /path/to/directory && claude-code"'
```

**Node.js Implementation:**
```javascript
const { spawn } = require('child_process');

function launchTerminalApp(workingDir, command = 'claude-code') {
  const script = `tell application "Terminal" to do script "cd ${workingDir} && ${command}"`;

  const child = spawn('osascript', ['-e', script], {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();
  return child;
}
```

**Key Points:**
- The `do script` command always creates a new Terminal window
- Commands must be properly escaped if they contain special characters
- The Terminal window will remain open after the command completes
- To change directory and execute a command, use `cd /path && command`

#### Method 2: Using the `open` command

**Command Syntax:**
```bash
open -a Terminal /path/to/directory
```

**Node.js Implementation:**
```javascript
const { spawn } = require('child_process');

function launchTerminalOpen(workingDir) {
  const child = spawn('open', ['-a', 'Terminal', workingDir], {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();
  return child;
}
```

**Limitations:**
- This opens Terminal but doesn't automatically execute a command
- Less control over the exact behavior
- May reuse existing windows depending on Terminal preferences

### iTerm2

iTerm2 supports more advanced scripting capabilities through AppleScript.

#### Command Syntax:

**Basic window with command:**
```bash
osascript -e 'tell application "iTerm2" to create window with default profile command "cd /path/to/directory && claude-code"'
```

**More robust approach:**
```bash
osascript -e 'tell application "iTerm2"
  create window with default profile
  tell current session of current window
    write text "cd /path/to/directory"
    write text "claude-code"
  end tell
end tell'
```

#### Node.js Implementation:

```javascript
const { spawn } = require('child_process');

function launchITerm2(workingDir, command = 'claude-code') {
  const script = `
    tell application "iTerm2"
      create window with default profile
      tell current session of current window
        write text "cd ${workingDir}"
        write text "${command}"
      end tell
    end tell
  `;

  const child = spawn('osascript', ['-e', script], {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();
  return child;
}
```

**Advantages over Terminal.app:**
- Better scripting support
- Can specify profiles
- More control over tabs vs windows
- Can use `write text` to execute commands sequentially

### macOS Security Considerations

#### Gatekeeper
- Gatekeeper is macOS's security feature that enforces code signing and verifies downloaded applications
- In macOS Sequoia (15) and later, additional security warnings may appear for newly installed apps
- If Terminal is granted full disk access, scripts run in Terminal also inherit app management permissions

#### Automation Permissions
- AppleScript automation may require user permission on first run
- Users will see a dialog asking to allow your app to control Terminal/iTerm2
- This permission is granted on a per-application basis
- Permissions are managed in System Settings > Privacy & Security > Automation

#### Best Practices:
- Inform users about required permissions in your plugin documentation
- Handle permission denials gracefully with clear error messages
- Consider providing fallback methods if AppleScript permissions are denied

---

## Windows

### Windows Terminal

Windows Terminal (wt.exe) is the modern terminal for Windows with extensive command-line support.

#### Command Syntax:

**Open new window in specific directory:**
```cmd
wt.exe -w -1 new-tab -d "C:\path\to\directory" -- claude-code
```

**Components:**
- `-w -1`: Create a new window (instead of using existing)
- `new-tab` or `nt`: Create a new tab
- `-d` or `--startingDirectory`: Set the starting directory
- `--`: Separator before the command to execute

#### Node.js Implementation:

```javascript
const { spawn } = require('child_process');
const path = require('path');

function launchWindowsTerminal(workingDir, command = 'claude-code') {
  // Normalize path for Windows
  const normalizedPath = path.normalize(workingDir);

  const args = [
    '-w', '-1',           // New window
    'new-tab',            // Create new tab in that window
    '-d', normalizedPath, // Starting directory
    '--',                 // Command separator
    command
  ];

  const child = spawn('wt.exe', args, {
    detached: true,
    stdio: 'ignore',
    shell: false  // Important for security
  });

  child.unref();
  return child;
}
```

**Detection:**
```javascript
function hasWindowsTerminal() {
  try {
    const { execSync } = require('child_process');
    execSync('where wt.exe', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
```

### PowerShell

PowerShell can be launched using `Start-Process` or directly via `powershell.exe`.

#### Command Syntax:

**Using powershell.exe directly:**
```cmd
powershell.exe -NoExit -Command "Set-Location 'C:\path\to\directory'; claude-code"
```

**Using Start-Process (from PowerShell):**
```powershell
Start-Process powershell.exe -ArgumentList "-NoExit -Command Set-Location 'C:\path'; claude-code" -WorkingDirectory "C:\path"
```

#### Node.js Implementation:

```javascript
const { spawn } = require('child_process');

function launchPowerShell(workingDir, command = 'claude-code') {
  const psCommand = `Set-Location '${workingDir}'; ${command}`;

  const args = [
    '-NoExit',           // Keep window open
    '-Command',
    psCommand
  ];

  const child = spawn('powershell.exe', args, {
    detached: true,
    stdio: 'ignore',
    shell: false
  });

  child.unref();
  return child;
}
```

**Note:** There's a known issue when using `-Verb RunAs` (admin elevation) with `-WorkingDirectory` - the working directory may not be set correctly and defaults to `C:\Windows\System32`.

### cmd.exe

The classic Windows Command Prompt.

#### Command Syntax:

**Start new cmd window:**
```cmd
start "Claude Code" /D "C:\path\to\directory" cmd.exe /K claude-code
```

**Components:**
- `start`: Windows command to launch a new process
- `"Claude Code"`: Window title
- `/D`: Starting directory
- `/K`: Keep window open after command executes (use `/C` to close after)

#### Node.js Implementation:

```javascript
const { spawn } = require('child_process');

function launchCmd(workingDir, command = 'claude-code') {
  const args = [
    '/C',                          // Execute the following command and terminate
    'start',                       // Start a new window
    '"Claude Code Terminal"',      // Window title
    '/D', `"${workingDir}"`,      // Starting directory
    'cmd.exe',
    '/K',                          // Keep window open after command
    command
  ];

  // Note: We need shell: true for the 'start' command to work
  const child = spawn('cmd.exe', args, {
    detached: true,
    stdio: 'ignore',
    shell: true,
    windowsHide: false
  });

  child.unref();
  return child;
}
```

#### Path Handling Differences:

Windows paths require special attention:
- Use backslashes `\` or forward slashes `/` (Node.js handles both)
- Escape spaces with quotes
- Use `path.normalize()` for consistent formatting
- Use `path.win32` for Windows-specific path operations

```javascript
const path = require('path');

// Convert Unix-style to Windows
const winPath = path.win32.normalize('/c/Users/name/folder');
// Result: 'C:\\Users\\name\\folder'

// Always quote paths with spaces
const quotedPath = `"${path.normalize(userPath)}"`;
```

---

## Linux

Linux has many terminal emulators, each with slightly different command-line interfaces. The most common are gnome-terminal, konsole, xfce4-terminal, and xterm.

### gnome-terminal

The default terminal for GNOME desktop environments.

#### Command Syntax:

**Modern syntax (GNOME 3.24+):**
```bash
gnome-terminal --working-directory=/path/to/directory -- bash -c 'claude-code; exec bash'
```

**Components:**
- `--working-directory=DIR`: Set starting directory
- `--`: Separator before command
- `bash -c 'command; exec bash'`: Execute command and keep shell open

**Legacy syntax (deprecated):**
```bash
gnome-terminal --working-directory=/path/to/directory -x bash -c 'claude-code; exec bash'
```

#### Node.js Implementation:

```javascript
const { spawn } = require('child_process');

function launchGnomeTerminal(workingDir, command = 'claude-code') {
  const args = [
    `--working-directory=${workingDir}`,
    '--',
    'bash',
    '-c',
    `${command}; exec bash`  // Execute command then keep bash running
  ];

  const child = spawn('gnome-terminal', args, {
    detached: true,
    stdio: 'ignore',
    shell: false
  });

  child.unref();
  return child;
}
```

**Important Notes:**
- The `--execute` and `-x` options are deprecated
- Use `--` instead to separate terminal options from the command
- Commands are NOT run via shell by default - use `bash -c` for shell syntax
- `exec bash` at the end keeps the terminal open after the command completes

### konsole

The default terminal for KDE Plasma desktop environments.

#### Command Syntax:

```bash
konsole --workdir /path/to/directory --noclose -e bash -c 'claude-code; exec bash'
```

**Components:**
- `--workdir DIR`: Set working directory
- `--noclose`: Keep window open after command exits
- `-e COMMAND`: Execute command
- `--new-tab`: Open in new tab instead of new window (if you want tabs)

#### Node.js Implementation:

```javascript
const { spawn } = require('child_process');

function launchKonsole(workingDir, command = 'claude-code') {
  const args = [
    '--workdir', workingDir,
    '--noclose',
    '-e', 'bash', '-c', `${command}; exec bash`
  ];

  const child = spawn('konsole', args, {
    detached: true,
    stdio: 'ignore',
    shell: false
  });

  child.unref();
  return child;
}
```

**Tab vs Window:**
```javascript
// To open a new tab in existing konsole window
function launchKonsoleTab(workingDir, command = 'claude-code') {
  const args = [
    '--new-tab',
    '--workdir', workingDir,
    '--noclose',
    '-e', 'bash', '-c', `${command}; exec bash`
  ];

  const child = spawn('konsole', args, {
    detached: true,
    stdio: 'ignore',
    shell: false
  });

  child.unref();
  return child;
}
```

### xfce4-terminal

The default terminal for Xfce desktop environments.

#### Command Syntax:

```bash
xfce4-terminal --working-directory=/path/to/directory --hold -x bash -c 'claude-code'
```

**Components:**
- `--working-directory=DIR`: Set working directory
- `--hold` or `-H`: Keep terminal open after command exits
- `-x` or `--execute`: Execute remainder of command line
- `-e COMMAND`: Execute specific command (alternative to -x)

#### Node.js Implementation:

```javascript
const { spawn } = require('child_process');

function launchXfce4Terminal(workingDir, command = 'claude-code') {
  const args = [
    `--working-directory=${workingDir}`,
    '--hold',
    '-x', 'bash', '-c', command
  ];

  const child = spawn('xfce4-terminal', args, {
    detached: true,
    stdio: 'ignore',
    shell: false
  });

  child.unref();
  return child;
}
```

### xterm

A lightweight, basic terminal emulator available on most Linux systems.

#### Command Syntax:

```bash
xterm -e 'cd /path/to/directory && bash -c "claude-code; exec bash"'
```

**Note:** xterm does not have a native `--working-directory` option, so we must use `cd` in the command.

#### Node.js Implementation:

```javascript
const { spawn } = require('child_process');

function launchXterm(workingDir, command = 'claude-code') {
  const fullCommand = `cd ${workingDir} && bash -c "${command}; exec bash"`;

  const args = ['-e', fullCommand];

  const child = spawn('xterm', args, {
    detached: true,
    stdio: 'ignore',
    shell: false
  });

  child.unref();
  return child;
}
```

### Terminal Detection

Linux has many terminal emulators, and it's important to detect which ones are available.

#### Best Practices:

**1. Check Multiple Terminals in Order of Preference:**

```javascript
const { execSync } = require('child_process');

function findAvailableTerminal() {
  const terminals = [
    'gnome-terminal',
    'konsole',
    'xfce4-terminal',
    'xterm',
    'mate-terminal',
    'lxterminal',
    'terminator',
    'alacritty',
    'kitty'
  ];

  for (const terminal of terminals) {
    try {
      execSync(`which ${terminal}`, { stdio: 'ignore' });
      return terminal;
    } catch {
      // Terminal not found, continue
    }
  }

  return null;
}
```

**2. Check the TERM Environment Variable (with caveats):**

```javascript
// Note: TERM indicates terminal type/capabilities, not the emulator name
const termType = process.env.TERM;
console.log('Terminal type:', termType); // e.g., 'xterm-256color'

// This is NOT reliable for detecting the actual terminal emulator
// because terminals may fake it for compatibility
```

**3. Use the TERMINAL Environment Variable (if set):**

```javascript
// Some systems set TERMINAL to the preferred terminal
const preferredTerminal = process.env.TERMINAL;
if (preferredTerminal) {
  console.log('Preferred terminal:', preferredTerminal);
}
```

**4. Desktop Environment Detection:**

```javascript
function getDesktopEnvironment() {
  const de = process.env.XDG_CURRENT_DESKTOP ||
             process.env.DESKTOP_SESSION ||
             process.env.GDMSESSION;

  const deMap = {
    'GNOME': 'gnome-terminal',
    'KDE': 'konsole',
    'XFCE': 'xfce4-terminal',
    'MATE': 'mate-terminal',
    'LXDE': 'lxterminal'
  };

  return deMap[de] || null;
}
```

**Complete Detection Strategy:**

```javascript
function detectLinuxTerminal() {
  // 1. Try desktop environment default
  const deTerminal = getDesktopEnvironment();
  if (deTerminal) {
    try {
      execSync(`which ${deTerminal}`, { stdio: 'ignore' });
      return deTerminal;
    } catch {
      // Fall through to general search
    }
  }

  // 2. Check TERMINAL environment variable
  const envTerminal = process.env.TERMINAL;
  if (envTerminal) {
    try {
      execSync(`which ${envTerminal}`, { stdio: 'ignore' });
      return envTerminal;
    } catch {
      // Fall through to general search
    }
  }

  // 3. Fall back to searching for available terminals
  return findAvailableTerminal();
}
```

---

## Node.js Implementation Guide

### Using child_process.spawn()

The `spawn()` method is the recommended approach for launching terminals because it:
- Doesn't spawn a shell by default (more secure)
- Handles arguments safely as an array
- Provides better control over the process

#### Basic Pattern:

```javascript
const { spawn } = require('child_process');

function launchTerminal(command, args, options = {}) {
  const defaultOptions = {
    detached: true,    // Allow parent to exit independently
    stdio: 'ignore',   // Don't pipe stdio
    shell: false,      // Don't use shell (security)
    ...options
  };

  const child = spawn(command, args, defaultOptions);

  // Allow parent process to exit independently
  child.unref();

  return child;
}
```

#### Platform-Specific Launcher:

```javascript
const os = require('os');
const path = require('path');

class TerminalLauncher {
  constructor() {
    this.platform = os.platform();
  }

  launch(workingDir, command = 'claude-code') {
    const normalizedDir = path.normalize(workingDir);

    switch (this.platform) {
      case 'darwin':
        return this.launchMacOS(normalizedDir, command);
      case 'win32':
        return this.launchWindows(normalizedDir, command);
      case 'linux':
        return this.launchLinux(normalizedDir, command);
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  launchMacOS(workingDir, command) {
    // Try iTerm2 first, fall back to Terminal.app
    if (this.hasITerm2()) {
      return this.launchITerm2(workingDir, command);
    }
    return this.launchTerminalApp(workingDir, command);
  }

  launchWindows(workingDir, command) {
    // Try Windows Terminal first, fall back to cmd.exe
    if (this.hasWindowsTerminal()) {
      return this.launchWindowsTerminal(workingDir, command);
    }
    return this.launchCmd(workingDir, command);
  }

  launchLinux(workingDir, command) {
    const terminal = detectLinuxTerminal();
    if (!terminal) {
      throw new Error('No terminal emulator found');
    }

    switch (terminal) {
      case 'gnome-terminal':
        return this.launchGnomeTerminal(workingDir, command);
      case 'konsole':
        return this.launchKonsole(workingDir, command);
      case 'xfce4-terminal':
        return this.launchXfce4Terminal(workingDir, command);
      default:
        return this.launchXterm(workingDir, command);
    }
  }

  // Individual launcher methods here...
  // (Use implementations from platform-specific sections above)
}
```

### Security Best Practices

#### 1. Always Use Array-Based Arguments

**DON'T DO THIS (Vulnerable to injection):**
```javascript
const { exec } = require('child_process');
exec(`gnome-terminal --working-directory=${userInput}`); // DANGEROUS!
```

**DO THIS (Safe):**
```javascript
const { spawn } = require('child_process');
spawn('gnome-terminal', ['--working-directory=' + userInput]); // Safe
```

#### 2. Avoid child_process.exec() for User Input

- `exec()` spawns a shell, making it vulnerable to command injection
- Shell metacharacters like `` ` ``, `$()`, `;`, `&&`, `||` can be exploited
- Use `spawn()` or `execFile()` instead

#### 3. Never Enable Shell with Untrusted Input

```javascript
// DANGEROUS - vulnerable to injection
spawn('some-command', [userInput], { shell: true });

// SAFE - no shell interpretation
spawn('some-command', [userInput], { shell: false });
```

#### 4. Validate and Sanitize Paths

```javascript
const path = require('path');
const fs = require('fs');

function sanitizeWorkingDir(dirPath) {
  // Normalize path
  const normalized = path.normalize(dirPath);

  // Resolve to absolute path
  const absolute = path.resolve(normalized);

  // Verify directory exists
  if (!fs.existsSync(absolute)) {
    throw new Error(`Directory does not exist: ${absolute}`);
  }

  // Verify it's actually a directory
  if (!fs.statSync(absolute).isDirectory()) {
    throw new Error(`Path is not a directory: ${absolute}`);
  }

  return absolute;
}
```

#### 5. Escape Special Characters in AppleScript

For macOS AppleScript, special characters need proper escaping:

```javascript
function escapeAppleScript(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
}

function launchTerminalApp(workingDir, command) {
  const escapedDir = escapeAppleScript(workingDir);
  const escapedCmd = escapeAppleScript(command);

  const script = `tell application "Terminal" to do script "cd ${escapedDir} && ${escapedCmd}"`;

  return spawn('osascript', ['-e', script], {
    detached: true,
    stdio: 'ignore'
  });
}
```

#### 6. Use detached and unref() for Fire-and-Forget

```javascript
const child = spawn('terminal', args, {
  detached: true,     // Run independently of parent
  stdio: 'ignore'     // Don't create pipes
});

child.unref();        // Allow parent to exit without waiting
```

### Error Handling

#### Comprehensive Error Handling:

```javascript
function launchTerminalSafe(workingDir, command = 'claude-code') {
  try {
    // Validate working directory
    const validatedDir = sanitizeWorkingDir(workingDir);

    // Create launcher
    const launcher = new TerminalLauncher();

    // Launch terminal
    const child = launcher.launch(validatedDir, command);

    // Handle spawn errors
    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        console.error('Terminal executable not found');
      } else if (error.code === 'EACCES') {
        console.error('Permission denied to execute terminal');
      } else {
        console.error('Failed to launch terminal:', error.message);
      }
    });

    return { success: true, child };

  } catch (error) {
    console.error('Error launching terminal:', error.message);
    return { success: false, error: error.message };
  }
}
```

#### Common Error Codes:

- `ENOENT`: Command not found (terminal not installed or not in PATH)
- `EACCES`: Permission denied (file exists but not executable)
- `EPERM`: Operation not permitted (security restrictions)

#### Platform-Specific Error Handling:

```javascript
// macOS: Handle AppleScript permission denial
function handleMacOSError(error) {
  if (error.message.includes('not allowed')) {
    return 'AppleScript permission denied. Please grant automation permissions in System Settings.';
  }
  return error.message;
}

// Windows: Handle wt.exe not found
function handleWindowsError(error) {
  if (error.code === 'ENOENT' && error.path === 'wt.exe') {
    return 'Windows Terminal not found. Please install it from the Microsoft Store or use cmd.exe.';
  }
  return error.message;
}

// Linux: Handle missing terminal
function handleLinuxError(error) {
  if (error.code === 'ENOENT') {
    return 'No terminal emulator found. Please install gnome-terminal, konsole, or xterm.';
  }
  return error.message;
}
```

### Obsidian Plugin Considerations

Obsidian plugins run in an Electron environment with access to Node.js APIs.

#### 1. Desktop-Only Plugin

If your plugin uses `child_process`, it must be marked as desktop-only:

```json
{
  "isDesktopOnly": true
}
```

#### 2. Accessing Node.js APIs

```javascript
// In Obsidian plugin
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
```

#### 3. Using Vault Path

```javascript
class ClaudeCodeLauncherPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'launch-claude-code',
      name: 'Launch Claude Code in Terminal',
      callback: () => {
        // Get the vault's base path
        const vaultPath = this.app.vault.adapter.basePath;

        // Launch terminal in vault directory
        this.launchTerminal(vaultPath);
      }
    });
  }

  launchTerminal(workingDir) {
    const launcher = new TerminalLauncher();
    const result = launchTerminalSafe(workingDir, 'claude-code');

    if (!result.success) {
      new Notice(`Failed to launch terminal: ${result.error}`);
    }
  }
}
```

#### 4. Security Warnings

Electron applications (including Obsidian) using `child_process` may trigger security detection rules. This is normal and legitimate when:
- You're using it for valid operations (launching terminals)
- You're following security best practices (using `spawn` with array args)
- You're not executing untrusted user input

#### 5. Settings for Terminal Preference

Allow users to configure their preferred terminal:

```javascript
DEFAULT_SETTINGS = {
  macOSTerminal: 'auto', // 'auto', 'terminal', 'iterm2'
  windowsTerminal: 'auto', // 'auto', 'wt', 'powershell', 'cmd'
  linuxTerminal: 'auto' // 'auto', 'gnome-terminal', 'konsole', etc.
};

class SettingsTab extends PluginSettingTab {
  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('macOS Terminal')
      .setDesc('Preferred terminal on macOS')
      .addDropdown(dropdown => dropdown
        .addOption('auto', 'Auto-detect')
        .addOption('terminal', 'Terminal.app')
        .addOption('iterm2', 'iTerm2')
        .setValue(this.plugin.settings.macOSTerminal)
        .onChange(async (value) => {
          this.plugin.settings.macOSTerminal = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

---

## Complete Example Implementation

Here's a complete, production-ready implementation:

```javascript
const { spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

class TerminalLauncher {
  constructor(options = {}) {
    this.platform = os.platform();
    this.options = options;
  }

  /**
   * Launch terminal with working directory and command
   * @param {string} workingDir - Absolute path to working directory
   * @param {string} command - Command to execute (default: 'claude-code')
   * @returns {Object} { success: boolean, child?: ChildProcess, error?: string }
   */
  launch(workingDir, command = 'claude-code') {
    try {
      // Validate and normalize path
      const validDir = this.validateDirectory(workingDir);

      // Platform-specific launch
      let child;
      switch (this.platform) {
        case 'darwin':
          child = this.launchMacOS(validDir, command);
          break;
        case 'win32':
          child = this.launchWindows(validDir, command);
          break;
        case 'linux':
          child = this.launchLinux(validDir, command);
          break;
        default:
          throw new Error(`Unsupported platform: ${this.platform}`);
      }

      // Error handling
      child.on('error', (error) => {
        console.error('Terminal launch error:', error);
      });

      return { success: true, child };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  validateDirectory(dirPath) {
    const normalized = path.normalize(dirPath);
    const absolute = path.resolve(normalized);

    if (!fs.existsSync(absolute)) {
      throw new Error(`Directory does not exist: ${absolute}`);
    }

    if (!fs.statSync(absolute).isDirectory()) {
      throw new Error(`Path is not a directory: ${absolute}`);
    }

    return absolute;
  }

  // macOS Implementation
  launchMacOS(workingDir, command) {
    const terminal = this.options.macOSTerminal || 'auto';

    if (terminal === 'iterm2' || (terminal === 'auto' && this.hasCommand('iTerm'))) {
      return this.launchITerm2(workingDir, command);
    }

    return this.launchTerminalApp(workingDir, command);
  }

  launchTerminalApp(workingDir, command) {
    const script = `tell application "Terminal" to do script "cd ${this.escapeAppleScript(workingDir)} && ${this.escapeAppleScript(command)}"`;

    const child = spawn('osascript', ['-e', script], {
      detached: true,
      stdio: 'ignore'
    });

    child.unref();
    return child;
  }

  launchITerm2(workingDir, command) {
    const script = `
      tell application "iTerm2"
        create window with default profile
        tell current session of current window
          write text "cd ${this.escapeAppleScript(workingDir)}"
          write text "${this.escapeAppleScript(command)}"
        end tell
      end tell
    `;

    const child = spawn('osascript', ['-e', script], {
      detached: true,
      stdio: 'ignore'
    });

    child.unref();
    return child;
  }

  escapeAppleScript(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');
  }

  // Windows Implementation
  launchWindows(workingDir, command) {
    const terminal = this.options.windowsTerminal || 'auto';

    if (terminal === 'wt' || (terminal === 'auto' && this.hasCommand('wt.exe'))) {
      return this.launchWindowsTerminal(workingDir, command);
    }

    if (terminal === 'powershell') {
      return this.launchPowerShell(workingDir, command);
    }

    return this.launchCmd(workingDir, command);
  }

  launchWindowsTerminal(workingDir, command) {
    const normalizedPath = path.win32.normalize(workingDir);

    const args = [
      '-w', '-1',
      'new-tab',
      '-d', normalizedPath,
      '--',
      command
    ];

    const child = spawn('wt.exe', args, {
      detached: true,
      stdio: 'ignore',
      shell: false
    });

    child.unref();
    return child;
  }

  launchPowerShell(workingDir, command) {
    const psCommand = `Set-Location '${workingDir}'; ${command}`;

    const args = [
      '-NoExit',
      '-Command',
      psCommand
    ];

    const child = spawn('powershell.exe', args, {
      detached: true,
      stdio: 'ignore',
      shell: false
    });

    child.unref();
    return child;
  }

  launchCmd(workingDir, command) {
    const args = [
      '/C',
      'start',
      '"Claude Code Terminal"',
      '/D', `"${workingDir}"`,
      'cmd.exe',
      '/K',
      command
    ];

    const child = spawn('cmd.exe', args, {
      detached: true,
      stdio: 'ignore',
      shell: true,
      windowsHide: false
    });

    child.unref();
    return child;
  }

  // Linux Implementation
  launchLinux(workingDir, command) {
    const terminal = this.options.linuxTerminal || this.detectLinuxTerminal();

    if (!terminal) {
      throw new Error('No terminal emulator found');
    }

    const launchers = {
      'gnome-terminal': () => this.launchGnomeTerminal(workingDir, command),
      'konsole': () => this.launchKonsole(workingDir, command),
      'xfce4-terminal': () => this.launchXfce4Terminal(workingDir, command),
      'xterm': () => this.launchXterm(workingDir, command)
    };

    const launcher = launchers[terminal] || launchers['xterm'];
    return launcher();
  }

  launchGnomeTerminal(workingDir, command) {
    const args = [
      `--working-directory=${workingDir}`,
      '--',
      'bash',
      '-c',
      `${command}; exec bash`
    ];

    const child = spawn('gnome-terminal', args, {
      detached: true,
      stdio: 'ignore',
      shell: false
    });

    child.unref();
    return child;
  }

  launchKonsole(workingDir, command) {
    const args = [
      '--workdir', workingDir,
      '--noclose',
      '-e', 'bash', '-c', `${command}; exec bash`
    ];

    const child = spawn('konsole', args, {
      detached: true,
      stdio: 'ignore',
      shell: false
    });

    child.unref();
    return child;
  }

  launchXfce4Terminal(workingDir, command) {
    const args = [
      `--working-directory=${workingDir}`,
      '--hold',
      '-x', 'bash', '-c', command
    ];

    const child = spawn('xfce4-terminal', args, {
      detached: true,
      stdio: 'ignore',
      shell: false
    });

    child.unref();
    return child;
  }

  launchXterm(workingDir, command) {
    const fullCommand = `cd ${workingDir} && bash -c "${command}; exec bash"`;

    const args = ['-e', fullCommand];

    const child = spawn('xterm', args, {
      detached: true,
      stdio: 'ignore',
      shell: false
    });

    child.unref();
    return child;
  }

  detectLinuxTerminal() {
    // Try desktop environment default
    const deTerminal = this.getDesktopEnvironmentTerminal();
    if (deTerminal && this.hasCommand(deTerminal)) {
      return deTerminal;
    }

    // Try TERMINAL environment variable
    const envTerminal = process.env.TERMINAL;
    if (envTerminal && this.hasCommand(envTerminal)) {
      return envTerminal;
    }

    // Search for available terminals
    const terminals = [
      'gnome-terminal',
      'konsole',
      'xfce4-terminal',
      'mate-terminal',
      'lxterminal',
      'xterm'
    ];

    for (const terminal of terminals) {
      if (this.hasCommand(terminal)) {
        return terminal;
      }
    }

    return null;
  }

  getDesktopEnvironmentTerminal() {
    const de = process.env.XDG_CURRENT_DESKTOP ||
               process.env.DESKTOP_SESSION ||
               process.env.GDMSESSION;

    const deMap = {
      'GNOME': 'gnome-terminal',
      'KDE': 'konsole',
      'XFCE': 'xfce4-terminal',
      'MATE': 'mate-terminal',
      'LXDE': 'lxterminal'
    };

    return deMap[de?.toUpperCase()] || null;
  }

  hasCommand(command) {
    try {
      if (this.platform === 'win32') {
        execSync(`where ${command}`, { stdio: 'ignore' });
      } else {
        execSync(`which ${command}`, { stdio: 'ignore' });
      }
      return true;
    } catch {
      return false;
    }
  }
}

// Export
module.exports = { TerminalLauncher };

// Usage example
if (require.main === module) {
  const launcher = new TerminalLauncher();
  const result = launcher.launch(process.cwd(), 'claude-code');

  if (result.success) {
    console.log('Terminal launched successfully');
  } else {
    console.error('Failed to launch terminal:', result.error);
  }
}
```

---

## Sources

### macOS
- [macOS shell command to create a new Terminal Window – Scripting OS X](https://scriptingosx.com/2020/03/macos-shell-command-to-create-a-new-terminal-window/)
- [How to programmatically open a new terminal tab or window – Stuart Dotson](https://stuartdotson.com/blog/how-to-programmatically-open-a-new-terminal-tab-or-window/)
- [Scripting - Documentation - iTerm2](https://iterm2.com/documentation-scripting.html)
- [iTerm2, AppleScript, and Jumping Quickly into Your Workflow | Medium](https://medium.com/@beyondborders/iterm-applescript-and-jumping-quickly-into-your-workflow-1849beabb5f7)
- [Gatekeeper and runtime protection in macOS - Apple Support](https://support.apple.com/guide/security/gatekeeper-and-runtime-protection-sec5599b66df/web)

### Windows
- [Windows Terminal command line arguments | Microsoft Learn](https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments)
- [WT.exe Windows Terminal - Windows CMD](https://ss64.com/nt/wt.html)
- [Start-Process - PowerShell | Microsoft Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/start-process)
- [Programmatically Opening Windows Terminal in a Specific Folder - Rick Strahl's Web Log](https://weblog.west-wind.com/posts/2019/Sep/03/Programmatically-Opening-Windows-Terminal-in-a-Specific-Folder)

### Linux
- [Managing gnome-terminal From the Command Line | Baeldung on Linux](https://www.baeldung.com/linux/gnome-terminal-command-line)
- [gnome-terminal man page](https://manpages.ubuntu.com/manpages/bionic//man1/gnome-terminal.1.html)
- [konsole man page](https://linuxcommandlibrary.com/man/konsole)
- [apps:xfce4-terminal:command-line [Xfce Docs]](https://docs.xfce.org/apps/xfce4-terminal/command-line)
- [The $TERM Environment Variable | Baeldung on Linux](https://www.baeldung.com/linux/term-environment-variable)

### Node.js & Security
- [Security: Secure Escaping Techniques for Child_process Spawn in Node.js](https://copyprogramming.com/howto/child-process-spawn-in-node-js-security-escaping)
- [Secure JavaScript Coding Practices Against Command Injection Vulnerabilities](https://www.nodejs-security.com/blog/secure-javascript-coding-practices-against-command-injection-vulnerabilities)
- [Everything You Wanted To Know About Electron Child Processes](https://www.matthewslipper.com/2019/09/22/everything-you-wanted-electron-child-process.html)
- [Execution via Electron Child Process Node.js Module | Elastic Security](https://www.elastic.co/guide/en/security/current/execution-via-electron-child-process-node-js-module.html)

### Obsidian
- [When I use child_process in nodejs - Obsidian Forum](https://forum.obsidian.md/t/when-i-use-child-process-in-nodejs-i-get-the-following-error-and-i-dont-know-why/56211)
- [Inquiry about Downloading and Executing Local Executables in Obsidian Plugins - Obsidian Forum](https://forum.obsidian.md/t/inquiry-about-downloading-and-executing-local-executables-in-obsidian-plugins/89716/3)
- [GitHub - Quorafind/O-Terminal: A terminal plugin for Obsidian](https://github.com/Quorafind/O-Terminal)
