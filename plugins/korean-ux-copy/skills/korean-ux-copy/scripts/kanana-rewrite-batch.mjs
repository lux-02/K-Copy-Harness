#!/usr/bin/env node
import fs from "node:fs";
import {
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
    protectedTokens: Array.isArray(item.protectedTokens) ? item.protectedTokens.map(String) : [],
  })).filter((item) => item.text.trim().length > 0);
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
  console.error("missing_api_key: run node scripts/kanana-ensure.mjs");
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
  protectedTokens: item.protectedTokens,
}));

const prompt = `당신은 소프트웨어 제품의 한국어 UX 카피 에디터입니다.
아래 items 배열의 각 한국어 문구를 UI 역할에 맞게 다듬으세요.
원문의 의미, 제품 주장, 보호 토큰은 유지하세요.
새 기능, 숫자, 보장, 법적 의미를 추가하지 마세요.
무료/무제한/연동/자동/실시간/보장/고객지원 약속은 원문 또는 입력 맥락에 없으면 추가하지 마세요.
uxGap, userState, nextAction을 참고해 사용자의 다음 행동이 더 분명해지도록 다듬으세요.
법률/개인정보/환불/동의/의료/금융 문구처럼 위험하면 rewrite를 원문과 동일하게 두고 risk를 "manual_only"로 표시하세요.

출력은 TSV 라인만 허용합니다. JSON, 설명, 헤더, 번호, 마크다운 코드펜스는 금지합니다.
각 입력 item마다 아래 형식의 한 줄만 출력하세요.
id<TAB>risk<TAB>rewrite

risk는 safe_auto, review_recommended, manual_only 중 하나만 쓰세요.
rewrite에는 탭과 줄바꿈을 넣지 마세요.
입력 순서를 유지하세요.

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
  const rejectedCount = gatedItems.filter((item) => String(item.providerCandidate).startsWith("rejected_")).length;
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
    items: gatedItems,
    batchWarnings: [
      ...(Array.isArray(parsed.batchWarnings) ? parsed.batchWarnings : []),
      ...(rejectedCount > 0 ? [`Rejected ${rejectedCount} provider candidate(s) at claim-boundary gate.`] : []),
    ],
    rawText: parsedResult.rawText,
    parseError: parsedResult.parseError,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error?.message || String(error), itemsRequested: items.length }, null, 2));
  process.exit(4);
}
