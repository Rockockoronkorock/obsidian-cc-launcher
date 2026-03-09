---

description: "Task list for 002-iterm2-support feature implementation"
---

# Tasks: Dedicated iTerm2 Support on macOS

**Input**: Design documents from `/specs/002-iterm2-support/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: No test tasks generated (not requested in spec).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Type definitions and settings defaults needed by ALL user stories. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: These changes are shared across all three user stories. Complete before any story phase.

- [x] T001 Add `MacTerminalApp` type (`'terminal' | 'iterm2' | 'custom'`) to `src/types.ts`
- [x] T002 Add optional `macTerminalApp?: MacTerminalApp` field to `LauncherSettings` interface in `src/types.ts`
- [x] T003 Update `getDefaultSettings()` in `src/settings.ts` — macOS case returns `macTerminalApp: 'terminal'` alongside existing `terminalCommand`

**Checkpoint**: Types compile cleanly (`npm run build`) and `getDefaultSettings()` returns `macTerminalApp: 'terminal'` on macOS.

---

## Phase 2: User Story 1 — Launch Claude Code in iTerm2 (Priority: P1) 🎯 MVP

**Goal**: When `macTerminalApp === 'iterm2'` is stored in settings, triggering "Launch Claude Code" from any file context menu opens an iTerm2 window in the correct directory running Claude Code.

**Independent Test**: Temporarily hardcode `macTerminalApp: 'iterm2'` in `getDefaultSettings()` → right-click any file or folder → verify iTerm2 opens in the correct directory running `claude-code`.

### Implementation for User Story 1

- [x] T004 [US1] Update `buildLaunchContext` in `src/utils/terminal.ts` — when `process.platform === 'darwin'` and `settings.macTerminalApp === 'iterm2'`, set `terminalCommand` to the iTerm2 built-in AppleScript template: `osascript -e 'tell application "iTerm2" to create window with default profile command "cd \"{DIR}\" && {CMD}"'`
- [x] T005 [US1] Update `buildLaunchContext` in `src/utils/terminal.ts` — when `process.platform === 'darwin'` and `settings.macTerminalApp === 'terminal'`, set `terminalCommand` to the built-in Terminal.app template (moving hardcoded string out of `getDefaultSettings` into the template constant)
- [x] T006 [US1] Update `buildLaunchContext` in `src/utils/terminal.ts` — when `process.platform === 'darwin'` and `settings.macTerminalApp === 'custom'` (or `undefined`), fall back to `settings.terminalCommand` as before; on non-macOS platforms, always use `settings.terminalCommand`
- [x] T007 [US1] Verify error handling path in `src/utils/terminal.ts` — existing `ENOENT` → `ERROR_MESSAGES.COMMAND_NOT_FOUND` notice is already triggered when iTerm2 is not found; confirm no code change needed and add an inline comment noting iTerm2 not-found scenario is covered

**Checkpoint**: With `macTerminalApp: 'iterm2'` as default, triggering "Launch Claude Code" opens iTerm2 (if installed) or shows a clear error notice (if not installed). US1 is fully functional.

---

## Phase 3: User Story 2 — Open CLAUDE.md in iTerm2 Context (Priority: P2)

**Goal**: Triggering "Launch Claude Code" from a CLAUDE.md file context menu (file explorer or editor tab) opens iTerm2 in the CLAUDE.md's parent directory running Claude Code.

**Independent Test**: With `macTerminalApp: 'iterm2'` in settings, right-click a CLAUDE.md file in file explorer → verify iTerm2 opens in the file's parent directory (not vault root or wrong directory).

**Note**: US2 shares its core launch implementation with US1 (same `buildLaunchContext` and `launchTerminal` code paths). The task below verifies the `file.parent` resolution is correct specifically for the CLAUDE.md triggering flow.

### Implementation for User Story 2

- [x] T008 [US2] Review `buildLaunchContext` in `src/utils/terminal.ts` — confirm `path.join(vaultPath, file.parent.path)` produces the correct `workingDirectory` for a CLAUDE.md file in a subdirectory (e.g., `vault/projects/myproject/CLAUDE.md` → `workingDirectory` = `vault/projects/myproject`); add an inline comment confirming this works for both file explorer and editor-menu triggers with no code change needed

**Checkpoint**: CLAUDE.md context menu in both file explorer and editor tab correctly opens iTerm2 in the CLAUDE.md's directory. US2 is verified complete.

---

## Phase 4: User Story 3 — Select iTerm2 from Settings (Priority: P3)

**Goal**: A "Terminal application" dropdown appears in plugin settings on macOS, offering Terminal.app / iTerm2 / Custom. The dropdown is invisible on Windows and Linux. Selection persists across Obsidian restarts.

**Independent Test**: Open plugin settings on macOS → verify "Terminal application" dropdown is present with three options → select "iTerm2" → restart Obsidian → reopen settings → verify "iTerm2" remains selected and no terminal command text field is visible.

### Implementation for User Story 3

- [x] T009 [P] [US3] Add "Terminal application" `addDropdown` setting in `LauncherSettingTab.display()` in `src/settings.ts` — only rendered when `platform === 'darwin'`; options: `terminal` → "Terminal.app", `iterm2` → "iTerm2", `custom` → "Custom command"; default value: `this.plugin.settings.macTerminalApp ?? 'terminal'`; `onChange` saves `macTerminalApp` and calls `this.display()` to refresh
- [x] T010 [US3] Conditionally render the terminal command text field in `src/settings.ts` — show only when `platform !== 'darwin'` OR `(this.plugin.settings.macTerminalApp ?? 'terminal') === 'custom'`; this hides the raw AppleScript field when a named option is active
- [x] T011 [US3] Conditionally show `{DIR}`/`{CMD}` placeholder validation notice in `src/settings.ts` — only validate and show the notice when the terminal command text field is actually visible (i.e., custom mode)
- [x] T012 [P] [US3] Update the "Detected Platform / Default Terminal" info panel in `src/settings.ts` — on macOS, replace `defaults.terminalCommand` display with the selected terminal name (e.g., "Terminal.app", "iTerm2", or "Custom") so the info panel stays readable

**Checkpoint**: On macOS, settings shows dropdown with three options. Selecting "iTerm2" hides the terminal command field. Selection persists after Obsidian restart. On Linux/Windows, settings are unchanged. US3 is complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build validation, cleanup, and documentation of the backward-compatibility behavior.

- [x] T013 Run `npm run build` in repo root — confirm zero TypeScript errors and bundle compiles cleanly to `main.js`
- [x] T014 Run `npm test && npm run lint` in repo root — confirm all existing tests pass and no new lint errors (no test/lint scripts exist in this project)
- [x] T015 [P] Add inline comment in `src/main.ts` `loadSettings` documenting backward-compatibility behavior: existing users with no saved `macTerminalApp` will receive `'terminal'` default via `Object.assign`, which is functionally equivalent to their previous Terminal.app default
- [x] T016 [P] Verify `src/settings.ts` file does not exceed 300 lines after changes (Constitution Principle VII); 172 lines ✓ and terminal.ts 188 lines ✓

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately; BLOCKS all user story phases
- **US1 (Phase 2)**: Depends on Phase 1 completion
- **US2 (Phase 3)**: Depends on Phase 2 completion (shares launch code)
- **US3 (Phase 4)**: Depends on Phase 1 completion — can be worked in parallel with US1/US2 if staffed
- **Polish (Phase 5)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 1 — no dependency on US2 or US3
- **US2 (P2)**: Depends on US1 (T004–T007) being complete — shares launch mechanism
- **US3 (P3)**: Can start after Phase 1 (independent of US1/US2 implementation) — but should be tested with US1 working to validate end-to-end

### Within Each Phase

- T001 and T002 can run in parallel (both in `src/types.ts` but distinct additions)
- T003 depends on T001 and T002 (uses `MacTerminalApp` type)
- T004, T005, T006 in Phase 2 are sequential (same function, build on each other)
- T009 and T012 in Phase 4 are parallel (different parts of `display()`)

### Parallel Opportunities

```bash
# Phase 1 — T001 and T002 touch same file but distinct additions; can be combined:
Task T001: Add MacTerminalApp type to src/types.ts
Task T002: Add macTerminalApp? field to LauncherSettings in src/types.ts

# Phase 4 — T009 and T012 are independent UI sections:
Task T009: Add dropdown setting in src/settings.ts
Task T012: Update platform info panel in src/settings.ts

# Phase 5 — T015 and T016 are independent reviews:
Task T015: Add backward-compat comment in src/settings.ts
Task T016: Verify file line count in src/settings.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (T001–T003)
2. Complete Phase 2: US1 (T004–T007)
3. **STOP and VALIDATE**: Hardcode `macTerminalApp: 'iterm2'` temporarily → verify iTerm2 opens correctly
4. Continue to US3 to wire up the settings UI properly

### Incremental Delivery

1. Phase 1 → Foundation ready
2. Phase 2 (US1) → iTerm2 launch works (testable by hardcoding setting)
3. Phase 3 (US2) → CLAUDE.md flow verified (minimal additional work)
4. Phase 4 (US3) → Settings UI wired up → full end-to-end UX complete
5. Phase 5 (Polish) → Build clean, tests pass → ready to ship

### Single Developer (Recommended Order)

```
T001 → T002 → T003 (foundational types/defaults)
→ T004 → T005 → T006 → T007 (launch logic, test manually)
→ T008 (CLAUDE.md verification, likely no code change)
→ T009 → T010 → T011 → T012 (settings UI)
→ T013 → T014 → T015 → T016 (polish + validate)
```

---

## Notes

- [P] tasks = different files or independent sections, no blocking dependencies between them
- [Story] label maps each task to a user story for traceability
- US2 (Phase 3) is intentionally lightweight — it shares US1's launch mechanism; the phase primarily confirms correct behavior rather than adding new code
- The `terminalCommand` field in `data.json` is preserved even when a named option is active; users switching to `'custom'` will find their previous value intact
- No new npm dependencies are introduced
- `main.ts` is untouched throughout this feature
