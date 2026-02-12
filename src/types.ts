// Settings stored in data.json
export interface LauncherSettings {
	terminalCommand: string;
	claudeCommand: string;
	additionalArgs: string;
}

// Runtime context for launching
export interface LaunchContext {
	workingDirectory: string;
	command: string;
	terminalCommand: string;
}

// Platform detection
export type SupportedPlatform = 'darwin' | 'win32' | 'linux';
export type Platform = SupportedPlatform | 'unknown';

// Launch result for error handling
export interface LaunchResult {
	success: boolean;
	error?: string;
}

// Error code constants
export const ERROR_CODES = {
	COMMAND_NOT_FOUND: 'COMMAND_NOT_FOUND',
	PERMISSION_DENIED: 'PERMISSION_DENIED',
	INVALID_PATH: 'INVALID_PATH',
	PLATFORM_UNSUPPORTED: 'PLATFORM_UNSUPPORTED',
	SPAWN_FAILED: 'SPAWN_FAILED',
	NOT_DESKTOP: 'NOT_DESKTOP'
} as const;

// Error messages
export const ERROR_MESSAGES = {
	COMMAND_NOT_FOUND: 'Claude Code not found. Ensure it is installed and in your PATH.',
	PERMISSION_DENIED: 'Permission denied. Check your terminal settings and system permissions.',
	INVALID_PATH: 'Invalid directory path. Cannot launch Claude Code.',
	PLATFORM_UNSUPPORTED: 'Your platform is not currently supported.',
	SPAWN_FAILED: 'Failed to launch terminal: ',
	NOT_DESKTOP: 'This feature is only available on desktop.'
} as const;
