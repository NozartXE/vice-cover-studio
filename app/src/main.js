// Vice Cover Studio — editor wiring for the C5 Poster Triptych.
// Upload 1–3 photos, crop each panel face-safe, edit the title/subline/caption,
// pick a grade and a post size, export a PNG in one click. All offline:
// photos are read on this machine and never uploaded anywhere.

import { drawViceCover, vicePanelRects } from './cover.js';
import { runViceShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const titleInput = document.getElementById('title');
const sublineInput = document.getElementById('subline');
const captionInput = document.getElementById('caption');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const cropLabel = document.getElementById('crop-label');
const emptyState = document.getElementById('empty-state');

const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg', 'samples/skyline.jpg'];
const EXPORT_SIZES = [
  { label: '1080 × 1080', w: 1080, h: 1080 },
  { label: '1080 × 1350', w: 1080, h: 1350 },
  { label: '1920 × 1080', w: 1920, h: 1080 },
];

/** The whole editor state; photos live in `library`, slots point at it by index. */
const library = [];
const state = {
  panels: 3,
  singlePhoto: false,
  gradeName: 'sunset',
  title: 'VICE CITY',
  subline: 'Sunset Heist',
  caption: 'Every sunset has a price',
  slots: [null, null, null],
  crops: [
    { zoom: 1, panX: 0, panY: -1 },
    { zoom: 1, panX: 0, panY: -1 },
    { zoom: 1, panX: 0, panY: -1 },
  ],
  sizeIndex: 2, // default preview: wide 1920 x 1080
};
let selectedPanel = 0;
let undoStack = [];

/** Photos resolved for the renderer, in column order. */
export function statePhotos() {
  return state.slots.map((i) => (i === null ? null : library[i].img));
}

/** Renders the full cover (never a clipped crop) into the preview canvas. */
export function renderVicePreview() {
  drawViceCover(canvas, {
    panels: state.panels,
    singlePhoto: state.singlePhoto,
    gradeName: state.gradeName,
    title: state.title,
    subline: state.subline,
    caption: state.caption,
    photos: statePhotos(),
    crops: state.crops,
  });
  const anyPhoto = state.slots.some((s) => s !== null);
  emptyState.hidden = anyPhoto;
  cropLabel.textContent = `Panel ${selectedPanel + 1} — crop (face-safe)`;
  const crop = state.crops[selectedPanel];
  zoomInput.value = crop.zoom;
  panXInput.value = crop.panX;
  panYInput.value = crop.panY;
}

/** A snapshot for undo: slots, crops and words (photos stay in the library). */
export function snapshotViceState() {
  return JSON.stringify({
    panels: state.panels, singlePhoto: state.singlePhoto, gradeName: state.gradeName,
    title: state.title, subline: state.subline, caption: state.caption,
    slots: state.slots, crops: state.crops, sizeIndex: state.sizeIndex,
  });
}

export function pushViceUndo() {
  undoStack.push(snapshotViceState());
  if (undoStack.length > 25) undoStack.shift();
}

export function undoViceCover() {
  const snap = undoStack.pop();
  if (!snap) { statusEl.textContent = 'Nothing to undo yet.'; return; }
  const s = JSON.parse(snap);
  Object.assign(state, s);
  syncViceControls();
  renderVicePreview();
  statusEl.textContent = 'Undone.';
}

/** Pushes state back into the controls after an undo or a shot scene. */
export function syncViceControls() {
  titleInput.value = state.title;
  sublineInput.value = state.subline;
  captionInput.value = state.caption;
  document.querySelectorAll('[data-panels]').forEach((b) => {
    b.setAttribute('aria-pressed', String(Number(b.dataset.panels) === state.panels));
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.gradeName));
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.setAttribute('aria-pressed', String(Number(b.dataset.size) === state.sizeIndex));
  });
  document.getElementById('single-photo').checked = state.singlePhoto;
  resizeVicePreview();
}

/** Sizes the preview canvas to the chosen post size's aspect. */
export function resizeVicePreview() {
  const size = EXPORT_SIZES[state.sizeIndex];
  const scale = size.w >= size.h ? 960 / size.w : 720 / size.w;
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  renderVicePreview();
}

/** Loads an image from a URL (local sample) or a blob URL (user file). */
export function loadViceImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}

/** Puts an image into a panel slot, with a fresh face-safe crop. */
export function placeVicePhoto(img, panel) {
  pushViceUndo();
  library.push({ img });
  state.slots[panel] = library.length - 1;
  state.crops[panel] = { zoom: 1, panX: 0, panY: -1 };
  selectedPanel = panel;
  renderVicePreview();
  statusEl.textContent = `Photo placed in panel ${panel + 1} — face-safe crop applied.`;
}

export async function loadViceFile(file, panel) {
  if (!file || !file.type.startsWith('image/')) return;
  const img = await loadViceImage(URL.createObjectURL(file));
  placeVicePhoto(img, panel);
}

/** Loads the three bundled samples into the three columns — three distinct photos. */
export async function loadViceSamples() {
  pushViceUndo();
  for (let i = 0; i < 3; i++) {
    const img = await loadViceImage(SAMPLES[i]);
    library.push({ img });
    state.slots[i] = library.length - 1;
    state.crops[i] = { zoom: 1, panX: 0, panY: -1 };
  }
  state.panels = 3;
  state.singlePhoto = false;
  syncViceControls();
  renderVicePreview();
  statusEl.textContent = 'Samples loaded — one distinct photo per column.';
}

/** Renders the cover at a post size and downloads it as a PNG. One click. */
export function exportViceCover(sizeIndex) {
  const size = EXPORT_SIZES[sizeIndex];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawViceCover(off, {
    panels: state.panels,
    singlePhoto: state.singlePhoto,
    gradeName: state.gradeName,
    title: state.title,
    subline: state.subline,
    caption: state.caption,
    photos: statePhotos(),
    crops: state.crops,
  });
  off.toBlob((blob) => {
    if (!blob) { statusEl.textContent = 'Export failed in this browser.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved vice-city-cover-${size.w}x${size.h}.png — photo to PNG in 3 clicks.`;
  }, 'image/png');
}

function bindViceControls() {
  // Photo slots: file picker + drag-and-drop, one per column.
  document.querySelectorAll('.slot').forEach((slot) => {
    const panel = Number(slot.dataset.panel);
    const input = slot.querySelector('input[type=file]');
    slot.querySelector('.slot-pick').addEventListener('click', () => input.click());
    input.addEventListener('change', () => loadViceFile(input.files[0], panel));
    slot.addEventListener('click', (e) => {
      if (e.target.closest('button, input')) return;
      selectedPanel = panel;
      renderVicePreview();
    });
    ['dragover', 'dragenter'].forEach((ev) => slot.addEventListener(ev, (e) => {
      e.preventDefault();
      slot.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach((ev) => slot.addEventListener(ev, (e) => {
      e.preventDefault();
      slot.classList.remove('dragging');
    }));
    slot.addEventListener('drop', (e) => loadViceFile(e.dataTransfer.files[0], panel));
  });
  // Whole preview is a drop target for the selected panel.
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    loadViceFile(e.dataTransfer.files[0], selectedPanel);
  });
  // Click a panel in the preview to select it for cropping.
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * canvas.width;
    const py = ((e.clientY - r.top) / r.height) * canvas.height;
    const rects = vicePanelRects(canvas.width, canvas.height, state.panels);
    rects.forEach((rect, i) => {
      if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
        selectedPanel = i;
        renderVicePreview();
      }
    });
  });

  document.getElementById('load-samples').addEventListener('click', loadViceSamples);
  document.getElementById('empty-samples').addEventListener('click', loadViceSamples);
  document.getElementById('undo').addEventListener('click', undoViceCover);
  document.getElementById('reset-crop').addEventListener('click', () => {
    pushViceUndo();
    state.crops[selectedPanel] = { zoom: 1, panX: 0, panY: -1 };
    renderVicePreview();
    statusEl.textContent = `Panel ${selectedPanel + 1} reset to the face-safe crop.`;
  });

  titleInput.addEventListener('input', () => { state.title = titleInput.value; renderVicePreview(); });
  sublineInput.addEventListener('input', () => { state.subline = sublineInput.value; renderVicePreview(); });
  captionInput.addEventListener('input', () => { state.caption = captionInput.value; renderVicePreview(); });
  zoomInput.addEventListener('input', () => { state.crops[selectedPanel].zoom = Number(zoomInput.value); renderVicePreview(); });
  panXInput.addEventListener('input', () => { state.crops[selectedPanel].panX = Number(panXInput.value); renderVicePreview(); });
  panYInput.addEventListener('input', () => { state.crops[selectedPanel].panY = Number(panYInput.value); renderVicePreview(); });

  document.querySelectorAll('[data-panels]').forEach((b) => b.addEventListener('click', () => {
    pushViceUndo();
    state.panels = Number(b.dataset.panels);
    selectedPanel = Math.min(selectedPanel, state.panels - 1);
    syncViceControls();
    renderVicePreview();
  }));
  document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
    pushViceUndo();
    state.gradeName = b.dataset.grade;
    syncViceControls();
    renderVicePreview();
  }));
  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    state.sizeIndex = Number(b.dataset.size);
    syncViceControls();
    renderVicePreview();
  }));
  document.getElementById('single-photo').addEventListener('change', (e) => {
    pushViceUndo();
    state.singlePhoto = e.target.checked;
    renderVicePreview();
  });
  document.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', () => {
    exportViceCover(Number(b.dataset.export));
  }));

  // Keyboard shortcuts: Ctrl/⌘+Z undo, 1/2/3 panels, G grade, E export.
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input[type=text], textarea')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoViceCover(); }
    else if (e.key >= '1' && e.key <= '3') {
      pushViceUndo();
      state.panels = Number(e.key);
      syncViceControls();
      renderVicePreview();
    } else if (e.key.toLowerCase() === 'g') {
      pushViceUndo();
      state.gradeName = state.gradeName === 'sunset' ? 'neon' : 'sunset';
      syncViceControls();
      renderVicePreview();
    } else if (e.key.toLowerCase() === 'e') {
      exportViceCover(state.sizeIndex);
    }
  });
}

bindViceControls();
syncViceControls();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runViceShot(shot, new URLSearchParams(location.search), {
    state, loadViceImage, loadViceSamples, renderVicePreview, syncViceControls,
    exportViceCover, statusEl,
  });
} else {
  renderVicePreview();
}
