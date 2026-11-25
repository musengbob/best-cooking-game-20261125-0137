// Ember & Thyme: recipes — what an ingredient needs before it can be
// plated, and whether a built plate matches an open order. An item is a
// { key, prep } pair: prep is 'raw', 'ready' or 'burnt'. Only 'ready'
// items (chopped, cooked, or needing no prep) go on a plate.

import { INGREDIENTS, RECIPES } from './config.js';

// True when the item is finished and may be plated.
export function isReady(item) {
  if (!item) return false;
  const step = INGREDIENTS[item.key]?.step ?? 'none';
  return step === 'none' || item.prep === 'ready';
}

// True when the item still needs work at a station.
export function needsPrep(item) {
  if (!item) return false;
  const step = INGREDIENTS[item.key]?.step ?? 'none';
  return step !== 'none' && item.prep === 'raw';
}

// The station id that finishes this item ('chopping' / 'stove' / null).
export function prepStationFor(item) {
  if (!item) return null;
  const step = INGREDIENTS[item.key]?.step ?? 'none';
  if (step === 'chop') return 'chopping';
  if (step === 'cook') return 'stove';
  return null;
}

// Seconds of work the item needs at its prep station.
export function prepSecondsFor(item) {
  if (!item) return 0;
  const ing = INGREDIENTS[item.key];
  if (!ing) return 0;
  return ing.step === 'chop' ? ing.chopSeconds : ing.step === 'cook' ? ing.cookSeconds : 0;
}

// Multiset comparison: same keys, same counts, order ignored.
export function sameIngredients(a, b) {
  if (a.length !== b.length) return false;
  const count = (list) => {
    const map = new Map();
    for (const key of list) map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  };
  const ca = count(a);
  const cb = count(b);
  if (ca.size !== cb.size) return false;
  for (const [key, n] of ca) if (cb.get(key) !== n) return false;
  return true;
}

// The recipe a built plate matches, or null when it matches nothing.
export function recipeForPlate(plate) {
  const keys = plate.map((item) => item.key);
  return RECIPES.find((r) => sameIngredients(keys, r.ingredients)) ?? null;
}

// The open order whose recipe matches the plate, or null.
export function matchingOrder(plate, orders) {
  const recipe = recipeForPlate(plate);
  if (!recipe) return null;
  return orders.find((o) => o.recipe.id === recipe.id) ?? null;
}

// Points for serving an order: base points scaled by time left (the
// faster the serve, the more it pays) and by the combo multiplier.
export function scoreForServe(order, combo) {
  const frac = Math.max(0, order.timeLeft / order.waitSeconds);
  const mult = Math.min(Math.max(combo, 1), 5);
  return Math.round(order.recipe.points * (0.5 + frac) * (1 + 0.2 * (mult - 1)));
}

// Recipes the board may ask for at this point in the shift: the kitchen
// opens with 2-ingredient dishes and unlocks longer ones as it goes.
export function availableRecipes(elapsedSeconds) {
  const maxLen = elapsedSeconds < 45 ? 2 : elapsedSeconds < 100 ? 3 : 5;
  const pool = RECIPES.filter((r) => r.ingredients.length <= maxLen);
  return pool.length > 0 ? pool : RECIPES;
}
