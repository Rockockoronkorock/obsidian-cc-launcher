# Implementation Plan: Claude Code Launcher

**Branch**: `001-claude-code-launcher` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-claude-code-launcher/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create an Obsidian plugin that enables users to launch Claude Code CLI sessions directly from CLAUDE.md files within their vault. Users can right-click on any CLAUDE.md file (in file explorer or editor tab) and select "Launch Claude Code" to open a terminal with Claude Code running in that file's directory. The plugin provides cross-platform terminal integration with configurable terminal applications and Claude Code invocation methods.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: Obsidian API (minAppVersion: 1.0.0 or higher)
**Build Tool**: esbuild (required for bundling to main.js)
**Package Manager**: npm (required)
**Testing**: N/A (no automated testing for MVP)
**Target Platform**: Obsidian Desktop only (isDesktopOnly: true in manifest.json)
**Performance Goals**: Instant context menu response (<100ms), minimal memory footprint (<1MB), no startup overhead
**Constraints**:
- No blocking operations during onload
- Local-first operation (no network calls)
- Must support cross-platform terminal launching (macOS, Windows, Linux)
- NEEDS CLARIFICATION: Specific terminal launch commands for each platform
- NEEDS CLARIFICATION: Best practices for spawning child processes in Electron/Obsidian context
- NEEDS CLARIFICATION: How to handle terminal path detection and validation
**Scale/Scope**: Small utility plugin (single feature, minimal UI surface)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Minimal Plugin Lifecycle**: main.ts contains ONLY lifecycle management (onload, onunload, command registration)
  - ✅ Command registration will be delegated to command modules
  - ✅ Settings management will be in separate settings.ts
  - ✅ Context menu logic will be in commands/ directory
- [x] **TypeScript Strict Mode**: tsconfig.json has `"strict": true` enabled
  - ✅ Will be configured during project setup
- [x] **Resource Management**: All listeners/events use `this.registerEvent()`, `this.registerDomEvent()`, or `this.registerInterval()`
  - ✅ Context menu items will be registered properly
  - ✅ No timers or intervals needed for this feature
- [x] **Manifest Stability**: Plugin id chosen and documented (NEVER changes post-release), commands have stable IDs
  - ✅ Plugin ID: `obsidian-cc-launch`
  - ✅ Command ID: `launch-claude-code` (stable, will never change)
- [x] **Privacy & Local-First**: No network calls OR clear disclosure + opt-in in settings
  - ✅ Purely local operation, no network calls whatsoever
- [x] **Performance**: No blocking operations in onload, heavy work deferred
  - ✅ Command handlers execute only on user action
  - ✅ No vault scanning or indexing needed
- [x] **Modular Architecture**: Files under 200-300 lines, clear separation (commands/, ui/, utils/, etc.)
  - ✅ Expected structure: main.ts, settings.ts, commands/launch-claude.ts, utils/terminal.ts
  - ✅ All files expected to be under 150 lines each
- [x] **Build Configuration**: esbuild configured, npm scripts defined (dev, build)
  - ✅ Will use standard Obsidian plugin build setup
- [x] **Mobile Compatibility**: Desktop-only APIs avoided OR `isDesktopOnly: true` in manifest
  - ✅ `isDesktopOnly: true` will be set (terminal launching requires desktop)
- [x] **Dependencies**: All dependencies bundled into main.js, no runtime deps
  - ✅ Will use only Node.js built-ins (child_process, path) and Obsidian API
  - ✅ No external npm dependencies required

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Obsidian Plugin Structure (based on Constitution Principle VII)
src/
├── main.ts                      # Plugin lifecycle ONLY (onload, onunload, command registration)
├── settings.ts                  # Settings interface and tab
├── commands/                    # Command implementations
│   └── launch-claude.ts         # Launch Claude Code command handler
├── utils/                       # Helper functions and utilities
│   └── terminal.ts              # Cross-platform terminal launching utilities
└── types.ts                     # TypeScript interfaces and types

# Root files (DO NOT commit main.js - it's a build artifact)
manifest.json                    # Plugin metadata (id: obsidian-cc-launch, name, version, minAppVersion)
esbuild.config.mjs              # Build configuration
tsconfig.json                   # TypeScript configuration (strict: true required)
package.json                    # npm dependencies and scripts
versions.json                   # Plugin version → Obsidian version mapping
.gitignore                      # MUST exclude: node_modules/, main.js, *.js (except esbuild.config.mjs)
README.md                       # User-facing documentation
```

**Structure Decision**: This is a minimal utility plugin with a simple feature set. The structure follows Constitution Principle VII (Modular Architecture) with clear separation:
- **main.ts**: Plugin lifecycle only, registers the command and settings tab
- **settings.ts**: Settings data interface, default settings, and settings tab UI
- **commands/launch-claude.ts**: Context menu registration and command handler
- **utils/terminal.ts**: Platform-specific terminal launching logic (macOS, Windows, Linux)
- **types.ts**: TypeScript interfaces for settings and internal types

No `ui/` directory needed as there are no modals or custom views. No `styles.css` needed as the plugin uses standard Obsidian UI components only.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution checks pass.

---

## Phase Completion Status

### Phase 0: Research ✅ COMPLETE

**Research Findings**: All technical unknowns resolved and documented in `research.md`

**Key Decisions**:

1. **Cross-Platform Terminal Launching**: Use platform-specific commands via `child_process.spawn()`
   - macOS: AppleScript with Terminal.app or iTerm2
   - Windows: `start cmd /K` or Windows Terminal (`wt.exe`)
   - Linux: gnome-terminal, konsole, or xterm with working directory flags

2. **Obsidian Context Menus**: Use workspace events (`file-menu` and `editor-menu`)
   - Filter by filename before adding menu items (performance)
   - Use `registerEvent()` for automatic cleanup
   - Check `instanceof TFile` to prevent crashes

3. **Child Process Management**: Use `spawn()` with detached mode
   - More secure than `exec()` (no shell interpretation)
   - `detached: true` and `unref()` for fire-and-forget
   - Platform-specific handling for Windows batch files
   - Path validation to prevent command injection

**Alternatives Rejected**:
- Electron's `shell.openExternal()`: Doesn't support working directory or command execution
- Embedded terminal (xterm.js): Too heavy, out of MVP scope
- Single cross-platform abstraction: Platform differences too significant

---

### Phase 1: Design & Contracts ✅ COMPLETE

**Artifacts Generated**:
- ✅ `data-model.md`: Complete entity definitions and relationships
- ✅ `contracts/plugin-api.md`: Internal API contracts for all modules
- ✅ `quickstart.md`: Developer onboarding guide
- ✅ `CLAUDE.md`: Agent context file updated with technology stack

**Data Model Summary**:
- **LauncherSettings**: User configuration (terminal command, claude command, additional args)
- **LaunchContext**: Runtime context for launching (working directory, command, terminal command)
- **LaunchResult**: Return type for launch operations (success/error)
- **PlatformInfo**: Platform detection types

**Module Architecture**:
- `main.ts`: Plugin lifecycle management only
- `settings.ts`: Settings interface, defaults, and UI tab
- `commands/launch-claude.ts`: Context menu registration and command handlers
- `utils/terminal.ts`: Cross-platform terminal spawning utilities
- `types.ts`: Shared TypeScript interfaces

**No External Dependencies**: Uses only Obsidian API and Node.js built-ins (child_process, path)

---

### Phase 2: Constitution Re-Check ✅ PASS

All constitution principles validated against final design:

- ✅ **Minimal Plugin Lifecycle**: main.ts delegates to modules
- ✅ **TypeScript Strict Mode**: Configured in tsconfig.json
- ✅ **Resource Management**: Uses `registerEvent()` for automatic cleanup
- ✅ **Manifest Stability**: Plugin ID `obsidian-cc-launch`, command ID `launch-claude-code`
- ✅ **Privacy & Local-First**: Zero network calls, purely local operation
- ✅ **Performance**: No blocking operations, fire-and-forget terminal launch
- ✅ **Modular Architecture**: All files under 150 lines (estimated), clear separation
- ✅ **Build Configuration**: esbuild with npm scripts (dev, build)
- ✅ **Mobile Compatibility**: `isDesktopOnly: true` in manifest
- ✅ **Dependencies**: Zero external npm dependencies, only Obsidian API + Node.js built-ins

**No complexity violations detected.**

---

## Ready for Implementation

The plan is complete. All research is documented, design artifacts are generated, and constitution principles are validated.

**Next Step**: Use `/speckit.tasks` command to generate implementation tasks from this plan.
