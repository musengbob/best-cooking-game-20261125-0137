# Ember & Thyme — Rush Hour Kitchen

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun rank](https://make.fun/badge/best-cooking-game-20261125-0137-rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun reward](https://make.fun/badge/best-cooking-game-20261125-0137-reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A fast, top-down 2D cooking game built for the [make.fun "Make the best cooking game" bounty](https://make.fun/bounty/best-cooking-game-20261125-0137) ($250 in USDC).

You are the chef of **Ember & Thyme**, a tiny bistro with a big lunch rush.
Orders fly onto the board with countdown timers. Run to the pantry, chop
ingredients, mind the stove, assemble plates and serve them before the
timers run out. Wrong or missed orders cost a heart. Survive the 3-minute
shift, chain combos, and chase the high score.

## How to play

- **Move:** WASD / arrow keys, or click anywhere on the kitchen floor
- **Interact:** `E` near a station, or click the station
- **Goal:** serve every order on the board before its timer expires

Stations: **Pantry** (grab ingredients) · **Chopping board** (prep) ·
**Stove** (cook — don't let it burn!) · **Assembly counter** (plate the
dish) · **Serving window** (hand it over).

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no external assets — plain static
files under `game/`. The game is original: its own art, names and sounds
(WebAudio-synthesised blips, no audio files).

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to `$MAKEFUN_OUTPUT_DIR` and writes `dossier.json` with the
vendored `vendor/makefun-game.ts` library.

## Referral

Built with make.fun — [join with referral code `t2hmjdyt`](https://make.fun/r/t2hmjdyt).
