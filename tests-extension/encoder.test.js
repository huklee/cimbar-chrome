import test from 'node:test';
import assert from 'node:assert/strict';
import { stabilizeFrameAlignment } from '../extension/lib/encoder.js';

test('stabilizeFrameAlignment removes libcimbar frame offsets', () => {
  const calls = [];
  const gl = {
    uniform2f(location, x, y) {
      calls.push({ location, x, y });
    },
  };

  const state = stabilizeFrameAlignment(gl);
  gl.uniform2f('transform', -0.01, 0.01);
  gl.uniform2f('transform', 0, 0);

  assert.deepEqual(calls, [
    { location: 'transform', x: 0, y: 0 },
    { location: 'transform', x: 0, y: 0 },
  ]);
  assert.deepEqual(state, { calls: 2, corrected: 1 });
  assert.equal(stabilizeFrameAlignment(gl), state, 'installation must be idempotent');
});

test('stabilizeFrameAlignment requires a WebGL context', () => {
  assert.throws(() => stabilizeFrameAlignment(null), /WebGL context is unavailable/);
});
