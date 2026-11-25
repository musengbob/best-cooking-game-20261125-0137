// Ember & Thyme: input — keyboard (WASD/arrows + E to interact) and
// mouse (click-to-move, click a station to walk to it and use it).
// This module only collects raw input; main.js decides what it means.

export function createInput(canvas, onInteract, onAnyKey) {
  const input = {
    keys: new Set(),
    // Normalised movement direction for this frame, read by the loop.
    moveX: 0,
    moveY: 0,
    interactPressed: false,
  };

  function recomputeMove() {
    const k = input.keys;
    const left = k.has('arrowleft') || k.has('a');
    const right = k.has('arrowright') || k.has('d');
    const up = k.has('arrowup') || k.has('w');
    const down = k.has('arrowdown') || k.has('s');
    input.moveX = (right ? 1 : 0) - (left ? 1 : 0);
    input.moveY = (down ? 1 : 0) - (up ? 1 : 0);
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if (key === 'e' && !event.repeat) {
      input.interactPressed = true;
      onInteract();
    }
    if (key === 'enter' || key === ' ') onAnyKey();
    input.keys.add(key);
    recomputeMove();
  });

  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
    recomputeMove();
  });

  // Clicking the floor sets a move target; clicking a station walks the
  // chef to it and uses it on arrival (main.js handles the arrival).
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    onAnyKey();
    if (typeof input.onPointerDown === 'function') input.onPointerDown(x, y);
  });

  window.addEventListener('blur', () => {
    input.keys.clear();
    recomputeMove();
  });

  return input;
}
