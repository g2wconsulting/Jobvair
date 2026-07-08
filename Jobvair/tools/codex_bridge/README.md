# Jobvair Codex Bridge

Local orchestration scaffold for sending implementation tasks from an OpenAI
Agents SDK planner agent to Codex CLI through Codex's stdio MCP server.

This is a developer tool only. It does not change Jobvair app behavior.

## What It Does

- Starts or connects to Codex through `codex mcp-server`.
- Gives a planner agent access to Codex MCP tools.
- Sends a Markdown task file to Codex.
- Instructs Codex to work in `C:\Users\hschu\jobvair`.
- Instructs Codex to run `npm.cmd run build`.
- Returns:
  - summary
  - changed files
  - build result
  - next action

The bridge does not commit, push, create pull requests, or modify production
data.

## Requirements

- Python 3.11+
- Codex CLI installed and logged in
- OpenAI API key available to the planner process
- Node dependencies already installed in the Jobvair repo

Install Python dependencies:

```powershell
cd C:\Users\hschu\jobvair\tools\codex_bridge
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PowerShell blocks venv activation, run:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Set your OpenAI API key for the current terminal:

```powershell
$env:OPENAI_API_KEY = "your-api-key"
```

Do not commit API keys or secrets.

## Usage

Run the included read-only example:

```powershell
cd C:\Users\hschu\jobvair
python tools\codex_bridge\bridge.py --task tools\codex_bridge\tasks\example_task.md
```

Use another task file:

```powershell
python tools\codex_bridge\bridge.py --task C:\path\to\task.md
```

If `codex` is not on PATH, pass the command explicitly:

```powershell
python tools\codex_bridge\bridge.py `
  --codex-command C:\Users\hschu\AppData\Roaming\npm\codex.cmd `
  --task tools\codex_bridge\tasks\example_task.md
```

Optional Codex config overrides can be passed through:

```powershell
python tools\codex_bridge\bridge.py `
  --codex-config "sandbox_mode=\"workspace-write\"" `
  --task tools\codex_bridge\tasks\example_task.md
```

## Safe Usage

Before running a task:

1. Make sure the task file clearly says what Codex may change.
2. Keep tasks small and reviewable.
3. Keep `git status` clean or understand existing changes.
4. Do not include secrets in task files.
5. Review `git diff` after every run.
6. Commit manually only after you review the output.

Recommended task language:

```text
Do not commit.
Do not push.
Do not create pull requests.
Do not modify production data.
Run npm.cmd run build.
Return changed files, build result, and next action.
```

## How It Works

The bridge uses the OpenAI Agents SDK with `MCPServerStdio`, following the
official Agents SDK MCP stdio pattern:

```python
async with MCPServerStdio(
    name="Codex MCP",
    params={
        "command": "codex.cmd",
        "args": ["mcp-server"],
        "cwd": "C:\\Users\\hschu\\jobvair",
    },
) as codex_server:
    ...
```

The planner agent receives the task, uses Codex MCP tools to delegate work, and
asks Codex to run `npm.cmd run build` before returning a summary.

## Troubleshooting

If Codex is not found:

```powershell
where.exe codex
codex --help
codex mcp-server --help
```

If the planner fails immediately:

- confirm `OPENAI_API_KEY` is set
- confirm `pip install -r requirements.txt` succeeded
- confirm Codex CLI is logged in

If the bridge appears to hang:

- reduce the task scope
- lower `--max-turns`
- run Codex manually once to confirm authentication

