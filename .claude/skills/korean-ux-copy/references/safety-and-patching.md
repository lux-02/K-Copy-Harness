# Safety And Patching

## Scan Exclusions

Exclude by default:

```txt
node_modules
.git
.next
dist
build
coverage
vendor
*.lock
*.snap
*.min.js
*.map
.env
.env.*
```

Allow `.env.korean-ux-copy.local` only for reading Korean UX Copy provider settings. Legacy `.env.k-copy-harness.local` may be read for backward compatibility. Never print either file's contents.

## User-Facing Targets

Target:

- JSX/HTML visible text,
- button labels,
- placeholders,
- aria/title/alt text,
- toast/modal/alert/error strings,
- i18n values,
- Markdown prose,
- SEO title/description,
- public SVG text when it is visible in the UI.

Avoid:

- variable names,
- function names,
- translation keys,
- route slugs,
- analytics event names,
- tests/snapshots unless requested,
- comments and logs unless user-facing.

## Patch Gates

Apply only when:

- the user asked to fix/apply,
- replacement is copy-only,
- placeholders are preserved,
- source text still matches,
- no overlapping edits,
- legal/policy text is excluded,
- no unsupported product claims were added,
- no evidence cue, pricing claim, channel integration, or guarantee was invented,
- UX Copy Lift did not broaden the user's possible action beyond current product behavior.

Risk labels:

| Label | Meaning |
|---|---|
| `safe_auto` | small copy-only change, safe to apply when requested |
| `review_recommended` | good suggestion, human should confirm |
| `manual_only` | report only |
