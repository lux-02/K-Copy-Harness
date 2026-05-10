# Korean UX Copy Plugin

Korean UX Copy is a Codex and Claude Code plugin for auditing user-facing Korean copy in codebases. It finds awkward or AI-like product copy, classifies each text surface, proposes safer rewrites, and can use Kanana as a Korean rewrite provider when configured.

This plugin includes one skill:

```txt
korean-ux-copy
```

## Local Test

Codex repo marketplace:

```bash
codex plugin marketplace add .
```

Then restart Codex, open the plugin directory, choose `Korean UX Copy`, and install `korean-ux-copy`.

Claude Code direct plugin test:

```bash
claude --plugin-dir ./plugins/korean-ux-copy
```

Inside Claude Code, run:

```txt
/korean-ux-copy:korean-ux-copy 이 프로젝트의 한국어 UX 카피를 진단해줘. 파일은 수정하지 마.
```

Claude marketplace test:

```bash
claude plugin validate .
claude plugin marketplace add ./ --scope local
claude plugin install korean-ux-copy@korean-ux-copy-marketplace
```

## Kanana Setup

The skill never stores API keys in source. Run the setup script from the skill directory:

```bash
cd plugins/korean-ux-copy/skills/korean-ux-copy
node scripts/kanana-setup.mjs
node scripts/kanana-ensure.mjs
```

`kanana-ensure.mjs` is local-only and does not spend API quota. The first network request is the batch rewrite call.

## Safety

- Only user-facing Korean copy is targeted by default.
- Dry-run diffs should come before apply.
- Provider output is advisory and passes agent-side safety gates.
- Secrets, private data, build output, lockfiles, and dependency folders stay out of provider requests.

This project is not affiliated with, endorsed by, or sponsored by Kakao. When configured, Kanana is used as the Korean rewrite provider for this skill.
