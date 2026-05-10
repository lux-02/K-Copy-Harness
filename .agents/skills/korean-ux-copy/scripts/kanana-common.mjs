import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const DEFAULT_BASE_URL = "https://kanana-o.a2s-endpoint.kr-central-2.kakaocloud.com/v1";
export const DEFAULT_MODEL = "kanana-o";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return {};

  const result = {};
  const body = fs.readFileSync(filePath, "utf8");
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export function resolveKananaConfig({ cwd = process.cwd() } = {}) {
  const localConfig = parseEnvFile(path.join(cwd, ".env.korean-ux-copy.local"));
  const globalConfig = parseEnvFile(path.join(os.homedir(), ".config", "korean-ux-copy", "secrets.env"));

  const apiKey =
    process.env.KOREAN_UX_COPY_KANANA_API_KEY ||
    process.env.KANANA_API_KEY ||
    localConfig.KOREAN_UX_COPY_KANANA_API_KEY ||
    localConfig.KANANA_API_KEY ||
    globalConfig.KOREAN_UX_COPY_KANANA_API_KEY ||
    globalConfig.KANANA_API_KEY ||
    "";

  const keySource = process.env.KOREAN_UX_COPY_KANANA_API_KEY
    ? "env:KOREAN_UX_COPY_KANANA_API_KEY"
    : process.env.KANANA_API_KEY
      ? "env:KANANA_API_KEY"
      : localConfig.KOREAN_UX_COPY_KANANA_API_KEY || localConfig.KANANA_API_KEY
        ? ".env.korean-ux-copy.local"
        : globalConfig.KOREAN_UX_COPY_KANANA_API_KEY || globalConfig.KANANA_API_KEY
          ? "~/.config/korean-ux-copy/secrets.env"
          : "missing";

  return {
    apiKey,
    keySource,
    baseURL:
      process.env.KANANA_BASE_URL ||
      localConfig.KANANA_BASE_URL ||
      globalConfig.KANANA_BASE_URL ||
      DEFAULT_BASE_URL,
    model:
      process.env.KANANA_MODEL ||
      localConfig.KANANA_MODEL ||
      globalConfig.KANANA_MODEL ||
      DEFAULT_MODEL,
  };
}

export function extractTextContent(messageContent) {
  if (typeof messageContent === "string") return messageContent;
  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) return part.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

export function parseJsonish(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return JSON.parse(fenced[1].trim());

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  const body =
    firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
      ? trimmed.slice(firstBrace, lastBrace + 1)
      : trimmed;
  return JSON.parse(body);
}

export function parseLineProtocol(text) {
  const risks = new Set(["safe_auto", "review_recommended", "manual_only"]);
  const riskAliases = new Map([
    ["safe_plain", "review_recommended"],
    ["hooked_safe", "review_recommended"],
    ["risk_manual_only", "manual_only"],
  ]);
  const items = [];
  const skippedLines = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (
      !line ||
      line.startsWith("```") ||
      line.startsWith("#") ||
      /^id\s+risk\s+rewrite$/i.test(line)
    ) {
      continue;
    }

    const normalizedLine = line.includes("\t")
      ? line
      : line.replaceAll("<TAB>", "\t").replaceAll("\\t", "\t");
    const parts = normalizedLine.split("\t");
    if (parts.length < 3) {
      skippedLines.push(rawLine);
      continue;
    }

    const id = parts[0].trim();
    const rawRisk = parts[1].trim();
    const risk = riskAliases.get(rawRisk) || rawRisk;
    const rewrite = parts.slice(2).join("\t").trim();
    if (!id || !risks.has(risk) || !rewrite) {
      skippedLines.push(rawLine);
      continue;
    }

    items.push({ id, risk, rewrite });
  }

  return {
    items,
    skippedLines,
  };
}

export function parseProviderText(text) {
  try {
    const parsed = parseJsonish(text);
    return {
      parseStatus: "parsed_json",
      parsed,
      rawText: text,
      parseError: null,
    };
  } catch (error) {
    const lineResult = parseLineProtocol(text);
    if (lineResult.items.length > 0) {
      return {
        parseStatus: "parsed_lines",
        parsed: {
          items: lineResult.items,
          batchWarnings: lineResult.skippedLines.length > 0
            ? [`Skipped ${lineResult.skippedLines.length} non-protocol line(s).`]
            : [],
        },
        rawText: text,
        parseError: error?.message || String(error),
      };
    }

    return {
      parseStatus: "raw_text",
      parsed: null,
      rawText: text,
      parseError: error?.message || String(error),
    };
  }
}

const RISK_VALUES = new Set(["safe_auto", "review_recommended", "manual_only"]);
const ADDED_CLAIM_TERMS = ["무료", "무제한", "보장", "연동", "자동", "실시간", "고객지원"];
const WEAK_COPY_TERMS = [
  "특별한 경험",
  "감성적인 공간",
  "일상의 여유",
  "작은 행복",
  "더 나은 라이프스타일",
  "혁신적인",
  "새로운 기준",
  "여정",
  "솔루션",
  "경험을 제공합니다",
  "경험하세요",
  "비즈니스 성장",
  "생산성을 극대화",
  "차별화된",
  "프리미엄",
  "감각적인",
  "트렌디한",
  "진정성 있는",
  "스마트한",
  "완벽한",
  "최고의",
  "편리한",
  "지금 바로 시작하세요",
  "관리할 수 있게 구성했습니다",
  "중심으로 구성했습니다",
  "베타형으로 구성했습니다",
];
const BENEFIT_CUES = [
  "줄",
  "덜",
  "바로",
  "먼저",
  "없이",
  "한 번",
  "한 화면",
  "같은 말",
  "맞춥",
  "놓치",
  "헷갈",
  "초안",
  "고르",
  "고치",
  "선택",
  "확인",
  "시작",
  "받",
  "정리",
  "가볍",
  "나눠",
  "새로 쓰지",
];
const CONCRETE_CUES = [
  "메뉴",
  "알레르기",
  "리뷰",
  "답변",
  "초안",
  "직원",
  "손님",
  "매장",
  "요금제",
  "FAQ",
  "출력본",
  "웹",
  "빈",
  "화면",
  "클릭",
];
const CLAIM_GROUPS = [
  {
    trigger: /KUX-007|연결|연동|관리 가능|채널 연결/,
    forbidden: ["연결", "연동", "관리 가능", "통합 관리", "중앙 관리"],
  },
  {
    trigger: /KUX-008|AI 답변|AI가|자동 생성|자동 분석/,
    forbidden: ["AI 답변", "AI가", "자동 생성", "자동 분석"],
  },
  {
    trigger: /KUX-010|넉넉|대량|충분한 사용량|무제한/,
    forbidden: ["넉넉", "대량", "충분한 사용량", "무제한"],
  },
];

function includesAny(text, terms) {
  return terms.filter((term) => text.includes(term));
}

function claimBoundaryViolations(source, rewrite) {
  const sourceText = [source.text, source.issue, source.uxGap, source.nextAction].join("\n");
  const violations = [];

  for (const group of CLAIM_GROUPS) {
    if (group.trigger.test(sourceText)) {
      violations.push(...includesAny(rewrite, group.forbidden));
    }
  }

  for (const term of ADDED_CLAIM_TERMS) {
    if (!source.text.includes(term) && rewrite.includes(term)) {
      violations.push(term);
    }
  }

  return [...new Set(violations)];
}

export function applyProviderAcceptanceGate(providerItems, sourceItems) {
  const sourceById = new Map(sourceItems.map((item) => [String(item.id), item]));

  return providerItems.map((item) => {
    const id = String(item.id ?? "");
    const source = sourceById.get(id);
    const normalizedRisk = RISK_VALUES.has(item.risk) ? item.risk : "review_recommended";
    const rewrite = String(item.rewrite ?? "");

    if (!source) {
      return {
        ...item,
        id,
        risk: normalizedRisk === "manual_only" ? "manual_only" : "review_recommended",
        providerCandidate: "rejected_unmatched_id",
        rejectionReason: "Provider item id did not match a requested item.",
      };
    }

    const violations = claimBoundaryViolations(source, rewrite);
    if (violations.length > 0) {
      return {
        ...item,
        id,
        risk: normalizedRisk === "manual_only" ? "manual_only" : "review_recommended",
        rewrite: source.text,
        providerCandidate: "rejected_claim_boundary",
        rejectedRewrite: rewrite,
        rejectionReason: `Provider rewrite kept or added claim-boundary term(s): ${violations.join(", ")}`,
        forbiddenTerms: violations,
      };
    }

    return {
      ...item,
      id,
      risk: normalizedRisk,
      rewrite,
      providerCandidate: "accepted",
    };
  });
}

function trimSentence(text) {
  return String(text ?? "")
    .trim()
    .replace(/[.。]+$/g, "")
    .replace(/\s+/g, " ");
}

function includesTerm(text, terms) {
  return terms.some((term) => text.includes(term));
}

function roleMaxLength(role) {
  if (role === "button_label") return 18;
  if (role === "hero_headline") return 44;
  if (role === "section_subtitle" || role === "feature_subtitle" || role === "pricing_copy") return 48;
  if (role === "problem_copy") return 42;
  return 58;
}

function hookScore(text, source) {
  const value = trimSentence(text);
  if (!value) return -100;

  const maxLength = roleMaxLength(source.role);
  let score = 0;

  if (value.length <= maxLength) score += 3;
  if (value.length <= Math.max(14, maxLength - 10)) score += 1;
  if (value.length > maxLength + 10) score -= 4;
  if (value.length > maxLength + 22) score -= 6;

  if (includesTerm(value, BENEFIT_CUES)) score += 3;
  if (includesTerm(value, CONCRETE_CUES)) score += 2;
  score -= includesAny(value, WEAK_COPY_TERMS).length * 4;
  if (/합니다$|습니다$/.test(value)) score -= 1;
  if (/하세요$|보세요$|받기$|만들기$|고르세요$/.test(value)) score += 2;
  if (/제공합니다$|선사합니다$|경험하세요$|시작하세요$/.test(value)) score -= 3;
  if (/당신의|여러분의/.test(value)) score -= 1;
  if (/때마다|직원마다|손님|출력본|웹|알레르기|메뉴/.test(value)) score += 1;
  if (/[?？]$/.test(value) && /나요|있나요|않나요/.test(value)) score += 1;

  const sourceText = [source.text, source.benefit, source.scene, source.nextAction].join("\n");
  for (const term of ["메뉴", "알레르기", "직원", "손님", "출력", "웹", "매장", "초안"]) {
    if (sourceText.includes(term) && value.includes(term)) score += 0.5;
  }

  return score;
}

function compactMenuAndAllergyHeadline(source) {
  const sourceText = [source.text, source.benefit].join("\n");
  if (source.role !== "hero_headline") return "";
  if (!sourceText.includes("메뉴 설명") || !sourceText.includes("알레르기")) return "";
  if (!sourceText.includes("한 화면")) return "";
  return "메뉴 설명부터 알레르기 안내까지, 한 화면에서 맞춥니다";
}

function compactBetaCta(source) {
  if (source.role !== "button_label") return "";
  const sourceText = [source.text, source.benefit, source.nextAction].join("\n");
  if (sourceText.includes("베타 체험")) return "베타 체험 안내 받기";
  if (sourceText.includes("오픈 알림")) return "오픈 알림 받기";
  if (sourceText.includes("초안") && sourceText.includes("매장 말투")) return "매장 말투로 초안 만들기";
  return "";
}

function compactProblemQuestion(source) {
  if (source.role !== "section_subtitle") return "";
  const sourceText = [source.text, source.scene, source.benefit].join("\n");
  if (sourceText.includes("메뉴를 고칠 때마다") || sourceText.includes("메뉴 고칠 때마다")) {
    return "메뉴 고칠 때마다, 문구도 알레르기도 다시 맞추고 있나요?";
  }
  return "";
}

function compactProblemCopy(source) {
  if (source.role !== "problem_copy") return "";
  const sourceText = [source.text, source.scene, source.benefit].join("\n");
  if (sourceText.includes("직원") && sourceText.includes("손님") && sourceText.includes("다르게")) {
    return "직원마다 말이 달라지면 손님도 헷갈립니다";
  }
  if (sourceText.includes("알레르기") && sourceText.includes("수정")) {
    return "알레르기 안내는 따로 적을수록 놓치기 쉽습니다";
  }
  return "";
}

function compactFeatureCopy(source) {
  const sourceText = [source.text, source.benefit, source.scene].join("\n");
  if (source.role === "feature_subtitle" && sourceText.includes("메뉴 등록부터 출력 전 검수")) {
    return "메뉴 등록부터 출력 전 검수까지, 오가는 일을 줄입니다";
  }
  if (source.role === "feature_body" && sourceText.includes("자주 쓰는 추천 문구")) {
    return "자주 쓰는 추천 문구를 저장해, 직원마다 새로 쓰는 일을 줄입니다";
  }
  if (source.role === "feature_body" && sourceText.includes("웹") && sourceText.includes("출력")) {
    return "한 번 정리한 메뉴 설명을 웹·출력본·직원 안내용으로 나눠 받습니다";
  }
  return "";
}

function compactPricingCopy(source) {
  if (source.role !== "pricing_copy") return "";
  const sourceText = [source.text, source.benefit, source.scene].join("\n");
  if (sourceText.includes("매장 규모") && sourceText.includes("운영 방식")) {
    return "매장 규모와 운영 방식에 맞는 기능부터 고르세요";
  }
  return "";
}

function compactGenericBenefit(source) {
  const benefit = trimSentence(source.benefit);
  if (!benefit) return "";
  if (benefit.length > roleMaxLength(source.role) + 6) return "";
  if (!includesTerm(benefit, BENEFIT_CUES)) return "";
  return benefit;
}

function buildBenefitHookCandidate(source) {
  const candidates = [
    compactBetaCta(source),
    compactMenuAndAllergyHeadline(source),
    compactProblemQuestion(source),
    compactProblemCopy(source),
    compactFeatureCopy(source),
    compactPricingCopy(source),
    compactGenericBenefit(source),
  ].filter(Boolean).map(trimSentence);

  if (source.role === "hero_subcopy") {
    const sourceText = [source.text, source.benefit, source.scene].join("\n");
    if (sourceText.includes("직원마다") && sourceText.includes("메뉴 설명") && sourceText.includes("알레르기")) {
      candidates.unshift("직원마다 달라지던 메뉴 설명과 알레르기 안내를 한 화면에서 정리하세요");
    }
    if (sourceText.includes("출력") && sourceText.includes("배포")) {
      candidates.unshift("메뉴 설명을 고치면 출력본과 배포 문구까지 한 흐름으로 맞춥니다");
    }
  }

  if (source.role === "section_subtitle") {
    const sourceText = [source.text, source.benefit].join("\n");
    if (sourceText.includes("같은 재료") && sourceText.includes("매장 스타일")) {
      candidates.unshift("같은 재료도 매장 스타일에 맞게 다르게 팔 수 있습니다");
    }
  }

  return candidates[0] || "";
}

function hookLabelsFor(text, source) {
  const labels = new Set(["benefit"]);
  if (source.role === "button_label" || /받기|만들기|고르세요|하세요|보세요$/.test(text)) labels.add("cta");
  if (/때마다|직원마다|손님|빈|앞에서|출력본|웹/.test(text)) labels.add("scene");
  if (/알레르기|메뉴|요금제|FAQ|사전 신청/.test([source.text, text].join("\n"))) labels.add("search");
  if (/빈|앞에서|멈추|헷갈|놓치|밀린|덜/.test(text)) labels.add("sensory");
  if (text.length <= roleMaxLength(source.role)) labels.add("clarity");
  return [...labels];
}

export function applyBenefitHookLift(providerItems, sourceItems) {
  const sourceById = new Map(sourceItems.map((item) => [String(item.id), item]));

  return providerItems.map((item) => {
    const source = sourceById.get(String(item.id));
    if (!source) return item;

    const copyMode = source.copyMode || "safe_plain";
    const withMode = {
      ...item,
      copyMode,
    };

    if (copyMode !== "hooked_safe" || item.providerCandidate !== "accepted") {
      return {
        ...withMode,
        benefitHookApplied: false,
        hookLabels: copyMode === "safe_plain" ? ["clarity"] : [],
      };
    }

    const providerRewrite = trimSentence(item.rewrite);
    const hookCandidate = buildBenefitHookCandidate(source);
    if (!hookCandidate) {
      return {
        ...withMode,
        rewrite: providerRewrite,
        benefitHookApplied: false,
        hookLabels: hookLabelsFor(providerRewrite, source),
        hookScore: hookScore(providerRewrite, source),
      };
    }

    const violations = claimBoundaryViolations(source, hookCandidate);
    if (violations.length > 0) {
      return {
        ...withMode,
        rewrite: providerRewrite,
        rejectedBenefitHook: hookCandidate,
        benefitHookApplied: false,
        benefitHookRejectionReason: `Benefit Hook candidate added claim-boundary term(s): ${violations.join(", ")}`,
        hookLabels: hookLabelsFor(providerRewrite, source),
        hookScore: hookScore(providerRewrite, source),
      };
    }

    const providerScore = hookScore(providerRewrite, source);
    const candidateScore = hookScore(hookCandidate, source) + 1;
    if (candidateScore <= providerScore) {
      return {
        ...withMode,
        rewrite: providerRewrite,
        benefitHookApplied: false,
        hookLabels: hookLabelsFor(providerRewrite, source),
        hookScore: providerScore,
        benefitHookCandidate: hookCandidate,
        benefitHookCandidateScore: candidateScore,
      };
    }

    return {
      ...withMode,
      risk: item.risk === "manual_only" ? "manual_only" : "review_recommended",
      providerRewrite,
      rewrite: hookCandidate,
      benefitHookApplied: true,
      hookLabels: hookLabelsFor(hookCandidate, source),
      hookScore: candidateScore,
      providerHookScore: providerScore,
    };
  });
}

export async function callKanana({ prompt, config }) {
  const endpoint = `${config.baseURL.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    }),
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }

  return {
    ok: response.ok,
    status: response.status,
    endpoint,
    data,
    text: extractTextContent(data?.choices?.[0]?.message?.content) || data?.raw || "",
  };
}
