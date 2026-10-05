// Pure logic shared by the app and its self-check (core.test.mjs).

export const DEADZONE = 0.15;
export const MAX_PACKET = 20; // micro:bit UART characteristic size

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// "J" "L" [-50, 30] -> "JL=-50,30"
export const encode = (type, id, v) => `${type}${id}=${Array.isArray(v) ? v.join(',') : v}`;

// UTF-8 encode lines and cut them into BLE writes of <= MAX_PACKET bytes.
// Lines may straddle packets: the micro:bit buffers until '\n'.
export function pack(lines, max = MAX_PACKET) {
  const b = new TextEncoder().encode(lines.map(l => l + '\n').join(''));
  const out = [];
  for (let i = 0; i < b.length; i += max) out.push(b.subarray(i, i + max));
  return out;
}

// Widget IDs / channel names: any letters (Greek too), digits, _; max 8 characters.
export const cleanId = v => [...String(v).replace(/[^\p{L}\p{N}_]/gu, '')].slice(0, 8).join('');

// Screen point -> point in a W x H box rotated clockwise by rot (see #app.rotN in style.css).
export function unrotate(rot, W, H, x, y) {
  return rot === 90 ? [y, H - x] : rot === 180 ? [W - x, H - y] : rot === 270 ? [W - y, x] : [x, y];
}

// Split a receive buffer into complete lines plus the unfinished remainder.
export function splitLines(buf) {
  const parts = buf.split('\n');
  const rest = parts.pop();
  return [parts.map(s => s.replace(/\r$/, '')).filter(Boolean), rest];
}

// "Dspeed=42" -> ["speed", "42"]
export function parseData(line) {
  const i = line.indexOf('=');
  if (line[0] !== 'D' || i < 2) return null;
  return [line.slice(1, i), line.slice(i + 1)];
}

// A binding is a KeyboardEvent.code ("KeyW") or a gamepad input:
// "pad:b0" (button), "pad:a1+" / "pad:a1-" (axis direction). Returns 0..1.
export function readBinding(b, keys, pad) {
  if (!b.startsWith('pad:')) return keys.has(b) ? 1 : 0;
  const m = /^pad:([ab])(\d+)([+-]?)$/.exec(b);
  if (!pad || !m) return 0;
  if (m[1] === 'b') {
    const btn = pad.buttons[m[2]];
    return btn ? (btn.value || (btn.pressed ? 1 : 0)) : 0;
  }
  const a = pad.axes[m[2]] ?? 0;
  const v = m[3] === '-' ? -a : a;
  return v > DEADZONE ? (v - DEADZONE) / (1 - DEADZONE) : 0;
}

const any = (binds, keys, pad) => Math.max(0, ...(binds || []).map(b => readBinding(b, keys, pad)));

// Advance one widget by dt seconds. `s` is its mutable state (touch input lives there).
// Returns the value to send: 0/1, 0..100, or [x, y] in -100..100.
export function step(w, s, keys, pad, dt) {
  switch (w.type) {
    case 'button':
      return s.touch || any(w.bind, keys, pad) > 0.5 ? 1 : 0;
    case 'toggle': {
      const down = any(w.bind, keys, pad) > 0.5;
      if (down && !s.prev) s.on = !s.on;
      s.prev = down;
      return s.on ? 1 : 0;
    }
    case 'slider': {
      s.v ??= 0;
      if (!s.touch) s.v = clamp(s.v + (any(w.up, keys, pad) - any(w.down, keys, pad)) * (w.speed ?? 100) * dt, 0, 100);
      return Math.round(s.v);
    }
    case 'axis': { // single-axis stick, -100..100; s.v is set directly while touched
      const r = any(w.pos, keys, pad) - any(w.neg, keys, pad);
      if (!s.touch) s.v = w.spring === false ? clamp((s.v ?? 0) + r * (w.speed ?? 100) * 2 * dt, -100, 100) : r * 100;
      return Math.round(s.v ?? 0) || 0;
    }
    case 'joystick': {
      let x, y;
      if (s.touch) { x = s.tx; y = s.ty; }
      else {
        x = any(w.right, keys, pad) - any(w.left, keys, pad);
        y = any(w.up, keys, pad) - any(w.down, keys, pad);
        const m = Math.hypot(x, y);
        if (m > 1) { x /= m; y /= m; }
      }
      return [Math.round(x * 100) || 0, Math.round(y * 100) || 0];
    }
  }
  return null;
}
