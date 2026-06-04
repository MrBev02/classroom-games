# Jeopardy

A classroom Jeopardy game with a **dual-screen** setup: students see the game
board on the projector while you control everything (and see the answers) from
your laptop.

## Quick start

1. Open a terminal in this folder and start a local server:

   ```
   python -m http.server 8080
   ```

2. On **your laptop**, open <http://localhost:8080/host.html>
3. On the **projector**, open <http://localhost:8080/index.html>
   (or click **"Open display window"** on the host screen and drag it across)
4. Pick a game set, number of teams (2–10) and team names, then **Start Game**.
   Both screens sync automatically.

> The two tabs talk via `BroadcastChannel`, so they must be opened from the
> same server in the same browser — exactly like the Family Feud game.

## Running the game

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
- **🎵 Think music** plays `sounds/think.mp3` if you've added one (the real
  Jeopardy "Think!" track is copyrighted, so it isn't bundled — source it
  yourself and drop it in the `sounds/` folder). Without the file, a built-in
  ~30-second "thinking clock" plays instead, ending with a time's-up chime.
- With **"Auto-play think music when a clue opens"** ticked on the setup
  screen (on by default), the music starts by itself on every clue; otherwise
  use the 🎵 button in the clue panel. While it plays, the projector shows a
  **countdown bar** that turns red for the last 5 seconds. The music and
  countdown stop automatically when you award the clue, reveal the answer,
  or close it.

You can also **print an answer key** from the setup screen.

## Writing your own questions

Edit `data/games.js`. Each game set looks like:

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
