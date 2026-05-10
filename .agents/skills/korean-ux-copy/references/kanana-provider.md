# Kanana Provider

Use Kanana as an optional Korean UX copy refinement layer, not as an uncontrolled generator. The skill must remain useful without Kanana: deterministic diagnosis, KUX rules, UX Copy Lift, and safe dry-run reports still run without provider access.

This project is not affiliated with, endorsed by, or sponsored by Kakao. Kanana is used only as an optional provider integration.

## Configuration

The scripts read provider settings in this order:

1. `KOREAN_UX_COPY_KANANA_API_KEY`
2. `KANANA_API_KEY`
3. `.env.korean-ux-copy.local` in the current project
4. `~/.config/korean-ux-copy/secrets.env`
5. legacy fallback: `K_COPY_HARNESS_KANANA_API_KEY`, `.env.k-copy-harness.local`, `~/.config/k-copy-harness/secrets.env`

Do not read a project `.env` file by default.

## Setup

Use the ensure script before Kanana-assisted rewrites:

```bash
node scripts/kanana-ensure.mjs
```

It passes immediately when a key is already configured. If the key is missing and the shell is interactive, it starts one-time setup. If the shell is not interactive, it prints the setup command for the user. Missing Kanana config should not block deterministic audits.

Use the setup script directly when you want to configure the key yourself:

```bash
node scripts/kanana-setup.mjs
```

It asks for the API key using hidden terminal input, writes `~/.config/korean-ux-copy/secrets.env`, sets restrictive permissions, and never prints the key.

Optional:

```bash
KANANA_BASE_URL="https://kanana-o.a2s-endpoint.kr-central-2.kakaocloud.com/v1"
KANANA_MODEL="kanana-o"
```

## Skill Scripts

Run from the skill directory:

```bash
node scripts/kanana-ensure.mjs
node scripts/kanana-setup.mjs
node scripts/kanana-rewrite-batch.mjs --input copy-targets.json
```

The scripts never print the API key.

`kanana-ensure.mjs` is local-only and does not call Kanana. `kanana-rewrite-batch.mjs` is the only normal-use script that sends a Kanana API request.

## Batch Policy

To conserve quota, collect all Korean copy targets first, diagnose deterministically, run the UX Copy Lift pass, then send only the highest-priority rewrite targets to Kanana.

Default policy:

- one Kanana request per user-requested rewrite attempt,
- no doctor, smoke, or connection-test API calls,
- at most 12 items per batch by default,
- if more than 12 targets exist, send high-impact items first and handle the rest deterministically,
- keep each item compact; do not send full source files.

Prefer deterministic handling for:

- internal placeholder cleanup such as `링크 텍스트`, `아바타`, `fixture`,
- obvious title/aria wording fixes,
- simple empty-state or button-label repairs with established local wording,
- static SVG labels where the safe fix is only adding `예시`.

Prefer Kanana for:

- SEO, hero, pricing, and comparison copy with claim risk,
- channel claims such as `연결`, `관리 가능`, `네이버`, `카카오`, `배달앱`,
- AI/runtime claims such as `AI 답변`, `자동 생성`, `자동 분석`,
- Korean rewrites where preserving nuance matters more than applying a known rule.

User-facing positioning:

```txt
Kanana is not required to find the problem.
Kanana is useful when the fix needs Korean product copy taste.
```

In Korean:

```txt
문제를 찾는 데 Kanana가 필요한 것은 아닙니다.
하지만 고치는 문장을 한국 서비스답게 다듬는 데 Kanana가 유용합니다.
```

## Batch Rewrite

To conserve quota, collect all Korean copy targets and send them in one request:

```json
{
  "items": [
    {
      "id": "app.py:230",
      "text": "페이지 단위로 재배열하는 PDF 작업대",
      "role": "hero_headline",
      "issue": "작업대가 약간 번역투이고 제품 기능이 즉시 안 잡힘",
      "uxGap": "제품 기능과 다음 행동이 즉시 잡히지 않음",
      "userState": "first_run",
      "nextAction": "PDF 페이지 순서를 바꾸는 작업 시작",
      "protectedTokens": []
    },
    {
      "id": "app.py:462",
      "text": "문서를 페이지 편집 캔버스로 펼치는 중입니다...",
      "role": "toast",
      "issue": "처리 중 문구에 비유가 들어가 있음",
      "uxGap": "현재 처리 상태가 은유로 표현됨",
      "userState": "routine",
      "nextAction": "로딩 완료를 기다림",
      "protectedTokens": []
    }
  ]
}
```

Run:

```bash
node scripts/kanana-rewrite-batch.mjs --input copy-targets.json
node scripts/kanana-rewrite-batch.mjs --input copy-targets.json --max-items 12
```

The script makes one Kanana API request for the whole input and returns:

```json
{
  "ok": true,
  "requestCount": 1,
  "itemsRequested": 2,
  "itemsSent": 2,
  "itemsSkippedByLimit": 0,
  "parseStatus": "parsed_json|parsed_lines|raw_text",
  "providerStatus": "kanana_parsed|kanana_lines|kanana_lines_partial|kanana_raw_text_unusable",
  "needsCodexPostprocess": false,
  "items": []
}
```

## Response Handling

Send one Kanana request per rewrite attempt. Do not retry just to force JSON shape.

The rewrite script always wraps a successful HTTP response in a machine-readable envelope:

```json
{
  "ok": true,
  "parseStatus": "parsed_json|parsed_lines|raw_text",
  "providerStatus": "kanana_parsed|kanana_lines|kanana_lines_partial|kanana_raw_text_unusable",
  "needsCodexPostprocess": true,
  "items": [],
  "rawText": "Kanana's original response"
}
```

Kanana is asked for a compact line response by default because it is easier to recover when the provider truncates output:

```txt
id<TAB>risk<TAB>rewrite
```

Example:

```txt
src/app/page.tsx:24	safe_auto	리뷰 답변 초안 만들기
src/app/page.tsx:131	review_recommended	네이버·카카오 리뷰 문구 입력 지원
```

If `parseStatus` is `raw_text`, the agent should:

1. read `rawText`,
2. extract a candidate only when the item id or original text is clearly matched,
3. preserve placeholders manually,
4. mark the suggestion `review_recommended` by default,
5. use `safe_auto` only after comparing source, original, rewrite, and placeholders,
6. skip patching if the raw response changes product meaning or includes unsupported claims.

## Provider Candidate Gate

Parsed provider items are still advisory. Before using them, reject provider candidates that:

- keep claim-boundary terms that the original diagnosis was trying to remove,
- add stronger terms not present in the source, such as `무료`, `무제한`, `보장`, `연동`, `자동`, `실시간`, or `고객지원`,
- keep `연결`, `연동`, or `관리 가능` for `KUX-007`,
- keep `AI 답변`, `AI가`, `자동 생성`, or `자동 분석` for `KUX-008`,
- keep `넉넉`, `대량`, `충분한 사용량`, or `무제한` for `KUX-010`.

Rejected provider candidates should be labeled:

```txt
Provider Candidate: rejected_claim_boundary
Risk: review_recommended
```

Use deterministic rewrites or report-only handling for rejected items.

Provider status labels:

| Label | Meaning |
|---|---|
| `deterministic` | no provider candidate used |
| `kanana_parsed` | JSON response parsed successfully |
| `kanana_lines` | line protocol parsed for every sent item |
| `kanana_lines_partial` | line protocol parsed for some sent items; missing items fall back to deterministic/report-only |
| `kanana_raw_text_unusable` | response could not be safely matched to items |
| `provider_http_error` | provider returned a non-2xx response |

## Provider Prompt Constraints

Kanana requests should include:

- original text,
- UI role,
- issue summary,
- UX gap,
- user state,
- next action,
- protected tokens,
- tone instruction,
- line response requirement.

Hard constraints:

- preserve placeholders exactly,
- do not add product claims,
- do not change legal meaning,
- do not invent proof, integrations, discounts, free plans, guarantees, or support promises,
- return a warning if uncertain,
- rewrite only the Korean copy, not code.

## Fallback

If Kanana is unavailable:

1. continue deterministic diagnosis,
2. mark provider status as unavailable,
3. do not invent provider-assisted output,
4. suggest checking setup with `kanana-ensure.mjs`.
