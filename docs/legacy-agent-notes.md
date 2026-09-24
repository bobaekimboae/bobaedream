# Legacy Agent Notes

These notes were moved out of `AGENTS.md` during OP-004 so the main agent guide can stay focused on active repository rules.

## Legacy Work Mode Preview Note

In ChatGPT Work Mode, older instructions said to run `sites-preview start "$PWD"`, open `http://terminal.local:4173/` in the cloud browser, keep that preview open, and ask the user to inspect it there. In Codex Desktop, older instructions said to run the local server, open the preview in the in-app browser, and provide a clickable local URL.

The current repository workflow uses local validation and GitHub Pages deployment unless the user asks for a different preview path.

## Legacy Sites Note

Older notes referenced Sites handoff requirements such as confirming `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and source `.openai/hosting.json`, then running `npm run test:sites`.

Current Pages work should follow the active validation and deployment rules in `AGENTS.md`.

## Legacy Visual Source Note

Older notes suggested using Product Design context for substantial visual changes when the source was unclear, and treating selected generated mocks as source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Keep that guidance as historical context only; user instructions and the active quick-filter specs are authoritative.
