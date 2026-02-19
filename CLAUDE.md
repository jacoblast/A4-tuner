# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git hooks

A `pre-commit` hook at `.git/hooks/pre-commit` automatically updates the build stamp in `index.html` with the current UTC date/time before every commit. This file is not tracked by git — if you clone fresh, recreate it:

```sh
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
STAMP=$(date -u '+%Y-%m-%d %H:%M UTC')
sed -i '' 's/\(id="build-stamp"[^>]*>\)[^<]*/\1'"$STAMP"'/' index.html
git add index.html
EOF
chmod +x .git/hooks/pre-commit
```

## Deployment

There is no build step. Editing files and pushing to `main` deploys directly to GitHub Pages at `https://jacoblast.github.io/A4-tuner/`.

## Architecture

The entire app lives in a single `index.html` file — markup, CSS, and JS are all inline. There are no external dependencies, no npm, no bundler.

Supporting files:
- `sw.js` — service worker for offline support and caching
- `manifest.json` — PWA metadata (scope and start_url are absolute GitHub Pages URLs)
- `icons/` — PWA icons

## Service Worker Cache

The cache is versioned by the `CACHE_NAME` constant at the top of `sw.js` (currently `a4-tuner-v35`). **Bump this version whenever you change any cached file** (index.html, manifest.json, icons), otherwise installed PWA users won't receive updates.

## Key Patterns in index.html

**Audio**: The Web Audio API `AudioContext` is created fresh on first use and reused thereafter. iOS requires a silent buffer to be played synchronously on the user gesture before the context is resumed — this unlock pattern must be preserved.

**Tone envelope**: Each tone uses an attack → sustain → release envelope via `GainNode`. Active nodes are tracked in `activeNodes` keyed by tone type (`low`, `mid`, `high`). Interrupting a tone that's already in its release phase is intentionally skipped to avoid clicks.

**Settings persistence**: User preferences (target frequency, offset, tone length, attack, release) are saved to `localStorage` and restored on load.

**Auto-alternate mode**: Timed via `setTimeout` chained in `autoStep()`. The sweep bar animation is driven by the Web Animations API and visually tracks which tone is playing.

**Analytics**: GoatCounter is loaded async at the bottom of `<body>`. A custom event fires on load to distinguish `launch-pwa` (installed standalone) from `launch-web` (browser), detected via `window.matchMedia('(display-mode: standalone)')` and `navigator.standalone`.
