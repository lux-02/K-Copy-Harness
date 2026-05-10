#!/usr/bin/env node
import fs from "node:fs";
import {
  applyBenefitHookLift,
  applyProviderAcceptanceGate,
  callKanana,
  parseProviderText,
  resolveKananaConfig,
} from "./kanana-common.mjs";

function readArg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function readIntArg(name, fallback) {
  const raw = readArg(name, "");
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readStdin() {
  return fs.readFileSync(0, "utf8");
}

function normalizeInput(value) {
  const items = Array.isArray(value) ? value : value?.items;
  if (!Array.isArray(items)) {
    throw new Error("Input must be a JSON array or an object with an items array.");
  }

  return items.map((item, index) => ({
    id: String(item.id ?? `item-${index + 1}`),
    text: String(item.text ?? ""),
    role: String(item.role ?? "unknown"),
    issue: String(item.issue ?? ""),
    uxGap: String(item.uxGap ?? ""),
    userState: String(item.userState ?? ""),
    nextAction: String(item.nextAction ?? ""),
    copyMode: normalizeCopyMode(item.copyMode, item.role),
    benefit: String(item.benefit ?? item.practicalBenefit ?? ""),
    scene: String(item.scene ?? ""),
    protectedTokens: Array.isArray(item.protectedTokens) ? item.protectedTokens.map(String) : [],
  })).filter((item) => item.text.trim().length > 0);
}

function normalizeCopyMode(copyMode, role) {
  const raw = String(copyMode ?? "").trim();
  if (["hooked_safe", "safe_plain", "manual_only"].includes(raw)) return raw;

  const conversionRoles = new Set([
    "hero_headline",
    "hero_subcopy",
    "button_label",
    "feature_title",
    "feature_body",
    "pricing_copy",
    "comparison_copy",
    "seo",
    "faq",
    "testimonial",
  ]);
  const plainRoles = new Set([
    "error_message",
    "empty_state",
    "toast",
    "form_helper",
    "permission",
    "destructive_confirm",
    "aria_label",
    "title_attribute",
    "alt_text",
    "legal_notice",
  ]);

  const roleName = String(role ?? "");
  if (plainRoles.has(roleName)) return roleName === "legal_notice" ? "manual_only" : "safe_plain";
  return conversionRoles.has(roleName) ? "hooked_safe" : "safe_plain";
}

const inputPath = readArg("input");
const maxItems = readIntArg("max-items", 12);
const rawInput = inputPath ? fs.readFileSync(inputPath, "utf8") : readStdin();

if (!rawInput.trim()) {
  console.error(`Usage:
  node scripts/kanana-rewrite-batch.mjs --input copy-targets.json
  cat copy-targets.json | node scripts/kanana-rewrite-batch.mjs

Input shape:
{
  "items": [
    {
      "id": "app.py:230",
      "text": "지금 바로 시작하세요",
      "role": "button_label",
      "issue": "CTA pressure",
      "uxGap": "Action after click is unclear",
      "userState": "first_run",
      "nextAction": "Create a draft answer",
      "copyMode": "hooked_safe",
      "benefit": "Start from a store-tone reply draft",
      "scene": "Owner needs to answer reviews without staring at a blank box",
      "protectedTokens": []
    }
  ]
}`);
  process.exit(1);
}

let items;
try {
  items = normalizeInput(JSON.parse(rawInput));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error?.message || String(error) }, null, 2));
  process.exit(1);
}

if (items.length === 0) {
  console.error(JSON.stringify({ ok: false, error: "No non-empty text items found." }, null, 2));
  process.exit(1);
}

const config = resolveKananaConfig();
if (!config.apiKey) {
  console.error(JSON.stringify({
    ok: false,
    provider: "kanana",
    error: "missing_api_key",
    providerStatus: "llm_fallback_required",
    fallback: "Use the current execution LLM with the same target fields, Benefit Hook principles, protected-token rules, and claim gate. Label output Provider Status as llm_fallback.",
    itemsRequested: items.length,
    maxItems,
    itemsSent: 0,
    itemsSkippedByLimit: Math.max(0, items.length - maxItems),
  }, null, 2));
  process.exit(2);
}

const itemsForRequest = items.slice(0, maxItems);
const skippedItems = items.slice(maxItems);

const compactItems = itemsForRequest.map((item) => ({
  id: item.id,
  text: item.text,
  role: item.role,
  issue: item.issue,
  uxGap: item.uxGap,
  userState: item.userState,
  nextAction: item.nextAction,
  copyMode: item.copyMode,
  benefit: item.benefit,
  scene: item.scene,
  protectedTokens: item.protectedTokens,
}));

const prompt = `당신은 소프트웨어 제품의 한국어 UX 카피 에디터입니다.
아래 items 배열의 각 한국어 문구를 UI 역할에 맞게 다듬으세요.
원문의 의미, 제품 주장, 보호 토큰은 유지하세요.
새 기능, 숫자, 보장, 법적 의미를 추가하지 마세요.
무료/무제한/연동/자동/실시간/보장/고객지원 약속은 원문 또는 입력 맥락에 없으면 추가하지 마세요.
uxGap, userState, nextAction, benefit, scene, copyMode를 참고하세요.
분석 내용은 출력하지 말고, 문장을 쓰기 전에 내부적으로만 아래 원칙을 적용하세요.
- 제품이 하고 싶은 말보다 사용자가 지금 알고 싶은 말을 먼저 찾으세요.
- "그래서 나한테 뭐가 좋은데?"에 대한 답이 첫눈에 보이게 하세요.
- 기능 설명을 체감 이득, 감정 변화, 행동 이유로 바꾸세요.
- 추상어와 클리셰를 지우고, 입력이 뒷받침하는 장면, 행동, 시간, 대상, 결과로 바꾸세요.
- 모바일 첫 줄에서 의미가 살아남도록 짧은 호흡의 한국어로 압축하세요.
- CTA는 클릭 압박이 아니라 클릭 후 얻는 결과를 말하게 하세요.
copyMode가 "hooked_safe"이면 안전한 범위 안에서 더 선택받고, 더 누르고 싶고, 더 기억나는 한국어로 압축하세요.
copyMode가 "safe_plain"이면 후킹보다 명확성, 회복 경로, 접근성, 신뢰를 우선하세요.
copyMode가 "manual_only"이면 rewrite를 원문과 동일하게 두거나 의미가 변하지 않는 최소 수정만 제안하세요.
추상어와 클리셰를 줄이고, 기능을 사용자가 느끼는 이득과 구체적인 행동으로 바꾸세요.
단, 클릭을 유도하기 위해 제품 약속을 키우거나 새 claim을 만들면 안 됩니다.
법률/개인정보/환불/동의/의료/금융 문구처럼 위험하면 rewrite를 원문과 동일하게 두고 risk를 "manual_only"로 표시하세요.

출력은 TSV 라인만 허용합니다. JSON, 설명, 헤더, 번호, 마크다운 코드펜스는 금지합니다.
각 입력 item마다 아래 형식의 한 줄만 출력하세요.
id<TAB>risk<TAB>rewrite

risk는 safe_auto, review_recommended, manual_only 중 하나만 쓰세요.
id는 입력 item.id 문자열을 한 글자도 바꾸지 말고 그대로 쓰세요. 앞에 "id:"를 붙이지 마세요.
risk 칸은 비우지 마세요. risk_manual_only 같은 새 값을 만들지 마세요.
rewrite에는 탭과 줄바꿈을 넣지 마세요.
입력 순서를 유지하세요.

올바른 출력 예:
src/app/page.tsx:24	review_recommended	리뷰 답변, 매장 말투로 초안부터 잡아보세요
app/page.tsx:41	safe_auto	매장 말투로 초안 만들기

잘못된 출력 예:
id:src/app/page.tsx:24		리뷰 답변 초안
src/app/page.tsx:24	risk_manual_only	원문 유지

입력 items:
${JSON.stringify(compactItems, null, 2)}`;

try {
  const result = await callKanana({ prompt, config });
  if (!result.ok) {
    console.error(JSON.stringify({
      ok: false,
      provider: "kanana",
      model: config.model,
      httpStatus: result.status,
      error: "provider_http_error",
      providerStatus: "provider_http_error",
      itemsRequested: items.length,
      itemsSent: itemsForRequest.length,
      itemsSkippedByLimit: skippedItems.length,
    }, null, 2));
    process.exit(3);
  }

  const parsedResult = parseProviderText(result.text);
  const parsed = parsedResult.parsed || {};
  const parsedItems = Array.isArray(parsed.items) ? parsed.items : [];
  const hasUsableItems = parsedItems.length > 0;
  const gatedItems = hasUsableItems ? applyProviderAcceptanceGate(parsedItems, itemsForRequest) : [];
  const liftedItems = hasUsableItems ? applyBenefitHookLift(gatedItems, itemsForRequest) : [];
  const rejectedCount = liftedItems.filter((item) => String(item.providerCandidate).startsWith("rejected_")).length;
  const benefitHookAppliedCount = liftedItems.filter((item) => item.benefitHookApplied).length;
  const providerStatus = !hasUsableItems
    ? "kanana_raw_text_unusable"
    : parsedResult.parseStatus === "parsed_json"
      ? "kanana_parsed"
      : parsedItems.length >= itemsForRequest.length
        ? "kanana_lines"
        : "kanana_lines_partial";

  console.log(JSON.stringify({
    ok: true,
    provider: "kanana",
    model: config.model,
    httpStatus: result.status,
    requestCount: 1,
    itemsRequested: items.length,
    maxItems,
    itemsSent: itemsForRequest.length,
    itemsSkippedByLimit: skippedItems.length,
    skippedItemIds: skippedItems.map((item) => item.id),
    parseStatus: parsedResult.parseStatus,
    providerStatus,
    needsCodexPostprocess: !hasUsableItems || providerStatus === "kanana_lines_partial" || rejectedCount > 0,
    benefitHookAppliedCount,
    items: liftedItems,
    batchWarnings: [
      ...(Array.isArray(parsed.batchWarnings) ? parsed.batchWarnings : []),
      ...(rejectedCount > 0 ? [`Rejected ${rejectedCount} provider candidate(s) at claim-boundary gate.`] : []),
      ...(benefitHookAppliedCount > 0 ? [`Applied Benefit Hook Lift to ${benefitHookAppliedCount} item(s).`] : []),
    ],
    rawText: parsedResult.rawText,
    parseError: parsedResult.parseError,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error?.message || String(error), itemsRequested: items.length }, null, 2));
  process.exit(4);
}
