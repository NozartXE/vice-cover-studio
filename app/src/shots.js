// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone at
// the size the query names; ?shot=editor shows the full editor with the three
// distinct samples loaded; ?shot=export shows the editor just after an export.
// window.__shotReady is set once the scene has painted.

/**
 * Sets up a screenshot scene.
 * query: photo (sample name), caption, title, subline, grade, w, h.
 * api: the editor's live functions and state, passed in by main.js.
 */
export async function runViceShot(shot, query, api) {
  const { state } = api;
  const w = Number(query.get('w') || 1920);
  const h = Number(query.get('h') || 1080);
  state.title = query.get('title') || 'VICE CITY';
  state.subline = query.get('subline') || 'Sunset Heist';
  state.caption = query.get('caption') || 'Every sunset has a price';
  state.gradeName = query.get('grade') || 'sunset';
  state.panels = 3;
  state.singlePhoto = false;
  await api.loadViceSamples();

  if (shot === 'cover') {
    // Cover alone, full frame, at the export size the query names.
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    canvas.width = w;
    canvas.height = h;
    api.renderVicePreview();
  } else if (shot === 'export') {
    document.body.classList.add('shot-editor');
    api.statusEl.textContent = 'Saved vice-city-cover-1920x1080.png — photo to PNG in 3 clicks.';
    document.querySelector('[data-export="2"]').classList.add('just-exported');
    api.statusEl.scrollIntoView({ block: 'nearest' });
    api.syncViceControls();
  } else {
    document.body.classList.add('shot-editor');
    api.syncViceControls();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
