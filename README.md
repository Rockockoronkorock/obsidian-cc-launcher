# Claude Code Launcher for Obsidian

Launch Claude Code CLI sessions directly from CLAUDE.md files in your Obsidian vault.

## Features

- 🚀 **Right-click to launch**: Context menu on CLAUDE.md files (both file explorer and editor tabs)
- ⚙️ **Configurable**: Customize terminal application and Claude Code command
- 🖥️ **Cross-platform**: Works on macOS, Windows, and Linux with platform-specific defaults
- 📁 **Automatic directory**: Claude Code launches in the correct working directory

## Installation

### Manual Installation

1. Download the latest release from GitHub
2. Extract the files into your vault's `.obsidian/plugins/obsidian-cc-launch/` directory
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

### Prerequisites

- **Claude Code CLI** must be installed and accessible in your PATH
- **Desktop version** of Obsidian (this plugin does not work on mobile)
- A terminal application (Terminal.app, cmd.exe, gnome-terminal, etc.)

## Usage

### Basic Usage

1. Create or open a CLAUDE.md file anywhere in your vault
2. Right-click on the file in the file explorer **OR** right-click on the editor tab
3. Select "Launch Claude Code" from the context menu
4. A terminal window opens with Claude Code running in that file's directory

### Configuration

Go to **Settings → Claude Code Launcher** to customize:

#### Terminal Command
- The command used to launch your terminal application
- Uses placeholders: `{DIR}` for directory, `{CMD}` for command
- Platform-specific defaults are provided

**macOS Examples:**
```
osascript -e 'tell application "Terminal" to do script "cd {DIR} && {CMD}"'
osascript -e 'tell application "iTerm2" to create window with default profile command "cd {DIR} && {CMD}"'
```

**Windows Examples:**
```
start cmd /K "cd /D {DIR} && {CMD}"
wt.exe -w -1 new-tab -d "{DIR}" cmd /K {CMD}
start pwsh -NoExit -Command "Set-Location '{DIR}'; {CMD}"
```

**Linux Examples:**
```
gnome-terminal --working-directory="{DIR}" -- bash -c "{CMD}; exec bash"
konsole --workdir "{DIR}" --noclose -e {CMD}
xterm -e "cd {DIR} && {CMD}; exec bash"
```

#### Claude Code Command
- Default: `claude-code`
- Can be changed to `npx claude-code` or a full path if needed

#### Additional Arguments
- Optional arguments passed to Claude Code
- Example: `--verbose`, `--model sonnet`

### Reset to Defaults

Click the "Reset" button in settings to restore platform-specific defaults.

## Troubleshooting

### "Claude Code not found" error

**Solution:**
- Ensure Claude Code is installed: `npm install -g @anthropic-ai/claude-code`
- Verify it's in your PATH: `which claude-code` (macOS/Linux) or `where claude-code` (Windows)
- Try using the full path in settings: `/usr/local/bin/claude-code`

### "Permission denied" error

**Solution:**
- On **macOS**: Grant Automation permissions to Obsidian in System Preferences → Security & Privacy → Privacy → Automation
- On **Linux**: Ensure your terminal application is executable: `chmod +x /usr/bin/gnome-terminal`
- On **Windows**: Run Obsidian as administrator if needed

### Context menu item doesn't appear

**Solution:**
- Ensure the file is named exactly **CLAUDE.md** (case-insensitive)
- The file must be a file, not a folder
- Reload Obsidian (Ctrl/Cmd + R)

### Wrong working directory

**Solution:**
- Verify the terminal command contains `{DIR}` placeholder
- Check that your terminal application supports working directory specification
- Try using the "Reset to defaults" button in settings

### Terminal doesn't open

**Solution:**
- Test the terminal command manually in your system terminal
- Ensure the terminal application is installed and accessible
- Check Obsidian's Developer Console (Ctrl/Cmd + Shift + I) for error messages

## Platform-Specific Notes

### macOS
- Default terminal: **Terminal.app**
- Alternative: **iTerm2** (recommended for better customization)
- First launch may prompt for Automation permissions

### Windows
- Default terminal: **cmd.exe**
- Alternatives: **Windows Terminal**, **PowerShell**
- Paths with spaces are automatically handled

### Linux
- Default terminal: **gnome-terminal** (GNOME)
- Alternatives: **konsole** (KDE), **xfce4-terminal** (XFCE), **xterm** (universal)
- Terminal detection is automatic based on desktop environment

## Development

### Building from Source

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

This starts esbuild in watch mode for automatic rebuilding.

## License

MIT License - See [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/obsidian-cc-launch/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/obsidian-cc-launch/discussions)

## Credits

Created with ❤️ for the Obsidian and Claude Code communities.
