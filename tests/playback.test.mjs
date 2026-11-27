import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlayback } from '../playback.mjs';

function setup(onAdvance) {
  let now = 0;
  let frame;
  const progress = [];
  const states = [];
  const playback = createPlayback({
    now: () => now,
    requestFrame(next) { frame = next; return 1; },
    cancelFrame() { frame = undefined; },
    onProgress: fraction => progress.push(fraction),
    onStateChange: playing => states.push(playing),
    onAdvance,
  });
  return {
    playback, progress, states,
    tick(time) {
      now = time;
      const callback = frame;
      frame = undefined;
      callback?.();
    },
    hasFrame: () => Boolean(frame),
  };
}

test('pause, speed change and resume preserve fractional progress', () => {
  const { playback, tick, hasFrame, states } = setup();
  playback.play(1000);
  tick(250);
  playback.pause();
  assert.equal(playback.getProgress(), .25);
  assert.equal(hasFrame(), false);
  playback.setDuration(2000);
  tick(1250);
  assert.equal(playback.getProgress(), .25);
  playback.play();
  tick(1750);
  assert.equal(playback.getProgress(), .5);
  assert.deepEqual(states, [true, false, true]);
});

test('a late frame carries into the next stop without skipping stops', () => {
  let advances = 0;
  const { playback, tick } = setup(() => { advances++; });
  playback.play(1000);
  tick(1200);
  assert.equal(advances, 1);
  assert.equal(playback.getProgress(), .2);
  tick(5000);
  assert.equal(advances, 2);
  assert.equal(playback.getProgress(), 0);
});

test('the ending stops scheduling and can replay from zero', () => {
  const { playback, tick, hasFrame, progress } = setup(() => false);
  playback.play(1000);
  tick(1000);
  assert.equal(playback.isPlaying(), false);
  assert.equal(hasFrame(), false);
  assert.equal(playback.getProgress(), 1);
  assert.equal(progress.filter(fraction => fraction === 1).length, 1);
  playback.play();
  assert.equal(playback.getProgress(), 0);
  assert.equal(hasFrame(), true);
});
