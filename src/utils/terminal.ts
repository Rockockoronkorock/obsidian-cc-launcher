import { App, FileSystemAdapter, Notice, TFile } from 'obsidian';
import { spawn } from 'child_process';
import * as path from 'path';
import { LauncherSettings, LaunchContext, LaunchResult, ERROR_MESSAGES } from '../types';

export function buildLaunchContext(
	app: App,
	file: TFile,
	settings: LauncherSettings
): LaunchContext {
	const adapter = app.vault.adapter;

	if (!(adapter instanceof FileSystemAdapter)) {
		throw new Error(ERROR_MESSAGES.NOT_DESKTOP);
	}

	if (!file.parent) {
		throw new Error(ERROR_MESSAGES.INVALID_PATH);
	}

	const vaultPath = adapter.getBasePath();
	const workingDirectory = path.join(vaultPath, file.parent.path);

	// Build command string
	const command = settings.additionalArgs.trim()
		? `${settings.claudeCommand} ${settings.additionalArgs}`
		: settings.claudeCommand;

	return {
		workingDirectory,
		command,
		terminalCommand: settings.terminalCommand
	};
}

export function spawnTerminal(
	executable: string,
	args: string[],
	useShell: boolean = false
): Promise<LaunchResult> {
	return new Promise((resolve) => {
		try {
			const child = spawn(executable, args, {
				detached: true,
				stdio: 'ignore',
				windowsHide: true,
				shell: useShell
			});

			// Unref allows parent to exit independently
			child.unref();

			// Listen for spawn errors
			child.on('error', (error: NodeJS.ErrnoException) => {
				console.error('Failed to launch terminal:', error);

				let errorMessage = ERROR_MESSAGES.SPAWN_FAILED + error.message;

				// Map specific error codes
				if (error.code === 'ENOENT') {
					errorMessage = ERROR_MESSAGES.COMMAND_NOT_FOUND;
				} else if (error.code === 'EACCES') {
					errorMessage = ERROR_MESSAGES.PERMISSION_DENIED;
				}

				resolve({
					success: false,
					error: errorMessage
				});
			});

			// If no immediate error, assume success
			setTimeout(() => {
				resolve({ success: true });
			}, 100);

		} catch (error) {
			console.error('Spawn error:', error);
			resolve({
				success: false,
				error: ERROR_MESSAGES.SPAWN_FAILED + (error as Error).message
			});
		}
	});
}

export async function launchTerminal(context: LaunchContext): Promise<LaunchResult> {
	try {
		// Validate path
		if (!validatePath(context.workingDirectory)) {
			return {
				success: false,
				error: ERROR_MESSAGES.INVALID_PATH
			};
		}

		// Replace placeholders
		let terminalCommand = context.terminalCommand
			.replace(/{DIR}/g, context.workingDirectory)
			.replace(/{CMD}/g, context.command);

		// Parse command into executable and arguments
		// Since terminal commands often have complex quoting, we use shell execution
		// This is safe because the template is user-configured, not runtime user input
		const platform = process.platform;

		let executable: string;
		let args: string[];
		let useShell: boolean = false;

		if (platform === 'win32') {
			// Windows: use cmd.exe to execute
			executable = 'cmd';
			args = ['/c', terminalCommand];
		} else if (platform === 'darwin' && terminalCommand.includes('osascript')) {
			// macOS: osascript command
			executable = 'osascript';
			const scriptMatch = terminalCommand.match(/osascript\s+-e\s+'(.+)'/);
			if (scriptMatch) {
				args = ['-e', scriptMatch[1]];
			} else {
				args = ['-e', terminalCommand.replace('osascript -e ', '')];
			}
		} else {
			// Linux: use shell to handle complex quoting
			executable = '/bin/sh';
			args = ['-c', terminalCommand];
			useShell = false; // We're explicitly using sh, don't need shell: true
		}

		return await spawnTerminal(executable, args, useShell);

	} catch (error) {
		console.error('Launch terminal error:', error);
		return {
			success: false,
			error: ERROR_MESSAGES.SPAWN_FAILED + (error as Error).message
		};
	}
}

export function validatePath(filePath: string): boolean {
	const normalized = path.normalize(filePath);

	// Prevent path traversal
	if (normalized.includes('..')) {
		return false;
	}

	return true;
}
