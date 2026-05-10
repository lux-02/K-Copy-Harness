# UX Copy Lift

Use this pass after Korean naturalness diagnosis and before Benefit Hook Lift or Kanana rewriting. The goal is not prettier Korean. The goal is Korean product copy that fits the exact code surface where it appears.

This is not a general UX writing checklist and not a marketing copy-editing sweep. Start from the component role, surrounding source, and current product behavior. Improve only what can be justified from the codebase. For conversion surfaces, run `benefit-hook-lift.md` after this pass to make the primary rewrite more benefit-led without broadening product claims.

## Surface Checks

Check each meaningful user-facing string against these code-surface checks:

| Check | Question | Good Direction |
|---|---|---|
| `surface_job` | What job does this UI surface perform? | name the state, task, result, or choice |
| `next_step` | What can the user infer or do after reading it? | expose the next action when the UI expects one |
| `context_fit` | Does the wording match nearby code and product behavior? | keep claims within what the project actually supports |
| `claim_boundary` | Does the text promise more than the app can prove? | remove guarantees, superlatives, and unsupported integrations |
| `recovery_path` | If something is blocked or empty, is recovery clear? | say what failed, what is missing, or what to try next |
| `standalone_meaning` | Would the copy still make sense in a screen reader, toast, or SVG? | avoid labels that rely only on visual placement |

## Report Fields

When a target has a UX copy issue, include:

```txt
UX Gap: what makes the string less helpful for the user
User State: first_run|routine|blocked|recovering|confirming|high_stakes
Next Action: the action the user should understand or take
Lift Reason: why the rewrite improves product usability
```

## Role Patterns

| Role | Pattern | Avoid |
|---|---|---|
| `button_label` | click result in a short Korean phrase | "확인", "시작하기" when the result is unclear |
| `link_text` | destination, document, or setting name | "여기", "자세히" alone |
| `error_message` | failed action plus a practical recovery cue | blame, raw codes, or a dead end |
| `empty_state` | absent object plus the first useful creation/search action | "데이터가 없습니다" alone |
| `form_label` | stable field name that survives without placeholder text | placeholder-only meaning |
| `form_helper` | input condition, format, or reason | marketing claims in form help |
| `toast` | single event result: saved, failed, copied, queued, sent | mixing completion with a sales CTA |
| `aria_label` | semantic meaning for assistive tech | visual asset labels like "아바타" |
| `title_attribute` | destination or action users can recognize | "링크 텍스트" or builder notes |
| `svg_metric_value` | explicitly illustrative value or no number | mock numbers that look like real usage evidence |
| `permission` | feature value and requested access in the same flow | permission asks before value is visible |
| `destructive_confirm` | exact loss, reversibility, and target object | soft or playful wording around data loss |
| `pricing_copy` | plan fit, limit, or included usage | vague productivity promises |
| `testimonial` | bounded user experience | guaranteed or universal outcomes |
| `seo` | product category plus literal use case | keyword stuffing or inflated claims |

## Korean UX Defaults

- Prefer calm directness over empty excitement. Conversion surfaces may be sharper and more benefit-led after the Benefit Hook Lift pass, but trust and recovery surfaces stay plain.
- Prefer "화면에서 가능한 행동" over "제품이 대단한 이유".
- Use "당신" sparingly; Korean product copy often sounds better without a second-person pronoun.
- Use 해요체 only when the product voice is already casual. Do not mix 합니다체 and 해요체 in the same surface unless the project does.
- Do not add "무료", "무제한", "보장", "연동", "자동", "실시간" unless the source code or nearby copy already supports it.
- Do not flatten strong supported benefits just to sound neutral. If a surface is meant to sell or move the user forward, keep one concrete hook as long as it stays true.

## Lift Examples

```txt
Original: "오류가 발생했습니다."
UX Gap: failed action and recovery cue are unclear
Rewrite: "리뷰 답변을 저장하지 못했어요. 잠시 후 다시 시도해 주세요."
```

```txt
Original: "데이터가 없습니다."
UX Gap: empty state names absence but not the first action
Rewrite: "아직 등록된 리뷰가 없어요. 첫 리뷰를 추가해 보세요."
```

```txt
Original: "지금 바로 시작하세요"
UX Gap: CTA hides the result of the click
Rewrite: "답변 초안 만들기"
```

```txt
Original: "단 하나의 솔루션으로 모든 문제를 해결합니다."
UX Gap: universal claim exceeds what the interface can prove
Rewrite: "반복되는 답변 작성을 줄이고 중요한 리뷰부터 확인할 수 있어요."
```

## Safety Rules

- UX lift cannot broaden product capability.
- Credibility copy must use evidence already present in the project.
- Static demo images and fixture metrics should be marked as examples unless real evidence exists.
- If the better UX copy requires product knowledge that is not in the codebase, report the missing context instead of inventing a rewrite.
- Mark legal, financial, medical, privacy, refund, and consent copy as `manual_only`.
