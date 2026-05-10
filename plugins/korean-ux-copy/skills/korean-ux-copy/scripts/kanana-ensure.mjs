#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveKananaConfig } from "./kanana-common.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = resolveKananaConfig();

if (config.apiKey) {
  console.log(`Kanana 설정: 사용 가능 (${config.keySource})`);
  console.log("고영향 한국어 문구는 Kanana로 conversion-safe 후보를 받은 뒤 agent safety gate로 다시 검증합니다.");
  process.exit(0);
}

console.log("Kanana 설정: 없음");
console.log("계속 deterministic + runtime LLM fallback 모드로 진단하고 rewrite를 제안할 수 있습니다.");
console.log("Hero, SEO, 가격표, FAQ처럼 문맥이 중요한 문구는 Kanana를 설정하면 더 선택받기 쉬운 한국어 후보를 받을 수 있습니다.");

if (!process.stdin.isTTY) {
  console.log("현재 shell에서는 대화형 설정을 시작할 수 없습니다.");
  console.log("설정하려면 터미널에서 아래 명령을 실행하세요:");
  console.log(`node ${path.join(__dirname, "kanana-setup.mjs")}`);
  process.exit(2);
}

console.log("Kanana 1회 설정을 시작합니다...");
const result = spawnSync(process.execPath, [path.join(__dirname, "kanana-setup.mjs")], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
