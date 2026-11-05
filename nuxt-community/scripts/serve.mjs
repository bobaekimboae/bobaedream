// 로컬 확인용 정적 서버: 배포와 같은 주소 구조로 띄운다.
//   /bobaedream/nuxt-community/*  → nuxt-community/.output/public (nuxt generate 결과)
//   /bobaedream/*                → 저장소 public/ (아이콘 · 예시 사진 · 인식 데이터)
// 사용: node scripts/serve.mjs [포트=5203]
//   /bobaedream/nuxt-community/api/bbm/* → 보배드림 리뉴얼 백엔드(BBM_UPSTREAM, 기본 https://staging.bbmuseum.co.kr) 중계.
//   BBM_MOCK=1 이면 보배드림 서버 대신 같은 형식으로 답하는 시험용 가짜 서버(받은 요청은 BBM_MOCK_LOG 파일에 적는다).
import { createServer } from "node:http";
import { appendFileSync, createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const appDir = resolve(here, "../.output/public");
const siteDir = resolve(here, "../../public");
const port = Number(process.argv[2] || 5203);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
};

const pick = (root, rel) => {
  const p = normalize(join(root, rel));
  if (!p.startsWith(root)) return null;
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(join(p, "index.html"))) return join(p, "index.html");
  return null;
};

const upstream = (process.env.BBM_UPSTREAM || "https://staging.bbmuseum.co.kr").replace(/\/$/, "");
const API = "/bobaedream/nuxt-community/api/bbm";
const readBody = req => new Promise(done => { const parts = []; req.on("data", c => parts.push(c)); req.on("end", () => done(Buffer.concat(parts))); });
const json = (res, status, body) => { res.writeHead(status, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(body)); };

// 시험용 가짜 보배드림 서버: dev.bbmuseum.co.kr 글쓰기가 보내는 형식만 확인한다
let mockId = 100;
async function mock(req, res, path) {
  const body = await readBody(req);
  const log = process.env.BBM_MOCK_LOG;
  const auth = req.headers.authorization || "";
  if (log) appendFileSync(log, JSON.stringify({ method: req.method, path, auth: auth ? "Bearer ***" : "", type: req.headers["content-type"] || "", body: (req.headers["content-type"] || "").includes("json") ? JSON.parse(body.toString() || "null") : body.length }) + "\n");
  if (req.method === "GET" && path === "/v1/board-groups") return json(res, 200, { data: [{ id: 1, code: "community", name: "게시판", boards: [{ code: "free", name: "자유게시판", type: "general", is_adult_only: false }, { code: "battle", name: "시승기/목격담", type: "general", is_adult_only: false }, { code: "dealer-community", name: "딜러 커뮤니티", type: "dealer_page", is_adult_only: false }] }] });
  if (req.method === "GET" && /^\/v1\/boards\/[^/]+\/categories$/.test(path)) return json(res, 200, { data: [] });
  if (!/^Bearer \S+/.test(auth)) return json(res, 401, { message: "Unauthenticated." });
  if (req.method === "POST" && path === "/v1/articles/media-uploads") {
    const count = (body.toString("latin1").match(/name="files\[\]"/g) || []).length;
    return json(res, 201, { data: Array.from({ length: count }, () => ({ upload_id: ++mockId, url: `https://file9.bobaedream.co.kr/mock/${mockId}.jpg` })) });
  }
  if (req.method === "POST" && path === "/v1/articles") {
    const p = JSON.parse(body.toString() || "{}");
    if (!p.board_code) return json(res, 422, { message: "게시판을 선택해주세요.", errors: { board_code: ["게시판을 선택해주세요."] } });
    if (!p.title) return json(res, 422, { message: "제목을 입력해주세요.", errors: { title: ["제목을 입력해주세요."] } });
    return json(res, 201, { data: { id: ++mockId, public_id: `mock${mockId}` } });
  }
  if (path.startsWith("/v1/article-drafts")) return json(res, req.method === "POST" ? 201 : 200, { data: { id: 77 } });
  return json(res, 404, { message: "Not Found" });
}

async function proxy(req, res, path) {
  const headers = {};
  for (const key of ["authorization", "content-type", "accept"]) if (req.headers[key]) headers[key] = req.headers[key];
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
  try {
    const r = await fetch(upstream + path, { method: req.method, headers, body });
    res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "application/json" });
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (error) { json(res, 502, { message: `보배드림 서버 중계 실패: ${error.message}` }); }
}

createServer((req, res) => {
  const rawPath = (req.url || "/");
  if (rawPath.startsWith(API + "/")) {
    const path = rawPath.slice(API.length);
    return process.env.BBM_MOCK ? mock(req, res, path.split("?")[0]) : proxy(req, res, path);
  }
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = null;
  if (url.startsWith("/bobaedream/nuxt-community/")) file = pick(appDir, url.slice("/bobaedream/nuxt-community/".length)) ?? pick(appDir, "index.html");
  // 자동 시험용 짧은 주소(주소에 「shootkit」 글자가 두 번 나오지 않게): /bobaedream/nk/ → 같은 앱
  else if (url.startsWith("/bobaedream/nk/")) file = pick(appDir, "index.html");
  else if (url.startsWith("/bobaedream/")) file = pick(siteDir, url.slice("/bobaedream/".length));
  if (!file) {
    res.writeHead(404);
    return res.end("not found");
  }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`http://localhost:${port}/bobaedream/nuxt-community/`));
