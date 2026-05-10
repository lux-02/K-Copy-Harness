---
name: korean-ux-copy
description: Use when auditing or rewriting Korean user-facing UX copy in a codebase, especially AI-generated/vibe-coded apps. Triggers for Korean copy review, UX copy lift, AI-like Korean, awkward landing copy, CTA/error/empty-state wording, Kanana-assisted rewrite, or safe dry-run copy patches. Do not use for general translation, non-Korean copy, or legal rewriting without explicit review.
---

# Korean UX Copy

## Goal

Audit user-facing Korean text in a project, diagnose AI-like or awkward UX copy, improve the copy for its exact UI surface, and propose safe Korean rewrites. The recommended flow is deterministic diagnosis, Kanana-assisted Korean refinement for high-impact copy, and agent-side safety review. If Kanana is not configured, continue with deterministic diagnosis instead of blocking the audit.

## Workflow

1. Determine scope from the user request. If unclear, default to user-facing copy in source/docs/i18n files.
2. Inspect candidate files with `rg`, excluding generated, dependency, secret, and build output.
3. Load references only as needed:
   - Korean copy rules: `references/korean-copy-rules.md`
   - UX Copy Lift: `references/ux-copy-lift.md`
   - Kanana setup and scripts: `references/kanana-provider.md`
   - Patch safety: `references/safety-and-patching.md`
4. Identify visible Korean copy targets: JSX/HTML text, labels, placeholders, aria/title/alt, toast/modal/error strings, i18n values, Markdown prose, and metadata.
5. Diagnose by role and Korean naturalness: hero/CTA, button, error, empty state, form helper, toast, docs, SEO, legal/policy.
6. Run the UX Copy Lift pass before provider rewriting. For each meaningful target, record `uxGap`, `userState`, `nextAction`, and `liftReason` using `references/ux-copy-lift.md`. This is a code-surface pass, not a generic UX writing or marketing copy sweep.
7. If Kanana-assisted rewrite is requested or useful, collect all selected Korean copy targets first. Prioritize high-impact or high-risk targets and prefer one batch request with `scripts/kanana-rewrite-batch.mjs`; do not call Kanana once per phrase unless the user explicitly asks.
8. Keep the batch compact. The rewrite script sends at most 12 items by default; if more targets exist, audit all targets deterministically and send only the top-priority set to Kanana.
9. Run `scripts/kanana-ensure.mjs` before the batch call. It should pass immediately when configured; if not configured and the shell is interactive, it starts one-time setup.
10. Do not run connection-test calls. `ensure` is local-only and does not call Kanana. The first network request should be the single batch rewrite request.
11. Treat Kanana output as advisory. The batch script applies a provider candidate gate; if an item is marked `rejected_claim_boundary`, do not use the provider rewrite. If the script returns `parseStatus: raw_text` or `needsCodexPostprocess: true`, inspect `rawText`, extract only safe rewrite candidates yourself, and mark them `review_recommended` unless the edit is obviously copy-only and meaning-preserving.
12. Produce a concise but itemized report with original text, issue, UX gap, lift reason, rewrite candidate, provider status, risk label, and file reference. Do not return only a high-level summary unless the user explicitly asks for a summary.
13. For edits, make a dry-run diff first. Apply only safe copy-only changes when the user explicitly asked to fix/apply.

## Commands

Resolve script paths relative to this skill directory.

```bash
node scripts/kanana-ensure.mjs
node scripts/kanana-setup.mjs
node scripts/kanana-rewrite-batch.mjs --input copy-targets.json
node scripts/kanana-rewrite-batch.mjs --input copy-targets.json --max-items 12
```

`kanana-rewrite-batch.mjs` is the only script that should call Kanana during normal use. Collect targets first, then spend one request.

When Kanana is missing, keep working in deterministic mode. Mention that Kanana can improve rewrite candidates for hero, SEO, pricing, FAQ, and other nuanced Korean product copy, but do not block the audit.

## Safety Defaults

- Do not read or modify `.env`, tokens, certificates, lockfiles, build output, generated files, or dependency folders.
- Do not send secrets, private user data, or full source files to Kanana.
- Do not rename variables, props, translation keys, routes, analytics events, or API contracts.
- Preserve placeholders such as `{name}`, `{{count}}`, `${value}`, `%s`, and ICU tokens.
- Do not invent evidence cues, integrations, discounts, guarantees, free plans, or support promises.
- Legal, privacy, refund, consent, medical, financial, and policy copy is report-only unless the user explicitly asks for manual review.

## Output Shape

Prefer this compact format:

- Always include `Provider Status` when Kanana is used or requested.
- Include at least the top 8 findings when 8 or more meaningful issues exist.
- Do not collapse findings into aggregate counts only; counts may appear in the summary, but findings must remain itemized.
- If no meaningful issues are found, say so and include the scanned scope and provider status.

```txt
File: app/page.tsx:18
Role: hero_headline
Original: "당신의 비즈니스 여정은 여기서 시작됩니다"
Issue: Generic translated SaaS tone; vague journey metaphor.
UX Gap: Does not explain what the user can do next.
Lift Reason: Replaces mood-setting copy with a concrete starting action.
Rewrite: "필요한 기능부터 가볍게 시작해 보세요"
Provider: deterministic|kanana_parsed|kanana_lines|kanana_lines_partial|kanana_raw_text_unusable|provider_http_error
Provider Candidate: accepted|rejected_claim_boundary|rejected_unmatched_id
Risk: review_recommended
```
