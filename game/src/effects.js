// Ember & Thyme: effects — particles (chop bits, steam, sparkles) and
// floating score text. Pure state + drawing; main.js owns the arrays.

export function spawnParticles(state, x, y, colour, count, speed = 90) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 40,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      size: 2 + Math.random() * 3,
      colour,
      gravity: 220,
    });
  }
}

export function spawnSteam(state, x, y) {
  state.particles.push({
    x: x + (Math.random() - 0.5) * 16, y,
    vx: (Math.random() - 0.5) * 12,
    vy: -34 - Math.random() * 20,
    life: 0.8 + Math.random() * 0.4,
    maxLife: 1.2,
    size: 4 + Math.random() * 4,
    colour: 'rgba(255,248,236,0.7)',
    gravity: -30,
  });
}

export function spawnSparkles(state, x, y) {
  for (let i = 0; i < 14; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const v = 60 + Math.random() * 90;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 60,
      life: 0.6 + Math.random() * 0.5,
      maxLife: 1.1,
      size: 2 + Math.random() * 3,
      colour: ['#ffd166', '#f4a259', '#7fb069'][i % 3],
      gravity: 120,
    });
  }
}

export function spawnFloater(state, x, y, text, colour = '#ffd166') {
  state.floaters.push({ x, y, text, colour, life: 1.2 });
}

export function updateEffects(state, dt) {
  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const f of state.floaters) {
    f.life -= dt;
    f.y -= 42 * dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
}

export function drawEffects(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.min(1, f.life / 0.4);
    ctx.fillStyle = f.colour;
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(43,33,24,0.8)';
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
