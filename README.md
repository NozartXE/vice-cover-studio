# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/NozartXE/vice-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/NozartXE/vice-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline browser app that composes GTA-style poster covers: a three-column
sunset triptych built from your own photos, with face-safe crops, an editable
title / subline / caption, a sunset-neon grade, and one-click PNG exports in
three sizes — 1080×1080, 1080×1350 and 1920×1080. No build step, no network
requests; everything runs locally in the browser.

Built for make.fun's [Make GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01).

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 and load your photos (or use the bundled
samples). Edit the title, subline and caption, then export your cover.

To produce the grading dossier instead:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Join make.fun

New to make.fun? Start here: https://make.fun/r/b9zyas72
