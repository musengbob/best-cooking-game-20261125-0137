// Ember & Thyme: deterministic screenshot states. `?shot=start|play|end`
// (plus `&seed=`) stages the game into a fixed, readable scene so the
// screenshots are reproducible: title + full kitchen, a dish mid-assembly
// with a timer running, and the shift-end screen. The seed only varies
// which sample orders appear; seed=1 is the shipped set.

import { RECIPES, SHIFT_SECONDS } from './config.js';
import { createWorld } from './world.js';

function sampleOrders() {
  return [
    { id: 'shot-a', recipe: RECIPES[0], waitSeconds: RECIPES[0].waitSeconds, timeLeft: 32 },
    { id: 'shot-b', recipe: RECIPES[3], waitSeconds: RECIPES[3].waitSeconds, timeLeft: 48 },
    { id: 'shot-c', recipe: RECIPES[4], waitSeconds: RECIPES[4].waitSeconds, timeLeft: 21 },
  ];
}

function baseState(screen) {
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
    carried: [],
    toast: null,
    world: createWorld(),
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
    // Chef stands at the assembly counter with a half-built dish.
    state.world.player.x = 621;
    state.world.player.y = 210;
    state.carried = ['tomato', 'lettuce'];
    state.toast = { text: 'Plating Garden Salad… 2 of 2 ready!', life: 2 };
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
