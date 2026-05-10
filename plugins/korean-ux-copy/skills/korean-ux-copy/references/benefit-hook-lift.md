# Benefit Hook Lift

Use this pass after UX Copy Lift and before provider rewriting. The goal is Korean product copy that is still safe, but no longer flat. The default rewrite should be the single best conversion-safe sentence, not a pile of variants.

Do not imitate any specific living person's style. Use the judgment system only: observe, compress, convert features into benefits, create a hook, then inspect safety.

## Principle Kernel

This file is a judgment kernel, not an output template. The agent may use the breakdown and self-check silently, but the default product output remains one primary rewrite plus compact report fields.

Before writing, apply these principles:

1. Start from what the reader wants to know, not what the product wants to say.
2. Answer "So what is good for me?" before adding any descriptive flourish.
3. Convert feature words into felt value: less work, less uncertainty, faster start, fewer mistakes, clearer choice.
4. Remove generic praise before adding new words.
5. Replace abstract mood words with a supported scene, action, time, count, object, or visible result.
6. Keep the first mobile line understandable without surrounding context.
7. Make CTAs name the result of the click, not just the pressure to click.
8. Preserve the source claim boundary even when the hook becomes sharper.
9. Prefer short spoken Korean. If the sentence runs out of breath, split or cut it.
10. Return the strongest safe sentence, not every possible sentence.

## Default Position

Korean UX copy should not merely sound natural. For conversion surfaces, it should help the user choose, click, remember, or understand value faster.

Default output:

```txt
Rewrite: one primary hooked_safe rewrite
Copy Mode: hooked_safe|safe_plain|manual_only
Hook Labels: benefit|scene|cta|search|clarity|sensory
```

Use `hooked_safe` when the surface is meant to sell, persuade, onboard, compare, or move the user forward. Use `safe_plain` when trust, recovery, accessibility, or legal precision matters more than persuasion. Use `manual_only` for legal, privacy, refund, consent, medical, financial, or policy text.

## Surface Eligibility

Strongly apply Benefit Hook Lift:

- `hero_headline`
- `hero_subcopy`
- `button_label` for acquisition, onboarding, signup, trial, lead, or creation flows
- `feature_title`
- `feature_body`
- `pricing_copy`
- `comparison_copy`
- `seo`
- `faq` when it answers buying or adoption anxiety
- `testimonial` when evidence is bounded and already present

Apply lightly or fall back to `safe_plain`:

- `empty_state`
- `toast`
- `error_message`
- `form_helper`
- `permission`
- `destructive_confirm`
- `aria_label`
- `title_attribute`
- `alt_text`
- `legal_notice`

## Material Breakdown

Before rewriting, extract only what the source or nearby code supports. These fields are for internal reasoning by default; print them only when the user asks for a diagnostic copy-coaching view.

| Field | Question |
|---|---|
| `identity` | What is this product, feature, or content surface? |
| `function` | What does it do? |
| `scene` | When would the user actually need it? |
| `practicalBenefit` | What practical effort, time, uncertainty, or risk is reduced? |
| `emotionalShift` | What changes emotionally: less stuck, less awkward, more ready, more confident? |
| `beforeAfter` | What is different before and after using it? |
| `mobileWords` | Which 1-3 words must survive on a small screen? |
| `cliches` | Which generic phrases should be removed? |
| `specificDetail` | Which concrete detail makes this copy credible? |
| `readerQuestion` | What is the user silently asking? |
| `soWhat` | Answer "So what is good for me?" in plain Korean. |

## Benefit Conversion

Convert feature to felt value before writing:

```txt
function -> felt effect -> emotional shift -> reason to act
```

Examples:

```txt
review draft generation -> first reply shape appears -> less stuck before a sensitive review -> start from a draft, not a blank box
```

```txt
menu/allergen management -> same wording in one place -> fewer inconsistent staff explanations -> keep menu guidance aligned
```

## Cliche Guard

Treat these phrases as weak until made concrete:

- 특별한 경험
- 감성적인 공간
- 일상의 여유
- 작은 행복
- 더 나은 라이프스타일
- 프리미엄
- 차별화된
- 감각적인
- 트렌디한
- 진정성 있는
- 혁신적인
- 새로운 기준
- 여정
- 솔루션
- 경험을 제공합니다
- 비즈니스 성장
- 생산성 극대화
- 지금 바로 시작하세요

Replace them with a scene, user action, concrete detail, time saved, fewer steps, lower awkwardness, or clearer next action.

## Hook Patterns

Use one pattern that fits the surface. Do not force all patterns at once.

| Pattern | Use When | Example Direction |
|---|---|---|
| `benefit` | value needs to be understood fast | "리뷰 답변, 매장 말투로 초안부터 잡아보세요" |
| `scene` | the pain is easy to picture | "답변이 밀린 리뷰부터 초안으로 정리하세요" |
| `cta` | the surface is a button | "매장 말투로 초안 만들기" |
| `search` | SEO or page title needs literal intent | "식당 메뉴 설명과 알레르기 안내 관리 도구" |
| `contrast` | before/after tension is clear | "직원마다 달라지던 메뉴 설명을 한 화면에 맞춥니다" |
| `clarity` | trust or accessibility matters | "리뷰 답변 초안을 준비하세요" |
| `sensory` | a physical or emotional moment is supported | "빈 답변창 앞에서 멈추지 않게" |

## Title And CTA Rules

- Lead with the user's benefit, not the product's greatness.
- Keep the first screen understandable without context.
- Prefer short spoken Korean; split long breath lines.
- Use easy middle-school-level words.
- Make the next action visible.
- Do not add unsupported words such as `무료`, `무제한`, `보장`, `연동`, `자동`, `실시간`, or `고객지원`.

## Single-Rewrite Rule

Default to one rewrite:

```txt
Rewrite: "리뷰 답변, 매장 말투로 초안부터 잡아보세요"
Copy Mode: hooked_safe
Hook Labels: benefit,cta,clarity
```

Only provide multiple variants when the user explicitly asks for options, brainstorming, naming, landing-page copy, ads, or social copy.

## Automatic Application

The normal batch rewrite script applies this pass automatically:

1. infer `copyMode` from the UI role when the caller does not provide it,
2. pass `copyMode`, supported benefit, and scene into the Kanana request,
3. run provider candidate gates,
4. if an accepted `hooked_safe` provider rewrite is safe but flat, build one agent-side Benefit Hook candidate,
5. run claim-boundary checks again,
6. replace the primary `Rewrite` only when the Benefit Hook candidate scores higher.

When the script replaces a provider rewrite, it keeps the provider output as `providerRewrite`, sets `benefitHookApplied: true`, adds `hookLabels`, and lowers the patch risk to `review_recommended` unless the item is already `manual_only`.

Do not apply this automatic lift to `safe_plain` or `manual_only` items.

When Kanana is unavailable, apply the same pass inside the current execution LLM and label the result `Provider Status: llm_fallback`. The fallback may approximate Kanana-style Korean refinement, but it must keep the same claim gate and conservative risk labels.

## Self-Check

Before returning a rewrite, check:

- Does the benefit appear before the product self-praise?
- Did the copy remove generic mood words?
- Is there a concrete scene, action, or felt change?
- Can a mobile reader understand it in one glance?
- Is it shorter than the original when possible?
- Does it preserve placeholders, product scope, and tone?
- Did it avoid unsupported claims?
- Would it still fit the exact UI surface?

## Examples

```txt
Original: "지금 바로 시작하세요"
Weak rewrite: "답변 초안 만들기"
Benefit Hook rewrite: "매장 말투로 초안 만들기"
Copy Mode: hooked_safe
Hook Labels: benefit,cta
```

```txt
Original: "혁신적인 AI 솔루션으로 매장의 성장을 시작하세요."
Weak rewrite: "리뷰 답변 초안을 빠르게 준비하세요."
Benefit Hook rewrite: "리뷰 답변, 매장 말투로 초안부터 잡아보세요."
Copy Mode: hooked_safe
Hook Labels: benefit,scene,clarity
```

```txt
Original: "오류가 발생했습니다."
Benefit Hook rewrite: not applicable
Rewrite: "저장하지 못했어요. 잠시 후 다시 시도해 주세요."
Copy Mode: safe_plain
Hook Labels: clarity
```
