# AGENTS.md

## Scope
These rules apply to `D:\GithubWorkspaceAI` and all projects created inside it, unless a child project has its own more specific `AGENTS.md`.

This directory is a multi-repo development workspace. Each first-level folder should be treated as a separate project/repository.

## Workspace Rules
- Create new projects, repos, scripts, docs, and generated files inside `D:\GithubWorkspaceAI` unless the user gives another path.
- Before editing an existing project, identify the active repo root with `git rev-parse --show-toplevel` when available.
- Do not touch sibling repos unless the user explicitly asks for cross-repo work.
- If a child repo has its own `AGENTS.md`, follow that file first and use this one as the workspace default.
- Check `git status --short` before and after code changes when working inside a git repo.

## Communication
- Reply to the user in Turkish by default.
- Keep code, comments, file names, commands, commit messages, durable docs, and technical identifiers in English unless the repo already uses Turkish.
- Keep updates short. For long tasks, report only useful checkpoints: changed, verified, failed, blocked, or next action.
- Do not paste large logs or whole files into chat. Summarize them and reference the file or command.

## Token Optimization
- Start by mapping only the relevant area with `rg --files`, `git status --short`, or a focused directory listing.
- Prefer targeted `rg` searches over broad recursive file dumps.
- Read only the files needed for the next decision.
- For large files, read focused line ranges instead of the full file.
- Avoid re-reading files or repeating context already established in the conversation.
- Run independent read-only inspections in parallel when supported.
- Keep plans brief. Use a task list only for non-trivial multi-step implementation or debugging.
- Stop expanding once the requested behavior is implemented and verified.

## Truth and Verification
- Never invent file contents, APIs, function names, schemas, config values, or test results.
- Read the actual source or run the actual command before making claims.
- If a command fails, report the meaningful error instead of hiding it.
- If verification cannot be run, say exactly why.
- Do not claim "tests pass" unless the relevant command was actually run.
- Before saying a reference, import, route, or caller is gone, verify it with `rg`.
- Mock-only checks are not enough for behavior that depends on real auth, database, browser, filesystem, network, or external services.

## Implementation Defaults
- Follow the existing repo style before adding new patterns.
- Keep edits small and scoped to the user's request.
- Prefer project-native tools, scripts, and config over ad hoc commands.
- Use structured parsers or framework APIs for structured data instead of fragile string edits.
- Do not add fake fallbacks such as bare `except`, silent `catch`, placeholder defaults, or TODO stubs presented as complete work.
- Add or update tests for bug fixes, public behavior, shared utilities, and high-risk logic.
- Remove dead code only after checking real references.

## MCP Usage
- Use the `sequential-thinking` MCP for complex planning, ambiguous debugging, multi-step architecture decisions, or tasks where careful reasoning should happen before editing.
- Keep user-facing explanations concise; summarize conclusions and next actions instead of exposing private chain-of-thought.

## Ask First
Ask before doing any of these unless the user clearly requested it:
- Adding, removing, or upgrading dependencies.
- Creating database migrations or changing schemas.
- Changing auth, permissions, sessions, billing, secrets, deployment, or destructive data behavior.
- Deleting files recursively, force-pushing, rewriting git history, or running destructive cleanup.
- Moving files across repos or doing broad formatting-only rewrites.
- Starting paid, remote, or long-running external services.

## Verification Ladder
Use the strongest practical check for the claim:
- `static`: format, lint, type check, compile check.
- `unit`: isolated tests for pure logic.
- `integration`: real project wiring, database, filesystem, API, or service boundary.
- `browser/e2e`: real user-visible app behavior.
- `live/acceptance`: real external dependency or production-like workflow.

A lower tier may support confidence, but it does not prove a higher-tier claim.

## Command Discovery
- Prefer repo-native commands found in `package.json`, `pyproject.toml`, `pytest.ini`, `Makefile`, `justfile`, `.csproj`, `go.mod`, `Cargo.toml`, or documented scripts.
- Run commands from the correct project root.
- Start with the smallest relevant verification command, then broaden only when needed.
- Do not run the same failing command repeatedly without changing the root cause.

## Common Stack Hints
- Node/TypeScript: inspect `package.json` and the lockfile; use the configured package manager.
- Python: inspect `pyproject.toml`, `requirements.txt`, `setup.cfg`, or `pytest.ini`; use configured tools such as `pytest`, `ruff`, `black`, `mypy`, or `compileall`.
- .NET: inspect `.sln` and `.csproj`; use `dotnet build` and `dotnet test`.
- Go: use focused `go test` packages or `go test ./...` when appropriate.
- Rust: use `cargo check`, `cargo test`, and `cargo fmt --check` when configured.
- Frontend UI: after meaningful UI work, run the app and verify in a browser or screenshot when possible.

## Security and Secrets
- Never commit secrets, API keys, tokens, private keys, credentials, local auth state, or real `.env` values.
- Do not paste secrets into chat, logs, docs, examples, or tests.
- Use `.env.example` with placeholders for configuration examples.
- Treat auth, tenant isolation, permissions, payment, deployment, data export, and data deletion as high-risk paths.

## Git Discipline
- Do not commit, push, rebase, amend, or tag unless the user asks.
- Stage only intended files when a commit is requested.
- Review staged diffs before committing.
- Mention unrelated dirty files in the final response instead of touching them.
- Never use `git reset --hard`, `git checkout --`, or destructive cleanup without explicit approval.

## Review Mode
When the user asks for a review:
- Lead with findings ordered by severity.
- Include file and line references.
- Focus on bugs, regressions, security, missing tests, and maintainability risks.
- Keep summaries brief and secondary.

## Final Response
- State what changed and where.
- State what was verified.
- Mention skipped verification or remaining risk plainly.
- Keep the answer concise.


