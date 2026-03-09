# Quickstart: Implementing iTerm2 Support

**Branch**: `002-iterm2-support` | **Date**: 2026-03-09

## Overview

Three files need changes. No new files are created. Changes are additive and backward-compatible.

## Step 1: Update `src/types.ts`

Add `MacTerminalApp` type and update `LauncherSettings`:

```typescript
// After the Platform type, add:
export type MacTerminalApp = 'terminal' | 'iterm2' | 'custom';

// In LauncherSettings, add optional field:
export interface LauncherSettings {
  terminalCommand: string;
  claudeCommand: string;
  additionalArgs: string;
  macTerminalApp?: MacTerminalApp;  // macOS only; other platforms ignore this
}
```

## Step 2: Update `src/settings.ts`

**In `getDefaultSettings()`**: Set `macTerminalApp: 'terminal'` for macOS default:

```typescript
case 'darwin':
  return {
    terminalCommand: 'osascript -e \'tell application "Terminal" to do script "cd \\"{DIR}\\" && {CMD}"\'',
    claudeCommand: 'claude-code',
    additionalArgs: '',
    macTerminalApp: 'terminal'
  };
```

**In `LauncherSettingTab.display()`**: On macOS, add a dropdown before the terminal command field. Show/hide the terminal command text field based on selection:

```typescript
if (platform === 'darwin') {
  new Setting(containerEl)
    .setName('Terminal application')
    .setDesc('Select which terminal to use on macOS')
    .addDropdown(dropdown => dropdown
      .addOption('terminal', 'Terminal.app')
      .addOption('iterm2', 'iTerm2')
      .addOption('custom', 'Custom command')
      .setValue(this.plugin.settings.macTerminalApp ?? 'terminal')
      .onChange(async (value: string) => {
        this.plugin.settings.macTerminalApp = value as MacTerminalApp;
        await this.plugin.saveSettings();
        this.display(); // refresh to show/hide terminal command field
      }));
}

// Only show the terminal command text field when custom is selected
const showTerminalCommandField =
  platform !== 'darwin' || (this.plugin.settings.macTerminalApp ?? 'terminal') === 'custom';

if (showTerminalCommandField) {
  new Setting(containerEl)
    .setName('Terminal command')
    // ... existing implementation unchanged
}
```

## Step 3: Update `src/utils/terminal.ts`

**In `buildLaunchContext()`**: Select the appropriate template when on macOS:

```typescript
// After computing workingDirectory and command:
let terminalCommand: string;

if (process.platform === 'darwin') {
  const macApp = settings.macTerminalApp ?? 'terminal';
  if (macApp === 'iterm2') {
    terminalCommand = 'osascript -e \'tell application "iTerm2" to create window with default profile command "cd \\"{DIR}\\" && {CMD}"\'';
  } else if (macApp === 'terminal') {
    terminalCommand = 'osascript -e \'tell application "Terminal" to do script "cd \\"{DIR}\\" && {CMD}"\'';
  } else {
    terminalCommand = settings.terminalCommand;
  }
} else {
  terminalCommand = settings.terminalCommand;
}

return { workingDirectory, command, terminalCommand };
```

## Verification

1. Build: `npm run build` — should compile with zero type errors
2. On macOS with iTerm2 installed: set **Terminal application → iTerm2**, right-click a CLAUDE.md, verify iTerm2 opens
3. On macOS without iTerm2: same action should show an error notice (osascript fails to find app)
4. On macOS with **Custom** selected: existing terminal command field appears and behavior is unchanged
5. On Linux/Windows: settings show no "Terminal application" dropdown; behavior unchanged
6. Reload Obsidian: iTerm2 selection persists after restart
