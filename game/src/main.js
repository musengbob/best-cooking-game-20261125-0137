// Ember & Thyme — Rush Hour Kitchen: boot + game loop.
// Owns the game state machine (title → play → end), the clock, order
// spawning and scoring hooks. Phase 1 is the playable shell: movement,
// stations, toasts and the screens all work; the chop/cook/serve
// mechanics plug into interactAtStation() in phase 2.

import { CANVAS, MAX_HEARTS, ORDER_PACING, RECIPES, SHIFT_SECONDS, STATIONS } from './config.js';
import { createInput } from './input.js';
import { drawFrame } from './render.js';
import { sfx } from './audio.js';
import { createWorld, setMoveTarget, updatePlayer } from './world.js';
import { stateForShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seededState = shot ? stateForShot(shot) : null;

function freshState() {
  return {
    screen: 'title',
    now: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    served: 0,
    missed: 0,
    orders: [],
    carried: [],
    toast: null,
    world: createWorld(),
    nextOrderIn: 6,
    orderSeq: 0,
  };
}

let state = seededState ?? freshState();
let lastTick = performance.now();
// Station id the player clicked and should use on arrival (null if none).
let pendingStationUse = null;

function showToast(text, seconds = 2.2) {
  state.toast = { text, life: seconds };
}

function startShift() {
  const keepNow = state.now;
  state = freshState();
  state.now = keepNow;
  state.screen = 'play';
  state.orders = [makeOrder()];
  showToast('Shift started — first order up!');
  sfx.ding();
}

function endShift() {
  state.screen = 'end';
  state.timeLeft = 0;
  sfx.fail();
}

// Phase 1: orders arrive on a schedule and count down; serving and
// missing are wired in phase 2. A sample order keeps the board alive.
function makeOrder() {
  const recipe = RECIPES[state.orderSeq % RECIPES.length];
  state.orderSeq += 1;
  return {
    id: `order-${state.orderSeq}`,
    recipe,
    waitSeconds: recipe.waitSeconds,
    timeLeft: recipe.waitSeconds,
  };
}

function spawnOrders(dt) {
  if (state.orders.length >= ORDER_PACING.maxOnBoard) return;
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0) {
    state.orders.push(makeOrder());
    const progress = 1 - state.timeLeft / SHIFT_SECONDS;
    const interval =
      ORDER_PACING.startInterval +
      (ORDER_PACING.endInterval - ORDER_PACING.startInterval) * progress;
    state.nextOrderIn = interval;
    sfx.ding();
  }
}

function tickOrders(dt) {
  for (const order of state.orders) order.timeLeft -= dt;
  const expired = state.orders.filter((o) => o.timeLeft <= 0);
  if (expired.length > 0) {
    state.orders = state.orders.filter((o) => o.timeLeft > 0);
    state.missed += expired.length;
    state.hearts = Math.max(0, state.hearts - expired.length);
    state.combo = 0;
    showToast(`Order missed — ${expired.length} heart${expired.length > 1 ? 's' : ''} lost!`);
    sfx.fail();
    if (state.hearts <= 0) endShift();
  }
}

// Phase 1 placeholder interact: names the station and shows a toast.
// Phase 2 replaces this with pantry/chop/cook/assemble/serve actions.
function interactAtStation() {
  const station = state.world.nearStation;
  if (!station) {
    showToast('Walk up to a station to use it.');
    return;
  }
  sfx.click();
  const hints = {
    pantry: 'Pantry: grab an ingredient (coming in phase 2).',
    chopping: 'Chopping board: chop it here (coming in phase 2).',
    stove: 'Stove: mind the burn timer (coming in phase 2).',
    assembly: 'Assembly: plate your dish here (coming in phase 2).',
    serving: 'Serving window: hand dishes over (coming in phase 2).',
  };
  showToast(hints[station.id] ?? `Using ${station.label}.`);
}

function onPointerDown(x, y) {
  sfx.unlock();
  if (state.screen === 'title') {
    startShift();
    return;
  }
  if (state.screen === 'end') {
    state = freshState();
    return;
  }
  // Clicking a station walks to it and uses it on arrival; clicking the
  // floor just walks there.
  const station = stationAtPoint(x, y);
  pendingStationUse = station ? station.id : null;
  setMoveTarget(state.world, x, y);
}

// Station hit-test, in canvas pixels.
function stationAtPoint(x, y) {
  return STATIONS.find((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) ?? null;
}

const input = createInput(
  canvas,
  () => {
    sfx.unlock();
    if (state.screen === 'play') interactAtStation();
  },
  () => {
    sfx.unlock();
    if (state.screen === 'title') startShift();
    else if (state.screen === 'end') state = freshState();
  },
);
input.onPointerDown = onPointerDown;

function frame(now) {
  const dt = Math.min(0.05, (now - lastTick) / 1000);
  lastTick = now;
  state.now += dt;

  if (state.screen === 'play') {
    updatePlayer(state.world, input.moveX, input.moveY, dt);
    // Arrived at a clicked station: use it once, then clear the request.
    if (pendingStationUse && !state.world.player.target) {
      if (state.world.nearStation?.id === pendingStationUse) interactAtStation();
      pendingStationUse = null;
    }
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      endShift();
    } else {
      spawnOrders(dt);
      tickOrders(dt);
    }
  }
  if (state.toast) {
    state.toast.life -= dt;
    if (state.toast.life <= 0) state.toast = null;
  }
  drawFrame(ctx, state);
  requestAnimationFrame(frame);
}

canvas.width = CANVAS.width;
canvas.height = CANVAS.height;
requestAnimationFrame(frame);
