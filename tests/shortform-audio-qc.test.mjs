import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runFfmpeg, makeDialogueMix, checkDialogueTiming } from '../scripts/lib/shortform-audio.mjs';
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bobaedream-audio-qc-'));
const source = path.join(directory, 'reference.wav');
runFfmpeg(['-v','error','-f','lavfi','-i','aevalsrc=0.3*sin(2*PI*(170*t+173*t*t))*(0.7+0.3*sin(2*PI*3.7*t)):s=16000:d=3','-c:a','pcm_s16le','-y',source]);
test('aligned stereo narration passes the measured 250ms contract', () => {
  const target = path.join(directory, 'aligned.wav');
  makeDialogueMix({ voice: source, output: target, delayMs: 250, durationSeconds: 4 });
  const result = checkDialogueTiming({ reference: source, target, expectedDelayMs: 250, expectedDurationSeconds: 4 });
  assert.equal(result.technicalPassed, true, JSON.stringify(result.errors));
  assert.equal(result.maxMeasuredChannelSkewMs, 0);
});
test('the actual regression: left 250ms / right 0ms is blocked despite valid duration', () => {
  const target = path.join(directory, 'skewed.wav');
  runFfmpeg(['-v','error','-i',source,'-af','pan=stereo|c0=c0|c1=c0,adelay=250|0,apad=whole_dur=4,atrim=duration=4','-y',target]);
  const result = checkDialogueTiming({ reference: source, target, expectedDelayMs: 250, expectedDurationSeconds: 4 });
  assert.equal(result.durationSeconds, 4);
  assert.equal(result.technicalPassed, false);
  assert.ok(result.maxMeasuredChannelSkewMs >= 249);
});
test('equal channels at the wrong offset are blocked to protect caption sync', () => {
  const target = path.join(directory, 'wrong-offset.wav');
  makeDialogueMix({ voice: source, output: target, delayMs: 500, durationSeconds: 4 });
  const result = checkDialogueTiming({ reference: source, target, expectedDelayMs: 250, expectedDurationSeconds: 4 });
  assert.equal(result.technicalPassed, false);
  assert.ok(result.errors.some(e => e.includes('violates')));
});
test('a strong delayed second narration copy is rejected even with aligned stereo', () => {
  const target = path.join(directory, 'double-voice.wav');
  runFfmpeg(['-v','error','-i',source,'-filter_complex','[0:a]asplit[a][b];[a]adelay=250:all=1[a1];[b]adelay=450:all=1,volume=0.5[b1];[a1][b1]amix=inputs=2:normalize=0,pan=stereo|c0=c0|c1=c0,apad=whole_dur=4,atrim=duration=4[out]','-map','[out]','-y',target]);
  const result = checkDialogueTiming({ reference: source, target, expectedDelayMs: 250, expectedDurationSeconds: 4 });
  assert.equal(result.technicalPassed, false);
  assert.ok(result.errors.some(e => e.includes('coherence')));
});
test('different quiet L/R background beds do not trigger false stereo-skew alarms', () => {
  const target = path.join(directory, 'quiet-stereo-bed.wav');
  runFfmpeg(['-v','error','-i',source,'-f','lavfi','-i','aevalsrc=0.005*sin(2*PI*650*t)|0.005*sin(2*PI*1030*t):s=16000:d=4','-filter_complex','[0:a]adelay=250:all=1,pan=stereo|c0=c0|c1=c0[v];[v][1:a]amix=inputs=2:normalize=0,apad=whole_dur=4,atrim=duration=4[out]','-map','[out]','-y',target]);
  const result = checkDialogueTiming({ reference: source, target, expectedDelayMs: 250, expectedDurationSeconds: 4 });
  assert.equal(result.technicalPassed, true, JSON.stringify(result.errors));
});
