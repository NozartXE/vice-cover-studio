// Vice Cover Studio — C5 Poster Triptych render engine.
// Draws the cover onto any 2D canvas: a sunset/neon sky with a giant block
// title, three (or one/two) photo columns, and a caption ribbon at the foot.
// Every letter, grade and frame is drawn here from scratch — no Rockstar
// logo, artwork or font anywhere. Photos stay on the user's machine.

/** The two on-brief colour grades. Sunset is the default. */
export const GRADES = {
  sunset: {
    skyTop: '#2a0a44', skyMid: '#c62e5e', skyLow: '#ff7a30', skyHorizon: '#ffc46e',
    sun: '#ffe9a8', sunGlow: 'rgba(255,190,100,0.55)',
    panelTop: 'rgba(255,110,60,0.05)', panelBottom: 'rgba(255,80,40,0.22)',
    titleFill: '#ffffff', subline: '#ffd23f', ribbon: '#1d0b2e', ribbonRule: '#ff7a30',
  },
  neon: {
    skyTop: '#12022e', skyMid: '#a3137f', skyLow: '#ff2e88', skyHorizon: '#2ee6ff',
    sun: '#ffe9fb', sunGlow: 'rgba(255,46,136,0.55)',
    panelTop: 'rgba(255,0,180,0.10)', panelBottom: 'rgba(0,220,255,0.16)',
    titleFill: '#ffffff', subline: '#2ee6ff', ribbon: '#0d0221', ribbonRule: '#ff2e88',
  },
};

/** A deterministic pseudo-random stream, so the grain is identical on every export. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Face-safe default crop: the visible window is biased toward the TOP of the
 * photo (bias 0.16), so a subject's head — which sits in the upper part of
 * almost every portrait — is never cropped away. Pan moves the window.
 * crop = { zoom: >=1, panX: -1..1, panY: -1..1 }.
 */
export function faceSafeBias(crop) {
  return Math.min(1, Math.max(0, 0.16 + (crop.panY + 1) * 0.42));
}

/** Draws one photo into rect with cover-fit, zoom and pan. Null photo = placeholder art. */
export function drawPhotoPanel(ctx, rect, photo, crop, grade, label) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!photo) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#3a1445');
    g.addColorStop(0.55, '#7a2340');
    g.addColorStop(1, '#ff7a30');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';
    const s = Math.max(13, Math.min(26, w * 0.09));
    ctx.font = `900 ${s}px "Arial Black", Arial, sans-serif`;
    ctx.fillText('DROP A PHOTO', x + w / 2, y + h / 2 - s * 0.4);
    ctx.font = `700 ${Math.max(11, s * 0.55)}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(label, x + w / 2, y + h / 2 + s * 0.9);
  } else {
    const iw = photo.naturalWidth || photo.width;
    const ih = photo.naturalHeight || photo.height;
    const base = Math.max(w / iw, h / ih);
    const scale = base * Math.max(1, crop.zoom || 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const panX = Math.min(1, Math.max(-1, crop.panX || 0));
    const dx = x - (dw - w) * (0.5 + panX * 0.5);
    const dy = y - (dh - h) * faceSafeBias(crop);
    ctx.drawImage(photo, dx, dy, dw, dh);
  }
  // Grade wash: warm sunset from the foot, or magenta/cyan for neon.
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, grade.panelTop);
  wash.addColorStop(1, grade.panelBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Thin white keyline around the panel, poster style.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.strokeRect(x, y, w, h);
}

/** The sunset/neon sky behind the title, with a glowing sun disc and a dark skyline.
 * The sun sits low on the horizon, behind the skyline, so its disc never
 * touches the title block (D4 fix); the skyline band starts at skylineTop —
 * always below the subline — so no bar ever sits behind a letter (D1 fix). */
export function drawTitleSky(ctx, x, y, w, h, grade, skylineTop) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.45, grade.skyMid);
  sky.addColorStop(0.8, grade.skyLow);
  sky.addColorStop(1, grade.skyHorizon);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // Low sun on the horizon, setting behind the skyline: clear of the title
  // in every size, its lower half cut by the foot of the sky.
  const sunX = x + w * 0.85;
  const sunY = y + h * 0.98;
  const sunR = Math.min(w, h) * 0.30;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 1.9);
  glow.addColorStop(0, grade.sunGlow);
  glow.addColorStop(1, 'rgba(255,190,100,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Low skyline silhouette along the foot of the sky, capped so its tallest
  // bar stays below the subline.
  ctx.fillStyle = 'rgba(24,6,32,0.85)';
  const base = y + h;
  const top = y + h * (skylineTop ?? 0.86);
  const maxBh = base - top;
  let bx = x;
  const rnd = mulberry32(5);
  while (bx < x + w) {
    const bw = w * (0.02 + rnd() * 0.04);
    const bh = Math.min(maxBh, h * (0.04 + rnd() * 0.08));
    ctx.fillRect(bx, base - bh, bw, bh);
    bx += bw + w * 0.008;
  }
  ctx.restore();
}

/** Fits text to maxWidth by shrinking from startSize; returns the size used. */
export function fitBlockSize(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `900 ${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

/**
 * Title-block layout, measured before anything is drawn: the title lines,
 * then a clear-sky gap, then the subline, then the skyline band. The skyline
 * may only start below the subline's bottom edge plus a margin, so the
 * subline always sits in clear sky.
 */
export function layoutTitleBlock(ctx, w, h, title, subline) {
  const family = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
  const words = (title || 'VICE CITY').trim().toUpperCase().split(/\s+/);
  let lines = [words.join(' ')];
  if (words.length > 1) {
    // Split into two balanced lines when the single line would be tiny.
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const score = Math.abs(a.length - b.length);
      if (!best || score < best.score) best = { score, lines: [a, b] };
    }
    ctx.font = `900 ${h * 0.42}px ${family}`;
    if (ctx.measureText(lines[0]).width > w * 0.94) lines = best.lines;
  }
  const two = lines.length > 1;
  const lineH = h * (two ? 0.28 : 0.34);
  const startSize = h * (two ? 0.30 : 0.38);
  const sizes = lines.map((line) => fitBlockSize(ctx, line, w * 0.94, startSize, family));
  const startY = h * (two ? 0.50 : 0.46) - ((lines.length - 1) * lineH) / 2;
  const sub = (subline || '').trim().toUpperCase();
  const subSize = Math.max(12, h * 0.11);
  const titleBottom = startY + (lines.length - 1) * lineH + Math.max(...sizes) * 0.36;
  const subY = sub
    ? Math.max(titleBottom + subSize * 0.9, h * (two ? 0.84 : 0.74))
    : h * 0.74;
  const skylineTop = Math.min(0.96, (subY + subSize * 0.5) / h + 0.04);
  return { family, lines, sizes, lineH, startY, sub, subSize, subY, skylineTop };
}

/** The giant block title (up to two lines) plus subline, black-outlined for legibility. */
export function drawTitleBlock(ctx, x, y, w, h, title, subline, grade, layout) {
  const { family, lines, sizes, lineH, startY, sub, subSize, subY } = layout
    || layoutTitleBlock(ctx, w, h, title, subline);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const size = sizes[i];
    const cy = y + startY + i * lineH;
    ctx.font = `900 ${size}px ${family}`;
    ctx.strokeStyle = '#12060a';
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.strokeText(line, x + w / 2, cy);
    ctx.fillStyle = grade.titleFill;
    ctx.fillText(line, x + w / 2, cy);
  });
  if (sub) {
    ctx.font = `900 ${subSize}px ${family}`;
    try { ctx.letterSpacing = `${Math.max(2, subSize * 0.22)}px`; } catch (e) { /* older canvas */ }
    ctx.strokeStyle = '#12060a';
    ctx.lineWidth = Math.max(2, subSize * 0.12);
    ctx.strokeText(sub, x + w / 2, y + subY);
    ctx.fillStyle = grade.subline;
    ctx.fillText(sub, x + w / 2, y + subY);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  }
  ctx.restore();
}

/** The bottom ribbon: the USER's caption only — never any app branding. */
export function drawCaptionRibbon(ctx, x, y, w, h, caption, grade) {
  ctx.fillStyle = grade.ribbon;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = grade.ribbonRule;
  ctx.fillRect(x, y, w, Math.max(2, h * 0.07));
  const family = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
  const text = (caption || '').trim().toUpperCase() || 'YOUR CAPTION HERE';
  const size = fitBlockSize(ctx, text, w * 0.92, h * 0.52, family);
  ctx.font = `900 ${size}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x + w / 2, y + h * 0.56);
}

/** Subtle film grain + warm vignette over the photo zone. */
export function drawGrainAndVignette(ctx, x, y, w, h) {
  const rnd = mulberry32(7);
  const dots = Math.floor((w * h) / 1400);
  ctx.save();
  for (let i = 0; i < dots; i++) {
    const px = x + rnd() * w;
    const py = y + rnd() * h;
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(px, py, 1.6, 1.6);
  }
  const v = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.42,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  v.addColorStop(0, 'rgba(20,5,20,0)');
  v.addColorStop(1, 'rgba(20,5,20,0.30)');
  ctx.fillStyle = v;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/**
 * Draws the whole C5 triptych cover.
 * state: { panels (1|2|3), singlePhoto, gradeName, title, subline, caption,
 *          photos: [img|null x3], crops: [{zoom,panX,panY} x3] }
 */
export function drawViceCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.gradeName] || GRADES.sunset;
  const n = Math.min(3, Math.max(1, state.panels || 3));
  const titleH = Math.round(h * 0.30);
  const ribbonH = Math.round(h * 0.10);
  const panelY = titleH;
  const panelH = h - titleH - ribbonH;

  ctx.fillStyle = '#1d0b2e';
  ctx.fillRect(0, 0, w, h);
  // Measure the title layout first: the skyline band is capped below the
  // subline, so the sky must know the layout before it is drawn.
  const layout = layoutTitleBlock(ctx, w, titleH, state.title, state.subline);
  drawTitleSky(ctx, 0, 0, w, titleH, grade, layout.skylineTop);
  drawTitleBlock(ctx, 0, 0, w, titleH, state.title, state.subline, grade, layout);

  const gap = Math.max(3, Math.round(w * 0.006));
  const colW = (w - gap * (n + 1)) / n;
  for (let i = 0; i < n; i++) {
    const rect = { x: gap + i * (colW + gap), y: panelY, w: colW, h: panelH };
    let photo = state.photos[i] || null;
    let crop = state.crops[i] || { zoom: 1, panX: 0, panY: -1 };
    if (state.singlePhoto && state.photos[0]) {
      photo = state.photos[0];
      // One photo, a DIFFERENT crop per column: left / centre / right thirds.
      const spread = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      crop = { zoom: Math.max(1.25, (state.crops[0] || {}).zoom || 1.25), panX: spread, panY: -1 };
    }
    drawPhotoPanel(ctx, rect, photo, crop, grade, `PANEL ${i + 1}`);
  }
  drawGrainAndVignette(ctx, 0, panelY, w, panelH);
  drawCaptionRibbon(ctx, 0, h - ribbonH, w, ribbonH, state.caption, grade);
}

/** Panel rectangles in canvas pixels, for click-to-select in the editor. */
export function vicePanelRects(canvasWidth, canvasHeight, panels) {
  const n = Math.min(3, Math.max(1, panels || 3));
  const titleH = Math.round(canvasHeight * 0.30);
  const ribbonH = Math.round(canvasHeight * 0.10);
  const gap = Math.max(3, Math.round(canvasWidth * 0.006));
  const colW = (canvasWidth - gap * (n + 1)) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ x: gap + i * (colW + gap), y: titleH, w: colW, h: canvasHeight - titleH - ribbonH });
  }
  return out;
}
