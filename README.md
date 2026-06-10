# classroom-games

Browser-based game-show games for the classroom. Each lives in its own folder
and is pure static HTML/CSS/JS — no build step and no backend.

**Play online:** https://mrbev02.github.io/classroom-games/

- **jeopardy/** — Jeopardy. `index.html` (board) + `host.html` (host console). Flexible board size, 2–10 teams.
- **family_feud/** — Family Feud. `index.html` (board) + `host.html` (host controller).
- **pointless/** — Pointless. `display.html` + `controller.html`.

## Running locally

From the repo root, start any static server and open the landing page:

```
python -m http.server 8080
```

Then visit http://localhost:8080/ and pick a game.

## Dual-screen setup

Jeopardy and Pointless use `BroadcastChannel` to sync the host/controller tab
with the board/display tab. Both tabs must be open in the **same browser on the
same machine** (e.g. the teacher's laptop driving the projector). This is
same-device only — it does not control a separate phone or computer over the
network.

## Sounds

All effects (ding, buzzer, the Jeopardy "thinking clock") are synthesised in the
browser, so no audio files are required. The real Jeopardy "Think!" track is
copyrighted and is **not** included; the game falls back to the synthesised loop.
If you want the real track for your own classroom, drop an MP3 at
`jeopardy/sounds/think.mp3` locally — it is gitignored and never published.

## Hosting on GitHub Pages

This repo is set up to publish as-is (a `.nojekyll` file disables Jekyll
processing). To enable Pages:

1. Push to GitHub.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch.**
3. Select branch **`main`**, folder **`/ (root)`**, and save.
4. The site goes live at `https://<user>.github.io/classroom-games/`.

## Disclaimer

These are **unofficial** classroom games inspired by the TV formats of the same
names. They are not affiliated with, endorsed by, or sponsored by the formats'
rights holders. No official logos, fonts, or branding are used. Provided free
for non-commercial educational use.
