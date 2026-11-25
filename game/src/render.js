// Ember & Thyme: rendering — everything on one canvas, drawn with flat
// warm colours and chunky shapes so the kitchen reads at a glance. The
// renderer is pure drawing: it takes the game state and paints it.

import { CANVAS, INGREDIENTS, PALETTE, STATIONS } from './config.js';

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

function drawStation(ctx, station, highlighted) {
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
  } else if (station.id === 'chopping') {
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(x + 28, y + 34, w - 56, 30);
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 28, y + 34, w - 56, 30);
    drawIngredient(ctx, 'tomato', x + w / 2, y + 49, 11);
  } else if (station.id === 'stove') {
    for (const bx of [x + 38, x + w - 38]) {
      ctx.fillStyle = '#2b2118';
      ctx.beginPath();
      ctx.arc(bx, y + 48, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2574c';
      ctx.beginPath();
      ctx.arc(bx, y + 48, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(x + w / 2 - 16, y + 30, 32, 12);
  } else if (station.id === 'assembly') {
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 50, 42, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8a888';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, 'tomato', x + w / 2 - 14, y + 48, 8);
    drawIngredient(ctx, 'lettuce', x + w / 2 + 12, y + 48, 8);
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

function drawPlayer(ctx, player, carrying) {
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
  // Carried ingredient floats above the toque.
  if (carrying) drawIngredient(ctx, carrying, x, y - 32, 10);
}

// --- order board + HUD -------------------------------------------------------

function orderCard(ctx, order, x, y, w, h) {
  const frac = Math.max(0, order.timeLeft / order.waitSeconds);
  const urgent = frac < 0.35;
  ctx.fillStyle = urgent ? '#7a2e2e' : PALETTE.board;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = urgent ? PALETTE.bad : PALETTE.boardFrame;
  ctx.lineWidth = 2;
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

export function drawOrderBoard(ctx, orders) {
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
    orders.forEach((order, i) => orderCard(ctx, order, x, y + 30 + i * 74, w, 66));
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
  // Carried items tray, bottom-left.
  if (state.carried.length > 0) {
    ctx.fillStyle = PALETTE.hudBg;
    roundRect(ctx, 24, CANVAS.height - 52, 44 + state.carried.length * 30, 40, 10);
    ctx.fill();
    drawText(ctx, 'CARRYING', 36, CANVAS.height - 32, 11, PALETTE.textDim, 'left', '700');
    state.carried.forEach((key, i) => drawIngredient(ctx, key, 108 + i * 30, CANVAS.height - 32, 10));
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

export function drawFrame(ctx, state) {
  drawFloor(ctx);
  drawWall(ctx);
  for (const station of STATIONS) {
    const highlighted = state.world.nearStation?.id === station.id && state.screen === 'play';
    drawStation(ctx, station, highlighted);
  }
  drawOrderBoard(ctx, state.orders);
  drawPlayer(ctx, state.world.player, state.carried[0] ?? null);
  drawHud(ctx, state);
  drawToast(ctx, state.toast);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'end') drawEnd(ctx, state);
}
