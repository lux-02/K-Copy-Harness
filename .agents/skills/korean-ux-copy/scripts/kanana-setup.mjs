#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from "./kanana-common.mjs";

const configDir = path.join(os.homedir(), ".config", "korean-ux-copy");
const secretsPath = path.join(configDir, "secrets.env");

function createHiddenInputInterface() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const originalWrite = rl._writeToOutput;
  rl._writeToOutput = function writeToOutput(stringToWrite) {
    if (rl.stdoutMuted) {
      rl.output.write("*");
    } else {
      originalWrite.call(rl, stringToWrite);
    }
  };

  return rl;
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createHiddenInputInterface();
    rl.stdoutMuted = true;
    rl.question(question, (answer) => {
      rl.history = rl.history.slice(1);
      rl.close();
      process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

function ask(question, fallback) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const suffix = fallback ? ` (${fallback})` : "";
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || fallback);
    });
  });
}

function escapeEnvValue(value) {
  return JSON.stringify(value);
}

console.log("Kanana 설정을 시작합니다.");
console.log("설정하면 Hero, SEO, 가격표, FAQ처럼 말투가 중요한 문구의 conversion-safe rewrite 후보를 더 자연스럽게 받을 수 있습니다.");
console.log("스킬은 Kanana 후보를 그대로 적용하지 않고 agent safety gate로 다시 검증합니다.");

const apiKey = await askHidden("Kanana API key: ");
if (!apiKey) {
  console.error("API key가 입력되지 않아 아무것도 저장하지 않았습니다.");
  process.exit(1);
}

const baseURL = await ask("Kanana base URL", DEFAULT_BASE_URL);
const model = await ask("Kanana model", DEFAULT_MODEL);

fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });

const body = [
  "# Korean UX Copy Kanana provider settings",
  "# Do not commit this file.",
  `KOREAN_UX_COPY_KANANA_API_KEY=${escapeEnvValue(apiKey)}`,
  `KANANA_BASE_URL=${escapeEnvValue(baseURL)}`,
  `KANANA_MODEL=${escapeEnvValue(model)}`,
  "",
].join("\n");

fs.writeFileSync(secretsPath, body, { mode: 0o600 });
fs.chmodSync(configDir, 0o700);
fs.chmodSync(secretsPath, 0o600);

console.log(`Kanana 설정을 저장했습니다: ${secretsPath}`);
console.log("API key는 출력하지 않았습니다.");
console.log("다음 실행부터는 고영향 문구만 모아 1회 batch rewrite로 Kanana를 사용합니다.");
