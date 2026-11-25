// Ember & Thyme: mechanics — the cooking itself. Pantry pickup,
// chopping, stove burners, plate assembly and serving. Every action
// reads the chef's position and what they carry; main.js calls
// interactAtStation() on E and updateMechanics() every frame.

import { INGREDIENTS, PANTRY_ORDER, STATIONS } from './config.js';
import {
  isReady,
  needsPrep,
  prepSecondsFor,
  prepStationFor,
  recipeForPlate,
  scoreForServe,
} from './recipes.js';
import { sfx } from './audio.js';
import { spawnFloater, spawnParticles, spawnSparkles, spawnSteam, updateEffects } from './effects.js';

export const MAX_CARRY = 2;
const BURNER_COUNT = 2;
const BURN_GRACE = 1.4; // cooked at 1.0x time, burnt past 1.4x

export function freshKitchen() {
  return {
    carried: [], // [{ key, prep }] — prep 'raw' | 'ready' | 'burnt'
    plate: [], // items stacked on the assembly plate
    burners: Array.from({ length: BURNER_COUNT }, () => ({
      item: null, progress: 0, cooked: false, burnt: false,
    })),
    pantryIndex: 0,
    chop: null, // { key, progress } while chopping a carried item
    particles: [],
    floaters: [],
    shake: 0,
    servedAttempts: 0,
    correctServes: 0,
    lastTickBeat: -1,
    sizzleTimer: 0,
    chopSoundTimer: 0,
  };
}

function stationCentre(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h + 10 };
}

function stationCentreById(id) {
  const station = STATIONS.find((s) => s.id === id);
  return station ? stationCentre(station) : { x: 0, y: 0 };
}

// --- pantry ---------------------------------------------------------------

function pantryPick(state, showToast) {
  if (state.carried.length >= MAX_CARRY) {
    // Hands full: E browses the bins instead.
    state.pantryIndex = (state.pantryIndex + 1) % PANTRY_ORDER.length;
    const next = INGREDIENTS[PANTRY_ORDER[state.pantryIndex]];
    showToast(`Next bin: ${next.name} — hands full, press Q to bin one.`);
    return;
  }
  const key = PANTRY_ORDER[state.pantryIndex];
  state.carried.push({ key, prep: 'raw' });
  sfx.pickup();
  showToast(`Picked up ${INGREDIENTS[key].name}.`);
  state.pantryIndex = (state.pantryIndex + 1) % PANTRY_ORDER.length;
}

export function selectPantryBin(state, index, showToast) {
  if (index < 0 || index >= PANTRY_ORDER.length) return;
  state.pantryIndex = index;
  showToast(`Bin: ${INGREDIENTS[PANTRY_ORDER[index]].name}.`);
}

// --- chopping ---------------------------------------------------------------

function choppableCarried(state) {
  return state.carried.findIndex(
    (c) => needsPrep(c) && prepStationFor(c) === 'chopping',
  );
}

// One E press adds a chunk of chopping; holding E (see updateMechanics)
// keeps it going. Returns true when a chop happened.
function chopPress(state, showToast) {
  const idx = choppableCarried(state);
  if (idx < 0) {
    if (state.carried.length === 0) showToast('Nothing to chop — grab a tomato, lettuce or onion first.');
    else if (state.carried.some((c) => isReady(c))) showToast('That is already chopped. Take it to Assembly.');
    else showToast('This needs the stove, not the board.');
    return false;
  }
  const item = state.carried[idx];
  if (!state.chop || state.chop.key !== item.key) {
    state.chop = { key: item.key, progress: 0 };
  }
  state.chop.progress += 0.45;
  sfx.chop();
  const c = stationCentreById('chopping');
  spawnParticles(state, c.x, c.y - 20, INGREDIENTS[item.key].colour, 6, 70);
  finishChopIfDone(state, idx, showToast);
  return true;
}

function finishChopIfDone(state, idx, showToast) {
  const item = state.carried[idx];
  if (!item || !state.chop) return;
  if (state.chop.progress >= prepSecondsFor(item)) {
    item.prep = 'ready';
    state.chop = null;
    sfx.ding();
    showToast(`${INGREDIENTS[item.key].name} chopped!`);
    const c = stationCentreById('chopping');
    spawnParticles(state, c.x, c.y - 20, '#7fb069', 10, 110);
  }
}

// --- stove ------------------------------------------------------------------

function stoveInteract(state, showToast) {
  // Bin a burnt item you are carrying.
  const burntIdx = state.carried.findIndex((c) => c.prep === 'burnt');
  if (burntIdx >= 0) {
    state.carried.splice(burntIdx, 1);
    sfx.click();
    showToast('Burnt food binned. Fresh start!');
    return;
  }
  // Place a raw cookable item on a free burner.
  const rawIdx = state.carried.findIndex(
    (c) => needsPrep(c) && prepStationFor(c) === 'stove',
  );
  if (rawIdx >= 0) {
    const free = state.burners.find((b) => !b.item);
    if (!free) {
      showToast('Both burners are full!');
      sfx.fail();
      return;
    }
    const item = state.carried.splice(rawIdx, 1)[0];
    free.item = item;
    free.progress = 0;
    free.cooked = false;
    free.burnt = false;
    sfx.sizzle();
    showToast(`Cooking ${INGREDIENTS[item.key].name} — watch the ring!`);
    return;
  }
  // Pick a finished (or burnt) item off a burner.
  const doneIdx = state.burners.findIndex((b) => b.item && (b.cooked || b.burnt));
  if (doneIdx >= 0) {
    if (state.carried.length >= MAX_CARRY) {
      showToast('Hands full — press Q to bin something first.');
      return;
    }
    const burner = state.burners[doneIdx];
    const wasBurnt = burner.burnt;
    const item = burner.item;
    burner.item = null;
    burner.progress = 0;
    burner.cooked = false;
    burner.burnt = false;
    item.prep = wasBurnt ? 'burnt' : 'ready';
    if (item.prep === 'burnt') {
      sfx.fail();
      showToast('Burnt! Bin it with E at the stove or Q.');
    } else {
      sfx.pickup();
      showToast(`${INGREDIENTS[item.key].name} cooked — perfect!`);
    }
    state.carried.push(item);
    return;
  }
  if (state.burners.some((b) => b.item)) {
    showToast('Still cooking — wait for the ring to fill.');
  } else if (state.carried.length === 0) {
    showToast('Bring a patty, cheese or pasta to cook.');
  } else {
    showToast('This needs chopping, not the stove.');
  }
}

// --- assembly ---------------------------------------------------------------

function assemblyInteract(state, showToast) {
  // A finished plate is picked up, never added to.
  if (state.carried.some((c) => c.key === 'plate')) {
    showToast('Plate is ready — take it to the Serving window!');
    return;
  }
  const readyIdx = state.carried.findIndex((c) => isReady(c) && c.key !== 'plate');
  if (readyIdx >= 0) {
    const item = state.carried.splice(readyIdx, 1)[0];
    state.plate.push(item);
    sfx.pickup();
    const recipe = recipeForPlate(state.plate);
    if (recipe) {
      showToast(`${recipe.name} complete! Press E to pick up the plate.`);
      sfx.ding();
    } else {
      showToast(`Plated ${INGREDIENTS[item.key].name} (${state.plate.length} on the plate).`);
    }
    return;
  }
  if (state.carried.length === 0 && state.plate.length > 0) {
    const recipe = recipeForPlate(state.plate);
    if (recipe) {
      const keys = state.plate.map((i) => i.key);
      state.plate = [];
      state.carried.push({ key: 'plate', prep: 'ready', recipeId: recipe.id, keys });
      sfx.pickup();
      showToast(`${recipe.name} on the tray — serve it!`);
    } else {
      // Take the last item back off the plate.
      const item = state.plate.pop();
      state.carried.push(item);
      sfx.click();
      showToast(`Took ${INGREDIENTS[item.key].name} back off the plate.`);
    }
    return;
  }
  if (state.carried.length > 0) {
    const item = state.carried[0];
    if (needsPrep(item)) {
      const where = prepStationFor(item) === 'chopping' ? 'the Chopping board' : 'the Stove';
      showToast(`${INGREDIENTS[item.key].name} needs ${where} first.`);
    } else {
      showToast('Nothing ready to plate yet.');
    }
    return;
  }
  showToast('Bring a prepared ingredient to plate it.');
}

// --- serving ----------------------------------------------------------------

function serveInteract(state, showToast) {
  const plateIdx = state.carried.findIndex((c) => c.key === 'plate');
  if (plateIdx < 0) {
    showToast('Bring a finished plate to serve.');
    return;
  }
  const plateItem = state.carried[plateIdx];
  const order = state.orders.find((o) => o.recipe.id === plateItem.recipeId);
  state.servedAttempts += 1;
  const wx = 864;
  const wy = 150;
  if (order) {
    state.orders = state.orders.filter((o) => o !== order);
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const points = scoreForServe(order, state.combo);
    state.score += points;
    state.served += 1;
    state.correctServes += 1;
    state.carried.splice(plateIdx, 1);
    sfx.serve();
    spawnSparkles(state, wx, wy);
    spawnFloater(state, wx, wy - 20, `+${points}`);
    const mult = Math.min(state.combo, 5);
    showToast(`Served ${order.recipe.name}! +${points}${mult > 1 ? ` (combo x${mult})` : ''}`);
  } else {
    state.combo = 0;
    state.score = Math.max(0, state.score - 25);
    // The plate goes back to the assembly counter, dish intact.
    state.plate = plateItem.keys.map((key) => ({ key, prep: 'ready' }));
    state.carried.splice(plateIdx, 1);
    sfx.fail();
    state.shake = 0.25;
    showToast('Wrong dish — no order wants that. Plate returned (-25).');
  }
}

// --- discard ------------------------------------------------------------------

export function discardCarried(state, showToast) {
  if (state.carried.length === 0) {
    showToast('Nothing to bin.');
    return;
  }
  const item = state.carried.pop();
  if (item.key === 'plate') {
    state.plate = item.keys.map((key) => ({ key, prep: 'ready' }));
    showToast('Plate put back on the counter.');
  } else {
    showToast(`Binned the ${INGREDIENTS[item.key].name}.`);
  }
  sfx.click();
}

// --- dispatch -----------------------------------------------------------------

export function interactAtStation(state, showToast) {
  const station = state.world.nearStation;
  if (!station) {
    showToast('Walk up to a station to use it.');
    return;
  }
  if (station.id === 'pantry') pantryPick(state, showToast);
  else if (station.id === 'chopping') chopPress(state, showToast);
  else if (station.id === 'stove') stoveInteract(state, showToast);
  else if (station.id === 'assembly') assemblyInteract(state, showToast);
  else if (station.id === 'serving') serveInteract(state, showToast);
}

// --- per-frame update -----------------------------------------------------------

export function updateMechanics(state, input, dt, showToast) {
  // Holding E at the chopping board keeps chopping.
  if (input.eHeld && state.world.nearStation?.id === 'chopping') {
    const idx = choppableCarried(state);
    if (idx >= 0) {
      const item = state.carried[idx];
      if (!state.chop || state.chop.key !== item.key) {
        state.chop = { key: item.key, progress: 0 };
      }
      state.chop.progress += dt;
      state.chopSoundTimer -= dt;
      if (state.chopSoundTimer <= 0) {
        state.chopSoundTimer = 0.28;
        sfx.chop();
        const c = stationCentreById('chopping');
        spawnParticles(state, c.x, c.y - 20, INGREDIENTS[item.key].colour, 3, 60);
      }
      finishChopIfDone(state, idx, showToast);
    }
  } else if (state.chop && state.world.nearStation?.id !== 'chopping') {
    state.chop = null;
  }

  // Burners cook, steam, and burn past the grace window.
  for (let i = 0; i < state.burners.length; i += 1) {
    const b = state.burners[i];
    if (!b.item || b.burnt) continue;
    const total = prepSecondsFor(b.item);
    b.progress += dt;
    const stoveX = 372 + (i === 0 ? 38 : 150 - 38);
    if (Math.random() < dt * 6) spawnSteam(state, stoveX, 96 + 34);
    if (!b.cooked && b.progress >= total) {
      b.cooked = true;
      sfx.ding();
    }
    if (!b.burnt && b.progress > total * BURN_GRACE) {
      b.burnt = true;
      b.item.prep = 'burnt';
      sfx.fail();
      state.shake = 0.3;
      spawnParticles(state, stoveX, 120, '#3a3a3a', 12, 80);
    }
  }
  state.sizzleTimer -= dt;
  if (state.burners.some((b) => b.item && !b.burnt) && state.sizzleTimer <= 0) {
    state.sizzleTimer = 0.7;
    sfx.sizzle();
  }

  // A tick each half-second while any order is under 10 seconds.
  const beat = Math.floor(state.now * 2);
  if (beat !== state.lastTickBeat) {
    state.lastTickBeat = beat;
    if (state.orders.some((o) => o.timeLeft > 0 && o.timeLeft <= 10)) sfx.tick();
  }

  updateEffects(state, dt);
}
