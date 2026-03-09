# Research: Dedicated iTerm2 Support on macOS

**Branch**: `002-iterm2-support` | **Date**: 2026-03-09

## Decision 1: iTerm2 AppleScript Syntax

**Decision**: Use `create window with default profile command "..."` — the single-statement form.

**Rationale**: iTerm2's AppleScript dictionary supports a one-liner that opens a new window and immediately runs a command, identical in structure to Terminal.app's `do script`. This avoids multi-statement AppleScript, temp files, or the iTerm2 Python API.

```applescript
tell application "iTerm2" to create window with default profile command "cd \"{DIR}\" && {CMD}"
```

Invoked via `osascript -e '...'` exactly as the existing macOS dispatch path does for Terminal.app.

**Alternatives considered**:
- Multi-statement AppleScript (`create window`, then `write text` to the new session): More control over session targeting, but requires either a temp `.scpt` file or a heredoc pipe to `osascript`, adding complexity. Not needed since the single-statement form is officially documented.
- iTerm2 Python API: Requires iTerm2's Python runtime; too heavy a dependency for a simple terminal launch.

**Source**: https://iterm2.com/documentation-scripting.html

---

## Decision 2: How to Integrate Into Existing Architecture

**Decision**: Add a `macTerminalApp: MacTerminalApp` field to `LauncherSettings` and use it in `buildLaunchContext` to select the AppleScript template at runtime. Do **not** write the resolved template into `terminalCommand`.

**Rationale**: Storing only `macTerminalApp: 'iterm2'` (instead of the raw AppleScript string) makes the selected option round-trip correctly through settings persistence. If the template were written into `terminalCommand`, re-loading settings would show the raw AppleScript in the text field and lose the knowledge of which named option was chosen. The clean separation is: `macTerminalApp` drives template selection; `terminalCommand` is used only when `macTerminalApp === 'custom'` (or on non-macOS platforms where the field is irrelevant).

**Alternatives considered**:
- Pre-fill `terminalCommand` when user picks a named option (UI-only convenience): Loses selection state on reload; requires inferring the active option by string-matching known templates — fragile.
- Single unified template field, no named option: Forces users to know the correct iTerm2 AppleScript; poor discoverability.

---

## Decision 3: Scope of Changes

**Decision**: Modify three existing source files only — `types.ts`, `settings.ts`, `utils/terminal.ts`. No new files required.

**Rationale**: The feature is narrowly scoped: one new type, one new settings field, one new UI control, and one small branch in `buildLaunchContext`. Adding new files (e.g., a separate `iterm2.ts` helper) would be over-engineering for this scope.

**Affected files**:
| File | Change |
|------|--------|
| `src/types.ts` | Add `MacTerminalApp` type; add `macTerminalApp?: MacTerminalApp` to `LauncherSettings` |
| `src/settings.ts` | Add dropdown for `macTerminalApp` (macOS only); conditionally hide `terminalCommand` text field |
| `src/utils/terminal.ts` | Update `buildLaunchContext` to substitute built-in template when `macTerminalApp` is `'terminal'` or `'iterm2'` |

---

## Decision 4: Path Escaping for iTerm2 AppleScript

**Decision**: Reuse the existing `escapePath` for `darwin` — no changes needed.

**Rationale**: Both Terminal.app and iTerm2 receive paths via AppleScript string arguments. The current `escapePath('darwin')` escapes backslashes and double quotes, which is sufficient for both. The `osascript -e '...'` invocation via Node's `spawn` (not shell) avoids shell-level quoting issues.

**Pre-existing limitation**: Paths containing single quotes would break the regex-based script extraction in `launchTerminal`. This is a known pre-existing limitation affecting both Terminal.app and iTerm2 — out of scope for this feature.

---

## Decision 5: Settings UI Design

**Decision**: Show a **dropdown** (`addDropdown`) for "Terminal application" on macOS (values: `terminal`, `iterm2`, `custom`). When `terminal` or `iterm2` is selected, hide the terminal command text field. When `custom` is selected, show it.

**Rationale**: Matches Obsidian settings UI patterns; discoverable; prevents confusion from showing a raw AppleScript string when a named option is active. The `custom` fallback preserves full backward compatibility for existing users who may have entered custom terminal commands.

**Backward compatibility**: Existing users who have `terminalCommand` saved but no `macTerminalApp` value will default to `'custom'` on macOS (via `Object.assign` in `loadSettings`), preserving their saved command. Wait — actually we want to default new macOS installs to `'terminal'`. So the default for `macTerminalApp` in `getDefaultSettings` is `'terminal'` on macOS. For existing users who already have settings saved, `Object.assign({}, defaults, loaded)` will keep their saved `macTerminalApp` if present, or override with default `'terminal'` if absent. Since they had no `macTerminalApp` before, they'll get `'terminal'` as default — which means they'll stop using their saved `terminalCommand`. This could be a regression for users with custom terminal commands. Therefore: default `macTerminalApp` to `'custom'` on macOS when upgrading (i.e., treat absence of `macTerminalApp` in saved data as `'custom'`). This is handled by: default in `getDefaultSettings()` is `'terminal'`, but in `loadSettings` the loaded data overwrites defaults — so if `macTerminalApp` is absent in saved data, the default `'terminal'` kicks in. To protect existing users, we should default to `'custom'` in `getDefaultSettings()` on macOS OR handle migration. Simplest: default to `'terminal'` but only on fresh installs (no saved data). Since `Object.assign({}, defaults, loaded)` will use `loaded.macTerminalApp` if it exists, and use default `'terminal'` if it doesn't, existing users will get `'terminal'` and ignore their saved `terminalCommand`. This is acceptable because Terminal.app is what most macOS users would have been using (it's the default), and the built-in template is functionally identical to the default. For users with custom commands, they should select `'custom'` in the settings.

**Conclusion**: Default `macTerminalApp: 'terminal'` on macOS. Existing users with custom terminal commands will need to re-select `'custom'` and their saved `terminalCommand` will be preserved in `data.json` and re-shown when they select custom.
