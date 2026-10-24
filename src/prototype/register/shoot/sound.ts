// 촬영 찰칵음. 58 앱의 셔터음 원본 파일은 받을 수 없어(폰 화면 녹화에 소리가 담기지 않음)
// Web Audio로 직접 만든다: 짧은 잡음 두 번(셔터 막이 열리고 닫히는 소리) + 낮은 '톡'.
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function burst(ac: AudioContext, at: number, length: number, gain: number, freq: number) {
  const frames = Math.floor(ac.sampleRate * length);
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 3);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = 0.9;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(band).connect(g).connect(ac.destination);
  src.start(at);
}

/** 사진 셔터 「찰칵」 */
export function playShutter() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.005;
  burst(ac, t, 0.045, 0.9, 3200);
  burst(ac, t + 0.075, 0.06, 0.75, 2200);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

/** 영상 녹화 시작·일시정지 「삑」(짧은 사인파) */
export function playRecordTick(high = true) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.005;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = high ? 1320 : 880;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.16);
}
