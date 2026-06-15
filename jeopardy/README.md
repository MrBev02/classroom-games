# Jeopardy

A classroom Jeopardy game with a **dual-screen** setup: students see the game
board on the projector while you control everything (and see the answers) from
your laptop.

## Quick start — just open the link

1. On **your laptop**, open the host console:
   <https://mrbev02.github.io/classroom-games/jeopardy/host.html>
2. Pick a game set, number of teams (2–10) and team names, then **Start Game**.
3. The students' **Board** opens in a new tab — drag it to the **projector** and
   fullscreen it (F11). Lost the tab? Re-open it with **Open Board** (top right).
   Both screens sync automatically.

No installs, no terminal. The two windows talk via `BroadcastChannel`, so keep
them in the **same browser on the same computer**.

<details>
<summary>Running it offline instead (optional)</summary>

To run your own copy without internet, serve the folder from a local server
(the windows won't sync if you just double-click the files):

```
python -m http.server 8080
```

Then open <http://localhost:8080/host.html> on your laptop and start a game —
the board opens in its own tab, ready to drag to the projector.
</details>

## Running the game

A collapsible **How to run this** panel on the left of the board recaps these
controls during the game, and **← All games** (top bar) / **🏠 All games** (final
screen) return you to the Classroom Games home page.

- **Click a dollar value** on the host board to put that clue up on the display.
  You always see the answer; students don't until you reveal it.
- For each team: **✓** awards the money, **✗** deducts it. Whether wrong answers
  cost points is up to you per clue — just don't press ✗ if you're playing
  without penalties. Scores can go negative.
- **Reveal answer on display** shows the correct response to the class.
- **Done — back to board** marks the clue used. **Oops — keep clue available**
  (or `Esc`) closes the clue *without* using it up and undoes any scoring from
  it — for accidental clicks.
- Each team row on the board screen has **+100/−100** buttons for manual
  score fixes.
- When every clue is played you'll be prompted to show the **final results**
  (podium + confetti on the display).

The game auto-saves after every action, so if the host tab is accidentally
closed or refreshed you'll be offered a **Resume** button.

## Sounds

Sounds play from the **host tab** — since your laptop also drives the
projector, the class hears them through the room speakers. Toggle all sounds
with the **🔊** button next to the board.

- **✓ / ✗** play a correct-answer ding and a wrong-answer buzzer (synthesised
  in the browser, no files needed).
- **🎵 Think music** plays a track of your choosing (the real Jeopardy
  "Think!" track is copyrighted, so none is bundled — bring your own). Either
  **upload one on the setup screen** — the easiest way, with nothing to edit;
  it's kept in your browser and remembered next time, and a **Remove** button
  clears it — or drop an MP3 at `sounds/think.mp3`. Without either, a built-in
  ~30-second "thinking clock" plays instead, ending with a time's-up chime.
- With **"Auto-play think music when a clue opens"** ticked on the setup
  screen (on by default), the music starts by itself on every clue; otherwise
  use the 🎵 button in the clue panel. While it plays, the projector shows a
  **countdown bar** that turns red for the last 5 seconds. The music and
  countdown stop automatically when you award the clue, reveal the answer,
  or close it.

You can also **print an answer key** from the setup screen.

## Making your own quiz

Click **✨ Make or load your own quiz** on the setup screen — no files to edit.
You have four ways to get your own questions in, all running in your browser
(nothing is uploaded):

- **Type them in** — fill the grid: a column per category, a row per clue, with
  the clue and the answer side by side. Set the board size (categories ×
  clues each) and add/remove rows as needed.
- **Paste from a spreadsheet** — keep your questions in Excel or Google Sheets
  with columns **Category, Clue, Answer, Value** (Value optional), then copy the
  cells and paste them in. A header row is fine. They drop straight into the grid
  so you can tweak before playing.
- **Import a file / use AI** — under *Or import a file / generate questions with
  AI*: load a `.json` file you saved earlier, or copy the AI prompt, paste it
  into ChatGPT/Claude, and load the JSON it returns.

Boards you build are kept in this browser under **Your saved boards** (load,
re-edit, or delete them anytime), and **⬇ Export JSON** downloads a board as a
file to back up or share with another teacher.

When a board is ready, click **Use this board ▶** — it becomes the selected game
set, so just press **Start Game ▶**.

## Writing questions in code

You can also edit `data/games.js` directly. Each game set looks like:

```js
{
  title: "My Topic",
  categories: [
    {
      name: "Category Name",
      clues: [
        { clue: "The clue students see", answer: "What is the answer?" },
        // ... one entry per row
      ],
    },
    // ... one entry per column
  ],
}
```

- **Board size is flexible** — the number of categories sets the columns and
  the clues per category set the rows (5×5, 3×4, anything).
- `value` is optional per clue; it defaults to row × $100
  (`$100, $200, $300, ...`). Add `value: 1000` to override.

## Files

| File              | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `index.html`      | Display screen (projector) — passive renderer    |
| `host.html`       | Host console (teacher) — owns all game state     |
| `data/games.js`   | Question sets — edit this!                       |
| `js/channel.js`   | BroadcastChannel wrapper for two-screen sync     |
| `js/host.js`      | Game logic + host UI                             |
| `js/display.js`   | Renders broadcast state on the display           |
| `js/sounds.js`    | Ding / buzzer / think-music player               |
| `sounds/`         | Drop `think.mp3` here for real think music       |
