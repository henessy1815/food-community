/**
 * logo.png(1024² JPEG, 크림 배경) → PWA·파비콘 에셋 생성
 *
 *   node scripts/generate-pwa-assets.mjs
 *
 * 생성물
 * - src/app/favicon.ico          16·32·48 투명 배경 (PNG 임베드 ICO)
 * - src/app/icon.png             192² 투명 배경 (<link rel="icon">)
 * - src/app/apple-icon.png       180² 크림 배경 (iOS는 투명 영역을 검게 칠하므로 불투명)
 * - public/icons/icon-*.png      manifest 아이콘 (any: 투명 · maskable: 크림 배경 + 안전 영역)
 * - public/splash/*.png          iOS apple-touch-startup-image (기기별 세로 해상도)
 * - src/lib/pwa/apple-splash.ts  layout metadata용 startupImage 목록
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "logo.png");

/** 로고 배경 크림색 — manifest background_color · 스플래시 배경과 동일 */
const SPLASH_BG = { r: 245, g: 237, b: 214 };
/** 로고 스탬프 빨강 (가장자리 안티앨리어싱 복원용) */
const INK = { r: 197, g: 62, b: 14 };

/** iOS 기기 (CSS 폭 × 높이 @ DPR) — 세로 모드 */
const APPLE_DEVICES = [
  // iPhone
  [440, 956, 3], // 16·17 Pro Max
  [420, 912, 3], // Air
  [402, 874, 3], // 16·17 Pro, 17
  [430, 932, 3], // 14 Pro Max, 15 Plus·Pro Max, 16 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16, 16e
  [428, 926, 3], // 12·13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 13, 14
  [375, 812, 3], // X, XS, 11 Pro, 12·13 mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [414, 896, 2], // XR, 11
  [414, 736, 3], // 6s·7·8 Plus
  [375, 667, 2], // 6s·7·8, SE 2·3세대
  [320, 568, 2], // SE 1세대
  // iPad
  [1032, 1376, 2], // Pro 13 (M4)
  [1024, 1366, 2], // Pro 12.9
  [834, 1210, 2], // Pro 11 (M4)
  [834, 1194, 2], // Pro 11
  [820, 1180, 2], // Air 10.9
  [834, 1112, 2], // Pro 10.5
  [810, 1080, 2], // 10.2
  [768, 1024, 2], // 9.7, mini 5
  [744, 1133, 2], // mini 6
];

const dist = (data, i, c) =>
  Math.hypot(data[i] - c.r, data[i + 1] - c.g, data[i + 2] - c.b);

/** 크림 배경을 투명하게 — 테두리에서 시작한 flood fill로 바깥 배경만 지우고 안쪽 크림(링·글자)은 유지 */
async function cutoutLogo() {
  const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const N = W * H;
  const TOLERANCE = 48;

  // 1) 바깥 배경 마스크 (4방향 flood fill)
  const bg = new Uint8Array(N);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const p = stack.pop();
    if (bg[p] || dist(data, p * 3, SPLASH_BG) > TOLERANCE) continue;
    bg[p] = 1;
    const x = p % W;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (p >= W) stack.push(p - W);
    if (p < N - W) stack.push(p + W);
  }

  // 2) 배경과 맞닿은 가장자리(3px)는 크림↔빨강 혼합비로 알파를 복원해 매끄럽게
  const EDGE = 3;
  const nearBg = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    if (!bg[p]) continue;
    const x = p % W;
    const y = (p - x) / W;
    for (let dy = -EDGE; dy <= EDGE; dy++) {
      for (let dx = -EDGE; dx <= EDGE; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H) nearBg[ny * W + nx] = 1;
      }
    }
  }
  const inkToBg = Math.hypot(INK.r - SPLASH_BG.r, INK.g - SPLASH_BG.g, INK.b - SPLASH_BG.b);
  const out = Buffer.alloc(N * 4);
  for (let p = 0; p < N; p++) {
    const i = p * 3;
    const o = p * 4;
    out[o] = data[i];
    out[o + 1] = data[i + 1];
    out[o + 2] = data[i + 2];
    if (bg[p]) {
      out[o + 3] = 0;
    } else if (nearBg[p]) {
      const a = Math.min(1, dist(data, i, SPLASH_BG) / inkToBg);
      out[o + 3] = Math.round(a * 255);
      out[o] = INK.r;
      out[o + 1] = INK.g;
      out[o + 2] = INK.b;
    } else {
      out[o + 3] = 255;
    }
  }

  // 3) 바깥에 남은 잡티(워터마크 등)는 제거 — 가장 큰 덩어리(스탬프)만 남김
  const label = new Int32Array(N).fill(-1);
  let best = { id: -1, size: 0 };
  for (let s = 0, id = 0; s < N; s++) {
    if (label[s] !== -1 || out[s * 4 + 3] === 0) continue;
    let size = 0;
    stack.push(s);
    label[s] = id;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % W;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) {
        if (q < 0 || q >= N || label[q] !== -1 || out[q * 4 + 3] === 0) continue;
        label[q] = id;
        stack.push(q);
      }
    }
    if (size > best.size) best = { id, size };
    id++;
  }
  let [minX, minY, maxX, maxY] = [W, H, 0, 0];
  for (let p = 0; p < N; p++) {
    if (label[p] !== best.id) {
      out[p * 4 + 3] = 0;
      continue;
    }
    const x = p % W;
    const y = (p - x) / W;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  // 4) 스탬프 영역으로 잘라 정사각형 캔버스 중앙에 배치
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const side = Math.max(cropW, cropH);
  const cropped = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .png()
    .toBuffer();
  return sharp({
    create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: cropped, left: Math.floor((side - cropW) / 2), top: Math.floor((side - cropH) / 2) }])
    .png()
    .toBuffer();
}

/** 투명 로고를 size² 캔버스에 scale 비율로 배치 (background 없으면 투명) */
async function render(logo, size, { scale = 1, background } = {}) {
  const inner = Math.round(size * scale);
  const mark = await sharp(logo).resize(inner, inner, { kernel: "lanczos3" }).png().toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ? { ...background, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** PNG 이미지를 그대로 담는 ICO (Vista+ 지원 포맷) */
function toIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, buffer }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // 팔레트 없음
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(buffer.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buffer.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buffer)]);
}

async function write(rel, buffer) {
  const path = join(ROOT, rel);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
  console.log("✓", rel);
}

const logo = await cutoutLogo();

// 파비콘 — 투명 배경, 작은 크기에서도 보이도록 여백 없이 꽉 채움
const favicons = await Promise.all([16, 32, 48].map(async (size) => ({ size, buffer: await render(logo, size) })));
await write("src/app/favicon.ico", toIco(favicons));
await write("src/app/icon.png", await render(logo, 192));

// iOS 홈 화면 아이콘 — 불투명 크림 배경 (iOS가 모서리를 둥글게 자름)
await write("src/app/apple-icon.png", await render(logo, 180, { scale: 0.84, background: SPLASH_BG }));

// manifest 아이콘 — any: 투명 / maskable: 지름 80% 안전 영역 안쪽에 맞춤
await write("public/icons/icon-192.png", await render(logo, 192));
await write("public/icons/icon-512.png", await render(logo, 512));
await write("public/icons/maskable-512.png", await render(logo, 512, { scale: 0.7, background: SPLASH_BG }));

// iOS 스플래시 — 크림 배경 중앙에 로고
const splash = [];
for (const [w, h, dpr] of APPLE_DEVICES) {
  const [pw, ph] = [w * dpr, h * dpr];
  const name = `apple-splash-${pw}x${ph}.png`;
  const markSize = Math.round(Math.min(pw, ph) * 0.36);
  const mark = await sharp(logo).resize(markSize, markSize, { kernel: "lanczos3" }).png().toBuffer();
  const image = await sharp({ create: { width: pw, height: ph, channels: 3, background: SPLASH_BG } })
    .composite([{ input: mark, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  await write(`public/splash/${name}`, image);
  splash.push({
    url: `/splash/${name}`,
    media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
  });
}

const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("");
await write(
  "src/lib/pwa/apple-splash.ts",
  Buffer.from(
    `// scripts/generate-pwa-assets.mjs 가 생성 — 직접 수정하지 말 것\n\n` +
      `/** 스플래시·manifest 배경색 (logo.png 크림 배경) */\n` +
      `export const SPLASH_BACKGROUND = "${hex(SPLASH_BG)}";\n\n` +
      `/** iOS apple-touch-startup-image — 기기별 세로 해상도 */\n` +
      `export const appleSplashScreens = ${JSON.stringify(splash, null, 2)};\n`,
  ),
);
