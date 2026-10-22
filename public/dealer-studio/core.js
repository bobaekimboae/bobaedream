export const palettes = {
  clean: { name: '클린 쇼룸', background: '#f5f4ef', ink: '#172522', accent: '#17694e', label: '차량에 집중하는 담백한 소개' },
  night: { name: '미드나잇', background: '#111822', ink: '#ffffff', accent: '#bed9ff', label: '깊고 차분한 프리미엄 무드' },
  bold: { name: '볼드 드라이브', background: '#193dc7', ink: '#ffffff', accent: '#e6ff80', label: '가격과 핵심 정보를 선명하게' },
};
export function scenesFor(state) {
  const count = state.photos.length;
  if (!count) return [];
  const end = state.endCard ? 3 : 0;
  const each = (Number(state.duration) - end) / count;
  return [...state.photos.map((photo, index) => ({ ...photo, index, start: index * each, duration: each })), ...(end ? [{ id: 'end', index: count, start: Number(state.duration) - end, duration: end, end: true }] : [])];
}
export function sceneAt(state, time) {
  const scenes = scenesFor(state);
  return scenes.find(s => time >= s.start && time < s.start + s.duration) ?? scenes.at(-1);
}
export const stripCompany = value => String(value ?? '').replace(/\(주\)|\(유\)|주식회사/g, '').trim();
export const safeFilename = value => String(value).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').slice(0, 65) || '차량-숏폼';
export function socialCaption(state) {
  return [state.title, [state.year && `${state.year}년식`, state.mileage && `${state.mileage}km`, state.price].filter(Boolean).join(' · '), state.highlights, [state.gallery, state.company].filter(Boolean).join(' · '), [state.dealer, state.phone].filter(Boolean).join(' | '), '#중고차 #보배드림 #차량소개'].filter(Boolean).join('\n');
}
function wrapped(ctx, value, x, y, width, size, maxLines = 2, weight = 700) {
  ctx.font = `${weight} ${size}px "Pretendard Variable", Pretendard, sans-serif`;
  const lines = []; let line = '';
  for (const char of String(value ?? '')) {
    if (char === '\r') continue;
    if (char === '\n') { lines.push(line); line = ''; continue; }
    if (ctx.measureText(line + char).width > width && line) { lines.push(line); line = ''; }
    line += char;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((text, i) => ctx.fillText(i === maxLines - 1 && lines.length > maxLines ? text.slice(0, -1) + '…' : text, x, y + i * size * 1.3));
  return Math.min(lines.length, maxLines) * size * 1.3;
}
export function drawFrame(canvas, state, images, time) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width, height = canvas.height;
  const scale = width / 540;
  ctx.save(); ctx.scale(scale, scale);
  const palette = palettes[state.template] ?? palettes.clean;
  ctx.fillStyle = palette.background; ctx.fillRect(0, 0, 540, 960);
  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = .65; wrapped(ctx, state.gallery || 'VEHICLE FILM', 36, 57, 465, 14, 1, 500); ctx.globalAlpha = 1;
  wrapped(ctx, state.company || '나의 매물 스튜디오', 36, 91, 465, 22, 1);
  const scene = sceneAt(state, time);
  if (!scene) { wrapped(ctx, '차량 사진을 추가해 주세요', 36, 450, 465, 26, 2); ctx.restore(); return; }
  if (scene.end) {
    ctx.fillStyle = palette.accent; ctx.fillRect(36, 190, 44, 5);
    ctx.fillStyle = palette.ink;
    wrapped(ctx, state.cta || '이 차량이 궁금하다면', 36, 275, 465, 42, 3);
    wrapped(ctx, state.title, 36, 495, 465, 23, 2, 500);
    ctx.fillStyle = palette.accent; ctx.fillRect(36, 610, 468, 126);
    ctx.fillStyle = state.template === 'clean' ? '#ffffff' : '#132022';
    wrapped(ctx, state.dealer ? `${state.dealer} 딜러` : '판매자에게 문의하세요', 60, 655, 420, 22, 1, 600);
    wrapped(ctx, state.phone || state.company || '매물 상세에서 확인하세요', 60, 703, 420, 30, 1);
    ctx.fillStyle = palette.ink; ctx.globalAlpha = .5;
    wrapped(ctx, '좋은 차와 좋은 인연을 연결합니다.', 36, 852, 465, 16, 1, 400); ctx.globalAlpha = 1;
  } else {
    const image = images.get(scene.id);
    const p = Math.max(0, Math.min(1, (time - scene.start) / scene.duration));
    const box = { x: 0, y: 143, w: 540, h: 462 };
    ctx.fillStyle = state.template === 'clean' ? '#eaece8' : '#1c2735'; ctx.fillRect(box.x, box.y, box.w, box.h);
    if (image) {
      // Contain the original: motion only moves inside the spare room, never crops the car.
      const ratio = Math.min(508 / image.width, 430 / image.height);
      const zoom = state.motion ? .96 + .04 * (p * p * (3 - 2 * p)) : 1;
      const w = image.width * ratio * zoom, h = image.height * ratio * zoom;
      ctx.drawImage(image, (540 - w) / 2, box.y + (box.h - h) / 2, w, h);
    }
    if (state.logo && images.get('logo')) {
      const logo = images.get('logo'); const r = Math.min(90 / logo.width, 42 / logo.height);
      ctx.drawImage(logo, 540 - 36 - logo.width * r, 105 - logo.height * r, logo.width * r, logo.height * r);
    }
    ctx.fillStyle = palette.accent;
    wrapped(ctx, state.kicker || '지금 만나보세요', 36, 653, 465, 16, 1, 650);
    ctx.fillStyle = palette.ink;
    wrapped(ctx, state.title, 36, 700, 468, 32, 2);
    const details = [state.year && `${state.year}년식`, state.mileage && `${state.mileage}km`, state.fuel].filter(Boolean).join('  ·  ');
    ctx.globalAlpha = .65; wrapped(ctx, details, 36, 791, 465, 17, 1, 450); ctx.globalAlpha = 1;
    wrapped(ctx, state.price || '가격 상담', 36, 843, 465, 34, 1, 800);
    ctx.globalAlpha = .78;
    wrapped(ctx, state.highlights, 36, 878, 465, 16, 2, 500);
    if (state.captions) wrapped(ctx, scene.caption, 36, 924, 465, 14, 1, 500);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = palette.ink; ctx.globalAlpha = .15; ctx.fillRect(36, 937, 468, 2);
  ctx.globalAlpha = 1; ctx.fillStyle = palette.accent; ctx.fillRect(36, 937, 468 * Math.min(1, time / Number(state.duration)), 2);
  ctx.restore();
}

export async function mixAudio(state, files) {
  const duration = Number(state.duration), rate = 48000;
  const ctx = new OfflineAudioContext(2, rate * duration, rate);
  const volume = Math.max(0, Math.min(1, Number(state.volume)));
  const addFile = async (blob, gainValue, loop) => {
    if (!blob) return;
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = buffer; source.loop = loop;
    gain.gain.setValueAtTime(gainValue, 0); gain.gain.setValueAtTime(gainValue, Math.max(0, duration - 1.5)); gain.gain.linearRampToValueAtTime(0, duration);
    source.connect(gain).connect(ctx.destination); source.start(0); source.stop(duration);
  };
  if (state.music === 'upload') await addFile(files.music, volume, true);
  else if (state.music !== 'off' && volume > 0) {
    const roots = state.music === 'drive' ? [146.83, 174.61, 130.81, 164.81] : [130.81, 164.81, 110, 146.83];
    const beat = state.music === 'drive' ? .5 : .8;
    for (let t = 0; t < duration; t += beat) {
      const base = roots[Math.floor(t / 4) % roots.length];
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = base * (Math.round(t / beat) % 3 === 0 ? 2 : 1);
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(volume * .16, t + .025); gain.gain.exponentialRampToValueAtTime(.0001, Math.min(duration, t + beat * 1.9));
      osc.connect(gain).connect(ctx.destination); osc.start(t); osc.stop(Math.min(duration, t + beat * 2));
    }
  }
  await addFile(files.voice, .85, false);
  return ctx.startRendering();
}

export async function encodeMp4(state, images, files, { height = 1280, onProgress, signal } = {}) {
  if (!globalThis.VideoEncoder || !globalThis.AudioEncoder || !globalThis.Mp4Muxer) throw new Error('이 브라우저는 MP4 만들기를 지원하지 않습니다. 최신 Chrome 또는 Edge에서 열어 주세요.');
  const width = height * 9 / 16, fps = 30, rate = 48000;
  const config = { codec: height === 1920 ? 'avc1.640032' : 'avc1.42001f', width, height, bitrate: height === 1920 ? 8000000 : 4000000, framerate: fps };
  if (!(await VideoEncoder.isConfigSupported(config)).supported || !(await AudioEncoder.isConfigSupported({codec:'mp4a.40.2',sampleRate:rate,numberOfChannels:2,bitrate:160000})).supported) throw new Error('H.264·AAC 출력이 지원되지 않습니다. 최신 Chrome 또는 Edge에서 다시 시도해 주세요.');
  const aborted = () => { if (signal?.aborted) throw new DOMException('출력을 취소했습니다.', 'AbortError'); };
  aborted(); onProgress?.(1, '음악과 녹음 파일 준비 중');
  const buffer = await mixAudio(state, files); aborted();
  const target = new Mp4Muxer.ArrayBufferTarget();
  const muxer = new Mp4Muxer.Muxer({ target, video: { codec:'avc',width,height,frameRate:fps }, audio:{codec:'aac',numberOfChannels:2,sampleRate:rate},fastStart:'in-memory',firstTimestampBehavior:'offset' });
  let failure;
  const video = new VideoEncoder({output:(chunk,meta)=>muxer.addVideoChunk(chunk,meta),error:error=>{failure=error;}});
  const audio = new AudioEncoder({output:(chunk,meta)=>muxer.addAudioChunk(chunk,meta),error:error=>{failure=error;}});
  const canvas = document.createElement('canvas'); canvas.width=width; canvas.height=height;
  try {
    video.configure({...config,latencyMode:'quality',avc:{format:'avc'}});
    audio.configure({codec:'mp4a.40.2',sampleRate:rate,numberOfChannels:2,bitrate:160000});
    const frames = Number(state.duration)*fps;
    for(let i=0;i<frames;i++) {
      aborted(); if(failure) throw failure;
      drawFrame(canvas,state,images,i/fps);
      const frame = new VideoFrame(canvas,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});
      video.encode(frame,{keyFrame:i%60===0}); frame.close();
      while(video.encodeQueueSize>6) { aborted(); if(failure) throw failure; await new Promise(resolve=>setTimeout(resolve,4)); }
      if(i%10===0) {onProgress?.(5+Math.round(i/frames*83),'차량 영상 만드는 중');await new Promise(resolve=>setTimeout(resolve,0));}
    }
    const channels = [buffer.getChannelData(0),buffer.getChannelData(1)];
    for(let at=0;at<buffer.length;at+=4800) {
      aborted(); if(failure) throw failure;
      const count=Math.min(4800,buffer.length-at), data=new Float32Array(count*2);
      channels.forEach((channel,i)=>data.set(channel.subarray(at,at+count),i*count));
      const frame=new AudioData({format:'f32-planar',sampleRate:rate,numberOfChannels:2,numberOfFrames:count,timestamp:Math.round(at/rate*1e6),data});
      audio.encode(frame); frame.close();
      if(audio.encodeQueueSize>20) {await audio.flush();await new Promise(resolve=>setTimeout(resolve,0));}
    }
    onProgress?.(95,'MP4 파일 마무리 중'); await video.flush(); await audio.flush(); aborted(); if(failure) throw failure;
    muxer.finalize(); return new Blob([target.buffer],{type:'video/mp4'});
  } finally {if(video.state!=='closed')video.close();if(audio.state!=='closed')audio.close();}
}
