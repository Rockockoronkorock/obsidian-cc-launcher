# Feature Specification: Dedicated iTerm2 Support on macOS

**Feature Branch**: `002-iterm2-support`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User description: "I want to introduce dedicated iTerm2 support on Mac installation. There the AppleScript needs to be slightly different as described here: https://iterm2.com/documentation-scripting.html"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Launch Claude Code in iTerm2 (Priority: P1)

A macOS user who has iTerm2 installed as their preferred terminal selects iTerm2 as their terminal application in the plugin settings. When they right-click a file or folder and choose "Launch Claude Code", the plugin opens a new iTerm2 window in the correct directory and runs Claude Code — rather than using a generic AppleScript or the system's default Terminal.app.

**Why this priority**: This is the core use case. Without this working correctly, iTerm2 users cannot use the plugin effectively on macOS. Generic Terminal.app AppleScript will not work with iTerm2.

**Independent Test**: Can be fully tested by selecting iTerm2 in settings, right-clicking any folder, and verifying a new iTerm2 window opens in that folder running Claude Code.

**Acceptance Scenarios**:

1. **Given** the user has selected "iTerm2" as their terminal in plugin settings, **When** they right-click a folder and select "Launch Claude Code", **Then** a new iTerm2 window opens in that folder and runs the Claude Code command.
2. **Given** the user has selected "iTerm2" in settings, **When** they right-click a file (non-CLAUDE.md), **Then** iTerm2 opens in the file's parent directory and runs Claude Code.
3. **Given** iTerm2 is not installed on the user's system, **When** they have selected "iTerm2" and trigger the command, **Then** a clear error message informs them that iTerm2 could not be found.

---

### User Story 2 - Open CLAUDE.md in iTerm2 Context (Priority: P2)

A macOS iTerm2 user right-clicks a CLAUDE.md file in the editor or file explorer. The plugin recognizes this file and opens iTerm2 in that file's directory, launching Claude Code — taking advantage of the co-located CLAUDE.md instructions.

**Why this priority**: CLAUDE.md context launching is a key differentiator of the plugin. iTerm2 users should get the same experience as Terminal.app users.

**Independent Test**: Can be fully tested by right-clicking a CLAUDE.md file with iTerm2 selected as the terminal and verifying iTerm2 opens in the correct directory.

**Acceptance Scenarios**:

1. **Given** a CLAUDE.md file exists and the user has iTerm2 selected, **When** they right-click the CLAUDE.md file, **Then** iTerm2 opens in the CLAUDE.md's directory and runs Claude Code.
2. **Given** the editor context menu is triggered on a CLAUDE.md file, **When** the user selects the context menu action, **Then** iTerm2 launches in the correct directory.

---

### User Story 3 - Select iTerm2 from Settings (Priority: P3)

A macOS user opens the plugin settings and can select "iTerm2" as a named terminal option, rather than having to manually enter a custom command template. The option is only visible when the user is on macOS.

**Why this priority**: Discoverability matters. A named option for iTerm2 reduces friction compared to requiring users to know the correct AppleScript syntax for iTerm2 manually.

**Independent Test**: Can be tested by opening plugin settings on macOS and verifying "iTerm2" appears as a selectable terminal option alongside Terminal.app.

**Acceptance Scenarios**:

1. **Given** the user opens plugin settings on macOS, **When** they view the terminal selection, **Then** "iTerm2" appears as a distinct selectable option alongside "Terminal.app".
2. **Given** the user selects "iTerm2" and saves settings, **When** they reopen settings, **Then** "iTerm2" remains selected (setting is persisted).
3. **Given** the user is on Windows or Linux, **When** they open plugin settings, **Then** the iTerm2 option is not shown.

---

### Edge Cases

- What happens when iTerm2 is installed but not currently running — does it launch automatically?
- How does the plugin handle a path containing spaces or special characters when passed to iTerm2 via AppleScript?
- What happens when the user has both Terminal.app and iTerm2 installed and switches between them in settings?
- How does the system handle failure if AppleScript execution is blocked by macOS security/privacy permissions?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The plugin MUST provide "iTerm2" as a named, selectable terminal option in settings on macOS.
- **FR-002**: The plugin MUST use iTerm2-specific AppleScript (using `create window with default profile` and `write text`) rather than the generic Terminal.app AppleScript when iTerm2 is selected.
- **FR-003**: The iTerm2 AppleScript MUST open a new window, change to the target directory, and execute the Claude Code command within that window.
- **FR-004**: The iTerm2 terminal option MUST only be visible in plugin settings when the user is on macOS.
- **FR-005**: The plugin MUST display a user-friendly error if iTerm2 cannot be launched (e.g., not installed, AppleScript execution fails).
- **FR-006**: The iTerm2 command template MUST correctly handle directory paths containing spaces and special characters.
- **FR-007**: The plugin MUST persist the iTerm2 selection across Obsidian restarts using existing settings storage.
- **FR-008**: The plugin MUST support the existing `{DIR}` and `{CMD}` placeholder system when constructing the iTerm2 AppleScript command.

### Key Entities

- **Terminal Profile**: The selected terminal application for a given platform; extended to include "iTerm2" as a named macOS option alongside "Terminal.app".
- **AppleScript Template**: The platform-specific script used to spawn a terminal session; iTerm2 requires a distinct template from Terminal.app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: macOS users with iTerm2 can launch Claude Code from any file or folder context menu action with zero manual AppleScript configuration.
- **SC-002**: Selecting "iTerm2" in settings and triggering a launch opens an iTerm2 window in the correct directory 100% of the time when iTerm2 is installed.
- **SC-003**: Directory paths with spaces or special characters are handled correctly without error in all tested cases.
- **SC-004**: The iTerm2 option is invisible to non-macOS users, keeping the settings UI uncluttered for Windows and Linux users.
- **SC-005**: A meaningful error message is shown when iTerm2 is selected but cannot be launched, guiding the user toward resolution.

## Assumptions

- iTerm2 supports AppleScript via `tell application "iTerm2"` with `create window with default profile` and `write text "command"` — as documented at the iTerm2 scripting reference.
- The existing plugin architecture separates platform-specific terminal command templates, making it straightforward to add a new named macOS terminal type.
- The `osascript` binary used to execute AppleScript is available on all supported macOS versions.
- iTerm2 will auto-launch if not already running when targeted by AppleScript (standard macOS behavior for scriptable applications).
- The feature does not require iTerm2 Python API or any iTerm2-specific plugin — only built-in AppleScript support.
