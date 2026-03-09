import { Plugin } from 'obsidian';
import { LauncherSettings } from './types';
import { getDefaultSettings, LauncherSettingTab } from './settings';
import { registerLaunchCommand } from './commands/launch-claude';

export default class ClaudeCodeLauncherPlugin extends Plugin {
	settings!: LauncherSettings;

	async onload() {
		await this.loadSettings();

		// Register settings tab
		this.addSettingTab(new LauncherSettingTab(this.app, this));

		// Register context menu handlers
		registerLaunchCommand(this, this.settings);
	}

	onunload() {
		// Cleanup handled automatically by registerEvent()
	}

	async loadSettings() {
		const defaults = getDefaultSettings();
		const loaded = await this.loadData();
		// Object.assign gives loaded values priority over defaults.
		// Existing users with no saved macTerminalApp receive the default ('terminal' on macOS),
		// which is functionally equivalent to the Terminal.app command they had before.
		// Their saved terminalCommand is preserved and will be shown if they switch to 'custom'.
		this.settings = Object.assign({}, defaults, loaded);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
