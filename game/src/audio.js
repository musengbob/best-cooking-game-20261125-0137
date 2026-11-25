// Ember & Thyme: sound — every effect is synthesised with WebAudio,
// so the game ships no audio files at all. The context is created lazily
// on the first user gesture (browsers block audio before interaction).

let ctx = null;
let muted = false;

function audioContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function blip(freq, seconds, type, volume, slideTo) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + seconds);
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + seconds);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + seconds);
}

export const sfx = {
  // Call once from any user gesture so later sounds are allowed.
  unlock() {
    audioContext();
  },
  chop() {
    blip(220, 0.08, 'square', 0.12, 140);
  },
  sizzle() {
    blip(1200, 0.25, 'sawtooth', 0.05, 900);
  },
  pickup() {
    blip(520, 0.09, 'sine', 0.14, 760);
  },
  serve() {
    blip(660, 0.12, 'sine', 0.16, 880);
    setTimeout(() => blip(880, 0.16, 'sine', 0.16, 1180), 90);
  },
  ding() {
    blip(980, 0.2, 'triangle', 0.14, 980);
  },
  fail() {
    blip(220, 0.35, 'sawtooth', 0.12, 110);
  },
  click() {
    blip(440, 0.05, 'sine', 0.08, 440);
  },
  toggleMute() {
    muted = !muted;
    return muted;
  },
};
