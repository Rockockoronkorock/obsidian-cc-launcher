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
		this.settings = Object.assign({}, defaults, loaded);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
