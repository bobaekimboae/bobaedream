#!/usr/bin/env node
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createNormalizer } from "./image-normalize.mjs";

const root = join("public", "assets", "bike", "pilot", "v02");
const types = ["scooter", "naked", "supersport", "adventure"];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const normalizer = await createNormalizer({ browser });
const cropPage = await browser.newPage();

try {
  for (const type of types) {
    const master = join(root, "masters", `bike_type_${type}_side_master_v02.png`);
    const normalized = await normalizer.normalize(readFileSync(master));
    if (normalized.error) throw new Error(`${type}: ${normalized.error}`);
    const cropped = await cropPage.evaluate(async (b64) => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
      const canvas = new OffscreenCanvas(180, 120);
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, -24, 0);
      const bytes = new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    }, normalized.png);
    const slot = join(root, `bike_type_${type}_side_slot_v02.png`);
    writeFileSync(slot, Buffer.from(cropped, "base64"));
    const { png, ...info } = normalized;
    console.log(JSON.stringify({ type, slot, ...info }));
  }
} finally {
  await cropPage.close();
  await normalizer.close();
  await browser.close();
}
