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

Allow `.env.korean-ux-copy.local` only for reading Korean UX Copy provider settings. Never print this file's contents.

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
- Benefit Hook Lift did not make the copy more clickable by adding unsupported proof, urgency, capacity, automation, integration, discount, guarantee, or support claims.
- Runtime LLM fallback candidates passed the same claim-boundary review and are labeled `llm_fallback`.
- `hooked_safe` rewrites produced by runtime LLM fallback are `review_recommended` by default; use `safe_auto` only for obvious deterministic copy-only fixes.

Risk labels:

| Label | Meaning |
|---|---|
| `safe_auto` | small copy-only change, safe to apply when requested |
| `review_recommended` | good suggestion, human should confirm |
| `manual_only` | report only |

Copy mode labels:

| Label | Meaning |
|---|---|
| `hooked_safe` | benefit-led primary rewrite for conversion surfaces; still claim-safe |
| `safe_plain` | clear, low-risk rewrite for trust, recovery, accessibility, or high-stakes surfaces |
| `manual_only` | do not patch automatically |
