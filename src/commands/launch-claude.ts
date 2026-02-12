import { App, FileSystemAdapter, Menu, Notice, Plugin, TFile } from 'obsidian';
import { LauncherSettings } from '../types';
import { buildLaunchContext, launchTerminal } from '../utils/terminal';

export async function launchClaudeCode(
	app: App,
	file: TFile,
	settings: LauncherSettings
): Promise<void> {
	try {
		// Validate file
		if (!(file instanceof TFile)) {
			new Notice('Invalid file type');
			return;
		}

		if (!file.parent) {
			new Notice('File has no parent directory');
			return;
		}

		// Check desktop-only
		const adapter = app.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			new Notice('This feature is only available on desktop');
			return;
		}

		// Build launch context
		const context = buildLaunchContext(app, file, settings);

		// Launch terminal
		const result = await launchTerminal(context);

		// Show result notification
		if (result.success) {
			new Notice('Claude Code launched successfully', 3000);
		} else {
			new Notice(result.error || 'Failed to launch Claude Code', 8000);
		}

	} catch (error) {
		console.error('Launch Claude Code error:', error);
		new Notice(`Error: ${(error as Error).message}`, 8000);
	}
}

export function registerLaunchCommand(plugin: Plugin, settings: LauncherSettings): void {
	// Register file-menu event handler (file explorer context menu)
	plugin.registerEvent(
		plugin.app.workspace.on('file-menu', (menu: Menu, file) => {
			// Only show for CLAUDE.md files
			if (!(file instanceof TFile)) return;
			if (file.name.toLowerCase() !== 'claude.md') return;

			menu.addItem((item) => {
				item
					.setTitle('Launch Claude Code')
					.setIcon('terminal')
					.onClick(async () => {
						await launchClaudeCode(plugin.app, file, settings);
					});
			});
		})
	);

	// Register editor-menu event handler (editor tab context menu)
	plugin.registerEvent(
		plugin.app.workspace.on('editor-menu', (menu: Menu, editor, view) => {
			// Check if active file is CLAUDE.md
			const file = view.file;
			if (!file) return;
			if (file.name.toLowerCase() !== 'claude.md') return;

			menu.addItem((item) => {
				item
					.setTitle('Launch Claude Code')
					.setIcon('terminal')
					.onClick(async () => {
						await launchClaudeCode(plugin.app, file, settings);
					});
			});
		})
	);
}
