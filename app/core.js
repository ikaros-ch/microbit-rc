// Pure logic shared by the app and its self-check (core.test.mjs).

export const DEADZONE = 0.15;
export const MAX_PACKET = 20; // micro:bit UART characteristic size

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// "J" "L" [-50, 30] -> "JL=-50,30"
export const encode = (type, id, v) => `${type}${id}=${Array.isArray(v) ? v.join(',') : v}`;

// Pack lines into as few BLE writes as possible, each <= MAX_PACKET bytes.
export function pack(lines, max = MAX_PACKET) {
  const out = [];
  let cur = '';
  for (const l of lines) {
    const s = l + '\n';
    if (cur && cur.length + s.length > max) { out.push(cur); cur = ''; }
    cur += s;
  }
  if (cur) out.push(cur);
  return out;
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
