import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type ClaudeCodeLauncherPlugin from './main';
import { LauncherSettings, MacTerminalApp, Platform } from './types';

export function getDefaultSettings(): LauncherSettings {
	const platform = process.platform as Platform;

	let terminalCommand = '';

	switch (platform) {
		case 'darwin':
			terminalCommand = 'osascript -e \'tell application "Terminal" to do script "cd \\"{DIR}\\" && {CMD}"\'';
			return {
				terminalCommand,
				claudeCommand: 'claude-code',
				additionalArgs: '',
				macTerminalApp: 'terminal'
			};
		case 'win32':
			terminalCommand = 'start cmd /K "cd /D \"{DIR}\" && {CMD}"';
			break;
		case 'linux':
			terminalCommand = 'gnome-terminal --working-directory="{DIR}" -- bash -c "{CMD}; exec bash"';
			break;
		default:
			// Fallback to Linux default for unknown platforms
			terminalCommand = 'gnome-terminal --working-directory="{DIR}" -- bash -c "{CMD}; exec bash"';
			break;
	}

	return {
		terminalCommand,
		claudeCommand: 'claude-code',
		additionalArgs: ''
	};
}

export class LauncherSettingTab extends PluginSettingTab {
	plugin: ClaudeCodeLauncherPlugin;

	constructor(app: App, plugin: ClaudeCodeLauncherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Claude Code Launcher Settings' });

		const platform = process.platform as Platform;
		const platformNames: Record<string, string> = {
			'darwin': 'macOS',
			'win32': 'Windows',
			'linux': 'Linux'
		};
		const platformName = platformNames[platform] || 'Unknown';

		// Resolve active terminal display name for the info panel
		const macApp = this.plugin.settings.macTerminalApp ?? 'terminal';
		const macTerminalNames: Record<MacTerminalApp, string> = {
			'terminal': 'Terminal.app',
			'iterm2': 'iTerm2',
			'custom': 'Custom command'
		};
		const activeTerminalLabel = platform === 'darwin'
			? macTerminalNames[macApp]
			: this.plugin.settings.terminalCommand;

		const platformInfo = containerEl.createDiv('setting-item-description');
		platformInfo.style.marginBottom = '1em';
		platformInfo.style.padding = '0.5em';
		platformInfo.style.backgroundColor = 'var(--background-secondary)';
		platformInfo.innerHTML = `<strong>Detected Platform:</strong> ${platformName}<br><strong>Active Terminal:</strong> ${activeTerminalLabel}`;

		// macOS-only: terminal application selector dropdown (T009)
		if (platform === 'darwin') {
			new Setting(containerEl)
				.setName('Terminal application')
				.setDesc('Select which terminal to use on macOS')
				.addDropdown(dropdown => dropdown
					.addOption('terminal', 'Terminal.app')
					.addOption('iterm2', 'iTerm2')
					.addOption('custom', 'Custom command')
					.setValue(macApp)
					.onChange(async (value: string) => {
						this.plugin.settings.macTerminalApp = value as MacTerminalApp;
						await this.plugin.saveSettings();
						this.display(); // refresh to show/hide terminal command field
					}));
		}

		// Terminal command text field — shown only for custom mode on macOS, or always on other platforms (T010)
		const showTerminalCommandField = platform !== 'darwin' || macApp === 'custom';
		if (showTerminalCommandField) {
			new Setting(containerEl)
				.setName('Terminal command')
				.setDesc(this.getTerminalCommandDescription(platform))
				.addText(text => text
					.setPlaceholder('Enter terminal command')
					.setValue(this.plugin.settings.terminalCommand)
					.onChange(async (value) => {
						// Validate placeholders only when the field is visible (T011)
						if (value && (!value.includes('{DIR}') || !value.includes('{CMD}'))) {
							new Notice('Terminal command must contain {DIR} and {CMD} placeholders', 5000);
						}
						this.plugin.settings.terminalCommand = value;
						await this.plugin.saveSettings();
					}));
		}

		// Reset to defaults button
		new Setting(containerEl)
			.setName('Reset to defaults')
			.setDesc('Reset all settings to platform-specific defaults')
			.addButton(button => button
				.setButtonText('Reset')
				.onClick(async () => {
					const defaults = getDefaultSettings();
					this.plugin.settings = defaults;
					await this.plugin.saveSettings();
					this.display();
					new Notice('Settings reset to defaults');
				}));

		// Claude Code command setting
		new Setting(containerEl)
			.setName('Claude Code command')
			.setDesc('Command to invoke Claude Code. Examples: "claude-code", "npx claude-code", or full path to executable.')
			.addText(text => text
				.setPlaceholder('claude-code')
				.setValue(this.plugin.settings.claudeCommand)
				.onChange(async (value) => {
					this.plugin.settings.claudeCommand = value;
					await this.plugin.saveSettings();
				}));

		// Additional arguments setting
		new Setting(containerEl)
			.setName('Additional arguments')
			.setDesc('Optional additional arguments to pass to Claude Code (e.g., "--verbose", "--model sonnet")')
			.addText(text => text
				.setPlaceholder('--verbose')
				.setValue(this.plugin.settings.additionalArgs)
				.onChange(async (value) => {
					this.plugin.settings.additionalArgs = value;
					await this.plugin.saveSettings();
				}));
	}

	// T024, T028: Detailed platform-specific descriptions
	getTerminalCommandDescription(platform: Platform): string {
		const baseDesc = 'Command to launch terminal. Use {DIR} for directory and {CMD} for command.\n\n';

		const examples: Record<string, string> = {
			'darwin': 'macOS examples:\n' +
				'• Terminal.app: osascript -e \'tell application "Terminal" to do script "cd \\"{DIR}\\" && {CMD}"\'\n' +
				'• iTerm2: osascript -e \'tell application "iTerm2" to create window with default profile command "cd \\"{DIR}\\" && {CMD}"\'',
			'win32': 'Windows examples:\n' +
				'• cmd.exe: start cmd /K "cd /D \\"{DIR}\\" && {CMD}"\n' +
				'• Windows Terminal: wt.exe -w -1 new-tab -d "{DIR}" cmd /K {CMD}\n' +
				'• PowerShell: start pwsh -NoExit -Command "Set-Location \\"{DIR}\\"; {CMD}"',
			'linux': 'Linux examples:\n' +
				'• gnome-terminal: gnome-terminal --working-directory="{DIR}" -- bash -c "{CMD}; exec bash"\n' +
				'• konsole: konsole --workdir "{DIR}" --noclose -e {CMD}\n' +
				'• xterm: xterm -e "cd {DIR} && {CMD}; exec bash"'
		};

		return baseDesc + (examples[platform] || examples['linux']);
	}
}
