// Ember & Thyme: rendering — everything on one canvas, drawn with flat
// warm colours and chunky shapes so the kitchen reads at a glance. The
// renderer is pure drawing: it takes the game state and paints it.

import { CANVAS, INGREDIENTS, PALETTE, PANTRY_ORDER, STATIONS } from './config.js';
import { matchingOrder, prepSecondsFor } from './recipes.js';
import { drawEffects } from './effects.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawText(ctx, text, x, y, size, colour, align = 'left', weight = '700') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// --- kitchen ----------------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  // Checkerboard tiles.
  const tile = 48;
  ctx.fillStyle = PALETTE.floorB;
  for (let row = 0; row < CANVAS.height / tile; row += 1) {
    for (let col = 0; col < CANVAS.width / tile; col += 1) {
      if ((row + col) % 2 === 0) ctx.fillRect(col * tile, row * tile, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.25;
  for (let x = 0; x <= CANVAS.width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS.height);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS.height; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS.width, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // A woven rug in the middle of the floor so the open kitchen does
  // not read as one big empty checkerboard.
  ctx.fillStyle = '#a06a35';
  roundRect(ctx, 340, 392, 280, 96, 14);
  ctx.fill();
  ctx.strokeStyle = '#7a4a2b';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232, 220, 200, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, 352, 404, 256, 72, 10);
  ctx.stroke();
}

function drawWall(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, CANVAS.width, 88);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 84, CANVAS.width, 6);
  // Hanging lamps over the counter row.
  for (const x of [120, 360, 600, 840]) {
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 26);
    ctx.stroke();
    ctx.fillStyle = '#f4a259';
    ctx.beginPath();
    ctx.arc(x, 34, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(244, 162, 89, 0.25)';
    ctx.beginPath();
    ctx.arc(x, 40, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  drawText(ctx, 'EMBER & THYME', 24, 30, 26, PALETTE.text, 'left', '800');
  drawText(ctx, 'RUSH HOUR KITCHEN', 24, 58, 13, PALETTE.textDim, 'left', '600');
}

function drawIngredient(ctx, key, x, y, r) {
  const ing = INGREDIENTS[key];
  if (!ing) return;
  ctx.fillStyle = ing.colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (key === 'tomato') {
    ctx.fillStyle = '#386641';
    ctx.beginPath();
    ctx.arc(x, y - r + 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (key === 'lettuce') {
    ctx.strokeStyle = '#386641';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, 0.4, Math.PI * 1.4);
    ctx.stroke();
  }
  if (key === 'bread') {
    ctx.fillStyle = '#c98f4e';
    ctx.fillRect(x - r * 0.6, y - 2, r * 1.2, 4);
  }
  if (key === 'cheese') {
    ctx.fillStyle = '#b58900';
    ctx.beginPath();
    ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
    ctx.arc(x + 4, y + 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (key === 'pasta') {
    ctx.strokeStyle = '#e0aa6e';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - r * 0.7, y + i * 4);
      ctx.lineTo(x + r * 0.7, y + i * 4);
      ctx.stroke();
    }
  }
  if (key === 'patty') {
    ctx.fillStyle = '#5d3620';
    ctx.fillRect(x - r * 0.7, y - 3, r * 1.4, 6);
  }
}

// Draw a carried item: a plate renders as a tray with its dish on it,
// a burnt item is blackened, a raw one gets a small amber dot.
function drawCarriedItem(ctx, item, x, y, r) {
  if (!item) return;
  if (item.key === 'plate') {
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.ellipse(x, y, r + 4, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8a888';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    (item.keys ?? []).forEach((key, i) => {
      drawIngredient(ctx, key, x - ((item.keys.length - 1) * 7) + i * 14, y - 2, 5);
    });
    return;
  }
  drawIngredient(ctx, item.key, x, y, r);
  if (item.prep === 'burnt') {
    ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStation(ctx, station, highlighted, state) {
  const { x, y, w, h } = station;
  // Counter body and top.
  ctx.fillStyle = PALETTE.counterSide;
  roundRect(ctx, x, y + 8, w, h, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, x, y, w, 18, 8);
  ctx.fill();
  // Station-specific dressing.
  if (station.id === 'pantry') {
    for (let i = 0; i < 3; i += 1) {
      drawIngredient(ctx, ['tomato', 'lettuce', 'bread'][i], x + 30 + i * 45, y + 46, 13);
    }
    // Gold ring on the bin the chef will grab next with E.
    const currentKey = PANTRY_ORDER[state.pantryIndex % PANTRY_ORDER.length];
    drawIngredient(ctx, currentKey, x + w - 16, y + h - 16, 9);
    ctx.strokeStyle = PALETTE.boardFrame;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w - 16, y + h - 16, 12, 0, Math.PI * 2);
    ctx.stroke();
  } else if (station.id === 'chopping') {
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(x + 28, y + 34, w - 56, 30);
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 28, y + 34, w - 56, 30);
    // The item on the board: the one being chopped, or a tomato prop.
    const choppingKey = state.chop ? state.chop.key : 'tomato';
    drawIngredient(ctx, choppingKey, x + w / 2, y + 49, 11);
    // Chop progress bar while a chop is in flight.
    if (state.chop) {
      const item = { key: state.chop.key, prep: 'raw' };
      const total = prepSecondsFor(item);
      const frac = total > 0 ? Math.min(1, state.chop.progress / total) : 1;
      ctx.fillStyle = 'rgba(43,33,24,0.35)';
      ctx.fillRect(x + 28, y + 24, w - 56, 6);
      ctx.fillStyle = PALETTE.good;
      ctx.fillRect(x + 28, y + 24, (w - 56) * frac, 6);
    }
  } else if (station.id === 'stove') {
    state.burners.forEach((burner, i) => {
      const bx = x + 38 + i * (w - 76);
      const by = y + 48;
      ctx.fillStyle = '#2b2118';
      ctx.beginPath();
      ctx.arc(bx, by, 20, 0, Math.PI * 2);
      ctx.fill();
      // Flame glow while something cooks.
      if (burner.item && !burner.burnt) {
        ctx.fillStyle = '#e2574c';
        ctx.beginPath();
        ctx.arc(bx, by, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      if (burner.item) {
        drawIngredient(ctx, burner.item.key, bx, by, 11);
        if (burner.burnt) {
          ctx.fillStyle = 'rgba(20, 12, 8, 0.6)';
          ctx.beginPath();
          ctx.arc(bx, by, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        // Progress ring: amber while cooking, green in the perfect
        // window, red once burnt. Full ring = cooked.
        const total = prepSecondsFor(burner.item);
        const frac = total > 0 ? Math.min(1, burner.progress / total) : 1;
        ctx.strokeStyle = burner.burnt ? PALETTE.bad : burner.cooked ? PALETTE.good : '#ffd166';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(bx, by, 23, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
        if (burner.burnt) {
          drawText(ctx, '✕', bx, by - 30, 16, PALETTE.bad, 'center', '800');
          drawText(ctx, 'BURNT', bx, by + 32, 9, PALETTE.bad, 'center', '800');
        } else if (burner.cooked) {
          drawText(ctx, '✓ PERFECT', bx, by - 30, 10, PALETTE.good, 'center', '800');
        }
      }
    });
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(x + w / 2 - 16, y + 30, 32, 12);
  } else if (station.id === 'assembly') {
    // A plate that matches an open order is READY: green ring + label
    // so the serveable state reads at a glance.
    const ready = matchingOrder(state.plate ?? [], state.orders);
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 50, 42, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ready ? PALETTE.good : '#b8a888';
    ctx.lineWidth = ready ? 3 : 2;
    ctx.stroke();
    if (ready) drawText(ctx, '✓ READY', x + w / 2, y + 27, 11, PALETTE.good, 'center', '800');
    // The real plate stack: each plated item sits on the plate.
    const plate = state.plate ?? [];
    plate.forEach((item, i) => {
      const px = x + w / 2 - ((plate.length - 1) * 11) + i * 22;
      drawIngredient(ctx, item.key, px, y + 48, 8);
    });
  } else if (station.id === 'serving') {
    ctx.fillStyle = '#f4a259';
    ctx.fillRect(x + 12, y + 30, w - 24, 8);
    drawText(ctx, '🛎', x + w / 2, y + 52, 22, PALETTE.text, 'center');
  }
  drawText(ctx, station.label, x + w / 2, y + h - 6, 11, PALETTE.textDim, 'center', '700');
  if (highlighted) {
    ctx.strokeStyle = PALETTE.boardFrame;
    ctx.lineWidth = 3;
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
    ctx.stroke();
    drawText(ctx, 'E — USE', x + w / 2, y - 14, 12, PALETTE.boardFrame, 'center', '800');
  }
}

function drawPlayer(ctx, player, carrying, carryingSecond) {
  const { x, y } = player;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white chef coat, apron, toque.
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.playerApron;
  ctx.fillRect(x - 11, y - 2, 22, 14);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y - 16, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x - 10, y - 17, 20, 5);
  // Eyes look the way the chef faces.
  const look = player.facing === 'left' ? -3 : player.facing === 'right' ? 3 : 0;
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(x - 5 + look, y - 2, 2, 0, Math.PI * 2);
  ctx.arc(x + 5 + look, y - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  // Carried item floats above the toque (an object { key, prep }).
  if (carrying) drawCarriedItem(ctx, carrying, x, y - 32, 10);
  // A second carried item rides on the other side.
  if (carryingSecond) drawCarriedItem(ctx, carryingSecond, x + 20, y - 26, 8);
}

// --- order board + HUD -------------------------------------------------------

function orderCard(ctx, order, x, y, w, h, now) {
  const frac = Math.max(0, order.timeLeft / order.waitSeconds);
  const urgent = frac < 0.35;
  // Urgent cards flash in the last stretch of their timer.
  const flash = urgent && Math.floor(now * 3) % 2 === 0;
  ctx.fillStyle = flash ? '#8f3535' : urgent ? '#7a2e2e' : PALETTE.board;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = flash ? '#ffb4a2' : urgent ? PALETTE.bad : PALETTE.boardFrame;
  ctx.lineWidth = flash ? 3 : 2;
  ctx.stroke();
  drawText(ctx, order.recipe.name.toUpperCase(), x + 10, y + 16, 13, PALETTE.text, 'left', '800');
  drawText(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 10, y + 16, 15, urgent ? '#ffb4a2' : PALETTE.text, 'right', '800');
  // Ingredient dots in assembly order.
  order.recipe.ingredients.forEach((key, i) => {
    drawIngredient(ctx, key, x + 20 + i * 26, y + 40, 9);
  });
  drawText(ctx, `+${order.recipe.points} pts`, x + 10, y + h - 14, 11, PALETTE.textDim, 'left', '600');
  // Timer bar.
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x + 10, y + h - 8, w - 20, 4);
  ctx.fillStyle = urgent ? PALETTE.bad : frac < 0.6 ? PALETTE.warn : PALETTE.good;
  ctx.fillRect(x + 10, y + h - 8, (w - 20) * frac, 4);
}

export function drawOrderBoard(ctx, orders, now) {
  const x = 24;
  const y = 196;
  const w = 200;
  const h = 34 + Math.max(1, orders.length) * 74;
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, x - 8, y - 8, w + 16, h + 16, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.boardFrame;
  ctx.lineWidth = 3;
  ctx.stroke();
  drawText(ctx, '📋 ORDER BOARD', x + 8, y + 12, 15, PALETTE.boardFrame, 'left', '800');
  if (orders.length === 0) {
    drawText(ctx, 'No orders — breathe!', x + 8, y + 52, 13, PALETTE.textDim, 'left', '600');
  } else {
    orders.forEach((order, i) => orderCard(ctx, order, x, y + 30 + i * 74, w, 66, now));
  }
}

function drawHud(ctx, state) {
  // Top strip: shift timer, score, combo, hearts.
  ctx.fillStyle = PALETTE.hudBg;
  roundRect(ctx, CANVAS.width - 330, 8, 322, 44, 10);
  ctx.fill();
  const mm = Math.floor(state.timeLeft / 60);
  const ss = String(Math.floor(state.timeLeft % 60)).padStart(2, '0');
  drawText(ctx, `⏱ ${mm}:${ss}`, CANVAS.width - 316, 30, 18, PALETTE.text, 'left', '800');
  drawText(ctx, `SCORE ${state.score}`, CANVAS.width - 200, 30, 16, PALETTE.boardFrame, 'left', '800');
  drawText(ctx, `x${state.combo}`, CANVAS.width - 96, 30, 16, state.combo > 1 ? PALETTE.good : PALETTE.textDim, 'left', '800');
  let hearts = '';
  for (let i = 0; i < state.hearts; i += 1) hearts += '♥';
  drawText(ctx, hearts, CANVAS.width - 60, 30, 18, PALETTE.bad, 'left', '800');
  // Carried items tray, bottom-left. Items are objects { key, prep };
  // the dot under each one shows its state: amber raw, green ready.
  if (state.carried.length > 0) {
    ctx.fillStyle = PALETTE.hudBg;
    roundRect(ctx, 24, CANVAS.height - 52, 44 + state.carried.length * 30, 40, 10);
    ctx.fill();
    drawText(ctx, 'CARRYING', 36, CANVAS.height - 32, 11, PALETTE.textDim, 'left', '700');
    state.carried.forEach((item, i) => {
      const ix = 108 + i * 30;
      drawCarriedItem(ctx, item, ix, CANVAS.height - 32, 10);
      ctx.fillStyle = item.prep === 'burnt' ? PALETTE.bad : item.prep === 'ready' ? PALETTE.good : PALETTE.warn;
      ctx.beginPath();
      ctx.arc(ix, CANVAS.height - 18, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function drawToast(ctx, toast) {
  if (!toast) return;
  const alpha = Math.min(1, toast.life / 0.4);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PALETTE.hudBg;
  const w = toast.text.length * 8.5 + 32;
  roundRect(ctx, CANVAS.width / 2 - w / 2, CANVAS.height - 84, w, 36, 10);
  ctx.fill();
  drawText(ctx, toast.text, CANVAS.width / 2, CANVAS.height - 66, 15, PALETTE.text, 'center', '700');
  ctx.globalAlpha = 1;
}

// --- screens -----------------------------------------------------------------

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43, 33, 24, 0.72)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  drawText(ctx, '🍳', CANVAS.width / 2, 130, 64, PALETTE.text, 'center');
  drawText(ctx, 'EMBER & THYME', CANVAS.width / 2, 210, 52, PALETTE.boardFrame, 'center', '800');
  drawText(ctx, 'RUSH HOUR KITCHEN', CANVAS.width / 2, 258, 22, PALETTE.text, 'center', '600');
  drawText(ctx, 'Orders are flying in. Chop, cook, plate, serve —', CANVAS.width / 2, 310, 17, PALETTE.textDim, 'center');
  drawText(ctx, 'before the timers run out. Three hearts. Three minutes.', CANVAS.width / 2, 334, 17, PALETTE.textDim, 'center');
  drawText(ctx, 'WASD / ARROWS to move  ·  CLICK to walk  ·  E to use a station', CANVAS.width / 2, 392, 15, PALETTE.text, 'center', '700');
  const pulse = 0.65 + 0.35 * Math.sin(state.now * 4);
  ctx.globalAlpha = pulse;
  drawText(ctx, 'PRESS ENTER OR CLICK TO START', CANVAS.width / 2, 448, 18, PALETTE.boardFrame, 'center', '800');
  ctx.globalAlpha = 1;
  drawText(ctx, 'An original game — no borrowed names, art or music.', CANVAS.width / 2, 540, 12, PALETTE.textDim, 'center');
}

function drawEnd(ctx, state) {
  ctx.fillStyle = 'rgba(43, 33, 24, 0.78)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  drawText(ctx, '🏁', CANVAS.width / 2, 120, 56, PALETTE.text, 'center');
  drawText(ctx, 'SHIFT OVER!', CANVAS.width / 2, 190, 44, PALETTE.boardFrame, 'center', '800');
  drawText(ctx, `SCORE  ${state.score}`, CANVAS.width / 2, 258, 26, PALETTE.text, 'center', '800');
  drawText(ctx, `Dishes served: ${state.served}    Best combo: x${state.bestCombo}`, CANVAS.width / 2, 306, 18, PALETTE.textDim, 'center', '600');
  drawText(ctx, `Orders missed: ${state.missed}`, CANVAS.width / 2, 336, 18, PALETTE.textDim, 'center', '600');
  const pulse = 0.65 + 0.35 * Math.sin(state.now * 4);
  ctx.globalAlpha = pulse;
  drawText(ctx, 'PRESS ENTER TO PLAY AGAIN', CANVAS.width / 2, 410, 18, PALETTE.boardFrame, 'center', '800');
  ctx.globalAlpha = 1;
}

// --- frame -------------------------------------------------------------------

// RUSH banner: pulses over the kitchen in the last 30 seconds.
function drawRushBanner(ctx, state) {
  if (state.screen !== 'play' || state.timeLeft > 30 || state.timeLeft <= 0) return;
  const pulse = 0.55 + 0.45 * Math.sin(state.now * 6);
  ctx.globalAlpha = pulse;
  const text = `⚠ RUSH! ${Math.ceil(state.timeLeft)}s LEFT ⚠`;
  const w = text.length * 11 + 36;
  ctx.fillStyle = 'rgba(122, 46, 46, 0.92)';
  roundRect(ctx, CANVAS.width / 2 - w / 2, 178, w, 34, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.bad;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, text, CANVAS.width / 2, 195, 17, '#ffb4a2', 'center', '800');
  ctx.globalAlpha = 1;
}

export function drawFrame(ctx, state) {
  // Screen shake: the whole kitchen jolts, the HUD stays steady.
  const shakeMag = state.shake > 0 ? state.shake * 22 : 0;
  ctx.save();
  if (shakeMag > 0) {
    ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
  }
  drawFloor(ctx);
  drawWall(ctx);
  for (const station of STATIONS) {
    const highlighted = state.world.nearStation?.id === station.id && state.screen === 'play';
    drawStation(ctx, station, highlighted, state);
  }
  drawOrderBoard(ctx, state.orders, state.now);
  drawPlayer(ctx, state.world.player, state.carried[0] ?? null, state.carried[1] ?? null);
  drawEffects(ctx, state);
  ctx.restore();
  drawRushBanner(ctx, state);
  drawHud(ctx, state);
  drawToast(ctx, state.toast);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'end') drawEnd(ctx, state);
}
