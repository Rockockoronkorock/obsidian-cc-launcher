# Implementation Plan: Dedicated iTerm2 Support on macOS

**Branch**: `002-iterm2-support` | **Date**: 2026-03-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-iterm2-support/spec.md`

## Summary

Add iTerm2 as a named, selectable terminal option in the plugin's macOS settings UI. When selected, the plugin uses the iTerm2-specific AppleScript (`create window with default profile command "..."`) instead of Terminal.app's `do script`. Changes are limited to three existing source files; no new files are required.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: Obsidian API (minAppVersion: 1.0.0)
**Build Tool**: esbuild
**Package Manager**: npm
**Testing**: npm test (existing test suite)
**Target Platform**: Obsidian Desktop only (`isDesktopOnly: true` in manifest.json)
**Performance Goals**: No change — terminal launch is fire-and-forget
**Constraints**: macOS-only feature; no network calls; no new npm dependencies
**Scale/Scope**: Small additive change — one new type, one new settings field, one new dropdown UI control, one new branch in `buildLaunchContext`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Minimal Plugin Lifecycle**: `main.ts` is untouched (lifecycle only); all logic stays in `settings.ts` and `utils/terminal.ts`
- [x] **TypeScript Strict Mode**: `tsconfig.json` already has `strict: true`; new `MacTerminalApp` type is fully typed
- [x] **Resource Management**: No new event listeners; existing `registerEvent` usage unchanged
- [x] **Manifest Stability**: No command ID changes; plugin ID unchanged; no manifest changes required
- [x] **Privacy & Local-First**: No network calls added; purely local terminal spawning
- [x] **Performance**: No blocking operations; `buildLaunchContext` change is synchronous and trivial
- [x] **Modular Architecture**: `settings.ts` (~139 lines) and `terminal.ts` (~169 lines) remain well under 300 lines after changes
- [x] **Build Configuration**: No build config changes needed
- [x] **Mobile Compatibility**: `isDesktopOnly: true` already set; macOS terminal UI is gated by platform detection
- [x] **Dependencies**: No new npm dependencies introduced

## Project Structure

### Documentation (this feature)

```text
specs/002-iterm2-support/
├── plan.md              # This file
├── research.md          # Phase 0 output (complete)
├── data-model.md        # Phase 1 output (complete)
├── quickstart.md        # Phase 1 output (complete)
├── checklists/
│   └── requirements.md  # Spec quality checklist (complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code Changes

```text
src/
├── main.ts              # NO CHANGES
├── settings.ts          # Add macTerminalApp dropdown (macOS only); update getDefaultSettings
├── types.ts             # Add MacTerminalApp type; add macTerminalApp? to LauncherSettings
└── utils/
    └── terminal.ts      # Update buildLaunchContext to select template from macTerminalApp
```

## Complexity Tracking

No constitution violations. No complexity justification required.

## Phase 0: Research

**Status**: Complete — see [research.md](research.md)

### Key Findings

1. **iTerm2 AppleScript**: Single-statement form `create window with default profile command "..."` is correct and requires no multi-statement scripts or temp files.

2. **Architectural approach**: New `macTerminalApp: MacTerminalApp` field in `LauncherSettings` drives template selection at runtime. The `terminalCommand` field continues to be used for `'custom'` mode and all non-macOS platforms.

3. **Dispatch unchanged**: The existing `launchTerminal` macOS path (`osascript -e '...'`) works for iTerm2 with no modifications — the difference is only in the AppleScript content.

4. **Path escaping**: Existing `escapePath('darwin')` is sufficient. Pre-existing limitation (paths with single quotes) is out of scope.

5. **Backward compatibility**: Existing users with no saved `macTerminalApp` receive `'terminal'` (built-in template, functionally equivalent to their previous default). Their saved `terminalCommand` is preserved in `data.json` and re-activated if they switch to `'custom'`.

## Phase 1: Design

**Status**: Complete

### Data Model

See [data-model.md](data-model.md) for full entity definitions.

**Type additions (`types.ts`)**:
```typescript
export type MacTerminalApp = 'terminal' | 'iterm2' | 'custom';

// Updated LauncherSettings:
export interface LauncherSettings {
  terminalCommand: string;
  claudeCommand: string;
  additionalArgs: string;
  macTerminalApp?: MacTerminalApp;  // macOS only
}
```

### Settings UI Change (`settings.ts`)

On macOS, the settings tab renders a new "Terminal application" dropdown above the terminal command field. The terminal command text field is hidden when `macTerminalApp` is `'terminal'` or `'iterm2'`.

**getDefaultSettings() macOS branch**:
- Returns `macTerminalApp: 'terminal'` (named option, no raw AppleScript in default)

**LauncherSettingTab.display() macOS additions**:
- Dropdown: Terminal.app / iTerm2 / Custom
- Terminal command text field: shown only when `macTerminalApp === 'custom'` (or non-macOS)
- Validation notice for `{DIR}` / `{CMD}` placeholders: only when text field is visible

### Terminal Launch Change (`utils/terminal.ts`)

`buildLaunchContext` resolves `terminalCommand` before returning:

```
if darwin:
  macApp = settings.macTerminalApp ?? 'terminal'
  if macApp === 'iterm2':  use iTerm2 AppleScript template
  if macApp === 'terminal': use Terminal.app AppleScript template
  if macApp === 'custom':  use settings.terminalCommand
else:
  use settings.terminalCommand
```

Built-in templates:
- **Terminal.app**: `osascript -e 'tell application "Terminal" to do script "cd \"{DIR}\" && {CMD}"'`
- **iTerm2**: `osascript -e 'tell application "iTerm2" to create window with default profile command "cd \"{DIR}\" && {CMD}"'`

### No API Contracts

This feature involves no external APIs, HTTP endpoints, or data exchange protocols. No `contracts/` directory is required.

### Quickstart

See [quickstart.md](quickstart.md) for step-by-step implementation guide with code snippets.
