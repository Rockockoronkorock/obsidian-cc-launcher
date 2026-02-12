# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript with strict mode enabled
**Primary Dependencies**: Obsidian API (check manifest.json for minAppVersion)
**Build Tool**: esbuild (required for bundling to main.js)
**Package Manager**: npm (required)
**Testing**: [e.g., Jest, Vitest, or N/A]
**Target Platform**: Obsidian Desktop and/or Mobile (set isDesktopOnly in manifest.json)
**Performance Goals**: Fast startup, lightweight memory footprint, responsive UI
**Constraints**: No blocking operations during onload, local-first operation, no network calls without user opt-in
**Scale/Scope**: [e.g., small utility plugin, medium feature plugin, large integration plugin]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Minimal Plugin Lifecycle**: main.ts contains ONLY lifecycle management (onload, onunload, command registration)
- [ ] **TypeScript Strict Mode**: tsconfig.json has `"strict": true` enabled
- [ ] **Resource Management**: All listeners/events use `this.registerEvent()`, `this.registerDomEvent()`, or `this.registerInterval()`
- [ ] **Manifest Stability**: Plugin id chosen and documented (NEVER changes post-release), commands have stable IDs
- [ ] **Privacy & Local-First**: No network calls OR clear disclosure + opt-in in settings
- [ ] **Performance**: No blocking operations in onload, heavy work deferred
- [ ] **Modular Architecture**: Files under 200-300 lines, clear separation (commands/, ui/, utils/, etc.)
- [ ] **Build Configuration**: esbuild configured, npm scripts defined (dev, build)
- [ ] **Mobile Compatibility**: Desktop-only APIs avoided OR `isDesktopOnly: true` in manifest
- [ ] **Dependencies**: All dependencies bundled into main.js, no runtime deps

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Obsidian Plugin Structure (based on Constitution Principle VII)
src/
├── main.ts              # Plugin lifecycle ONLY (onload, onunload, command registration)
├── settings.ts          # Settings interface and tab
├── commands/            # Command implementations
│   └── [feature-command].ts
├── ui/                  # Modals, views, and UI components
│   ├── modals/
│   └── views/
├── utils/               # Helper functions and utilities
└── types.ts             # TypeScript interfaces and types

tests/                   # If tests are included
├── unit/
└── integration/

# Root files (DO NOT commit main.js - it's a build artifact)
manifest.json            # Plugin metadata (id, name, version, minAppVersion)
styles.css              # Optional: Plugin-specific styles
esbuild.config.mjs      # Build configuration
tsconfig.json           # TypeScript configuration (strict: true required)
package.json            # npm dependencies and scripts
versions.json           # Plugin version → Obsidian version mapping
.gitignore              # MUST exclude: node_modules/, main.js, *.js (except esbuild.config.mjs)
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
