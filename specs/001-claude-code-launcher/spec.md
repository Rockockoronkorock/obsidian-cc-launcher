# Feature Specification: Claude Code Launcher

**Feature Branch**: `001-claude-code-launcher`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "I want to create an Obsidian plugin which allows to launch Claude Code. The idea is that in (sub-) folders of my Obsidian Vault there are different 'CLAUDE.md' files which define how I want to interact with Claude with different parts of my personal Obsidian Vault. If I right click on a 'CLAUDE.md' file I want to have a new menu context entry 'Launch Claude Code' which directly opens up Claude Code in my terminal with the correct context / folder from where I wanted to have started Claude Code."

## Clarifications

### Session 2026-02-11

- Q: Where should the "Launch Claude Code" menu item appear? → A: In both file explorer AND in the editor tab context menu when the file is open
- Q: What should happen when a user launches Claude Code while another Claude Code session is already running? → A: Always open a new terminal window with a new Claude Code session
- Q: What should happen after displaying an error message when terminal launch fails? → A: Display error notification only; user must fix settings manually

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Launch Claude Code from File Context Menu (Priority: P1)

As an Obsidian user, I want to right-click on a CLAUDE.md file in my vault and select "Launch Claude Code" so that I can start an AI coding session with the correct working directory context for that specific part of my vault.

**Why this priority**: This is the core functionality of the plugin. Without this, the plugin has no value. Users need a quick, intuitive way to launch Claude Code from within Obsidian without manually switching to their terminal and navigating to the correct directory.

**Independent Test**: Can be fully tested by creating a CLAUDE.md file anywhere in the vault, right-clicking it, selecting "Launch Claude Code" from the context menu, and verifying that a terminal opens with Claude Code running in the directory containing that CLAUDE.md file.

**Acceptance Scenarios**:

1. **Given** a CLAUDE.md file exists in the vault root, **When** I right-click on the file in the file explorer and select "Launch Claude Code", **Then** a terminal window opens with Claude Code running in the vault root directory
2. **Given** a CLAUDE.md file is open in a tab, **When** I right-click on the editor tab and select "Launch Claude Code", **Then** a terminal window opens with Claude Code running in the directory containing that file
3. **Given** a CLAUDE.md file exists in a subfolder (e.g., `/projects/my-project/CLAUDE.md`), **When** I right-click on the file and select "Launch Claude Code", **Then** a terminal window opens with Claude Code running in that subfolder's directory
4. **Given** I have Claude Code already installed and accessible via CLI, **When** I launch Claude Code from a CLAUDE.md file, **Then** the terminal opens successfully with the appropriate working directory
5. **Given** multiple CLAUDE.md files exist in different folders, **When** I launch Claude Code from different CLAUDE.md files, **Then** each launch uses the correct directory context for that specific file
6. **Given** I already have a Claude Code session running from one CLAUDE.md file, **When** I launch Claude Code from a different CLAUDE.md file, **Then** a new terminal window opens with a separate Claude Code session in the new directory

---

### User Story 2 - Configure Terminal and Claude Code Command (Priority: P2)

As an Obsidian user, I want to configure which terminal application to use and how Claude Code is invoked so that the plugin works with my specific system setup and preferences.

**Why this priority**: Different users have different terminal preferences (Terminal.app on Mac, Windows Terminal on Windows, gnome-terminal on Linux, etc.) and may have Claude Code installed in different ways (npm global, local install, custom path). Configuration support ensures the plugin works for everyone.

**Independent Test**: Can be tested by accessing plugin settings, changing the terminal command and Claude Code invocation method, then launching Claude Code and verifying it uses the configured settings.

**Acceptance Scenarios**:

1. **Given** I'm on macOS, **When** I configure the plugin to use Terminal.app, **Then** launching Claude Code opens Terminal.app with the correct working directory
2. **Given** I'm on Windows, **When** I configure the plugin to use Windows Terminal, **Then** launching Claude Code opens Windows Terminal with the correct working directory
3. **Given** I'm on Linux, **When** I configure the plugin to use my preferred terminal (gnome-terminal, konsole, etc.), **Then** launching Claude Code opens that terminal with the correct working directory
4. **Given** I have Claude Code installed via npm global, **When** I launch from a CLAUDE.md file, **Then** the terminal executes `claude-code` command in the correct directory
5. **Given** I access the plugin settings, **When** I view the configuration, **Then** I see sensible defaults based on my operating system

---

### User Story 3 - Visual Feedback and Error Handling (Priority: P3)

As an Obsidian user, I want clear feedback when launching Claude Code and helpful error messages if something goes wrong so that I understand what's happening and can troubleshoot issues.

**Why this priority**: Good user experience requires feedback and error handling, but the core functionality can work without sophisticated feedback. This enhances usability but isn't critical for MVP.

**Independent Test**: Can be tested by triggering various launch scenarios (successful launch, missing Claude Code installation, permission errors) and verifying appropriate notifications appear.

**Acceptance Scenarios**:

1. **Given** I launch Claude Code successfully, **When** the terminal opens, **Then** I see a brief success notification in Obsidian
2. **Given** Claude Code is not installed or not in PATH, **When** I try to launch it, **Then** I see a clear error message explaining that Claude Code couldn't be found and suggesting how to install it
3. **Given** the plugin doesn't have permission to execute terminal commands, **When** I try to launch Claude Code, **Then** I see an error message explaining the permission issue
4. **Given** the terminal application path is invalid or terminal is not installed, **When** I try to launch Claude Code, **Then** I see an error notification and must manually fix the terminal path in plugin settings
5. **Given** I'm on mobile (iOS/Android), **When** I right-click a CLAUDE.md file, **Then** I see a message explaining that this feature is desktop-only

---

### Edge Cases

- What happens when a CLAUDE.md file exists but the directory doesn't have appropriate permissions?
- How does the system handle situations where the terminal application path is invalid or the terminal isn't installed?
- What happens if Claude Code is running but the process fails to start due to system resource constraints?
- How does the plugin behave when multiple CLAUDE.md files with the same name exist in different directories?
- What happens when a user tries to launch Claude Code from a CLAUDE.md file on a network drive or remote file system?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Plugin MUST add a context menu item "Launch Claude Code" in two locations for files named "CLAUDE.md":
  - File explorer context menu (when right-clicking the file in the file tree)
  - Editor tab context menu (when right-clicking the tab of an open CLAUDE.md file)
- **FR-002**: Plugin MUST determine the directory path of the CLAUDE.md file and use it as the working directory for Claude Code
- **FR-003**: Plugin MUST launch the configured terminal application with Claude Code running in the correct working directory. Each launch MUST create a new terminal window/session, allowing multiple concurrent Claude Code sessions
- **FR-004**: Plugin MUST provide a settings interface where users can configure:
  - Terminal application command/path
  - Claude Code invocation command
  - Additional command-line arguments (optional)
- **FR-005**: Plugin MUST have sensible default terminal commands based on the operating system:
  - macOS: Use Terminal.app or iTerm2
  - Windows: Use Windows Terminal or cmd.exe
  - Linux: Use gnome-terminal, konsole, or xterm
- **FR-006**: Plugin MUST be desktop-only (set `isDesktopOnly: true` in manifest.json) as terminal launching is not supported on mobile
- **FR-007**: Plugin MUST display user-friendly error notifications (no automatic recovery actions) when:
  - Claude Code is not installed or not found in PATH
  - Terminal application cannot be launched
  - Directory permissions prevent access
  - Users must manually correct configuration via plugin settings
- **FR-008**: Plugin MUST show a brief notification when Claude Code is launched successfully
- **FR-009**: Plugin MUST only show the "Launch Claude Code" context menu item for files named exactly "CLAUDE.md" (case-insensitive comparison recommended for cross-platform compatibility)
- **FR-010**: Plugin MUST use stable command IDs that will not change after release

### Assumptions

- Users have Claude Code installed and accessible via command line (either globally via npm or in their PATH)
- Users have a terminal application installed on their system
- The Obsidian vault is on a local file system (not a remote/network drive, though the plugin should handle this gracefully)
- Users understand that this is a desktop-only feature due to terminal integration requirements

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can launch Claude Code from any CLAUDE.md file in their vault in under 5 seconds (from right-click to terminal open)
- **SC-002**: The terminal opens with the correct working directory 100% of the time when paths are valid
- **SC-003**: Users receive clear, actionable error messages within 2 seconds when launch fails (95% of users understand the error without external help)
- **SC-004**: Plugin works across all three major desktop operating systems (macOS, Windows, Linux) without requiring platform-specific user configuration beyond defaults
- **SC-005**: 90% of users successfully launch Claude Code on their first attempt after installing the plugin (assuming Claude Code is installed)
- **SC-006**: Users with multiple CLAUDE.md files in different vault locations can independently launch Claude Code sessions for each location without interference
