# pi-claude-bridge

Uses Claude Code with your Claude subscription as a Pi model provider.

> [!CAUTION] **Experimental:** This is not a stable daily driver. Breaking changes may happen without notice, and the extension may be removed.

> [!NOTE] This started as an unofficial port of [pi-claude-bridge](https://github.com/elidickinson/pi-claude-bridge). It is not affiliated with or endorsed by Anthropic.

## Install

Run `pi install npm:@gjermundgaraba/pi-claude-bridge`, or clone this repository, run `vp install` in it, and add its directory to the `packages` in pi's `settings.json`.

## Usage

Run `/model` and pick a `claude-bridge/…` model; pi's tools, skills, and context files keep working through Claude Code.

## Use outside pi

`@gjermundgaraba/pi-claude-bridge/host` exports `createClaudeBridgeProvider()` for pi-ai hosts such as a pi-durable Harness; see [other hosts](docs/behavior.md#other-hosts).

## Requirements

A Claude Pro or Max login (Claude Code's own, or `/login claude-bridge`) or an Anthropic-compatible gateway configured in `models.json`. See [behavior and maintenance](docs/behavior.md).
