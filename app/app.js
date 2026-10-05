import { clamp, encode, pack, splitLines, parseData, step, cleanId } from './core.js';
import { t, lang, setLang, applyStatic } from './i18n.js';

const UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // micro:bit -> app (indicate)
const UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // app -> micro:bit (write)
const PREFIX = { button: 'B', toggle: 'T', slider: 'S', axis: 'A', joystick: 'J' };
const BINDS = { button: ['bind'], toggle: ['bind'], slider: ['up', 'down'], axis: ['pos', 'neg'], joystick: ['up', 'down', 'left', 'right'] };
const PAD_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', 'D↑', 'D↓', 'D←', 'D→', 'Home'];
const AXIS_NAMES = ['LX', 'LY', 'RX', 'RY'];
const STORE = 'rcpad.layout';

const defaults = () => ({ widgets: [
  { type: 'toggle', id: 'T1', label: t('lights'), x: 2, y: 2, w: 11, h: 18, bind: ['Digit1', 'pad:b4'] },
  { type: 'toggle', id: 'T2', label: 'Turbo', x: 14, y: 2, w: 11, h: 18, bind: ['Digit2', 'pad:b5'] },
  { type: 'display', channel: 'msg', label: t('status'), mode: 'text', x: 28, y: 2, w: 28, h: 18 },
  { type: 'display', channel: 'speed', label: t('speedLbl'), mode: 'bar', min: 0, max: 100, x: 58, y: 2, w: 16, h: 18 },
  { type: 'display', channel: 'temp', label: t('temp'), mode: 'graph', min: 0, max: 40, unit: '°C', x: 76, y: 2, w: 14, h: 18 },
  { type: 'display', channel: 'lamp', label: 'B', mode: 'lamp', x: 91, y: 2, w: 7, h: 18 },
  { type: 'joystick', id: 'L', x: 1, y: 30, w: 24, h: 66, up: ['KeyW', 'pad:a1-'], down: ['KeyS', 'pad:a1+'], left: ['KeyA', 'pad:a0-'], right: ['KeyD', 'pad:a0+'] },
  { type: 'slider', id: 'S', label: t('throttle'), color: '#ff9f43', x: 27, y: 30, w: 7, h: 66, up: ['KeyR', 'pad:b7'], down: ['KeyF', 'pad:b6'], speed: 100 },
  { type: 'joystick', id: 'R', color: '#00c2ff', x: 36, y: 30, w: 24, h: 66, up: ['ArrowUp', 'pad:a3-'], down: ['ArrowDown', 'pad:a3+'], left: ['ArrowLeft', 'pad:a2-'], right: ['ArrowRight', 'pad:a2+'] },
  { type: 'button', id: 'Y', color: '#f6c343', x: 76, y: 32, w: 10, h: 19, bind: ['KeyI', 'pad:b3'] },
  { type: 'button', id: 'X', color: '#00c2ff', x: 65, y: 53, w: 10, h: 19, bind: ['KeyJ', 'pad:b2'] },
  { type: 'button', id: 'B', color: '#ff5c7a', x: 87, y: 53, w: 10, h: 19, bind: ['KeyL', 'pad:b1'] },
  { type: 'button', id: 'A', color: '#3ddc84', x: 76, y: 74, w: 10, h: 19, bind: ['Space', 'pad:b0'] },
] });

const NEW = {
  button: { w: 9, h: 16, bind: [] },
  toggle: { w: 11, h: 16, bind: [] },
  slider: { w: 7, h: 45, up: [], down: [], speed: 100 },
  axis: { w: 7, h: 45, pos: [], neg: [], spring: true, speed: 100 },
  joystick: { w: 22, h: 50, up: [], down: [], left: [], right: [] },
  display: { w: 18, h: 16, mode: 'text', min: 0, max: 100 },
};

const $ = s => document.querySelector(s);
const stage = $('#stage'), panel = $('#panel');
const keys = new Set();
const st = new Map();          // uid -> widget runtime state
const data = {}, hist = {};    // channel -> latest value / numeric history
const pending = new Map();     // coalesced outgoing lines, newest value per widget wins
let layout, editing = false, selected = null, listening = null;
let device = null, rxChar = null, rxBuf = '', busy = false;

const uid = () => Math.random().toString(36).slice(2, 10);
const state = w => st.get(w.uid) || (st.set(w.uid, {}), st.get(w.uid));
const decoder = new TextDecoder();

function load(obj) {
  if (!obj || !Array.isArray(obj.widgets)) throw new Error('not a layout');
  layout = { widgets: obj.widgets.filter(w => w && (w.type in NEW)).map(w => ({ ...w, uid: uid() })) };
  for (const w of layout.widgets) {
    for (const k of ['x', 'y', 'w', 'h']) w[k] = clamp(+w[k] || 0, 0, 100);
    if (w.type === 'display') w.channel = cleanId(w.channel ?? '');
    else w.id = cleanId(w.id ?? '');
  }
  selected = null;
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(exportable())); } catch {}
}
const exportable = () => ({ widgets: layout.widgets.map(({ uid, ...w }) => w) });

try { load(JSON.parse(localStorage.getItem(STORE))); } catch { load(defaults()); }

/* ---------- rendering ---------- */

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function place(e, w) {
  Object.assign(e.style, { left: w.x + '%', top: w.y + '%', width: w.w + '%', height: w.h + '%' });
}

function render() {
  stage.replaceChildren();
  const W = stage.clientWidth, H = stage.clientHeight;
  for (const w of layout.widgets) {
    const s = state(w);
    const e = el('div', `w w-${w.type}`);
    if (w === selected) e.classList.add('sel');
    if (w.color) e.style.setProperty('--c', w.color);
    place(e, w);
    const face = el('div', 'face');
    const name = w.label || w.id || w.channel;
    if (w.type === 'button') face.append(el('span', null, name));
    if (w.type === 'toggle') { const sw = el('div', 'sw'); sw.append(el('i')); face.append(sw, el('span', 'lbl', name)); }
    if (w.type === 'slider') {
      const track = el('div', 'track'); track.append(el('div', 'fill'));
      if (w.w * W > w.h * H) e.classList.add('horiz');
      face.append(track, el('span', 'lbl', name));
    }
    if (w.type === 'axis') {
      const track = el('div', 'track atrack'); track.append(el('div', 'aknob'));
      if (w.w * W > w.h * H) e.classList.add('horiz');
      face.append(track, el('span', 'lbl', name));
    }
    if (w.type === 'joystick') {
      const base = el('div', 'base'); base.append(el('div', 'knob'));
      const size = Math.max(20, Math.min(w.w * W, w.h * H) / 100 - 24);
      base.style.width = base.style.height = size + 'px';
      face.append(base, el('span', 'lbl', name));
    }
    if (w.type === 'display') face.append(el('span', 'lbl', name), el('div', 'val'));
    e.append(face);
    if (editing) e.append(el('div', 'handle'));
    e.addEventListener('pointerdown', ev => editing ? drag(ev, w, e) : press(ev, w, e));
    stage.append(e);
    s.el = e;
    s.sent = s.sent ?? null;
    if (w.type === 'display') paintDisplay(w);
  }
}

function paint(w, s, v) {
  const e = s.el;
  if (!e) return;
  if (w.type === 'button') e.classList.toggle('down', !!v);
  if (w.type === 'toggle') e.classList.toggle('on', !!v);
  if (w.type === 'slider') {
    const f = e.querySelector('.fill');
    if (e.classList.contains('horiz')) f.style.width = v + '%'; else f.style.height = v + '%';
  }
  if (w.type === 'axis') {
    const k = e.querySelector('.aknob');
    if (e.classList.contains('horiz')) k.style.left = 50 + v * 0.4 + '%'; else k.style.top = 50 - v * 0.4 + '%';
  }
  if (w.type === 'joystick') e.querySelector('.knob').style.transform = `translate(${v[0] * 0.69}%, ${-v[1] * 0.69}%)`;
}

function paintDisplay(w) {
  const e = state(w).el?.querySelector('.val');
  if (!e) return;
  const raw = data[w.channel], n = parseFloat(raw);
  const min = +(w.min ?? 0), max = +(w.max ?? 100);
  const text = raw == null ? '–' : raw + (w.unit || '');
  if (w.mode === 'lamp') {
    const l = el('div', 'lamp');
    l.classList.toggle('on', raw != null && raw !== '0' && raw !== '' && raw !== 'false');
    e.replaceChildren(l);
  } else if (w.mode === 'bar') {
    const box = el('div'); box.style.width = '100%';
    const t = el('div', null, text); t.style.textAlign = 'center';
    const bar = el('div', 'bar'), b = el('b');
    b.style.width = (isNaN(n) || max === min ? 0 : clamp((n - min) / (max - min), 0, 1) * 100) + '%';
    bar.append(b); box.append(t, bar); e.replaceChildren(box);
  } else if (w.mode === 'graph') {
    const pts = hist[w.channel] || [];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 59 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const off = 60 - pts.length;
    pl.setAttribute('points', pts.map((p, i) => `${i + off - 1},${100 - clamp((p - min) / (max - min || 1), 0, 1) * 100}`).join(' '));
    svg.append(pl);
    e.title = text;
    e.replaceChildren(svg);
  } else e.textContent = text;
}

/* ---------- touch input (play mode) ---------- */

function press(ev, w, e) {
  const s = state(w);
  if (w.type === 'display') return;
  e.setPointerCapture(ev.pointerId);
  if (w.type === 'toggle') { s.on = !s.on; return; }
  const move = m => {
    if (w.type === 'slider') {
      const r = e.querySelector('.track').getBoundingClientRect();
      s.v = clamp(e.classList.contains('horiz') ? (m.clientX - r.left) / r.width * 100 : (r.bottom - m.clientY) / r.height * 100, 0, 100);
    }
    if (w.type === 'axis') {
      const r = e.querySelector('.track').getBoundingClientRect();
      const d = e.classList.contains('horiz') ? (m.clientX - r.left - r.width / 2) / (r.width * 0.4) : (r.top + r.height / 2 - m.clientY) / (r.height * 0.4);
      s.v = clamp(d, -1, 1) * 100;
    }
    if (w.type === 'joystick') {
      const r = e.querySelector('.base').getBoundingClientRect(), rad = r.width / 2;
      let x = (m.clientX - r.left - rad) / rad, y = (r.top + rad - m.clientY) / rad;
      const mag = Math.hypot(x, y);
      if (mag > 1) { x /= mag; y /= mag; }
      s.tx = x; s.ty = y;
    }
  };
  s.touch = true;
  move(ev);
  e.onpointermove = move;
  e.onpointerup = e.onpointercancel = () => { s.touch = false; e.onpointermove = null; };
}

/* ---------- edit mode ---------- */

function drag(ev, w, e) {
  select(w);
  const r = stage.getBoundingClientRect();
  const resize = ev.target.classList.contains('handle');
  const ox = ev.clientX, oy = ev.clientY, start = { ...w };
  const snap = v => Math.round(v * 2) / 2;
  e.setPointerCapture(ev.pointerId);
  e.onpointermove = m => {
    const dx = (m.clientX - ox) / r.width * 100, dy = (m.clientY - oy) / r.height * 100;
    if (resize) {
      w.w = clamp(snap(start.w + dx), 3, 100 - w.x);
      w.h = clamp(snap(start.h + dy), 3, 100 - w.y);
    } else {
      w.x = clamp(snap(start.x + dx), 0, 100 - w.w);
      w.y = clamp(snap(start.y + dy), 0, 100 - w.h);
    }
    place(e, w);
  };
  e.onpointerup = () => { e.onpointermove = null; save(); render(); };
}

function select(w) {
  selected = w;
  listening = null;
  for (const [id, s] of st) s.el?.classList.toggle('sel', id === w?.uid);
  renderPanel();
}

function row(label, input) {
  const r = el('label', 'row');
  r.append(el('span', null, label), input);
  panel.append(r);
  return input;
}
function input(w, key, type = 'text', after) {
  const i = el('input');
  i.type = type;
  i.value = w[key] ?? '';
  i.oninput = () => {
    let v = i.value;
    if (key === 'id' || key === 'channel') { v = cleanId(v); if (v !== i.value) i.value = v; }
    if (type === 'number') v = v === '' ? undefined : +v;
    w[key] = v;
    save(); render(); after?.();
  };
  return i;
}

function prettyBind(b) {
  const m = /^pad:([ab])(\d+)([+-]?)$/.exec(b);
  if (m) return '🎮 ' + (m[1] === 'b' ? PAD_NAMES[m[2]] ?? 'B' + m[2] : (AXIS_NAMES[m[2]] ?? 'Axis ' + m[2]) + m[3]);
  return '⌨ ' + ({ ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[b] || b.replace(/^Key|^Digit/, ''));
}

function renderPanel() {
  panel.hidden = !editing || !selected;
  if (panel.hidden) return;
  const w = selected;
  panel.replaceChildren();
  const h = el('h3', null, t(w.type));
  const close = el('button', null, '✕');
  close.onclick = () => select(null);
  h.append(close);
  panel.append(h);

  if (w.type === 'display') {
    const ch = row(t('channel'), input(w, 'channel'));
    ch.maxLength = 8;
    ch.setAttribute('list', 'channels');
    const dl = el('datalist'); dl.id = 'channels';
    for (const c of Object.keys(data)) { const o = el('option'); o.value = c; dl.append(o); }
    panel.append(dl);
    const mode = el('select');
    for (const m of ['text', 'bar', 'graph', 'lamp']) { const o = el('option', null, t(m)); o.value = m; mode.append(o); }
    mode.value = w.mode || 'text';
    mode.onchange = () => { w.mode = mode.value; save(); render(); renderPanel(); };
    row(t('showAs'), mode);
    if (w.mode === 'bar' || w.mode === 'graph') {
      row(t('min'), input(w, 'min', 'number'));
      row(t('max'), input(w, 'max', 'number'));
    }
    if (w.mode !== 'lamp') row(t('unit'), input(w, 'unit'));
  } else {
    row(t('id'), input(w, 'id')).maxLength = 8;
  }
  row(t('label'), input(w, 'label'));
  const c = input(w, 'color', 'color');
  c.value = w.color || '#7c5cff';
  row(t('color'), c);
  if (w.type === 'axis') {
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = w.spring !== false;
    cb.onchange = () => { w.spring = cb.checked; save(); renderPanel(); };
    row(t('spring'), cb);
  }
  if (w.type === 'slider' || (w.type === 'axis' && w.spring === false)) row(t('speed'), input(w, 'speed', 'number'));

  for (const key of BINDS[w.type] || []) {
    const box = el('div', 'chips');
    w[key] ||= [];
    w[key].forEach((b, i) => {
      const chip = el('button', 'chip', prettyBind(b) + ' ✕');
      chip.title = b;
      chip.onclick = () => { w[key].splice(i, 1); save(); renderPanel(); };
      box.append(chip);
    });
    const on = listening?.w === w && listening.key === key;
    const add = el('button', 'chip listen' + (on ? ' active' : ''), on ? t('listening') : t('bind'));
    add.onclick = () => {
      document.activeElement?.blur();
      listening = on ? null : { w, key, base: navigator.getGamepads?.().find(Boolean)?.axes.slice() };
      renderPanel();
    };
    box.append(add);
    row(BINDS[w.type].length > 1 ? t(key) : t('bindings'), box);
  }

  const del = el('button', 'danger', t('delete'));
  del.onclick = () => { layout.widgets.splice(layout.widgets.indexOf(w), 1); st.delete(w.uid); save(); select(null); render(); };
  panel.append(del);
}

function captured(b) {
  const { w, key } = listening;
  listening = null;
  if (!w[key].includes(b)) w[key].push(b);
  save(); renderPanel();
}

function capturePad(pad) {
  if (!pad) return;
  const i = pad.buttons.findIndex(b => b.pressed);
  if (i >= 0) return captured(`pad:b${i}`);
  const base = listening.base || [];
  const a = pad.axes.findIndex((v, j) => Math.abs(v) > 0.6 && Math.abs(v - (base[j] ?? 0)) > 0.6);
  if (a >= 0) captured(`pad:a${a}${pad.axes[a] > 0 ? '+' : '-'}`);
}

function setEditing(on) {
  editing = on;
  document.body.classList.toggle('editing', on);
  $('#edittools').hidden = !on;
  $('#edit').textContent = t(on ? 'done' : 'edit');
  for (const s of st.values()) { s.touch = false; }
  if (!on) selected = listening = null;
  render(); renderPanel();
}

$('#edit').onclick = () => setEditing(!editing);
$('#add').onchange = e => {
  const type = e.target.value;
  e.target.value = '';
  if (!type) return;
  const w = { type, ...structuredClone(NEW[type]), uid: uid() };
  w.x = (100 - w.w) / 2; w.y = (100 - w.h) / 2;
  if (type === 'display') w.channel = 'ch' + (layout.widgets.length + 1);
  else {
    let n = 1;
    while (layout.widgets.some(o => o.id === PREFIX[type] + n)) n++;
    w.id = PREFIX[type] + n;
  }
  layout.widgets.push(w);
  save(); render(); select(w);
};
$('#export').onclick = () => {
  const a = el('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(exportable(), null, 2)], { type: 'application/json' }));
  a.download = 'rcpad-layout.json';
  a.click();
  URL.revokeObjectURL(a.href);
};
$('#import').onchange = async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try { load(JSON.parse(await f.text())); save(); render(); renderPanel(); }
  catch (err) { alert(t('importFail') + err.message); }
};
$('#reset').onclick = () => {
  if (!confirm(t('resetConfirm'))) return;
  load(defaults()); save(); render(); renderPanel();
};
$('#fs').onclick = async () => {
  if (document.fullscreenElement) return document.exitFullscreen();
  await document.documentElement.requestFullscreen?.().catch(() => {});
  screen.orientation?.lock?.('landscape').catch(() => {});
};

/* ---------- keyboard ---------- */

const typing = e => /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
addEventListener('keydown', e => {
  if (listening) {
    e.preventDefault();
    if (e.code === 'Escape') { listening = null; renderPanel(); } else captured(e.code);
    return;
  }
  if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
  keys.add(e.code);
  if (!editing) e.preventDefault();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
addEventListener('resize', render);

/* ---------- bluetooth ---------- */

async function connect() {
  if (!navigator.bluetooth) return alert(t('noBt'));
  device = await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'BBC micro:bit' }], optionalServices: [UART] });
  device.addEventListener('gattserverdisconnected', disconnected);
  const svc = await (await device.gatt.connect()).getPrimaryService(UART);
  const tx = await svc.getCharacteristic(UART_TX);
  tx.addEventListener('characteristicvaluechanged', e => receive(decoder.decode(e.target.value, { stream: true })));
  await tx.startNotifications();
  rxChar = await svc.getCharacteristic(UART_RX);
  for (const s of st.values()) s.sent = null; // push full state on connect
  $('#dot').classList.add('on');
  showConn();
}
function showConn() {
  const on = !!rxChar;
  $('#devname').textContent = on ? device.name : t('notConnected');
  $('#connect').textContent = t(on ? 'disconnect' : 'connect');
}
function disconnected() {
  rxChar = null; busy = false; pending.clear();
  $('#dot').classList.remove('on');
  showConn();
}
$('#connect').onclick = async () => {
  if (device?.gatt.connected) return device.gatt.disconnect();
  try { await connect(); } catch (e) { if (e.name !== 'NotFoundError') alert(t('connectFail') + e.message); disconnected(); }
};

function receive(text) {
  const [lines, rest] = splitLines(rxBuf + text);
  rxBuf = rest.slice(-200);
  for (const l of lines) {
    const d = parseData(l);
    if (!d) continue;
    const [ch, v] = d;
    data[ch] = v;
    if (!isNaN(parseFloat(v))) hist[ch] = (hist[ch] || []).concat(parseFloat(v)).slice(-60);
    for (const w of layout.widgets) if (w.type === 'display' && w.channel === ch) paintDisplay(w);
  }
}

async function flush() {
  if (busy || !rxChar || !pending.size) return;
  busy = true;
  const lines = [...pending.values()];
  pending.clear();
  $('#tx').textContent = lines.join('  ');
  try {
    for (const p of pack(lines)) {
      const buf = new TextEncoder().encode(p);
      await (rxChar.properties.writeWithoutResponse ? rxChar.writeValueWithoutResponse(buf) : rxChar.writeValueWithResponse(buf));
    }
  } catch (e) { console.warn('write failed', e); }
  busy = false;
}

/* ---------- main loop ---------- */

let last = performance.now();
function frame(t) {
  const dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  // ponytail: first connected controller only; add a picker if people use several
  const pad = [...(navigator.getGamepads?.() || [])].find(Boolean) || null;
  if (listening) capturePad(pad);
  if (!editing) {
    for (const w of layout.widgets) {
      if (!(w.type in PREFIX)) continue;
      const s = state(w), v = step(w, s, keys, pad, dt);
      paint(w, s, v);
      const line = encode(PREFIX[w.type], w.id, v);
      if (w.id && s.sent !== line) { s.sent = line; pending.set(PREFIX[w.type] + w.id, line); }
    }
  }
  flush();
  requestAnimationFrame(frame);
}

$('#lang').value = lang;
$('#lang').onchange = e => { setLang(e.target.value); applyStatic(); showConn(); setEditing(editing); };
applyStatic();
showConn();
setEditing(false);
requestAnimationFrame(frame);
