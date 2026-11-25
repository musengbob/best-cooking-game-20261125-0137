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
import { availableRecipes } from './recipes.js';
import {
  discardCarried,
  freshKitchen,
  interactAtStation as mechanicsInteract,
  selectPantryBin,
  updateMechanics,
} from './mechanics.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seededState = shot ? stateForShot(shot) : null;

function freshState() {
  const kitchen = freshKitchen();
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
    carried: kitchen.carried,
    plate: kitchen.plate,
    burners: kitchen.burners,
    pantryIndex: kitchen.pantryIndex,
    chop: kitchen.chop,
    particles: kitchen.particles,
    floaters: kitchen.floaters,
    shake: kitchen.shake,
    servedAttempts: kitchen.servedAttempts,
    correctServes: kitchen.correctServes,
    lastTickBeat: kitchen.lastTickBeat,
    sizzleTimer: kitchen.sizzleTimer,
    chopSoundTimer: kitchen.chopSoundTimer,
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

// Orders arrive on a schedule and count down. The board unlocks longer
// recipes as the shift goes on; a missed order costs a heart, resets the
// combo and shakes the screen.
function makeOrder() {
  const elapsed = SHIFT_SECONDS - state.timeLeft;
  const pool = availableRecipes(elapsed);
  const recipe = pool[state.orderSeq % pool.length];
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
    state.shake = 0.35;
    showToast(`Order missed — ${expired.length} heart${expired.length > 1 ? 's' : ''} lost!`);
    sfx.fail();
    if (state.hearts <= 0) endShift();
  }
}

// All station actions live in mechanics.js — pantry, chop, cook,
// assemble and serve. E (or clicking a station) dispatches here.
function interactAtStation() {
  if (state.screen !== 'play') return;
  mechanicsInteract(state, showToast);
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
  () => {
    if (state.screen === 'play') discardCarried(state, showToast);
  },
  (index) => {
    if (state.screen === 'play' && state.world.nearStation?.id === 'pantry') {
      selectPantryBin(state, index, showToast);
    }
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
    // (Also fires at once when the chef is already standing at the
    // clicked station, so a click on a nearby station acts immediately.)
    if (pendingStationUse && (!state.world.player.target || state.world.nearStation?.id === pendingStationUse)) {
      if (state.world.nearStation?.id === pendingStationUse) interactAtStation();
      pendingStationUse = null;
    }
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      endShift();
    } else {
      spawnOrders(dt);
      tickOrders(dt);
      updateMechanics(state, input, dt, showToast);
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
