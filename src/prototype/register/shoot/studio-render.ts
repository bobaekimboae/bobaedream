import { FPS, type EditPart } from "./studio-model";

export async function inspectStudioMedia(blob: Blob) {
  const mb = await import("mediabunny");
  const input = new mb.Input({
    source: new mb.BlobSource(blob),
    formats: mb.ALL_FORMATS,
  });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track || !(await track.canDecode()))
      throw new Error(
        "이 영상 형식은 기기에서 읽을 수 없어요. MP4 영상을 선택해 주세요.",
      );
    const duration = await input.computeDuration();
    if (!Number.isFinite(duration) || duration <= 0 || duration > 600)
      throw new Error("10분 이하의 정상적인 영상 파일을 선택해 주세요.");
    return { duration, hasAudio: Boolean(await input.getPrimaryAudioTrack()) };
  } finally {
    input.dispose();
  }
}

function line(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
) {
  let fit = text;
  while (fit.length && ctx.measureText(fit).width > max) fit = fit.slice(0, -1);
  ctx.fillText(fit === text ? fit : `${fit.slice(0, -1)}…`, x, y, max);
}

/** Local, frame-accurate edit. No external upload, AI generation, or invented footage. */
export async function renderStudioMp4(
  plan: EditPart[],
  vehicle: string,
  width: 720 | 1080,
  signal: AbortSignal,
  onProgress: (n: number) => void,
): Promise<{ blob: Blob; cover: Blob }> {
  if (!plan.length)
    throw new Error("촬영하거나 앨범에서 영상을 추가해 주세요.");
  const mb = await import("mediabunny");
  const height = (width * 16) / 9;
  if (!(await mb.getFirstEncodableVideoCodec(["avc"], { width, height })))
    throw new Error(
      "이 브라우저는 H.264 MP4 생성을 지원하지 않아요. 최신 Chrome 또는 Safari에서 열어 주세요.",
    );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("영상 화면을 만들 수 없어요.");
  const audioNeeded = plan.some(
    (p) => p.part.keepAudio && p.part.media?.hasAudio,
  );
  if (
    audioNeeded &&
    !(await mb.getFirstEncodableAudioCodec(["aac"], {
      numberOfChannels: 2,
      sampleRate: 48000,
    }))
  )
    throw new Error(
      "이 기기는 AAC 음성 출력을 지원하지 않아요. 음성을 보존하려면 다른 브라우저를 사용하거나, 각 부위의 현장음을 꺼 주세요.",
    );
  const output = new mb.Output({
    format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new mb.BufferTarget(),
  });
  const video = new mb.CanvasSource(canvas, {
    codec: "avc",
    bitrate: width === 1080 ? 6_000_000 : 3_500_000,
    keyFrameInterval: 2,
  });
  const audio = audioNeeded
    ? new mb.AudioSampleSource({ codec: "aac", bitrate: 128_000 })
    : null;
  output.addVideoTrack(video, { frameRate: FPS });
  if (audio) output.addAudioTrack(audio);
  let cover: Blob | null = null;
  let outputFrame = 0;
  const totalFrames = plan.reduce((n, p) => n + p.frames, 0);
  const abort = () => {
    if (signal.aborted)
      throw new DOMException("편집을 취소했어요.", "AbortError");
  };
  const scale = width / 720;
  try {
    await document.fonts.ready;
    await output.start();
    for (const [index, entry] of plan.entries()) {
      abort();
      const input = new mb.Input({
        source: new mb.BlobSource(entry.part.media!.blob),
        formats: mb.ALL_FORMATS,
      });
      const offset = outputFrame / FPS;
      try {
        const track = await input.getPrimaryVideoTrack();
        if (!track || !(await track.canDecode()))
          throw new Error(`${entry.part.label} 영상을 읽을 수 없어요.`);
        const sink = new mb.CanvasSink(track, {
          width,
          height,
          fit: "contain",
          poolSize: 2,
        });
        const timestamps = Array.from(
          { length: entry.frames },
          (_, frame) => entry.start + frame / FPS,
        );
        let frame = 0;
        for await (const image of sink.canvasesAtTimestamps(timestamps)) {
          abort();
          if (!image)
            throw new Error(
              `${entry.part.label}의 시작 구간을 읽을 수 없어요. 시작 시간을 조금 뒤로 바꿔 주세요.`,
            );
          ctx.fillStyle = "#080c13";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(image.canvas, 0, 0, width, height);
          ctx.save();
          ctx.scale(scale, scale);
          const grad = ctx.createLinearGradient(0, 860, 0, 1140);
          grad.addColorStop(0, "rgba(6,12,22,0)");
          grad.addColorStop(1, "rgba(6,12,22,.92)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 860, 720, 420);
          ctx.fillStyle = "#fff";
          ctx.font = "700 25px Pretendard, sans-serif";
          ctx.fillText("보배드림", 56, 124);
          ctx.fillStyle = "#72a8ff";
          ctx.font = "600 21px Pretendard, sans-serif";
          ctx.fillText(
            `${String(index + 1).padStart(2, "0")} / ${String(plan.length).padStart(2, "0")}`,
            56,
            940,
          );
          ctx.fillStyle = "#fff";
          ctx.font = "700 38px Pretendard, sans-serif";
          line(ctx, vehicle || "차량 소개", 56, 994, 608);
          ctx.font = "600 30px Pretendard, sans-serif";
          line(ctx, entry.part.caption || entry.part.label, 56, 1045, 608);
          // A subtle reveal of confirmed user copy, not a fabricated option annotation.
          ctx.fillStyle = "#3478f6";
          ctx.fillRect(
            56,
            1070,
            608 * Math.min(1, (frame + 1) / Math.min(18, entry.frames)),
            4,
          );
          ctx.restore();
          if (!cover)
            cover = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, "image/jpeg", 0.9),
            );
          await video.add(outputFrame / FPS, 1 / FPS);
          outputFrame++;
          frame++;
          onProgress(Math.min(0.97, (outputFrame / totalFrames) * 0.94));
        }
        if (audio) {
          if (typeof OfflineAudioContext === "undefined")
            throw new Error(
              "이 기기는 음성 편집을 지원하지 않아요. 다른 브라우저에서 열어 주세요.",
            );
          // Normalise each clip before adding it: phones/album files can mix mono,
          // stereo, 44.1 kHz and 48 kHz. AudioSampleSource requires constant parameters.
          const offline = new OfflineAudioContext(
            2,
            Math.round(entry.seconds * 48000),
            48000,
          );
          if (entry.part.keepAudio && entry.part.media!.hasAudio) {
            const at = await input.getPrimaryAudioTrack();
            if (!at || !(await at.canDecode()))
              throw new Error(
                `${entry.part.label}의 음성을 읽을 수 없어요. 현장음을 끄거나 다른 파일을 선택해 주세요.`,
              );
            const end = entry.start + entry.seconds;
            for await (const sample of new mb.AudioSampleSink(at).samples(
              entry.start,
              end,
            )) {
              try {
                abort();
                const from = Math.max(
                  0,
                  Math.ceil(
                    (entry.start - sample.timestamp) * sample.sampleRate,
                  ),
                );
                const to = Math.min(
                  sample.numberOfFrames,
                  Math.floor((end - sample.timestamp) * sample.sampleRate),
                );
                if (to <= from) continue;
                const cut = sample.trim(from, to);
                try {
                  const source = offline.createBufferSource();
                  source.buffer = cut.toAudioBuffer();
                  source.connect(offline.destination);
                  source.start(Math.max(0, cut.timestamp - entry.start));
                } finally {
                  cut.close();
                }
              } finally {
                sample.close();
              }
            }
          }
          const mixed = await offline.startRendering();
          abort();
          for (const sample of mb.AudioSample.fromAudioBuffer(mixed, offset)) {
            try {
              await audio.add(sample);
            } finally {
              sample.close();
            }
          }
        }
      } finally {
        input.dispose();
      }
    }
    video.close();
    audio?.close();
    abort();
    await output.finalize();
    abort();
    const buffer = (output.target as InstanceType<typeof mb.BufferTarget>)
      .buffer;
    if (!buffer || !cover) throw new Error("완성 영상을 만들지 못했어요.");
    onProgress(1);
    return { blob: new Blob([buffer], { type: "video/mp4" }), cover };
  } catch (error) {
    await output.cancel().catch(() => undefined);
    throw error;
  }
}
