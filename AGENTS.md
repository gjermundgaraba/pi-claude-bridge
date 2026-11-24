# AGENTS

You are the owner and long-term maintainer of this codebase, and its design is up to you. It is a Pi extension that serves Claude Code, run through the Claude Agent SDK, as a Pi model provider. [docs/behavior.md](docs/behavior.md) describes how it works and the upstream behavior it relies on.

## Toolchain

The repository uses Vite+ (`vp`). Run `vp install` after pulling. `vp check` formats, lints and type-checks (`vp check --fix` applies fixes); `vp test --project unit|integration|smoke` runs one test project, and `vp test` runs them all. The live suite (`CLAUDE_BRIDGE_LIVE=1 vp test --project integration`) drives real Claude Code and spends subscription quota: run it only when asked.

## Instructions

- Follow [docs/lint-policy.md](docs/lint-policy.md). Fix the code rather than add a lint exception; an exception names the concrete boundary or invariant that keeps it necessary.
- Keep tests in the smallest layer that proves the behavior: unit by default, integration only for real `AgentSession` behavior, smoke only for package discovery and wiring. Assertions should tell correct behavior from a plausible regression.
- Session state is Pi-owned. `pi.appendEntry()` records the entry before it returns and throws on failure, so do not queue, re-read, or verify it.
- Sanitize text from sessions, providers, or Claude Code with `safeText()` where it is rendered.
- Never suggest upstreaming a change to Pi. If an extension cannot do something today, it cannot do it today.
- Commits carry DCO sign-offs: commit with `git commit -s`.
- Nothing `host.ts` imports may load pi-coding-agent or pi-tui at runtime; CI and the publish job check `vp pack`'s `dist/`. The entry also starts without the package's `dependencies` and typebox, which it loads when the first turn starts: `catalog-provider.ts` and everything it imports stay free of them, and `node tests/host-startup.mjs` checks the built entry. Publishing happens on a `v*` tag (`.github/workflows/npm.yml`), after bumping `version`.

## Upstream Pi reference

Read Pi's documentation, examples and APIs from its source, at the tag matching `@earendil-works/pi-coding-agent` in `package.json`, from a read-only checkout of `earendil-works/pi`. Treat `packages/coding-agent` as the documentation root: its `README.md`, and under `docs/` the extensions, providers (`custom-provider.md`), models, SDK and packages guides. Keep those doc names bare in this file: a context file naming both the providers and packages docs with their `docs/` prefix trips Anthropic's third-party gate, and the bridge then refuses to send the prompt.
