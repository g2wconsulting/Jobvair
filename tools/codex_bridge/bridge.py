"""Local ChatGPT-to-Codex bridge for Jobvair.

This script starts Codex CLI as a stdio MCP server and gives an OpenAI Agents
SDK planner agent a task to delegate to Codex. It is intentionally local-only:
it does not commit, push, open pull requests, or write outside the configured
repository unless the task itself asks Codex to edit allowed files.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import shutil
import sys
from pathlib import Path

from agents import Agent, Runner, set_default_openai_key
from agents.mcp import MCPServerStdio


DEFAULT_REPO = Path(r"C:\Users\hschu\jobvair")
DEFAULT_TASK = Path(__file__).parent / "tasks" / "example_task.md"
DEFAULT_MCP_TIMEOUT_SECONDS = 120


def find_codex_command(explicit_command: str | None) -> str:
    if explicit_command:
        return explicit_command

    for candidate in ("codex.cmd", "codex"):
        resolved = shutil.which(candidate)
        if resolved:
            return resolved

    raise RuntimeError(
        "Could not find Codex CLI on PATH. Install/login to Codex first, or pass "
        "--codex-command C:\\path\\to\\codex.cmd."
    )


def read_task(task_path: Path) -> str:
    if not task_path.exists():
        raise FileNotFoundError(f"Task file not found: {task_path}")
    return task_path.read_text(encoding="utf-8")


def build_prompt(repo_path: Path, task_text: str) -> str:
    return f"""You are a planner agent coordinating Codex through MCP.

Repository:
{repo_path}

Task for Codex:
{task_text}

Instructions:
- Send the task to Codex using the available MCP tools.
- Tell Codex to work in the repository path above.
- Let Codex edit the repository only as required by the task.
- Tell Codex to run `npm.cmd run build` after implementation or inspection.
- Do not ask Codex to commit, push, create a pull request, or modify production data.
- Ask Codex to return:
  1. summary
  2. changed files
  3. build result
  4. next action

Your final response must be concise and include the same four sections.
"""


async def run_bridge(args: argparse.Namespace) -> str:
    repo_path = Path(args.repo).resolve()
    task_path = Path(args.task).resolve()

    if not repo_path.exists():
        raise FileNotFoundError(f"Repository path not found: {repo_path}")

    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set. Set it before running the bridge.")
    set_default_openai_key(openai_api_key)

    task_text = read_task(task_path)
    codex_command = find_codex_command(args.codex_command)
    codex_args = ["mcp-server"]

    for config_override in args.codex_config:
        codex_args.extend(["--config", config_override])

    async with MCPServerStdio(
        name="Codex MCP",
        params={
            "command": codex_command,
            "args": codex_args,
            "cwd": str(repo_path),
        },
        cache_tools_list=True,
        client_session_timeout_seconds=DEFAULT_MCP_TIMEOUT_SECONDS,
    ) as codex_server:
        planner = Agent(
            name="Jobvair Codex Planner",
            model=args.model,
            instructions=(
                "You coordinate local software implementation through Codex MCP. "
                "Prefer small, safe, reviewable changes. Never commit, push, or "
                "open pull requests. Always ask Codex to run the requested build "
                "or verification command and summarize changed files."
            ),
            mcp_servers=[codex_server],
            mcp_config={
                "include_server_in_tool_names": True,
            },
        )

        result = await Runner.run(
            planner,
            build_prompt(repo_path, task_text),
            max_turns=args.max_turns,
        )
        return result.final_output


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a local planner agent that delegates a Jobvair task to Codex via MCP.",
    )
    parser.add_argument(
        "--repo",
        default=str(DEFAULT_REPO),
        help=f"Repository path. Default: {DEFAULT_REPO}",
    )
    parser.add_argument(
        "--task",
        default=str(DEFAULT_TASK),
        help=f"Markdown task file. Default: {DEFAULT_TASK}",
    )
    parser.add_argument(
        "--model",
        default="gpt-4.1",
        help="Planner model used by the OpenAI Agents SDK.",
    )
    parser.add_argument(
        "--codex-command",
        default=None,
        help="Optional explicit path to codex.cmd/codex.",
    )
    parser.add_argument(
        "--codex-config",
        action="append",
        default=[],
        help="Optional Codex CLI -c/--config override. May be repeated.",
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=24,
        help="Maximum planner-agent turns.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        output = asyncio.run(run_bridge(args))
    except KeyboardInterrupt:
        print("Bridge interrupted.", file=sys.stderr)
        return 130
    except Exception as exc:
        print(f"Bridge failed: {exc}", file=sys.stderr)
        return 1

    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
