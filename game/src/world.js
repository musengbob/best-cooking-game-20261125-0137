// Ember & Thyme: the kitchen world — stations, the player, movement and
// collision. The world owns positions and answers questions ("which
// station is near the chef?"); it never draws or reads input.

import { CANVAS, INTERACT_RADIUS, PLAYER, STATIONS } from './config.js';

export function createWorld() {
  return {
    player: {
      x: PLAYER.startX,
      y: PLAYER.startY,
      radius: PLAYER.radius,
      speed: PLAYER.speed,
      // Where the chef is walking to (click-to-move); null when idle.
      target: null,
      facing: 'down',
    },
    // The station the chef is close enough to use, or null.
    nearStation: null,
    // Seconds the chef has been idle at a station (phase 2 uses this for
    // chop/cook progress bars).
    stationDwell: 0,
  };
}

// The walkable floor: inside the canvas, below the counter row and
// inside the side walls.
export function floorBounds() {
  return { left: 24, top: 196, right: CANVAS.width - 24, bottom: CANVAS.height - 24 };
}

function clampToFloor(world) {
  const b = floorBounds();
  const p = world.player;
  p.x = Math.max(b.left + p.radius, Math.min(b.right - p.radius, p.x));
  p.y = Math.max(b.top + p.radius, Math.min(b.bottom - p.radius, p.y));
}

function stationCentre(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h + 14 };
}

export function nearestStation(world) {
  const p = world.player;
  let best = null;
  let bestDist = Infinity;
  for (const station of STATIONS) {
    const c = stationCentre(station);
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = station;
    }
  }
  return bestDist <= INTERACT_RADIUS + 30 ? best : null;
}

// Move the chef one frame: keyboard direction wins over a click target,
// and arriving at the target clears it.
export function updatePlayer(world, dirX, dirY, dt) {
  const p = world.player;
  if (dirX !== 0 || dirY !== 0) {
    p.target = null;
    const len = Math.hypot(dirX, dirY);
    p.x += (dirX / len) * p.speed * dt;
    p.y += (dirY / len) * p.speed * dt;
    p.facing = Math.abs(dirX) > Math.abs(dirY) ? (dirX > 0 ? 'right' : 'left') : dirY > 0 ? 'down' : 'up';
  } else if (p.target) {
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (dist <= step) {
      p.x = p.target.x;
      p.y = p.target.y;
      p.target = null;
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
      p.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    }
  }
  clampToFloor(world);
  const near = nearestStation(world);
  if (near !== world.nearStation) {
    world.nearStation = near;
    world.stationDwell = 0;
  } else if (near) {
    world.stationDwell += dt;
  }
}

export function setMoveTarget(world, x, y) {
  const b = floorBounds();
  world.player.target = {
    x: Math.max(b.left, Math.min(b.right, x)),
    y: Math.max(b.top, Math.min(b.bottom, y)),
  };
}
