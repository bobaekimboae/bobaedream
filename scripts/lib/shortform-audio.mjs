import { spawnSync } from 'node:child_process';

export const AUDIT_SAMPLE_RATE = 16000;
const binary = (name) => process.env[name.toUpperCase() + '_PATH'] || name;
export function runFfmpeg(args, { binaryOutput = false } = {}) {
  const result = spawnSync(binary('ffmpeg'), args, { encoding: binaryOutput ? undefined : 'utf8', maxBuffer: 128 * 1024 * 1024, windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(String(result.stderr));
  return binaryOutput ? result.stdout : result.stderr;
}
export function probeMedia(input) {
  const result = spawnSync(binary('ffprobe'), ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', input], { encoding: 'utf8', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
  return JSON.parse(result.stdout);
}
export function makeDialogueMix({ voice, music, output, delayMs = 250, durationSeconds = 60 }) {
  if (!Number.isFinite(delayMs) || delayMs < 0 || !Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('Invalid audio timing');
  // Pin the narration to mono before delay, apply the delay to ALL channels,
  // then explicitly duplicate the aligned dry narration into L/R. A lone
  // `adelay=250` leaves any negotiated second channel undelayed (default all=false).
  const dialogue = `[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=mono,asetpts=N/SR/TB,volume=0.636396103,adelay=${delayMs}:all=1,pan=stereo|c0=c0|c1=c0,apad=whole_dur=${durationSeconds},atrim=duration=${durationSeconds}`;
  let graph;
  if (music) {
    graph = `${dialogue},asplit=2[voice][side];[1:a]atrim=start=8:end=${durationSeconds + 8},asetpts=PTS-STARTPTS,aresample=48000,volume=0.08,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, durationSeconds - 3)}:d=3[bed];[bed][side]sidechaincompress=threshold=0.03:ratio=5:attack=30:release=350[ducked];[voice][ducked]amix=inputs=2:duration=longest:normalize=0`;
  } else graph = dialogue;
  graph += `,alimiter=limit=0.95:level=false:latency=true,asetpts=N/SR/TB,apad=whole_dur=${durationSeconds},atrim=duration=${durationSeconds}[out]`;
  const inputs = ['-i', voice];
  if (music) inputs.push('-i', music);
  runFfmpeg(['-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', graph, '-map', '[out]', '-ar', '48000', '-ac', '2', '-y', output]);
}
function pcm(input, channel) {
  const args = ['-hide_banner', '-loglevel', 'error', '-i', input, '-map', '0:a:0'];
  if (channel !== undefined) args.push('-af', `pan=mono|c0=c${channel}`);
  else args.push('-ac', '1');
  args.push('-ar', String(AUDIT_SAMPLE_RATE), '-f', 'f32le', '-');
  const bytes = runFfmpeg(args, { binaryOutput: true });
  return Float32Array.from({ length: bytes.length / 4 }, (_, i) => bytes.readFloatLE(i * 4));
}
function fit(reference, target, lag, from, to, stride) {
  let rr = 0, tt = 0, rt = 0;
  for (let i = from; i < to; i += stride) {
    const j = i + lag;
    if (j < 0 || j >= target.length) continue;
    rr += reference[i] ** 2; tt += target[j] ** 2; rt += reference[i] * target[j];
  }
  return { correlation: rr && tt ? rt / Math.sqrt(rr * tt) : 0, gain: rr ? rt / rr : 0, lagSamples: lag, lagMs: lag / AUDIT_SAMPLE_RATE * 1000 };
}
function align(reference, target, expectedDelayMs, from, to) {
  const center = Math.round(expectedDelayMs * AUDIT_SAMPLE_RATE / 1000);
  const radius = AUDIT_SAMPLE_RATE / 2;
  let best = { correlation: -Infinity };
  for (let lag = center - radius; lag <= center + radius; lag += 16) {
    const result = fit(reference, target, lag, from, to, 24);
    if (result.correlation > best.correlation) best = result;
  }
  const coarse = best.lagSamples;
  for (let lag = coarse - 16; lag <= coarse + 16; lag++) {
    const result = fit(reference, target, lag, from, to, 4);
    if (result.correlation > best.correlation) best = result;
  }
  return fit(reference, target, best.lagSamples, from, to, 1);
}
export function checkDialogueTiming({ reference, target, expectedDelayMs = 250, expectedDurationSeconds, maxChannelSkewMs = 1, maxDelayErrorMs = 2, minCorrelation = 0.97 }) {
  const metadata = probeMedia(target);
  const audio = metadata.streams.filter(s => s.codec_type === 'audio');
  const errors = [];
  if (audio.length !== 1) errors.push(`Expected exactly one audio stream, got ${audio.length}`);
  if (audio[0]?.channels !== 2) errors.push(`Expected explicit stereo delivery, got ${audio[0]?.channels} channels`);
  const durationSeconds = Number(audio[0]?.duration ?? metadata.format.duration);
  if (expectedDurationSeconds !== undefined && Math.abs(durationSeconds - expectedDurationSeconds) > 0.1) errors.push('Audio duration differs from contract');
  if (errors.length) return { technicalPassed: false, errors, durationSeconds, windows: [], perceptualReviewStatus: 'not_assessed' };
  const source = pcm(reference);
  const channels = [pcm(target, 0), pcm(target, 1)];
  const length = source.length / AUDIT_SAMPLE_RATE;
  const width = Math.min(3, length / 4);
  const windows = [];
  for (const fraction of [0.03, 0.17, 0.34, 0.52, 0.72, 0.9]) {
    const start = Math.min(length - width, length * fraction);
    const from = Math.max(0, Math.round(start * AUDIT_SAMPLE_RATE));
    const to = Math.min(source.length, Math.round((start + width) * AUDIT_SAMPLE_RATE));
    let power = 0;
    for (let i = from; i < to; i++) power += source[i] ** 2;
    if (10 * Math.log10(power / (to - from) + 1e-30) < -45) continue;
    const measurements = channels.map(channel => align(source, channel, expectedDelayMs, from, to));
    const skewMs = Math.abs(measurements[0].lagMs - measurements[1].lagMs);
    const window = { startSeconds: start, endSeconds: start + width, left: measurements[0], right: measurements[1], skewMs };
    windows.push(window);
    if (skewMs > maxChannelSkewMs) errors.push(`Stereo narration skew ${skewMs.toFixed(3)}ms at ${start.toFixed(2)}s`);
    for (const [i, value] of measurements.entries()) {
      if (Math.abs(value.lagMs - expectedDelayMs) > maxDelayErrorMs) errors.push(`Channel ${i} narration delay ${value.lagMs.toFixed(3)}ms violates ${expectedDelayMs}ms contract`);
      if (value.correlation < minCorrelation) errors.push(`Channel ${i} narration coherence ${value.correlation.toFixed(4)} is below ${minCorrelation}`);
    }
  }
  if (windows.length < 3) errors.push('Insufficient audible reference windows to verify both channels');
  return { technicalPassed: errors.length === 0, errors, expectedDelayMs, durationSeconds, maxMeasuredChannelSkewMs: Math.max(0, ...windows.map(w => w.skewMs)), windows, perceptualReviewStatus: 'not_assessed', scope: 'Reference-based channel timing and coherence check; not a general reverb detector or a substitute for listening.' };
}
