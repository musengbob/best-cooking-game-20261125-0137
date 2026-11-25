// Ember & Thyme: deterministic screenshot states. `?shot=start|play|end`
// (plus `&seed=`) stages the game into a fixed, readable scene so the
// screenshots are reproducible: title + full kitchen, a dish mid-assembly
// with a timer running, and the shift-end screen. The seed only varies
// which sample orders appear; seed=1 is the shipped set.
//
// baseState mirrors main.js freshState() exactly (including every
// freshKitchen() field): the play shot runs the live loop, so a missing
// field — plate, burners, particles — crashes updateMechanics.

import { RECIPES, SHIFT_SECONDS } from './config.js';
import { createWorld } from './world.js';
import { freshKitchen } from './mechanics.js';

function sampleOrders() {
  return [
    { id: 'shot-a', recipe: RECIPES[0], waitSeconds: RECIPES[0].waitSeconds, timeLeft: 32 },
    { id: 'shot-b', recipe: RECIPES[3], waitSeconds: RECIPES[3].waitSeconds, timeLeft: 48 },
    { id: 'shot-c', recipe: RECIPES[4], waitSeconds: RECIPES[4].waitSeconds, timeLeft: 21 },
  ];
}

function baseState(screen) {
  const kitchen = freshKitchen();
  return {
    screen,
    now: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: 3,
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

export function stateForShot(shot) {
  if (shot === 'play') {
    const state = baseState('play');
    state.timeLeft = 132;
    state.score = 480;
    state.combo = 3;
    state.bestCombo = 3;
    state.served = 4;
    state.orders = sampleOrders();
    // Chef stands at the assembly counter with a FINISHED dish: the
    // Garden Salad (tomato + lettuce) is fully plated and matches the
    // open order, so the plate reads as ready to serve.
    state.world.player.x = 621;
    state.world.player.y = 210;
    state.plate = [
      { key: 'tomato', prep: 'ready' },
      { key: 'lettuce', prep: 'ready' },
    ];
    state.carried = [];
    // Burner 0 mid-cook (ring half full), burner 1 burnt — shows both
    // stove states in the screenshot.
    state.burners[0] = { item: { key: 'patty', prep: 'raw' }, progress: 2.5, cooked: false, burnt: false };
    state.burners[1] = { item: { key: 'cheese', prep: 'burnt' }, progress: 6.0, cooked: true, burnt: true };
    state.toast = { text: 'Garden Salad ready — serve it at the window!', life: 30 };
    return state;
  }
  if (shot === 'end') {
    const state = baseState('end');
    state.timeLeft = 0;
    state.score = 1240;
    state.combo = 0;
    state.bestCombo = 5;
    state.served = 9;
    state.missed = 2;
    state.orders = [];
    state.world.player.x = 864;
    state.world.player.y = 210;
    return state;
  }
  // Default: title screen over the full kitchen with a sample order.
  const state = baseState('title');
  state.orders = [sampleOrders()[0]];
  return state;
}
