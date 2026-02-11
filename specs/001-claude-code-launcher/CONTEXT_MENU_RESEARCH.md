# Obsidian Plugin Context Menu Implementation - Best Practices Guide

This document provides comprehensive research on implementing context menu items in Obsidian plugins, specifically for adding menu items to file explorer and editor tabs.

## Table of Contents

1. [File Explorer Context Menus](#file-explorer-context-menus)
2. [Editor Tab Context Menus](#editor-tab-context-menus)
3. [Filtering Menu Items by File Name](#filtering-menu-items-by-file-name)
4. [Getting File Paths from Context Menu Events](#getting-file-paths-from-context-menu-events)
5. [Performance Considerations](#performance-considerations)
6. [Best Practices](#best-practices)
7. [Real-World Examples](#real-world-examples)
8. [Common Patterns and Anti-Patterns](#common-patterns-and-anti-patterns)

---

## 1. File Explorer Context Menus

### Overview

To add custom items to the file explorer context menu (when right-clicking files in the file tree), you subscribe to the `file-menu` workspace event using `registerEvent()`.

### Basic Implementation

```typescript
import { Plugin, TFile, Menu, Notice } from "obsidian";

export default class MyPlugin extends Plugin {
    async onload() {
        // Register file menu event
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                menu.addItem((item) => {
                    item
                        .setTitle("My Custom Action")
                        .setIcon("document")
                        .onClick(async () => {
                            new Notice(`Clicked on: ${file.path}`);
                        });
                });
            })
        );
    }
}
```

### Event Signature

```typescript
"file-menu": (
    menu: Menu,
    file: TAbstractFile,
    source: string,
    leaf?: WorkspaceLeaf
) => void
```

**Parameters:**
- `menu`: The Menu object to add items to
- `file`: The file/folder being right-clicked (type: `TAbstractFile`)
- `source`: The source of the menu event
- `leaf`: Optional workspace leaf reference

### Key Points

- Use `this.registerEvent()` to ensure proper cleanup when the plugin unloads
- The `file` parameter is of type `TAbstractFile`, which could be either a `TFile` or `TFolder`
- Always check the file type before accessing file-specific properties

---

## 2. Editor Tab Context Menus

### Overview

To add custom items to the editor tab context menu (when right-clicking on an open tab), you subscribe to the `editor-menu` workspace event.

### Basic Implementation

```typescript
import { Plugin, Editor, MarkdownView, Menu, Notice } from "obsidian";

export default class MyPlugin extends Plugin {
    async onload() {
        // Register editor menu event
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor, view) => {
                menu.addItem((item) => {
                    item
                        .setTitle("My Editor Action")
                        .setIcon("document")
                        .onClick(async () => {
                            new Notice(`File path: ${view.file.path}`);
                        });
                });
            })
        );
    }
}
```

### Event Signature

```typescript
"editor-menu": (
    menu: Menu,
    editor: Editor,
    view: MarkdownView
) => void
```

**Parameters:**
- `menu`: The Menu object to add items to
- `editor`: The Editor instance for the current file
- `view`: The MarkdownView instance containing file information

### Key Points

- Access the file through `view.file` (not directly from event parameters)
- The `view.file` property gives you access to the `TFile` object
- Use `view.file.path` to get the file path

---

## 3. Filtering Menu Items by File Name

### Checking for Specific File Names

To show menu items only for specific files (e.g., "CLAUDE.md"), add a conditional check inside your event handler:

```typescript
this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file) => {
        // Check if it's a file (not a folder)
        if (!(file instanceof TFile)) {
            return;
        }

        // Filter by exact file name (case-insensitive)
        if (file.name.toLowerCase() !== "claude.md") {
            return;
        }

        // Add menu item only for CLAUDE.md files
        menu.addItem((item) => {
            item
                .setTitle("Launch Claude Code")
                .setIcon("terminal")
                .onClick(async () => {
                    // Your action here
                });
        });
    })
);
```

### Using basename vs name

```typescript
// TFile properties:
// - file.name: Full name including extension (e.g., "CLAUDE.md")
// - file.basename: Name without extension (e.g., "CLAUDE")
// - file.extension: File extension (e.g., "md")
// - file.path: Full vault path (e.g., "folder/subfolder/CLAUDE.md")

// Check by basename (without extension)
if (file.basename.toLowerCase() === "claude") {
    // Matches CLAUDE.md, CLAUDE.txt, etc.
}

// Check by full name (with extension)
if (file.name.toLowerCase() === "claude.md") {
    // Matches only CLAUDE.md
}
```

### Type Checking Pattern

Always use `instanceof` to check if you're dealing with a file vs. folder:

```typescript
if (file instanceof TFile) {
    // It's a file - safe to access file-specific properties
    console.log(file.basename, file.extension);
} else if (file instanceof TFolder) {
    // It's a folder
    console.log("Folder:", file.name);
}
```

---

## 4. Getting File Paths from Context Menu Events

### File Explorer Menu (file-menu)

```typescript
this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFile) {
            // Access various path properties
            console.log("Full path:", file.path);              // "folder/CLAUDE.md"
            console.log("File name:", file.name);              // "CLAUDE.md"
            console.log("Basename:", file.basename);           // "CLAUDE"
            console.log("Extension:", file.extension);         // "md"
            console.log("Parent folder:", file.parent?.path);  // "folder"

            // Get absolute system path
            const adapter = this.app.vault.adapter;
            if (adapter instanceof FileSystemAdapter) {
                const absolutePath = adapter.getBasePath();
                const fullPath = `${absolutePath}/${file.path}`;
                console.log("Absolute path:", fullPath);
            }

            // Get directory containing the file
            const dirPath = file.parent?.path || "";
            console.log("Directory path:", dirPath);
        }
    })
);
```

### Editor Tab Menu (editor-menu)

```typescript
this.registerEvent(
    this.app.workspace.on("editor-menu", (menu, editor, view) => {
        // Access file through view.file
        const file = view.file;

        if (file) {
            console.log("File path:", file.path);
            console.log("File name:", file.name);
            console.log("Directory:", file.parent?.path || "");
        }
    })
);
```

### Getting Absolute System Paths

```typescript
import { FileSystemAdapter } from "obsidian";

// Get the vault's base path
const adapter = this.app.vault.adapter;
if (adapter instanceof FileSystemAdapter) {
    const vaultPath = adapter.getBasePath();
    const filePath = file.path;
    const absoluteFilePath = `${vaultPath}/${filePath}`;

    // For directory containing the file
    const dirPath = file.parent?.path || "";
    const absoluteDirPath = dirPath
        ? `${vaultPath}/${dirPath}`
        : vaultPath;

    console.log("Vault base:", vaultPath);
    console.log("File absolute:", absoluteFilePath);
    console.log("Dir absolute:", absoluteDirPath);
}
```

---

## 5. Performance Considerations

### Event Registration

- **Always use `registerEvent()`**: This ensures events are automatically cleaned up when the plugin unloads, preventing memory leaks.

```typescript
// CORRECT - Automatic cleanup
this.registerEvent(
    this.app.workspace.on("file-menu", handler)
);

// WRONG - Manual cleanup required, prone to leaks
this.app.workspace.on("file-menu", handler);
```

### Efficient Filtering

- **Return early**: Check file type and name at the beginning of your handler to avoid unnecessary processing.

```typescript
this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file) => {
        // Early return for non-matching files
        if (!(file instanceof TFile)) return;
        if (file.name.toLowerCase() !== "claude.md") return;

        // Only process matching files
        menu.addItem(/* ... */);
    })
);
```

### Menu Item Organization

- **Use separators**: Keep your menu items organized and visually separated from other plugins' items.

```typescript
menu.addSeparator();  // Add before your items
menu.addItem((item) => {
    item.setTitle("Launch Claude Code")
        .setIcon("terminal")
        .onClick(async () => { /* ... */ });
});
menu.addSeparator();  // Add after your items
```

### Large Vaults

- Context menu event handlers run every time a context menu is opened
- Keep handlers lightweight - avoid heavy computations or file I/O in the event handler
- Defer expensive operations to the `onClick` callback

```typescript
// GOOD - Fast filtering, expensive work deferred
this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile)) return;
        if (file.name !== "CLAUDE.md") return;

        menu.addItem((item) => {
            item.setTitle("Launch Claude Code")
                .onClick(async () => {
                    // Expensive operation happens only when clicked
                    await this.launchClaudeCode(file);
                });
        });
    })
);

// BAD - Expensive work in event handler
this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file) => {
        // This runs EVERY time ANY context menu opens
        const config = await this.loadConfiguration();  // Slow!
        const isValid = await this.validateFile(file);  // Slow!

        if (isValid) {
            menu.addItem(/* ... */);
        }
    })
);
```

---

## 6. Best Practices

### Event Registration and Cleanup

1. **Always use `registerEvent()`**
   - Obsidian automatically cleans up registered events when the plugin unloads
   - No manual cleanup needed in `onunload()`

```typescript
export default class MyPlugin extends Plugin {
    async onload() {
        // All registration methods auto-cleanup
        this.registerEvent(/* ... */);
        this.addCommand(/* ... */);
        this.registerView(/* ... */);
    }

    // No need to manually cleanup registered events
    async onunload() {
        // Other cleanup if needed
    }
}
```

2. **Declarative Registration Pattern**
   - Register all extensions during `onload()`
   - Let Obsidian handle cleanup during `onunload()`
   - Never manually track cleanup for registered items

### Menu Item Design

1. **Use appropriate icons**
   - Choose icons that clearly represent your action
   - Reference the [Lucide icon set](https://lucide.dev/) (used by Obsidian)
   - Common icons: `terminal`, `play`, `folder`, `file`, `settings`

2. **Clear, action-oriented titles**
   - Use verbs: "Launch Claude Code", "Open Terminal", "Run Command"
   - Keep titles concise (under 30 characters)
   - Avoid technical jargon when possible

3. **Organize with separators**
   - Add separators before and/or after your menu items
   - Helps distinguish your items from other plugins

```typescript
menu.addSeparator();
menu.addItem((item) => {
    item.setTitle("Launch Claude Code")
        .setIcon("terminal")
        .onClick(async () => { /* ... */ });
});
menu.addSeparator();
```

### Type Safety

1. **Always check types before accessing properties**

```typescript
// Check if file vs folder
if (file instanceof TFile) {
    // Safe to access TFile properties
    console.log(file.extension, file.basename);
}

// Check if adapter is FileSystemAdapter
const adapter = this.app.vault.adapter;
if (adapter instanceof FileSystemAdapter) {
    const basePath = adapter.getBasePath();
}
```

2. **Use TypeScript for type checking**

```typescript
// Good - TypeScript will catch errors
const processFile = (file: TFile) => {
    console.log(file.path);
};

if (file instanceof TFile) {
    processFile(file);  // Type-safe
}
```

### Error Handling

1. **Provide user feedback**
   - Use `new Notice()` for success/error messages
   - Keep messages clear and actionable

```typescript
menu.addItem((item) => {
    item.setTitle("Launch Claude Code")
        .onClick(async () => {
            try {
                await this.launchClaudeCode(file);
                new Notice("Claude Code launched successfully");
            } catch (error) {
                new Notice(`Failed to launch: ${error.message}`);
                console.error("Launch error:", error);
            }
        });
});
```

### Desktop-Only Features

If your plugin uses system commands or terminal launching:

1. **Set `isDesktopOnly` in manifest.json**

```json
{
    "id": "claude-code-launcher",
    "name": "Claude Code Launcher",
    "isDesktopOnly": true
}
```

2. **Check platform at runtime if needed**

```typescript
import { Platform } from "obsidian";

if (Platform.isDesktop) {
    // Desktop-only functionality
}
```

---

## 7. Real-World Examples

### Example 1: Obsius Plugin - Conditional Menu Items

Source: [obsius-obsidian-plugin](https://github.com/jonstodle/obsius-obsidian-plugin/blob/main/main.ts)

```typescript
import { Notice, Plugin, TFile } from "obsidian";

export default class ObsiusPlugin extends Plugin {
    async onload() {
        this.registerFileMenuEvent();
    }

    registerFileMenuEvent() {
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                // Only show for files, not folders
                if (file instanceof TFile) {
                    menu.addSeparator();

                    // Check state and show different options
                    if (!this.obsiusClient.getUrl(file)) {
                        // File not published - show publish option
                        menu.addItem((item) =>
                            item
                                .setTitle("Publish to Obsius")
                                .setIcon("up-chevron-glyph")
                                .onClick(() => this.publishFile(file))
                        );
                    } else {
                        // File already published - show management options
                        menu.addItem((item) =>
                            item
                                .setTitle("Update on Obsius")
                                .setIcon("refresh-cw")
                                .onClick(() => this.updateFile(file))
                        );
                        menu.addItem((item) =>
                            item
                                .setTitle("Copy Obsius URL")
                                .setIcon("link")
                                .onClick(() => this.copyUrl(file))
                        );
                        menu.addItem((item) =>
                            item
                                .setTitle("Unpublish from Obsius")
                                .setIcon("trash")
                                .onClick(() => this.deleteFile(file))
                        );
                    }

                    menu.addSeparator();
                }
            })
        );
    }

    async publishFile(file: TFile) {
        try {
            await this.obsiusClient.publish(file);
            new Notice(`Published: ${file.basename}`);
        } catch (error) {
            new Notice(`Failed to publish: ${error.message}`);
        }
    }
}
```

**Key Takeaways:**
- Uses `instanceof TFile` to filter folders
- Shows different menu items based on file state
- Uses separators for visual organization
- Provides user feedback with Notice

### Example 2: File-Specific Context Menu

```typescript
export default class ClaudeCodeLauncher extends Plugin {
    async onload() {
        // File explorer context menu
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                this.addLaunchMenuItem(menu, file);
            })
        );

        // Editor tab context menu
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor, view) => {
                if (view.file) {
                    this.addLaunchMenuItem(menu, view.file);
                }
            })
        );
    }

    addLaunchMenuItem(menu: Menu, file: TAbstractFile) {
        // Only show for TFile instances
        if (!(file instanceof TFile)) return;

        // Only show for CLAUDE.md files
        if (file.name.toLowerCase() !== "claude.md") return;

        menu.addSeparator();
        menu.addItem((item) => {
            item
                .setTitle("Launch Claude Code")
                .setIcon("terminal")
                .onClick(async () => {
                    await this.launchClaudeCode(file);
                });
        });
        menu.addSeparator();
    }

    async launchClaudeCode(file: TFile) {
        try {
            const adapter = this.app.vault.adapter;
            if (!(adapter instanceof FileSystemAdapter)) {
                throw new Error("Cannot access file system");
            }

            const vaultPath = adapter.getBasePath();
            const dirPath = file.parent?.path || "";
            const workingDir = dirPath
                ? `${vaultPath}/${dirPath}`
                : vaultPath;

            // Launch terminal with Claude Code
            // (Implementation depends on platform and settings)
            await this.executeTerminalCommand(workingDir);

            new Notice("Claude Code launched");
        } catch (error) {
            new Notice(`Failed to launch: ${error.message}`);
            console.error("Launch error:", error);
        }
    }
}
```

### Example 3: Root Folder Context Menu

Source: [obsidian-root-folder-context-menu](https://github.com/mnaoumov/obsidian-root-folder-context-menu)

This plugin enables context menu for vault root folder and the empty area of the Files pane - demonstrating how to extend context menus beyond just files.

---

## 8. Common Patterns and Anti-Patterns

### Common Patterns (Do This)

#### Pattern 1: Single Handler for Multiple Menu Types

```typescript
async onload() {
    // Reuse the same handler for both file and editor menus
    const handler = (menu: Menu, file: TAbstractFile) => {
        this.addCustomMenuItem(menu, file);
    };

    this.registerEvent(
        this.app.workspace.on("file-menu", handler)
    );

    this.registerEvent(
        this.app.workspace.on("editor-menu", (menu, editor, view) => {
            if (view.file) {
                handler(menu, view.file);
            }
        })
    );
}
```

#### Pattern 2: Extract Helper Methods

```typescript
addCustomMenuItem(menu: Menu, file: TAbstractFile) {
    if (!this.shouldShowMenuItem(file)) return;

    menu.addSeparator();
    menu.addItem((item) => {
        item
            .setTitle(this.getMenuTitle(file))
            .setIcon(this.getMenuIcon(file))
            .onClick(() => this.handleClick(file));
    });
    menu.addSeparator();
}

shouldShowMenuItem(file: TAbstractFile): boolean {
    return file instanceof TFile &&
           file.name.toLowerCase() === "claude.md";
}

getMenuTitle(file: TAbstractFile): string {
    return "Launch Claude Code";
}

getMenuIcon(file: TAbstractFile): string {
    return "terminal";
}

async handleClick(file: TAbstractFile) {
    // Implementation
}
```

#### Pattern 3: Settings-Based Filtering

```typescript
interface MyPluginSettings {
    enabledFileNames: string[];
    caseSensitive: boolean;
}

addCustomMenuItem(menu: Menu, file: TAbstractFile) {
    if (!(file instanceof TFile)) return;

    const settings = this.settings;
    const fileName = settings.caseSensitive
        ? file.name
        : file.name.toLowerCase();

    const enabledNames = settings.caseSensitive
        ? settings.enabledFileNames
        : settings.enabledFileNames.map(n => n.toLowerCase());

    if (!enabledNames.includes(fileName)) return;

    // Add menu item
}
```

### Anti-Patterns (Avoid This)

#### Anti-Pattern 1: Manual Event Cleanup

```typescript
// BAD - Manual cleanup prone to errors
async onload() {
    this.fileMenuHandler = (menu, file) => { /* ... */ };
    this.app.workspace.on("file-menu", this.fileMenuHandler);
}

async onunload() {
    // Easy to forget, causes memory leaks
    this.app.workspace.off("file-menu", this.fileMenuHandler);
}

// GOOD - Automatic cleanup
async onload() {
    this.registerEvent(
        this.app.workspace.on("file-menu", (menu, file) => { /* ... */ })
    );
}
```

#### Anti-Pattern 2: Not Checking File Type

```typescript
// BAD - Will crash on folders
this.app.workspace.on("file-menu", (menu, file) => {
    // file.extension will be undefined for folders!
    if (file.extension === "md") {
        menu.addItem(/* ... */);
    }
});

// GOOD - Check type first
this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFile && file.extension === "md") {
            menu.addItem(/* ... */);
        }
    })
);
```

#### Anti-Pattern 3: Expensive Operations in Event Handler

```typescript
// BAD - Runs every time any context menu opens
this.registerEvent(
    this.app.workspace.on("file-menu", async (menu, file) => {
        // Heavy operations that run for EVERY file
        const content = await this.app.vault.read(file);
        const config = await this.loadConfig();
        const result = await this.processFile(content, config);

        if (result.shouldShow) {
            menu.addItem(/* ... */);
        }
    })
);

// GOOD - Quick check, defer expensive work
this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file) => {
        // Fast synchronous check
        if (!(file instanceof TFile)) return;
        if (file.name !== "CLAUDE.md") return;

        menu.addItem((item) => {
            item.setTitle("Process File")
                .onClick(async () => {
                    // Expensive work only when clicked
                    const content = await this.app.vault.read(file);
                    const config = await this.loadConfig();
                    await this.processFile(content, config);
                });
        });
    })
);
```

#### Anti-Pattern 4: Not Providing User Feedback

```typescript
// BAD - Silent failures
menu.addItem((item) => {
    item.setTitle("Launch Claude Code")
        .onClick(async () => {
            // Might fail silently
            await this.launchClaudeCode(file);
        });
});

// GOOD - Clear feedback
menu.addItem((item) => {
    item.setTitle("Launch Claude Code")
        .onClick(async () => {
            try {
                await this.launchClaudeCode(file);
                new Notice("Claude Code launched successfully");
            } catch (error) {
                new Notice(`Failed to launch: ${error.message}`);
                console.error("Launch error:", error);
            }
        });
});
```

#### Anti-Pattern 5: Over-Cluttering Menus

```typescript
// BAD - Too many items without organization
this.app.workspace.on("file-menu", (menu, file) => {
    menu.addItem((item) => item.setTitle("Action 1").onClick(/* ... */));
    menu.addItem((item) => item.setTitle("Action 2").onClick(/* ... */));
    menu.addItem((item) => item.setTitle("Action 3").onClick(/* ... */));
    menu.addItem((item) => item.setTitle("Action 4").onClick(/* ... */));
    menu.addItem((item) => item.setTitle("Action 5").onClick(/* ... */));
});

// GOOD - Organized with separators and submenu if needed
this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file) => {
        menu.addSeparator();

        // Primary action
        menu.addItem((item) =>
            item.setTitle("Launch Claude Code").onClick(/* ... */)
        );

        // Group related actions in a submenu for many items
        if (this.settings.showAdvancedOptions) {
            menu.addItem((item) => {
                const submenu = item.setTitle("Advanced Options");
                // Add submenu items
            });
        }

        menu.addSeparator();
    })
);
```

---

## Launching External Terminal Applications

### Platform-Specific Commands

When launching external terminal applications (like for the Claude Code launcher), you need to handle different platforms differently.

#### Using Node.js child_process

Obsidian plugins can use Node.js APIs since Obsidian runs on Electron:

```typescript
import { Notice, Platform } from "obsidian";

async executeTerminalCommand(workingDir: string) {
    // Note: child_process only works on Desktop
    if (!Platform.isDesktop) {
        new Notice("Terminal launch is only available on desktop");
        return;
    }

    try {
        const { exec } = require('child_process');
        const command = this.buildCommand(workingDir);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Exec error:', error);
                new Notice(`Failed to launch terminal: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error('Stderr:', stderr);
            }
        });
    } catch (error) {
        new Notice(`Error: ${error.message}`);
        console.error('Terminal launch error:', error);
    }
}

buildCommand(workingDir: string): string {
    const settings = this.settings;

    // Platform-specific terminal commands
    if (Platform.isMacOS) {
        // macOS - Terminal.app or iTerm2
        return `osascript -e 'tell application "Terminal" to do script "cd \\"${workingDir}\\" && ${settings.claudeCommand}"'`;
    } else if (Platform.isWin) {
        // Windows - Windows Terminal, cmd, or PowerShell
        return `start cmd /K "cd /d \\"${workingDir}\\" && ${settings.claudeCommand}"`;
    } else {
        // Linux - gnome-terminal, konsole, xterm, etc.
        return `gnome-terminal --working-directory="${workingDir}" -- bash -c "${settings.claudeCommand}; exec bash"`;
    }
}
```

#### Example from Terminal Plugins

Real-world terminal plugins use similar approaches:

- **obsidian-terminal** ([GitHub](https://github.com/polyipseity/obsidian-terminal)): Uses profile-based system for configuring shell and terminal emulator executables
- **obsidian-shellcommands** ([GitHub](https://github.com/Taitava/obsidian-shellcommands)): Allows defining shell commands in settings and running them via command palette/hotkeys

### Important Considerations

1. **Desktop-Only**: Set `isDesktopOnly: true` in manifest.json
2. **Security**: Be careful with command execution - validate and sanitize inputs
3. **Platform Detection**: Use `Platform.isMacOS`, `Platform.isWin`, `Platform.isLinux`
4. **User Configuration**: Let users configure terminal preferences in settings
5. **Error Handling**: Provide clear error messages when terminal launch fails

---

## References and Sources

### Official Documentation

- [Context menus - Obsidian Plugin Developer Docs](https://marcusolsson.github.io/obsidian-plugin-docs/user-interface/context-menus)
- [Context menus - Developer Documentation](https://docs.obsidian.md/Plugins/User+interface/Context+menus)
- [TFile - Developer Documentation](https://docs.obsidian.md/Reference/TypeScript+API/TFile)
- [basename - Developer Documentation](https://docs.obsidian.md/Reference/TypeScript+API/TFile/basename)
- [Plugin - Developer Documentation](https://docs.obsidian.md/Reference/TypeScript+API/Plugin)
- [Events - Developer Documentation](https://docs.obsidian.md/Plugins/Events)
- [Plugin guidelines - Developer Documentation](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)

### GitHub Examples

- [obsidianmd/obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin) - Official sample plugin template
- [obsidianmd/obsidian-api](https://github.com/obsidianmd/obsidian-api) - Type definitions for Obsidian API
- [jonstodle/obsius-obsidian-plugin](https://github.com/jonstodle/obsius-obsidian-plugin) - Real-world file-menu implementation
- [phibr0/obsidian-extended-context-menu](https://github.com/phibr0/obsidian-extended-context-menu) - API for custom context menus
- [mnaoumov/obsidian-root-folder-context-menu](https://github.com/mnaoumov/obsidian-root-folder-context-menu) - Root folder context menu
- [kzhovn/obsidian-customizable-menu](https://github.com/kzhovn/obsidian-customizable-menu) - Customizable context menu plugin
- [polyipseity/obsidian-terminal](https://github.com/polyipseity/obsidian-terminal) - Terminal integration plugin
- [Taitava/obsidian-shellcommands](https://github.com/Taitava/obsidian-shellcommands) - Shell command execution plugin

### Forum Discussions

- [Obsidian Vault API TAbstractFile - How to tell if Folder or File?](https://forum.obsidian.md/t/obsidian-vault-api-tabstractfile-how-to-tell-if-folder-or-file/30060)
- [How to unregister events](https://forum.obsidian.md/t/how-to-unregister-events/32595)
- [Context menu event when multiple files are selected](https://forum.obsidian.md/t/context-menu-event-when-multiple-files-are-selected/49753)
- [When I use child_process in nodejs](https://forum.obsidian.md/t/when-i-use-child-process-in-nodejs-i-get-the-following-error-and-i-dont-know-why/56211)
- [Inquiry about Downloading and Executing Local Executables](https://forum.obsidian.md/t/inquiry-about-downloading-and-executing-local-executables-in-obsidian-plugins/89716)

### Community Resources

- [How to create your own Obsidian Plugin](https://phibr0.medium.com/how-to-create-your-own-obsidian-plugin-53f2d5d44046) by phibr0
- [Obsidian Plugin Development](https://www.turtlestoffel.com/Obsidian-Plugin-Development)

---

## Summary

### Quick Reference Checklist

For implementing context menu items in an Obsidian plugin:

- [ ] Import required types: `Plugin`, `TFile`, `TAbstractFile`, `Menu`, `Notice`
- [ ] Use `registerEvent()` for automatic cleanup
- [ ] Check file type with `instanceof TFile` before accessing file properties
- [ ] Filter by file name using `file.name` or `file.basename`
- [ ] Use `file.parent?.path` to get the directory containing the file
- [ ] Get absolute system paths using `FileSystemAdapter.getBasePath()`
- [ ] Add separators for visual organization
- [ ] Provide user feedback with `new Notice()`
- [ ] Handle errors gracefully with try-catch
- [ ] Set `isDesktopOnly: true` if using system commands
- [ ] Keep event handlers lightweight - defer expensive work to onClick
- [ ] Use clear, action-oriented menu item titles
- [ ] Choose appropriate icons from the Lucide icon set

### Key Takeaways

1. **Always use `registerEvent()`** - It ensures automatic cleanup and prevents memory leaks
2. **Filter early** - Check file type and name at the start of your handler
3. **Type safety matters** - Always use `instanceof` checks before accessing type-specific properties
4. **Performance** - Keep event handlers fast, defer expensive operations to onClick callbacks
5. **User experience** - Provide clear feedback, organize menus with separators, use descriptive titles
6. **Platform awareness** - Check for desktop/mobile and handle platform-specific code appropriately
7. **Error handling** - Catch errors and show user-friendly messages

This guide should provide everything needed to implement robust, performant context menu items in an Obsidian plugin.
