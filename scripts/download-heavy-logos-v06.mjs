import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";


const logoDir = path.resolve("public/assets/heavy/logos");

const rasterSources = [
  {
    output: "heavy_hd_hyundai_logo_companieslogo_raw_v06.png",
    url: "https://companieslogo.com/img/orig/267270.KS-2ff11e4f.png?download=true&t=1774549126",
  },
  {
    output: "heavy_develon_logo_official_raw_v06.png",
    url: "https://na.develon-ce.com/globalassets/develon-equipment/logos/dev_logo_charcoal_600x81_96dpi.png",
  },
  {
    output: "heavy_volvo_ce_logo_companieslogo_raw_v06.png",
    url: "https://companieslogo.com/img/orig/VOLV-A.ST-95a52654.png?download=true&t=1720244494",
  },
  {
    output: "heavy_caterpillar_logo_companieslogo_raw_v06.png",
    url: "https://companieslogo.com/img/orig/CAT-bb6413e4.png?download=true&t=1720244491",
  },
  {
    output: "heavy_komatsu_logo_companieslogo_raw_v06.png",
    url: "https://companieslogo.com/img/orig/6301.T_BIG-c4ba428f.png?download=true&t=1720244490",
  },
  {
    output: "heavy_hitachi_cm_logo_companieslogo_raw_v06.png",
    url: "https://companieslogo.com/img/orig/6305.T_BIG-154b690c.png?download=true&t=1720244490",
  },
  {
    output: "heavy_kubota_logo_companieslogo_raw_v06.png",
    url: "https://companieslogo.com/img/orig/6326.T_BIG-a07a3bdb.png?download=true&t=1720417469",
  },
];

const vectorSources = [
  {
    output: "heavy_kobelco_logo_official_raw_v06.svg",
    raster: "heavy_kobelco_logo_official_raster_raw_v06.png",
    url: "https://www.kobelco-kenki.co.jp/hubfs/common/logo-kobelco.svg",
    transform(svg) {
      return svg.replaceAll('fill="white"', 'fill="#00A7AC"');
    },
  },
  {
    output: "heavy_bobcat_logo_official_raw_v06.svg",
    raster: "heavy_bobcat_logo_official_raster_raw_v06.png",
    url: "https://res.cloudinary.com/doosan-bobcat/image/upload/v1724088281/bobcat-assets/common/logos/svg/bobcat-company-official-logo.svg",
    transform(svg) {
      return svg
        .replace('viewBox="0 0 143 38"', 'viewBox="0 0 45 38"')
        .replace("fill: #fff;", "fill: #111111;");
    },
  },
  {
    output: "heavy_jcb_logo_official_raw_v06.svg",
    raster: "heavy_jcb_logo_official_raster_raw_v06.png",
    url: "https://www.jcb.com/globalassets/logo.svg",
    transform(svg) {
      return svg;
    },
  },
];

async function download(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141 Safari/537.36",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

for (const source of rasterSources) {
  const target = path.join(logoDir, source.output);
  await writeFile(target, await download(source.url));
  console.log(`downloaded ${source.output}`);
}

for (const source of vectorSources) {
  const target = path.join(logoDir, source.output);
  const svg = source.transform((await download(source.url)).toString("utf8"));
  await writeFile(target, svg, "utf8");
  console.log(`downloaded ${source.output}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });

for (const source of vectorSources) {
  const svg = await readFile(path.join(logoDir, source.output), "utf8");
  const viewBox = svg.match(/viewBox=["']\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (!viewBox) throw new Error(`No viewBox found: ${source.output}`);
  const naturalWidth = Number(viewBox[3]);
  const naturalHeight = Number(viewBox[4]);
  const scale = 1200 / Math.max(naturalWidth, naturalHeight);
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  await page.setViewportSize({ width: width + 4, height: height + 4 });
  await page.setContent(`<style>html,body{margin:0;background:transparent}img{display:block;width:${width}px;height:${height}px}</style><img src="${dataUrl}">`);
  await page.locator("img").waitFor({ state: "visible" });
  await page.screenshot({
    path: path.join(logoDir, source.raster),
    omitBackground: true,
    clip: { x: 0, y: 0, width, height },
  });
  console.log(`rendered ${source.raster}: ${width}x${height}`);
}

await browser.close();
