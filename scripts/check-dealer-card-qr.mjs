import { readFileSync } from "node:fs";
import { PNG } from "pngjs";
import jsQR from "jsqr";

// Decode a QR image rendered by the app, rather than comparing encoder internals.
const [file, shop, emp] = process.argv.slice(2);
if (!file || !shop || !emp) throw new Error("Usage: node scripts/check-dealer-card-qr.mjs <PNG> <shop> <emp>");
const image = PNG.sync.read(readFileSync(file));
const decoded = jsQR(new Uint8ClampedArray(image.data), image.width, image.height);
if (!decoded) throw new Error("QR could not be scanned");
const url = new URL(decoded.data);
const fixed = url.origin === "https://bobaedream-dealer-card.bobaekim.chatgpt.site" && url.pathname === `/c/${shop}/${emp}` && !url.hash && !url.search;
const legacy = url.searchParams.get("profile") === "dealer" && url.searchParams.get("card") === "1" && url.searchParams.get("shop") === shop && url.searchParams.get("emp") === emp;
if (!fixed && !legacy) throw new Error("QR points to a different card");
console.log(JSON.stringify({ scanned: true, fixed, shop, emp, width: image.width, height: image.height }));
