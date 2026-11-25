// Ember & Thyme — Rush Hour Kitchen: tuning, recipes and palette.
// One place for every number a designer would tweak: canvas size, the
// kitchen layout, the recipes, the timers and the colours. Phase 2
// mechanics read from here and nowhere else.

export const CANVAS = { width: 960, height: 600 };

// A 3-minute shift. The rush ramps: orders arrive faster and ask for
// longer recipes as the shift goes on.
export const SHIFT_SECONDS = 180;
export const MAX_HEARTS = 3;
export const COMBO_WINDOW_SECONDS = 12;

// Movement and interaction.
export const PLAYER = {
  radius: 16,
  speed: 230, // px per second
  startX: 480,
  startY: 420,
};
export const INTERACT_RADIUS = 64;

// Kitchen stations. x/y/w/h are in canvas pixels; the top wall is the
// counter row, the serving window sits on the right wall.
export const STATIONS = [
  { id: 'pantry', label: 'PANTRY', x: 24, y: 96, w: 150, h: 76, colour: '#8a5a2b', accent: '#c98f4e', icon: '🥕' },
  { id: 'chopping', label: 'CHOPPING', x: 198, y: 96, w: 150, h: 76, colour: '#a06a35', accent: '#e0aa6e', icon: '🔪' },
  { id: 'stove', label: 'STOVE', x: 372, y: 96, w: 150, h: 76, colour: '#5c3a3a', accent: '#e2574c', icon: '🔥' },
  { id: 'assembly', label: 'ASSEMBLY', x: 546, y: 96, w: 150, h: 76, colour: '#3f5a44', accent: '#7fb069', icon: '🍽️' },
  { id: 'serving', label: 'SERVING', x: 792, y: 96, w: 144, h: 76, colour: '#44506b', accent: '#f4a259', icon: '🛎️' },
];

// Ingredients: each has a colour and the prep it needs.
export const INGREDIENTS = {
  tomato: { name: 'Tomato', colour: '#e63946', step: 'chop', chopSeconds: 2.5 },
  lettuce: { name: 'Lettuce', colour: '#7fb069', step: 'chop', chopSeconds: 2.0 },
  bread: { name: 'Bread', colour: '#e0aa6e', step: 'none', chopSeconds: 0 },
  cheese: { name: 'Cheese', colour: '#ffd166', step: 'cook', cookSeconds: 4.0 },
  pasta: { name: 'Pasta', colour: '#f4d58d', step: 'cook', cookSeconds: 6.0 },
  patty: { name: 'Patty', colour: '#8a5a2b', step: 'cook', cookSeconds: 5.0 },
};

// Recipes: a name, the ingredients in assembly order, base points and
// the seconds a customer will wait. Longer recipes pay more.
export const RECIPES = [
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    ingredients: ['tomato', 'lettuce'],
    points: 100,
    waitSeconds: 45,
  },
  {
    id: 'tomato-soup',
    name: 'Tomato Soup',
    ingredients: ['tomato', 'tomato'],
    points: 120,
    waitSeconds: 50,
  },
  {
    id: 'grilled-cheese',
    name: 'Grilled Cheese',
    ingredients: ['bread', 'cheese'],
    points: 140,
    waitSeconds: 55,
  },
  {
    id: 'pasta-special',
    name: 'Pasta Special',
    ingredients: ['pasta', 'tomato', 'cheese'],
    points: 200,
    waitSeconds: 65,
  },
  {
    id: 'thyme-burger',
    name: 'Thyme Burger',
    ingredients: ['bread', 'patty', 'lettuce', 'cheese'],
    points: 260,
    waitSeconds: 75,
  },
];

// Order pacing: seconds between new orders at the start and at the end
// of the shift; the spawn interval lerps between them.
export const ORDER_PACING = { startInterval: 16, endInterval: 8, maxOnBoard: 4 };

// The look: warm bistro wood, cream tiles, ember orange accents.
export const PALETTE = {
  floorA: '#c99a5b',
  floorB: '#bd8f52',
  floorLine: '#a87c46',
  wall: '#7a4a2b',
  wallTrim: '#5d3620',
  counterTop: '#e8dcc8',
  counterSide: '#6b4a2f',
  board: '#2b2118',
  boardFrame: '#f4a259',
  hudBg: 'rgba(43, 33, 24, 0.85)',
  text: '#fff8ec',
  textDim: '#d8c9ae',
  good: '#7fb069',
  warn: '#f4a259',
  bad: '#e63946',
  player: '#f4f1de',
  playerApron: '#e07a5f',
};

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? RECIPES[0];
}
