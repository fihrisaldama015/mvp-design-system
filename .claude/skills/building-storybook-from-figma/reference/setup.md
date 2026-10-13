# Setup per operating system

Run `node scripts/figma/doctor.mjs` (add `--json` for machine-readable output). It checks Node, git, Python, Chrome, the receiver, the
Desktop Bridge manifest, the figma-console MCP and the skill, and prints the fix for the OS it runs on. Run it again after each fix.
*Tested on Linux only. macOS and Windows steps follow the tools' own docs and have not been run by us yet; report what breaks.*

## Steps (same everywhere, commands differ)

| # | Step | Linux | macOS | Windows (PowerShell) |
|---|---|---|---|---|
| 1 | Figma Desktop | AppImage `IliyaBrook/figma-linux` | official app | official app |
| 2 | Node 18+, git | package manager or nvm | `brew install node git` | `winget install OpenJS.NodeJS.LTS Git.Git` |
| 3 | Python 3 (receiver, image sheets) | `sudo apt install python3` | `brew install python` | `winget install Python.Python.3.12` (command is `python` or `py`, not `python3`) |
| 4 | Chrome (render check, interactions) | Chrome or Chromium | `brew install --cask google-chrome` | `winget install Google.Chrome` (Edge also works); `CHROME_PATH` overrides |
| 5 | figma-console MCP | `claude mcp add figma-console -s user -- npx -y figma-console-mcp@latest` | same | same |
| 6 | Desktop Bridge plugin | Figma: Plugins > Development > Import plugin from manifest > `~/.figma-console-mcp/plugin/manifest.json` | same | same, file at `%USERPROFILE%\.figma-console-mcp\plugin\manifest.json` |
| 7 | The skill | **Nothing to install inside this repo**: it lives in `.claude/skills/` and Claude Code loads it. To use it in another project: `cp -R .claude/skills/building-storybook-from-figma <project>/.claude/skills/` | same | `xcopy /E /I .claude\skills\building-storybook-from-figma <project>\.claude\skills\building-storybook-from-figma` |
| 8 | Receiver | `python3 scripts/figma/dumpServer.py 9232 .figma-dump` | same | `python scripts\figma\dumpServer.py 9232 .figma-dump` |
| 9 | Free a busy port | `kill $(lsof -ti :9232)` | same | `netstat -ano \| findstr :9232`, then `taskkill /PID <pid> /F` |

Start the Desktop Bridge plugin in the Figma file you work in (Plugins > Development > Figma Desktop Bridge) and leave its window open.

## Known OS differences

- `renderCheck.sh` is a bash script: on Windows run it from Git Bash or WSL (`bash scripts/figma/renderCheck.sh`).
- The skill is a real folder in the repo (no symlink), so Windows needs no admin rights. `.mcp.json` starts figma-console with `npx`; if that server fails on native Windows, register it with `claude mcp add figma-console -s user -- cmd /c npx -y figma-console-mcp@latest` (not tested by us).
- `compareSheet.py` needs Pillow (`python -m pip install pillow`); only the side-by-side images use it.
- Paths in the docs use `/`; PowerShell accepts them for `node` and `python` arguments.

## When something fails

1. `node scripts/figma/doctor.mjs`: fix the FAIL lines from top to bottom.
2. Receiver: `curl localhost:9232/ping` (Windows: `Invoke-RestMethod http://localhost:9232/ping`) must answer with the folder.
3. Plugin cannot reach the receiver: the plugin may only call `localhost:9223-9232`; check a firewall or VPN is not blocking it.
4. Still stuck: paste the doctor output to the Claude Code session; it can fix environment problems (install a tool, change a command) with the user's approval.
