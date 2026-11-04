import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDialogueTiming } from './lib/shortform-audio.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; };
const manifestPath = path.resolve(root, option('--manifest', 'media-contracts/shortform-audio.json'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!manifest.entries?.length) throw new Error('Audio contract has no managed outputs');
const known = new Set([...manifest.entries.map(e => e.target), ...(manifest.exemptions ?? []).map(e => e.target)]);
const errors = [];
for (const directory of manifest.managedDirectories ?? []) {
  for (const file of fs.readdirSync(path.resolve(root, directory))) {
    const relative = `${directory}/${file}`;
    if (/\.mp4$/i.test(file) && !known.has(relative)) errors.push(`Missing audio contract: ${relative}`);
  }
}
const results = manifest.entries.map(entry => ({ target: entry.target, ...checkDialogueTiming({ reference: path.resolve(root, entry.reference), target: path.resolve(root, entry.target), expectedDelayMs: entry.expectedDelayMs, expectedDurationSeconds: entry.durationSeconds }) }));
const report = { technicalPassed: errors.length === 0 && results.every(r => r.technicalPassed), errors, results };
const output = option('--report');
if (output) fs.writeFileSync(path.resolve(root, output), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.technicalPassed) process.exitCode = 1;
