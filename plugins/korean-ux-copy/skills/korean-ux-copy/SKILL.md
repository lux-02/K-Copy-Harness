---
name: korean-ux-copy
description: Use when auditing or rewriting Korean user-facing UX copy in a codebase, especially AI-generated/vibe-coded apps. Triggers for Korean copy review, UX copy lift, AI-like Korean, awkward landing copy, CTA/error/empty-state wording, conversion-safe Korean copy, Kanana-assisted rewrite, or safe dry-run copy patches. Do not use for general translation, non-Korean copy, or legal rewriting without explicit review.
---

# Korean UX Copy

## Goal

Audit user-facing Korean text in a project, diagnose AI-like or awkward UX copy, improve the copy for its exact UI surface, and propose one conversion-safe Korean rewrite by default. The recommended flow is deterministic diagnosis, UX Copy Lift, Benefit Hook Lift as an internal copy judgment layer, optional Kanana-assisted Korean refinement for high-impact copy, runtime LLM fallback when Kanana is unavailable, and agent-side safety review. If Kanana is not configured, continue with deterministic diagnosis and best-effort `llm_fallback` rewrites instead of blocking the audit.

## Workflow

1. Determine scope from the user request. If unclear, default to user-facing copy in source/docs/i18n files.
2. Inspect candidate files with `rg`, excluding generated, dependency, secret, and build output.
3. Load references only as needed:
   - Korean copy rules: `references/korean-copy-rules.md`
   - UX Copy Lift: `references/ux-copy-lift.md`
   - Benefit Hook Lift: `references/benefit-hook-lift.md`
   - Kanana setup and scripts: `references/kanana-provider.md`
   - Patch safety: `references/safety-and-patching.md`
4. Identify visible Korean copy targets: JSX/HTML text, labels, placeholders, aria/title/alt, toast/modal/error strings, i18n values, Markdown prose, and metadata.
5. Diagnose by role and Korean naturalness: hero/CTA, button, error, empty state, form helper, toast, docs, SEO, legal/policy.
6. Run the UX Copy Lift pass before provider rewriting. For each meaningful target, record `uxGap`, `userState`, `nextAction`, and `liftReason` using `references/ux-copy-lift.md`. This is a code-surface pass, not a generic UX writing or marketing copy sweep.
7. Run the Benefit Hook Lift pass for conversion-eligible surfaces using `references/benefit-hook-lift.md`. Treat it as a hidden thinking kernel, not a required public output template: identify the target, supported scene, user benefit, before/after change, mobile words, weak cliches, and "so what is good for me?" answer before writing. Default to one `hooked_safe` rewrite for hero, CTA, feature, pricing, onboarding, SEO, comparison, and FAQ surfaces. Fall back to `safe_plain` for error, toast, empty state, aria/title/alt, legal/policy, destructive, permission, medical, financial, or high-stakes surfaces. The batch rewrite script applies this automatically to accepted provider output when a safe rewrite is still too flat.
8. If Kanana-assisted rewrite is requested or useful, collect all selected Korean copy targets first. Prioritize high-impact or high-risk targets and prefer one batch request with `scripts/kanana-rewrite-batch.mjs`; do not call Kanana once per phrase unless the user explicitly asks.
9. Keep the batch compact. The rewrite script sends at most 12 items by default; if more targets exist, audit all targets deterministically and send only the top-priority set to Kanana.
10. Run `scripts/kanana-ensure.mjs` before the batch call. It should pass immediately when configured; if not configured and the shell is interactive, it starts one-time setup.
11. If Kanana is unavailable, use the current execution LLM as `llm_fallback` for selected rewrite targets. The fallback must use the same compact target fields, Benefit Hook principles, provider prompt constraints, protected-token rules, and claim gate. Label the provider status as `llm_fallback`, never imply Kanana was used, and keep risk at `review_recommended` unless the edit is a trivial deterministic copy-only fix.
12. Do not run connection-test calls. `ensure` is local-only and does not call Kanana. The first network request should be the single batch rewrite request.
13. Treat Kanana output as advisory. The batch script applies a provider candidate gate; if an item is marked `rejected_claim_boundary`, do not use the provider rewrite. If the script returns `parseStatus: raw_text` or `needsCodexPostprocess: true`, inspect `rawText`, extract only safe rewrite candidates yourself, and mark them `review_recommended` unless the edit is obviously copy-only and meaning-preserving.
14. Produce a concise but itemized report with original text, issue, UX gap, lift reason, primary rewrite, copy mode, hook labels, provider status, risk label, and file reference. Do not return only a high-level summary unless the user explicitly asks for a summary.
15. For edits, make a dry-run diff first. Apply only safe copy-only changes when the user explicitly asked to fix/apply.

## Commands

Resolve script paths relative to this skill directory.

```bash
node scripts/kanana-ensure.mjs
node scripts/kanana-setup.mjs
node scripts/kanana-rewrite-batch.mjs --input copy-targets.json
node scripts/kanana-rewrite-batch.mjs --input copy-targets.json --max-items 12
```

`kanana-rewrite-batch.mjs` is the only script that should call Kanana during normal use. Collect targets first, then spend one request.

When Kanana is missing, keep working in deterministic plus `llm_fallback` mode. Mention that Kanana can improve conversion-safe rewrite candidates for hero, SEO, pricing, FAQ, and other nuanced Korean product copy, but do not block the audit.

## Safety Defaults

- Do not read or modify `.env`, tokens, certificates, lockfiles, build output, generated files, or dependency folders.
- Do not send secrets, private user data, or full source files to Kanana.
- Do not rename variables, props, translation keys, routes, analytics events, or API contracts.
- Preserve placeholders such as `{name}`, `{{count}}`, `${value}`, `%s`, and ICU tokens.
- Do not invent evidence cues, integrations, discounts, guarantees, free plans, or support promises.
- Do not make copy more clickable by broadening product capability, changing legal meaning, or creating a stronger promise than the source can support.
- Runtime LLM fallback must run the same claim gate mentally and label conversion rewrites `review_recommended` by default.
- Legal, privacy, refund, consent, medical, financial, and policy copy is report-only unless the user explicitly asks for manual review.

## Output Shape

Prefer this compact format:

- Always include `Provider Status` when Kanana is used or requested.
- Provide one primary `Rewrite` by default. Do not output multiple variants unless the user asks for brainstorming or comparison.
- Do not expose full material breakdown, self-check lists, or multi-section copy-coaching output unless the user explicitly asks for that diagnostic view.
- Default `Rewrite` is `hooked_safe` for conversion-eligible surfaces and `safe_plain` for trust, recovery, accessibility, legal, or high-stakes surfaces.
- Include at least the top 8 findings when 8 or more meaningful issues exist.
- Do not collapse findings into aggregate counts only; counts may appear in the summary, but findings must remain itemized.
- If no meaningful issues are found, say so and include the scanned scope and provider status.

```txt
File: app/page.tsx:18
Role: hero_headline
Original: "당신의 비즈니스 여정은 여기서 시작됩니다"
Issue: Generic translated SaaS tone; vague journey metaphor.
UX Gap: Does not explain what the user can do next.
Benefit Hook: Turns a vague journey claim into a concrete first action.
Lift Reason: Replaces mood-setting copy with a specific benefit and next step.
Rewrite: "필요한 기능만 골라 바로 시작하세요"
Copy Mode: hooked_safe|safe_plain|manual_only
Hook Labels: benefit|scene|cta|search|clarity|sensory
Provider: deterministic|llm_fallback|kanana_parsed|kanana_lines|kanana_lines_partial|kanana_raw_text_unusable|provider_http_error|llm_fallback_required
Provider Candidate: accepted|llm_fallback_claim_checked|rejected_claim_boundary|rejected_unmatched_id
Benefit Hook Applied: true|false
Risk: review_recommended
```
