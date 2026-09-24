#!/usr/bin/env node
// OP-011: 빌드할 때 브랜치·커밋·빌드 시각을 .env.production.local 에 적는다(Vite 가 VITE_* 로 읽음, 커밋하지 않음).
// GitHub Actions 에서는 GITHUB_REF_NAME·GITHUB_SHA 를 먼저 쓴다(체크아웃이 브랜치 이름 없는 상태라서).
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const run = (command) => { try { return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; } };
const branch = process.env.GITHUB_REF_NAME || run("git branch --show-current") || "unknown";
const commit = (process.env.GITHUB_SHA || run("git rev-parse HEAD") || "unknown").slice(0, 7);
const dirty = !process.env.GITHUB_SHA && run("git status --porcelain") ? "+" : "";
const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul", hour12: false }).slice(0, 16);
writeFileSync(".env.production.local", `VITE_BUILD_BRANCH=${branch}\nVITE_BUILD_COMMIT=${commit}${dirty}\nVITE_BUILD_TIME=${time} KST\n`);
console.log(`빌드 정보: ${branch} @ ${commit}${dirty} · ${time} KST`);
