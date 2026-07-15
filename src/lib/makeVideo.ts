// In-browser day video: draws photos onto a canvas with crossfade + caption overlay,
// records via MediaRecorder, optionally mixing the day's audio narrations as a soundtrack.
// Honest caveat: quality is "good enough for WhatsApp", not cinematic. iOS Safari support
// for canvas.captureStream is spotty — videoSupported() lets the UI fall back to ZIP.

export interface VideoPhoto {
  url: string;
  caption?: string;
  placeName?: string;
  ts: number;
}

export interface VideoOpts {
  photos: VideoPhoto[];
  audioUrls: string[];
  title: string;
  secPerPhoto?: number;
  onProgress?: (msg: string) => void;
}

export function videoSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const c = document.createElement('canvas');
  return typeof (c as unknown as { captureStream?: unknown }).captureStream === 'function' && typeof MediaRecorder !== 'undefined';
}

function pickVideoMime(): string {
  const cands = [
    'video/mp4;codecs=h264,aac',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  for (const m of cands) {
    try {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* ignore */
    }
  }
  return '';
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number, alpha: number, scale = 1) {
  const ir = img.width / img.height;
  const cr = W / H;
  let dw: number, dh: number;
  if (ir > cr) {
    dh = H * scale;
    dw = dh * ir;
  } else {
    dw = W * scale;
    dh = dw / ir;
  }
  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.globalAlpha = 1;
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function drawText(ctx: CanvasRenderingContext2D, W: number, H: number, photo: VideoPhoto, title: string) {
  const g = ctx.createLinearGradient(0, H - 240, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = g;
  ctx.fillRect(0, H - 240, W, 240);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
  const place = photo.placeName ?? '';
  if (place) ctx.fillText(truncate(ctx, place, W - 80), 40, H - 76);

  ctx.font = '500 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  const sub = photo.caption || title;
  if (sub) ctx.fillText(truncate(ctx, sub, W - 80), 40, H - 34);
}

async function startAudioQueue(
  ctx: AudioContext,
  dest: MediaStreamAudioDestinationNode,
  urls: string[]
): Promise<() => void> {
  const buffers: AudioBuffer[] = [];
  for (const u of urls) {
    try {
      const resp = await fetch(u);
      const arr = await resp.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      buffers.push(buf);
    } catch {
      /* skip undecodable */
    }
  }
  let when = ctx.currentTime + 0.15;
  const sources: AudioBufferSourceNode[] = [];
  for (const buf of buffers) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(dest);
    src.start(when);
    when += buf.duration;
    sources.push(src);
  }
  return () =>
    sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
}

export async function renderDayVideo(opts: VideoOpts): Promise<Blob> {
  const { photos, audioUrls, title } = opts;
  const secPerPhoto = opts.secPerPhoto ?? 3;
  const W = 1280;
  const H = 720;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');

  opts.onProgress?.('Carregando fotos…');
  const imgs: HTMLImageElement[] = [];
  for (const p of photos) {
    try {
      imgs.push(await loadImg(p.url));
    } catch {
      /* skip broken */
    }
  }
  if (!imgs.length) throw new Error('no images');

  const fps = 30;
  const stream = (canvas as unknown as { captureStream: (f: number) => MediaStream }).captureStream(fps);

  let audioCtx: AudioContext | null = null;
  let stopAudio: () => void = () => {};
  if (audioUrls.length) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AC();
      await audioCtx.resume?.();
      const dest = audioCtx.createMediaStreamDestination();
      stream.addTrack(dest.stream.getAudioTracks()[0]);
      stopAudio = await startAudioQueue(audioCtx, dest, audioUrls);
    } catch {
      /* no audio track */
    }
  }

  const mime = pickVideoMime();
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: rec.mimeType || 'video/webm' }));
  });

  rec.start();

  const totalMs = Math.max(imgs.length * secPerPhoto, 4) * 1000;
  const fadeMs = 650;
  const start = performance.now();

  await new Promise<void>((resolve) => {
    function frame(now: number) {
      const t = now - start;
      if (t >= totalMs) {
        resolve();
        return;
      }
      const idxFloat = t / (secPerPhoto * 1000);
      const idx = Math.min(Math.floor(idxFloat), imgs.length - 1);

      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, W, H);

      // gentle Ken Burns: 1.0 → 1.06 across each photo
      const into = (idxFloat - idx) * secPerPhoto * 1000;
      const kb = 1 + 0.06 * (into / (secPerPhoto * 1000));
      drawCover(ctx, imgs[idx], W, H, 1, kb);

      const remain = secPerPhoto * 1000 - into;
      if (remain < fadeMs && idx < imgs.length - 1) {
        drawCover(ctx, imgs[idx + 1], W, H, 1 - remain / fadeMs, 1);
      }

      drawText(ctx, W, H, photos[idx], title);
      opts.onProgress?.(`Renderizando… ${Math.round((t / totalMs) * 100)}%`);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  rec.stop();
  stopAudio();
  try {
    audioCtx?.close?.();
  } catch {
    /* ignore */
  }
  return done;
}
