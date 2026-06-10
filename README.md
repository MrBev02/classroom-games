# classroom-games

Browser-based game-show games for the classroom. Each lives in its own folder
and is pure static HTML/CSS/JS — no build step and no backend.

## For teachers — just open the link

**https://mrbev02.github.io/classroom-games/**

Open it in any browser, pick a game, and you're playing. There is nothing to
install — no Python, no terminal, no downloads. Bookmark the link and that's it.

The three games:

- **Jeopardy** — flexible board, 2–10 teams. (board + host console)
- **Family Feud** — two teams, survey answers and strikes. (board + host)
- **Pointless** — low-score-wins quiz. (board + host)

<details>
<summary>Running it offline instead (optional, technical)</summary>

You only need this if you want to run your own copy without internet. The games
must be served from a local server — just double-clicking the files won't let the
two screens sync. From the repo root:

```
python -m http.server 8080
```

Then visit <http://localhost:8080/> and pick a game.
</details>

## Load your own questions

Every game's **Host** screen has a **"Load your own questions"** panel:

1. Copy the built-in AI prompt.
2. Paste it into ChatGPT, Claude, or any AI and fill in your topic / year level.
3. Paste the JSON it returns (or pick a `.json` file) back on the same screen.
4. The browser validates it and either starts the game or shows a precise error.

It all runs in the browser (`FileReader` / `JSON.parse`) — nothing is uploaded,
committed, or shared, and it works even from `file://`. A bad paste only affects
that one attempt. The shared loader lives in `shared/custom-questions.js`.

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
