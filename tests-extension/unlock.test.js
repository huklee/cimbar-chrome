import test from 'node:test';
import assert from 'node:assert/strict';
import { createUnlockDetector } from '../extension/lib/unlock.js';

function key(value, modifiers = {}) {
  return { key: value, ctrlKey: false, metaKey: false, altKey: false, ...modifiers };
}

test('typing cimbar unlocks transfer mode once', () => {
  let unlocks = 0;
  const detect = createUnlockDetector(() => { unlocks += 1; });

  for (const character of 'ciMBAr') detect(key(character));
  for (const character of 'cimbar') detect(key(character));

  assert.equal(unlocks, 1);
});

test('unlock detector accepts the sequence within ordinary typing', () => {
  let unlocked = false;
  const detect = createUnlockDetector(() => { unlocked = true; });

  for (const character of 'notes: cimbar') detect(key(character));

  assert.equal(unlocked, true);
});

test('modified shortcuts do not contribute to the unlock sequence', () => {
  let unlocked = false;
  const detect = createUnlockDetector(() => { unlocked = true; });

  for (const character of 'cimba') detect(key(character));
  detect(key('r', { ctrlKey: true }));

  assert.equal(unlocked, false);
});
