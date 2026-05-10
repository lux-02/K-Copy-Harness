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
  const legacyLocalConfig = parseEnvFile(path.join(cwd, ".env.k-copy-harness.local"));
  const globalConfig = parseEnvFile(path.join(os.homedir(), ".config", "korean-ux-copy", "secrets.env"));
  const legacyGlobalConfig = parseEnvFile(path.join(os.homedir(), ".config", "k-copy-harness", "secrets.env"));

  const apiKey =
    process.env.KOREAN_UX_COPY_KANANA_API_KEY ||
    process.env.KANANA_API_KEY ||
    localConfig.KOREAN_UX_COPY_KANANA_API_KEY ||
    localConfig.KANANA_API_KEY ||
    globalConfig.KOREAN_UX_COPY_KANANA_API_KEY ||
    globalConfig.KANANA_API_KEY ||
    process.env.K_COPY_HARNESS_KANANA_API_KEY ||
    localConfig.K_COPY_HARNESS_KANANA_API_KEY ||
    legacyLocalConfig.K_COPY_HARNESS_KANANA_API_KEY ||
    legacyLocalConfig.KANANA_API_KEY ||
    legacyGlobalConfig.K_COPY_HARNESS_KANANA_API_KEY ||
    legacyGlobalConfig.KANANA_API_KEY ||
    "";

  const keySource = process.env.KOREAN_UX_COPY_KANANA_API_KEY
    ? "env:KOREAN_UX_COPY_KANANA_API_KEY"
    : process.env.KANANA_API_KEY
      ? "env:KANANA_API_KEY"
      : localConfig.KOREAN_UX_COPY_KANANA_API_KEY || localConfig.KANANA_API_KEY
        ? ".env.korean-ux-copy.local"
        : globalConfig.KOREAN_UX_COPY_KANANA_API_KEY || globalConfig.KANANA_API_KEY
          ? "~/.config/korean-ux-copy/secrets.env"
          : process.env.K_COPY_HARNESS_KANANA_API_KEY
            ? "env:K_COPY_HARNESS_KANANA_API_KEY"
            : legacyLocalConfig.K_COPY_HARNESS_KANANA_API_KEY || legacyLocalConfig.KANANA_API_KEY
              ? ".env.k-copy-harness.local"
              : legacyGlobalConfig.K_COPY_HARNESS_KANANA_API_KEY || legacyGlobalConfig.KANANA_API_KEY
                ? "~/.config/k-copy-harness/secrets.env"
                : "missing";

  return {
    apiKey,
    keySource,
    baseURL:
      process.env.KANANA_BASE_URL ||
      localConfig.KANANA_BASE_URL ||
      globalConfig.KANANA_BASE_URL ||
      legacyLocalConfig.KANANA_BASE_URL ||
      legacyGlobalConfig.KANANA_BASE_URL ||
      DEFAULT_BASE_URL,
    model:
      process.env.KANANA_MODEL ||
      localConfig.KANANA_MODEL ||
      globalConfig.KANANA_MODEL ||
      legacyLocalConfig.KANANA_MODEL ||
      legacyGlobalConfig.KANANA_MODEL ||
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
    const risk = parts[1].trim();
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
