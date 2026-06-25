# classroom-games

Browser-based game-show games for the classroom. Each lives in its own folder
and is pure static HTML/CSS/JS — no build step and no backend.

## For teachers — just open the link

**https://mrbev02.github.io/classroom-games/**

Open it in any browser, pick a game, and you're playing. There is nothing to
install — no Python, no terminal, no downloads. Bookmark the link and that's it.

The games:

- **Jeopardy** — flexible board, 2–10 teams. (board + host console)
- **Family Feud** — two teams, survey answers and strikes. (board + host)
- **Pointless** — low-score-wins quiz. (board + host)
- **Make & Swap** — students build their own word search / crossword and swap it. (self-serve, no host)

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

## Make & Swap (no teacher needed)

`make-swap/` is the odd one out — there's **no host console and no projector**.
It's built for a relief/cover lesson or independent work:

1. Each student opens the link and **types in words + clues** (a "Load Year 10 /
   Year 11 sample" button gives each class a worked example to copy).
2. They press **Create share link** and get a link plus a short code.
3. They share it however the class already talks — Google Classroom, a shared
   doc, chat, or just handing over the laptop.
4. A classmate opens it and solves it as a **word search or crossword** (one word
   list feeds both); the page marks it correct automatically.

The whole puzzle travels inside the link's `#hash` (base64 of the JSON), so
there is **no backend and nothing is uploaded** — it works on GitHub Pages and
from `file://`. Generation lives in `make-swap/puzzles.js`. Pasted puzzles are
rendered with safe DOM methods (never `innerHTML`), so a swapped link can't
inject markup.

### Bonus game — *The Huntsman* (and why it can't be farmed)

After a puzzle is **solved**, the student can play a short one-button game,
**The Huntsman**: a ceiling spider runs along the top of a retro title-screen
intro, and you tap (or Space) to drop under obstacles that hang down — with a
**double-jump** for the tall ones. Catching a **fly** (a Space-Invaders-style
UFO that drifts in) turns the spider **big**, letting it smash straight through
the next **2** obstacles before it shrinks back; while small, **one hit ends the
run**. Obstacles grow taller and longer the longer you survive. The play time is
*earned*, and the formula is deliberately hard to game (the failure mode being
students who make a 2-word puzzle and then play for 20 minutes):

- **Difficulty floor + ceiling, set by the puzzle, not a setting.** Under 4 words
  earns **no game**. The budget scales with word count up to 12 words, then stops.
- **Speed is a bounded ×0.5–×1.5 multiplier** measured against an expected "par"
  time for the puzzle's size — so solving a *hard* puzzle fast pays off, but
  solving a *trivial* one fast does not (its base is ~0).
- **Crosswords earn a flat 0:30 bonus** over word searches — they're harder to
  build *and* to solve, so they pay more.
- **Hard cap of 1:00** (1:30 for a crossword, with the bonus), and **one game per
  puzzle code** (claim recorded in `sessionStorage`). The creator's *preview*
  earns nothing — only real solves do.

Net effect: the only way to rack up game time is to author and solve genuine,
sizeable, themed puzzles — i.e. to do the work. The reward UI states the rule
on screen so the incentive is legible. The game itself uses a `<canvas>` with
synthesised sound and no image assets.

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
If you want your own thinking music in Jeopardy, **upload it on the host setup
screen** (kept in your browser, nothing to commit) — or drop an MP3 at
`jeopardy/sounds/think.mp3` locally, which is gitignored and never published.

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
