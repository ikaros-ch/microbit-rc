// Run: node app/core.test.mjs
import assert from 'node:assert/strict';
import { encode, pack, splitLines, parseData, readBinding, step, cleanId } from './core.js';

assert.equal(encode('J', 'L', [-50, 30]), 'JL=-50,30');
// Greek is 2 bytes/char: packets stay <= 20 bytes and reassemble exactly
const lines = ['BΑλφα=1', 'JΤιμόνι=-100,-100', 'SΓκάζι=42'];
const pk = pack(lines);
assert.ok(pk.every(p => p.length <= 20));
const dec = new TextDecoder();
assert.equal(pk.map(p => dec.decode(p, { stream: true })).join('') + dec.decode(), lines.join('\n') + '\n');
assert.equal(cleanId('Ταχύτητα-1 x'), 'Ταχύτητα');
assert.equal(cleanId('a=b\nc'), 'abc');
assert.deepEqual(splitLines('Da=1\r\nDb=2\nDc'), [['Da=1', 'Db=2'], 'Dc']);
assert.deepEqual(parseData('Dmsg=a=b'), ['msg', 'a=b']);
assert.equal(parseData('Xmsg=1'), null);

const keys = new Set(['KeyW', 'KeyD']);
const pad = { axes: [0.1, -1], buttons: [{ pressed: true, value: 1 }, { pressed: false, value: 0.5 }] };
assert.equal(readBinding('KeyW', keys, null), 1);
assert.equal(readBinding('pad:a0+', keys, pad), 0, 'inside deadzone');
assert.equal(readBinding('pad:a1-', keys, pad), 1);
assert.equal(readBinding('pad:b1', keys, pad), 0.5, 'analog trigger');

// toggle flips on rising edge only
const t = { type: 'toggle', bind: ['KeyW'] }, ts = {};
assert.equal(step(t, ts, keys, null, 0.016), 1);
assert.equal(step(t, ts, keys, null, 0.016), 1);
assert.equal(step(t, ts, new Set(), null, 0.016), 1);
assert.equal(step(t, ts, keys, null, 0.016), 0);

// slider ramps at speed %/s and clamps
const sl = { type: 'slider', up: ['KeyW'], down: [], speed: 100 }, ss = {};
assert.equal(step(sl, ss, keys, null, 0.5), 50);
assert.equal(step(sl, ss, keys, null, 1), 100);

// single-axis stick: springs to center by default, holds position with spring off
const ax = { type: 'axis', pos: ['KeyW'], neg: [] }, as = {};
assert.equal(step(ax, as, keys, null, 0), 100);
assert.equal(step(ax, as, new Set(), null, 0), 0);
as.touch = true; as.v = -40;
assert.equal(step(ax, as, new Set(), null, 0), -40);
const th = { type: 'axis', pos: ['KeyW'], neg: [], spring: false, speed: 100 }, ths = {};
assert.equal(step(th, ths, keys, null, 0.25), 50);
assert.equal(step(th, ths, new Set(), null, 1), 50);
assert.equal(step(th, ths, keys, null, 1), 100);

// joystick: keyboard diagonal is normalized, touch overrides
const j = { type: 'joystick', up: ['KeyW'], down: [], left: [], right: ['KeyD'] }, js = {};
assert.deepEqual(step(j, js, keys, null, 0), [71, 71]);
js.touch = true; js.tx = -1; js.ty = 0;
assert.deepEqual(step(j, js, keys, null, 0), [-100, 0]);

console.log('core ok');
