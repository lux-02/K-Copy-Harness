# Submission Checklist

This package is prepared as a dual Codex and Claude Code plugin.

## Current Package

```txt
plugins/korean-ux-copy/
  .codex-plugin/plugin.json
  .claude-plugin/plugin.json
  skills/korean-ux-copy/
  assets/
  README.md
  LICENSE
```

Root marketplace manifests:

```txt
.agents/plugins/marketplace.json
.claude-plugin/marketplace.json
```

## Validate Before Release

Run from the repository root:

```bash
python3 /Users/lux/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/korean-ux-copy/skills/korean-ux-copy
node --check plugins/korean-ux-copy/skills/korean-ux-copy/scripts/kanana-common.mjs
node --check plugins/korean-ux-copy/skills/korean-ux-copy/scripts/kanana-ensure.mjs
node --check plugins/korean-ux-copy/skills/korean-ux-copy/scripts/kanana-rewrite-batch.mjs
node --check plugins/korean-ux-copy/skills/korean-ux-copy/scripts/kanana-setup.mjs
claude plugin validate .
claude plugin validate plugins/korean-ux-copy
```

## Local Install Tests

Codex marketplace test:

```bash
codex plugin marketplace add .
```

Claude marketplace test:

```bash
claude plugin marketplace add ./ --scope local
claude plugin install korean-ux-copy@korean-ux-copy-marketplace --scope local
claude plugin list
```

Claude direct plugin test:

```bash
claude --plugin-dir ./plugins/korean-ux-copy
```

## Release Steps

1. Commit and push the plugin package.
2. Confirm the repository is public.
3. Run the validation commands above.
4. Create a release tag after the manifest version is final.
5. Submit the public GitHub repository through the Claude plugin submission flow.

## Submission Notes

- The plugin is not affiliated with Kakao.
- Kanana is optional and configured locally by the user.
- No API keys, `.env` files, or private provider data are included.
- The plugin should be positioned as a Korean UX copy audit and rewrite skill, not as a general translation tool.
