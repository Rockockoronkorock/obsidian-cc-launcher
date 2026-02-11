---

description: "Task list for Claude Code Launcher feature implementation"
---

# Tasks: Claude Code Launcher

**Input**: Design documents from `/specs/001-claude-code-launcher/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested - No test tasks included (manual testing will be performed per quickstart.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions (Obsidian Plugin)

- **Plugin structure**: `src/` at repository root (per Constitution Principle VII)
- **Main file**: `src/main.ts` (lifecycle only)
- **Commands**: `src/commands/[command-name].ts`
- **Utilities**: `src/utils/[feature].ts`
- **Settings**: `src/settings.ts`
- **Types**: `src/types.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Obsidian plugin initialization and basic structure

- [ ] T001 Create Obsidian plugin directory structure (src/, src/commands/, src/utils/) at repository root
- [ ] T002 Initialize package.json with npm init and install dependencies (obsidian, typescript, esbuild, @types/node as devDependencies)
- [ ] T003 [P] Configure tsconfig.json with strict mode enabled, target ES2020, ESNext module, rootDir src/, paths for obsidian API
- [ ] T004 [P] Configure esbuild.config.mjs for bundling (entry: src/main.ts, output: main.js, external: obsidian, watch mode support)
- [ ] T005 [P] Setup npm scripts in package.json (dev: node esbuild.config.mjs, build: tsc -noEmit -skipLibCheck && node esbuild.config.mjs production)
- [ ] T006 [P] Create manifest.json with stable plugin id "obsidian-cc-launch", name "Claude Code Launcher", version "1.0.0", minAppVersion "1.0.0", isDesktopOnly true
- [ ] T007 [P] Create .gitignore excluding node_modules/, main.js, *.js (except esbuild.config.mjs), dist/, *.log, .DS_Store
- [ ] T008 [P] Create versions.json with plugin version to Obsidian version mapping (1.0.0 -> 1.0.0)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core plugin infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Create src/types.ts with LauncherSettings, LaunchContext, LaunchResult, and Platform type definitions per data-model.md
- [ ] T010 [P] Create src/settings.ts with getDefaultSettings() function implementing platform-specific defaults (macOS: Terminal.app, Windows: cmd.exe, Linux: gnome-terminal) per research.md
- [ ] T011 [P] Implement LauncherSettingTab class in src/settings.ts with display() method and three settings (terminalCommand, claudeCommand, additionalArgs) with onChange handlers
- [ ] T012 Create minimal src/main.ts with ClaudeCodeLauncherPlugin class extending Plugin (onload, onunload, settings, loadSettings, saveSettings methods only)
- [ ] T013 Implement loadSettings() and saveSettings() methods in src/main.ts using this.loadData() and this.saveData() with platform-specific defaults merge

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Launch Claude Code from File Context Menu (Priority: P1) 🎯 MVP

**Goal**: Enable users to right-click on CLAUDE.md files in file explorer or editor tabs and launch Claude Code in terminal with correct working directory

**Independent Test**: Create a CLAUDE.md file anywhere in vault, right-click it in file explorer or open it and right-click the tab, select "Launch Claude Code", verify terminal opens with Claude Code running in that file's directory

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create src/utils/terminal.ts with buildLaunchContext() function that extracts vault base path, file parent path, and constructs LaunchContext per contracts/plugin-api.md
- [ ] T015 [P] [US1] Implement spawnTerminal() function in src/utils/terminal.ts using child_process.spawn() with detached: true, stdio: 'ignore', windowsHide: true, shell: false, and child.unref() per research.md security guidelines
- [ ] T016 [US1] Implement launchTerminal() function in src/utils/terminal.ts that replaces {DIR} and {CMD} placeholders, parses terminal command, calls spawnTerminal(), and returns LaunchResult with error handling
- [ ] T017 [P] [US1] Create src/commands/launch-claude.ts with launchClaudeCode() function that validates file (instanceof TFile, has parent, FileSystemAdapter check), builds LaunchContext, calls launchTerminal(), and shows Notice for success/error
- [ ] T018 [US1] Implement registerLaunchCommand() function in src/commands/launch-claude.ts that registers file-menu event handler with filename filter (case-insensitive "claude.md" check) and menu item with "terminal" icon
- [ ] T019 [US1] Add editor-menu event handler in src/commands/launch-claude.ts registerLaunchCommand() function that checks view.file and adds same menu item for open CLAUDE.md tabs
- [ ] T020 [US1] Register settings tab in src/main.ts onload() using this.addSettingTab(new LauncherSettingTab(this.app, this))
- [ ] T021 [US1] Call registerLaunchCommand() from src/main.ts onload() after settings are loaded to register both context menu handlers
- [ ] T022 [US1] Add path validation helper in src/utils/terminal.ts to check for path traversal attempts (reject paths containing "..")
- [ ] T023 [US1] Add error code constants in src/types.ts (COMMAND_NOT_FOUND, PERMISSION_DENIED, INVALID_PATH, PLATFORM_UNSUPPORTED, SPAWN_FAILED) with user-friendly error messages per contracts/plugin-api.md

**Checkpoint**: At this point, User Story 1 should be fully functional - users can launch Claude Code from CLAUDE.md files in both file explorer and editor tabs

---

## Phase 4: User Story 2 - Configure Terminal and Claude Code Command (Priority: P2)

**Goal**: Enable users to configure terminal application and Claude Code invocation method to match their system setup and preferences

**Independent Test**: Open plugin settings, change terminal command and Claude Code command, launch Claude Code from CLAUDE.md file, verify it uses the configured settings

### Implementation for User Story 2

- [ ] T024 [US2] Add detailed descriptions to each setting in src/settings.ts LauncherSettingTab.display() method explaining placeholders ({DIR}, {CMD}) and providing platform-specific examples
- [ ] T025 [P] [US2] Add settings validation in src/settings.ts LauncherSettingTab that checks terminalCommand contains both {DIR} and {CMD} placeholders on change and shows warning Notice if missing
- [ ] T026 [P] [US2] Implement platform detection display in src/settings.ts that shows current detected platform and active default terminal command as read-only information above settings
- [ ] T027 [US2] Add "Reset to defaults" button in src/settings.ts LauncherSettingTab.display() that calls getDefaultSettings() and updates all three settings to platform defaults
- [ ] T028 [US2] Add placeholder examples in setting descriptions showing Terminal.app/iTerm2 for macOS, Windows Terminal/cmd.exe for Windows, gnome-terminal/konsole for Linux per research.md

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can customize their terminal setup and launch Claude Code with custom configurations

---

## Phase 5: User Story 3 - Visual Feedback and Error Handling (Priority: P3)

**Goal**: Provide clear success/error feedback and helpful error messages when launching Claude Code to improve user experience and enable troubleshooting

**Independent Test**: Trigger various scenarios (successful launch, missing Claude Code, invalid terminal path, permission errors) and verify appropriate notifications appear with actionable guidance

### Implementation for User Story 3

- [ ] T029 [P] [US3] Enhance success notification in src/commands/launch-claude.ts launchClaudeCode() to show "Claude Code launched successfully" with 3-second display duration
- [ ] T030 [P] [US3] Implement error mapping in src/utils/terminal.ts spawnTerminal() that detects ENOENT errors and maps to COMMAND_NOT_FOUND with message "Claude Code not found. Ensure it is installed and in your PATH."
- [ ] T031 [P] [US3] Add EACCES error detection in src/utils/terminal.ts spawnTerminal() mapping to PERMISSION_DENIED with message "Permission denied. Check your terminal settings and system permissions."
- [ ] T032 [US3] Enhance error Notice in src/commands/launch-claude.ts launchClaudeCode() to display error.message with 8-second display duration and error styling
- [ ] T033 [US3] Add mobile detection check in src/commands/launch-claude.ts launchClaudeCode() that shows "This feature is only available on desktop" message if not on FileSystemAdapter (safety check even though isDesktopOnly is true)
- [ ] T034 [US3] Add console.error logging in src/utils/terminal.ts for all spawn errors with full error details for developer troubleshooting
- [ ] T035 [P] [US3] Add validation notice in src/settings.ts when terminal command is changed to invalid format (missing placeholders) showing "Terminal command must contain {DIR} and {CMD} placeholders"

**Checkpoint**: All user stories should now be independently functional with comprehensive error handling and user feedback

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final quality improvements

- [ ] T036 [P] Create README.md with plugin description, installation instructions, usage guide, settings explanation, troubleshooting section, and screenshots
- [ ] T037 [P] Add example CLAUDE.md file to repository root demonstrating plugin usage context
- [ ] T038 [P] Document platform-specific terminal options in README.md (Terminal.app vs iTerm2 for macOS, Windows Terminal vs cmd.exe vs PowerShell for Windows, gnome-terminal vs konsole vs xterm for Linux)
- [ ] T039 Verify all Constitution principles in plan.md are followed (minimal main.ts, strict mode, resource management with registerEvent, stable plugin ID and command IDs, local-first, no blocking onload, modular files under 150 lines, isDesktopOnly true)
- [ ] T040 Run manual testing checklist from quickstart.md on macOS (Terminal.app), Windows (cmd.exe), and Linux (gnome-terminal) with test scenarios from spec.md acceptance criteria
- [ ] T041 [P] Create LICENSE file (MIT) in repository root
- [ ] T042 [P] Update CLAUDE.md with final technology stack and any additional context from implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **This is the MVP**
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 settings infrastructure but is independently valuable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 with better feedback but US1 works without it

### Within Each User Story

- All parallel tasks marked [P] can run simultaneously (different files)
- Non-parallel tasks must run in sequence (dependencies within same file)
- US1: terminal.ts utilities → command implementation → main.ts registration
- US2: Settings enhancements can be parallelized by field
- US3: Error handling enhancements can be parallelized by module

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T006, T007, T008 (all configuration files)
- **Phase 2**: T009, T010, T011 (types, settings defaults, settings UI - different files)
- **Phase 3 (US1)**: T014, T015, T017 (different functions in terminal.ts and launch-claude.ts)
- **Phase 4 (US2)**: T024, T025, T026, T028 (different setting enhancements)
- **Phase 5 (US3)**: T029, T030, T031, T034, T035 (different error handling locations)
- **Phase 6**: T036, T037, T038, T041, T042 (different documentation files)

---

## Parallel Example: User Story 1

```bash
# Launch terminal utilities in parallel:
Task T014: "Create buildLaunchContext() in src/utils/terminal.ts"
Task T015: "Create spawnTerminal() in src/utils/terminal.ts"
(T014 and T015 are different functions, can be written in parallel)

# After utilities are done, launch command logic:
Task T017: "Create launchClaudeCode() in src/commands/launch-claude.ts"
Task T018: "Create registerLaunchCommand() file-menu handler in src/commands/launch-claude.ts"
(T017 and T018 are in same file but different functions, can be parallelized)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → Project structure and build configured
2. Complete Phase 2: Foundational → Plugin lifecycle and settings ready
3. Complete Phase 3: User Story 1 → Core launch functionality working
4. **STOP and VALIDATE**: Test launching Claude Code from CLAUDE.md files in both file explorer and editor tabs
5. Deploy/demo minimal working plugin

**MVP Success Criteria**:
- Can right-click CLAUDE.md in file explorer → "Launch Claude Code" appears → Terminal opens in correct directory
- Can right-click CLAUDE.md editor tab → "Launch Claude Code" appears → Terminal opens in correct directory
- Works on macOS, Windows, and Linux with platform-specific defaults
- Multiple CLAUDE.md files in different folders work independently

### Incremental Delivery

1. **MVP (P1)**: Setup + Foundational + User Story 1 → Basic launch functionality
2. **V1.1 (P2)**: Add User Story 2 → Configurable terminal and command settings
3. **V1.2 (P3)**: Add User Story 3 → Enhanced error handling and user feedback
4. Each version adds value without breaking previous functionality

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (Days 1-2)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (core functionality)
   - Developer B: User Story 2 (settings enhancements) - can start in parallel
   - Developer C: User Story 3 (error handling) - can start in parallel
3. Stories integrate naturally through shared types and settings infrastructure

---

## Task Summary

- **Total Tasks**: 42
- **Phase 1 (Setup)**: 8 tasks (6 parallel)
- **Phase 2 (Foundational)**: 5 tasks (2 parallel)
- **Phase 3 (US1 - MVP)**: 10 tasks (4 parallel)
- **Phase 4 (US2)**: 5 tasks (3 parallel)
- **Phase 5 (US3)**: 7 tasks (4 parallel)
- **Phase 6 (Polish)**: 7 tasks (5 parallel)

**Parallel Opportunities**: 24 tasks marked [P] can run in parallel (57% of total tasks)

**Independent Test Criteria**:
- **US1**: Right-click CLAUDE.md in file explorer or tab → Launch succeeds → Terminal opens in correct directory
- **US2**: Change settings → Launch uses new configuration → Customization works
- **US3**: Trigger error conditions → Clear error messages appear → User understands issue

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 23 tasks
- This delivers core value: Launch Claude Code from CLAUDE.md files
- Users can start using the plugin immediately with sensible defaults
- Settings and error handling can be added in subsequent releases

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story] Description with file path`
- Constitution compliance verified in T039
- No automated tests (manual testing per quickstart.md and spec.md acceptance scenarios)
- Plugin ID "obsidian-cc-launch" and command ID "launch-claude-code" are stable and will never change (FR-010)
- Platform-specific terminal commands researched and documented in research.md
- Security: Using spawn() not exec(), path validation, no shell interpretation (research.md)
- Performance targets: <100ms onload, <50ms context menu display, <500ms launch (contracts/plugin-api.md)
- Memory target: <1MB footprint (contracts/plugin-api.md)
