const defaultDuration = 4600;

function checkedDuration(duration) {
  if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Playback duration must be positive');
  return duration;
}

export function createPlayback({
  onAdvance = () => {},
  onProgress = () => {},
  onStateChange = () => {},
  now = () => performance.now(),
  requestFrame = callback => requestAnimationFrame(callback),
  cancelFrame = id => cancelAnimationFrame(id),
} = {}) {
  let duration = defaultDuration;
  let elapsed = 0;
  let startedAt = null;
  let frame = null;
  let revision = 0;
  let finished = false;

  const isPlaying = () => startedAt !== null;
  const progressAt = time => Math.min(1, Math.max(0, isPlaying() ? time - startedAt : elapsed) / duration);
  const getProgress = () => progressAt(now());

  function scheduleFrame() {
    if (isPlaying() && frame === null) frame = requestFrame(tick);
  }

  function stopAt(fraction, reportProgress = true) {
    if (frame !== null) cancelFrame(frame);
    frame = null;
    startedAt = null;
    elapsed = duration * fraction;
    revision++;
    if (reportProgress) onProgress(fraction);
    onStateChange(false);
  }

  function tick() {
    frame = null;
    if (!isPlaying()) return;

    const time = now();
    const fraction = progressAt(time);
    const currentRevision = revision;
    onProgress(fraction);

    if (fraction === 1 && isPlaying() && revision === currentRevision) {
      const boundary = startedAt + duration;
      // Carry a late frame into the next beat without skipping entire stops after a stall.
      startedAt = time - boundary >= duration ? time : boundary;
      if (onAdvance() === false) {
        if (isPlaying()) {
          finished = true;
          stopAt(1, false);
        }
      } else if (isPlaying() && revision === currentRevision) {
        onProgress(progressAt(time));
      }
    }

    scheduleFrame();
  }

  function setDuration(durationMs) {
    const next = checkedDuration(durationMs);
    if (next === duration) return;

    const time = now();
    const fraction = progressAt(time);
    duration = next;
    elapsed = duration * fraction;
    if (isPlaying()) startedAt = time - elapsed;
    revision++;
    onProgress(fraction);
  }

  function play(durationMs = duration) {
    if (finished) reset(durationMs);
    else setDuration(durationMs);
    if (isPlaying()) return;

    startedAt = now() - elapsed;
    revision++;
    onStateChange(true);
    scheduleFrame();
  }

  function pause() {
    if (isPlaying()) stopAt(getProgress());
  }

  function reset(durationMs = duration) {
    duration = checkedDuration(durationMs);
    elapsed = 0;
    finished = false;
    if (isPlaying()) startedAt = now();
    revision++;
    onProgress(0);
  }

  return { play, pause, reset, setDuration, isPlaying, getProgress };
}
