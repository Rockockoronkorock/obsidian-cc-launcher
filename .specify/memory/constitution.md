<!--
Sync Impact Report:
- Version change: [none - initial creation] → 1.0.0
- Principles defined: 7 core principles based on Obsidian plugin development guidelines
  1. Minimal Plugin Lifecycle
  2. TypeScript Strict Mode
  3. Resource Management & Cleanup
  4. Manifest Stability
  5. Privacy & Local-First Operation
  6. Performance & Startup Optimization
  7. Modular Architecture & File Size
- Added sections: Architecture Standards, Security & Privacy, Governance
- Templates requiring updates:
  ✅ Updated plan-template.md (Obsidian-specific technical context, constitution checks, source structure)
  ✅ Updated spec-template.md (Obsidian-specific requirements guidance)
  ✅ Updated tasks-template.md (Obsidian plugin setup, foundational, and implementation patterns)
  ✅ Verified checklist-template.md (no changes needed - generic)
  ✅ Verified agent-file-template.md (no changes needed - auto-generated)
  ✅ Verified constitution-template.md (source template - not updated)
- Follow-up TODOs:
  - None - all placeholders filled, all templates aligned
-->

# Obsidian CC Launch Plugin Constitution

## Core Principles

### I. Minimal Plugin Lifecycle
Keep `main.ts` minimal, focusing only on plugin lifecycle management (onload, onunload, command registration). All feature logic MUST be delegated to separate, focused modules. The main plugin file serves as a composition root, not an implementation container.

**Rationale**: Maintains clarity, enables independent testing of features, and prevents the main file from becoming an unmaintainable monolith.

### II. TypeScript Strict Mode
TypeScript MUST be configured with `"strict": true`. All code MUST compile without type errors. No use of `any` type except where absolutely necessary with explicit justification.

**Rationale**: Catches errors at compile time, improves maintainability, and provides better IDE support. Obsidian's API is fully typed and strict mode ensures we leverage these guarantees.

### III. Resource Management & Cleanup
All resources (event listeners, DOM events, intervals) MUST be registered using plugin helper methods:
- `this.registerEvent()` for app/workspace events
- `this.registerDomEvent()` for DOM events
- `this.registerInterval()` for timers

Code paths MUST be idempotent so reload/unload doesn't leak listeners or intervals.

**Rationale**: Prevents memory leaks, ensures proper cleanup, and maintains stable plugin behavior across enable/disable cycles.

### IV. Manifest Stability
The plugin `id` field in `manifest.json` MUST NEVER change after initial release. Command IDs MUST remain stable; avoid renaming post-release. Version MUST follow semantic versioning (x.y.z). The `minAppVersion` field MUST be kept accurate when using newer Obsidian APIs.

**Rationale**: Changing `id` breaks user installations. Stable command IDs preserve user hotkeys and workflows. Accurate version metadata ensures compatibility.

### V. Privacy & Local-First Operation
Default to local/offline operation. Network requests are permitted only when essential and MUST:
- Require explicit user opt-in via settings
- Be clearly disclosed in README and settings UI
- Never execute remote code or auto-update outside normal release channels
- Never collect vault contents, filenames, or personal information without essential need and explicit consent

**Rationale**: Respects user privacy, aligns with Obsidian's local-first philosophy, and builds trust. Users expect their vault data to remain private.

### VI. Performance & Startup Optimization
Keep plugin startup lightweight. Defer heavy work until needed. Avoid blocking operations during `onload`. Batch disk access and limit vault scans. Debounce/throttle expensive file system event handlers.

**Rationale**: Fast startup maintains Obsidian's responsiveness. Users notice slow plugins and disable them.

### VII. Modular Architecture & File Size
If any source file exceeds 200-300 lines, it MUST be broken into smaller, focused modules. Each file SHOULD have a single, well-defined responsibility. Prefer this structure:
```
src/
  main.ts              # Lifecycle management only
  settings.ts          # Configuration interfaces
  commands/            # Command implementations
  ui/                  # Modals and views
  utils/               # Helpers and utilities
  types.ts             # TypeScript interfaces
```

**Rationale**: Smaller files are easier to understand, test, and maintain. Clear separation of concerns reduces cognitive load.

## Architecture Standards

### Build & Tooling Requirements
- **Node.js**: Current LTS (18+)
- **Package manager**: npm required
- **Bundler**: esbuild required; bundle all dependencies into `main.js`
- **Build commands**:
  - `npm install` - Install dependencies
  - `npm run dev` - Watch mode development
  - `npm run build` - Production compilation
- **Release artifacts**: `main.js`, `manifest.json`, and optional `styles.css`
- **No build artifacts in version control**: Never commit `node_modules/` or generated `main.js`

### Code Quality Standards
- **Async patterns**: Prefer `async/await` over promise chains
- **Error handling**: Handle errors gracefully; never swallow exceptions silently
- **Dependencies**: Keep plugin small; prefer browser-compatible packages
- **Linting**: Use ESLint for code analysis

### Mobile Compatibility
- Test on iOS and Android where feasible
- Avoid desktop-only APIs unless `isDesktopOnly: true` in manifest
- Be mindful of memory and storage constraints on mobile devices

### User Experience Guidelines
- Use sentence case for headings, buttons, and titles
- Employ action-oriented imperatives in instructions
- Indicate literal UI labels with **bold**; prefer "select" for interactions
- Use arrow notation for navigation: **Settings → Community plugins**
- Keep in-app strings short, consistent, and jargon-free

## Security & Privacy

### Data Handling
- Minimize vault access scope
- Never read files outside the vault
- Do not collect analytics without explicit opt-in
- Clearly disclose third-party service integrations
- Avoid deceptive patterns, ads, or spammy notifications

### Code Execution
- Never execute remote code
- Never auto-update outside normal Obsidian release channels
- All code MUST be bundled at build time

## Governance

### Amendment Process
This constitution supersedes all other development practices. Amendments require:
1. Documented justification for the change
2. Review and approval from project maintainers
3. Version bump according to semantic versioning rules:
   - **MAJOR**: Backward incompatible governance/principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements
4. Propagation of changes to all dependent templates and documentation

### Compliance Review
All pull requests and code reviews MUST verify compliance with these principles. Any complexity introduced MUST be justified against these standards. When in doubt, favor simplicity and adherence to core principles.

### Versioning & Release Process
1. Bump `version` in `manifest.json` using semantic versioning
2. Update `versions.json` to map plugin version → minimum app version
3. Create GitHub release with tag matching `manifest.json` version (no leading 'v')
4. Attach `manifest.json`, `main.js`, and `styles.css` as individual assets
5. Follow Obsidian community catalog submission process

**Version**: 1.0.0 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-11
