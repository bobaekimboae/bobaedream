import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSheetRows, sheetHeaders } from "./sheet-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const snapshotPath = path.join(root, "public", "community", "data", "foreign-car-news.json");
const spreadsheetId = String(process.env.FOREIGN_NEWS_SHEET_ID || "").trim();
const sheetTitle = String(process.env.FOREIGN_NEWS_SHEET_TAB || "해외자동차뉴스_자동수집").trim();
const serviceAccountJson = String(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON || "").trim();

if (!spreadsheetId || !serviceAccountJson) {
  console.log("Google Sheet sync skipped: FOREIGN_NEWS_SHEET_ID or GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON is not configured.");
  process.exit(0);
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: credentials.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${signer.sign(credentials.private_key, "base64url")}`;
  const response = await fetch(credentials.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed: ${response.status} ${await response.text()}`);
  return (await response.json()).access_token;
}

async function googleRequest(token, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`Google Sheets API failed: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

function quoteSheetTitle(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const credentials = JSON.parse(serviceAccountJson);
if (!credentials.client_email || !credentials.private_key) {
  throw new Error("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON must contain client_email and private_key.");
}

const payload = JSON.parse(await readFile(snapshotPath, "utf8"));
const rows = buildSheetRows(payload);
const token = await getAccessToken(credentials);
const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
let metadata = await googleRequest(token, `${baseUrl}?fields=sheets.properties`);
let sheet = metadata.sheets?.find((item) => item.properties?.title === sheetTitle);

if (!sheet) {
  const created = await googleRequest(token, `${baseUrl}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: sheetTitle, gridProperties: { frozenRowCount: 1 } } } }] }),
  });
  sheet = created.replies?.[0]?.addSheet;
}

const sheetId = sheet.properties.sheetId;
const allRows = [sheetHeaders, ...rows];
const rangeTitle = quoteSheetTitle(sheetTitle);

await googleRequest(token, `${baseUrl}/values/${encodeURIComponent(`${rangeTitle}!A:Q`)}:clear`, {
  method: "POST",
  body: "{}",
});
await googleRequest(token, `${baseUrl}/values/${encodeURIComponent(`${rangeTitle}!A1:Q${allRows.length}`)}?valueInputOption=RAW`, {
  method: "PUT",
  body: JSON.stringify({ range: `${rangeTitle}!A1:Q${allRows.length}`, majorDimension: "ROWS", values: allRows }),
});

await googleRequest(token, `${baseUrl}:batchUpdate`, {
  method: "POST",
  body: JSON.stringify({
    requests: [
      {
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
          fields: "gridProperties.frozenRowCount",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: sheetHeaders.length },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.12, green: 0.12, blue: 0.12 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
              horizontalAlignment: "CENTER",
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, endRowIndex: allRows.length, startColumnIndex: 6, endColumnIndex: 8 },
          cell: { userEnteredFormat: { wrapStrategy: "WRAP" } },
          fields: "userEnteredFormat.wrapStrategy",
        },
      },
      {
        setBasicFilter: {
          filter: { range: { sheetId, startRowIndex: 0, endRowIndex: allRows.length, startColumnIndex: 0, endColumnIndex: sheetHeaders.length } },
        },
      },
      {
        autoResizeDimensions: {
          dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: sheetHeaders.length },
        },
      },
    ],
  }),
});

console.log(`Synced ${rows.length} articles to ${sheetTitle} (${spreadsheetId}).`);
