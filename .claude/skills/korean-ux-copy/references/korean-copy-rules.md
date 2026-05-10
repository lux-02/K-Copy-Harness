# Korean UX Copy Rules

Use these rules when auditing and rewriting Korean user-facing text.

## Pattern IDs

Use these IDs in reports when helpful.

| ID | Category | Severity | Typical Evidence |
|---|---|---|---|
| `KUX-001` | AI marketing hype | S1 | 혁신적인, 세상을 바꾸는, 새로운 기준 |
| `KUX-002` | Universal or guaranteed claim | S1 | 모든 문제, 단 하나의 솔루션, 반드시 |
| `KUX-003` | Translated SaaS tone | S2 | 여정, 가능하게 합니다, 경험을 제공합니다 |
| `KUX-004` | Generic CTA pressure | S2 | 지금 바로 시작하세요, 문의하기만 반복 |
| `KUX-005` | System-centered state copy | S2 | 데이터가 없습니다, 오류가 발생했습니다 |
| `KUX-006` | Internal context exposure | S1 | fixture, 감사, 정적 상태, 실제 API 호출 없음 |
| `KUX-007` | Unsupported channel or integration claim | S1 | 네이버/카카오/배달앱 연동 when not verified |
| `KUX-008` | Unsupported AI runtime or automation claim | S1 | AI 답변, 자동 생성, 자동 분석 when runtime is static |
| `KUX-009` | Mock metric or static evidence claim | S2 | static SVG/mockup numbers shown as real metrics |
| `KUX-010` | Vague plan capacity claim | S2 | 넉넉한, 대량, 충분한 사용량 without concrete limits |

## Red Flags

Flag generic AI-like or translated SaaS copy:

- 혁신적인
- 세상을 바꾸는
- 새로운 기준을 제시합니다
- 여정이 시작됩니다
- 가능하게 합니다
- 경험을 제공합니다
- 비즈니스를 성장시키세요
- 생산성을 극대화하세요
- 단 하나의 솔루션
- 모든 문제를 해결합니다
- 지금 바로 시작하세요
- fixture
- UX copy 감사
- 정적 클라이언트 상태
- 외부 API 연결을 하지 않습니다
- 링크 텍스트
- 아바타
- 네이버 연결
- 카카오 연결
- 배달앱 관리 가능
- AI 답변
- 자동 생성
- 넉넉한 답변 생성
- 대량 생성 지원
- 충분한 사용량

## Rewrite Direction

Prefer:

- concrete product benefit,
- user action,
- calm and specific Korean,
- low-pressure CTA,
- clear next step.
- UX copy that explains state, consequence, or next action.

Avoid:

- unsupported claims,
- abstract worldview,
- excessive urgency,
- generic nouns like 솔루션/플랫폼/경험 without context.
- internal test terms in user-facing surfaces.

## Role Rules

| Role | Good Direction |
|---|---|
| `hero_headline` | concrete value, target user, no grand worldview |
| `hero_subcopy` | who benefits and how |
| `button_label` | short action phrase |
| `error_message` | calm issue + next step |
| `empty_state` | absence + next action |
| `form_helper` | input requirement, not marketing |
| `toast` | concise result or recoverable issue |
| `aria_label` | semantic purpose, not visual implementation |
| `title_attribute` | direct destination or action |
| `svg_metric_value` | mark mock numbers as examples or remove |
| `docs` | clarity over style |
| `legal_notice` | report-only unless explicit legal review |

For higher-level usability checks, load `ux-copy-lift.md`.

## Examples

```txt
지금 바로 시작하세요
-> 무료로 확인하기
```

```txt
혁신적인 AI 솔루션으로 업무를 혁신하세요.
-> 반복되는 업무를 줄이고 필요한 정보를 더 빠르게 확인하세요.
```

```txt
오류가 발생했습니다.
-> 일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.
```

```txt
데이터가 없습니다.
-> 아직 등록된 항목이 없어요. 첫 항목을 추가해 보세요.
```

```txt
가상 고객 아바타
-> 후기 작성자 프로필
```

```txt
128개
-> 예시 128개
```

```txt
넉넉한 답변 생성
-> 답변 초안 생성량 비교
```
