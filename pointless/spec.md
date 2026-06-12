# Pointless — Classroom Game Show

## Overview

A browser-based implementation of the TV game show "Pointless" adapted for 4 teams in a secondary school classroom. Teacher-controlled via two browser tabs on a single machine using `BroadcastChannel` for communication.

- **Display tab**: Projected for students — shows game board, animations, scores
- **Controller tab**: Teacher's screen — manages game flow, enters answers, triggers reveals

---

## Game Concept

Each question has a category and many possible correct answers. Each answer is pre-scored from 0–100 based on obscurity (lower = better). A "pointless" answer (score 0) is the best possible result. Incorrect answers score 100.

Teams try to find the most obscure *correct* answer. Lowest cumulative score wins.

---

## Architecture

### Communication

- `BroadcastChannel('pointless-game')` connects display and controller tabs
- Controller sends events to display (reveal answer, update score, advance round)
- Display sends acknowledgements back (animation complete, ready for next)

### Message Protocol

```json
{
  "type": "event_name",
  "payload": { }
}
```

#### Controller → Display Events

| Event | Payload | Description |
|---|---|---|
| `LOAD_GAME` | `{ gameData }` | Load full question set |
| `START_ROUND` | `{ roundNumber }` | Begin a round |
| `SHOW_QUESTION` | `{ category, question }` | Display question and category |
| `SET_ACTIVE_TEAM` | `{ teamIndex }` | Highlight which team is answering |
| `REVEAL_ANSWER` | `{ answer, score, teamIndex }` | Trigger score bar animation for a team's answer |
| `SHOW_SCOREBOARD` | `{}` | Show cumulative scoreboard |
| `ELIMINATE_TEAM` | `{ teamIndex }` | Mark team as eliminated |
| `START_FINAL` | `{ category }` | Begin final round |
| `RESET_GAME` | `{}` | Reset to initial state |

#### Display → Controller Events

| Event | Payload | Description |
|---|---|---|
| `ANIMATION_COMPLETE` | `{ eventType }` | Score bar animation finished |
| `READY` | `{}` | Display tab loaded and ready |

### Data Storage

Questions are loaded from a JSON file. No backend or database required.

---

## Question Data Format

```json
{
  "title": "CS Fundamentals Review",
  "rounds": [
    {
      "roundNumber": 1,
      "questions": [
        {
          "category": "Programming Languages",
          "question": "Name a programming language in the TIOBE top 20",
          "answers": {
            "python": 95,
            "javascript": 88,
            "java": 85,
            "c": 72,
            "c++": 70,
            "c#": 65,
            "typescript": 45,
            "go": 30,
            "rust": 12,
            "fortran": 5,
            "scratch": 3,
            "zig": 0
          }
        },
        {
          "category": "HTTP Status Codes",
          "question": "Name a valid HTTP status code",
          "answers": {
            "200": 92,
            "404": 90,
            "500": 65,
            "301": 40,
            "403": 35,
            "418": 8,
            "204": 5,
            "451": 2,
            "507": 0
          }
        }
      ]
    },
    {
      "roundNumber": 2,
      "questions": []
    },
    {
      "roundNumber": 3,
      "questions": []
    }
  ],
  "final": {
    "category": "Sorting Algorithms",
    "question": "Name a sorting algorithm",
    "answers": {
      "bubble sort": 88,
      "quick sort": 70,
      "merge sort": 65,
      "insertion sort": 45,
      "selection sort": 40,
      "heap sort": 20,
      "radix sort": 10,
      "shell sort": 5,
      "tim sort": 3,
      "bogosort": 0
    }
  }
}
```

### Answer matching

- Case-insensitive
- Trim whitespace
- Support common aliases/variants (e.g. "js" matches "javascript") — defined as optional `aliases` array per answer
- Teacher can override/correct via controller if fuzzy matching fails

```json
{
  "javascript": { "score": 88, "aliases": ["js", "ecmascript"] }
}
```

Support both the simple format (answer: score) and the extended format (answer: { score, aliases }) in the same file. The loader should normalise both into the extended format internally.

---

## Round Structure

### Round 1 — All Play

1. Show category and question
2. Each team answers in turn (Team 1 → 2 → 3 → 4)
3. Teams cannot repeat an answer already given
4. Each answer triggers the score bar animation
5. Scores are cumulative

### Round 2 — All Play (harder questions)

- Same format as Round 1
- Questions should be from harder/more obscure categories

### Round 3 — Head to Head

- Bottom 2 teams (by cumulative score) are eliminated
- Remaining 2 teams play one more question
- Lowest score on this question goes to the final

### Final Round

- Winning team picks from available categories (or single category presented)
- Team gives 3 answers to one question
- If any answer is pointless (score 0), they win the trophy round
- Otherwise their 3 scores are summed — lowest possible total is the goal

---

## UI Specification

### Display Tab (Projected)

#### Layout

- Full viewport, 16:9 optimised
- Dark background (deep blue/navy — inspired by the show's aesthetic)
- No scrolling — everything fits on one screen at all times

#### Components

**Header Bar**
- Round indicator (e.g. "Round 1 of 3")
- Game title "POINTLESS"

**Question Panel**
- Category in smaller text above
- Question text prominently displayed
- Appears when controller triggers `SHOW_QUESTION`

**Score Bar (centrepiece animation)**
- Vertical bar, full height of the main area
- Starts at 100 (top) and counts down to the answer's score
- Colour transitions: red (100–75) → orange (74–50) → yellow (49–25) → green (24–1) → blue/gold pulse (0 — pointless!)
- Numeric counter displayed alongside the bar as it descends
- Smooth animation, approximately 3–5 seconds for full countdown
- Answer text and final score displayed at completion
- Sound effects optional but desirable: ticking during countdown, distinct sounds for high/low/pointless scores

**Team Display**
- 4 team panels across the bottom of the screen
- Each shows: team name, current round score, cumulative total
- Active team is visually highlighted (glow/border)
- Eliminated teams are greyed out / visually dimmed in Round 3

**Scoreboard View**
- Full-screen overlay showing all teams ranked by cumulative score
- Shown between rounds

#### Animations

- Score bar countdown is the hero animation — make it smooth and satisfying
- Team score updates should animate (count up/down)
- Question reveals can use a simple fade-in
- Pointless answer (0) should have a distinctive celebration animation

### Controller Tab (Teacher Screen)

#### Layout

- Functional, not decorative — this is a control panel
- Responsive but optimised for laptop screen
- Clear visual hierarchy

#### Components

**Game Setup Panel**
- Load question JSON file (file input or drag-and-drop)
- Set team names (default: Team 1, Team 2, Team 3, Team 4)
- Start game button

**Round Control**
- Current round and question displayed
- "Show Question" button — sends question to display
- "Next Round" / "Show Scoreboard" progression buttons

**Team Answer Panel**
- 4 team sections, one active at a time
- Text input to type team's verbal answer
- "Submit Answer" button — triggers matching and score bar animation on display
- Matched answer and score shown for confirmation
- "No match — mark wrong (100)" button for incorrect answers
- Manual score override input if needed

**Answer Reference Panel**
- Collapsible list of all valid answers and their scores for the current question
- Helps teacher verify answers quickly
- Shows which answers have already been claimed

**Score Override**
- Ability to manually adjust any team's score at any time
- Undo last action button

**Game State**
- Visual indicator of which tab is connected (display tab status)
- Reset game button (with confirmation dialog)

---

## Team Configuration

- 4 teams by default
- Team names editable during setup
- Colour-coded: suggest 4 distinct, accessible colours (e.g. blue, red, green, orange)
- Turn order rotates each question so no team always goes first or last

---

## Scoring Rules

| Outcome | Score |
|---|---|
| Correct answer | The pre-assigned score (0–99) |
| Incorrect answer | 100 |
| Pointless answer | 0 (+ celebration) |
| Repeated answer (already claimed) | Not allowed — controller prevents submission |

- Cumulative scores carry across rounds
- **Lower is better** throughout the game
- Elimination after Round 2: highest 2 cumulative scores are eliminated

---

## Technical Requirements

### Stack

- Vanilla HTML, CSS, JavaScript (no frameworks/bundlers)
- Two standalone HTML files: `display.html` and `controller.html`
- Single `BroadcastChannel('pointless-game')` for communication
- Question data loaded from external JSON file

### Browser

- Modern Chromium-based browser (Chrome/Edge) — teacher's machine only
- No IE/Safari compatibility needed

### Files

```
pointless/
├── display.html          # Projected game board
├── controller.html       # Teacher control panel
├── css/
│   ├── display.css       # Display tab styles
│   └── controller.css    # Controller tab styles
├── js/
│   ├── display.js        # Display tab logic + animations
│   ├── controller.js     # Controller tab logic
│   ├── channel.js        # Shared BroadcastChannel wrapper
│   ├── scorer.js         # Answer matching and scoring logic
│   └── animations.js     # Score bar and visual animations
├── audio/                # Optional sound effects
│   ├── tick.mp3
│   ├── pointless.mp3
│   └── wrong.mp3
├── data/
│   └── samples.js        # Built-in sample games (POINTLESS_SAMPLES)
└── README.md             # Setup and usage instructions
```

### Key Implementation Notes

- Score bar animation should use `requestAnimationFrame` for smoothness
- BroadcastChannel messages should be JSON with a consistent `{ type, payload }` structure
- Answer matching in `scorer.js` should normalise input (lowercase, trim, strip punctuation) before comparison
- All game state lives in the controller tab — display tab is purely reactive
- Display tab should recover gracefully if opened after controller (request current state on load)
- Controller should detect if display tab is connected via heartbeat/ready messages

---

## Content Authoring Notes

Scores should reflect how likely a typical class of students would be to give that answer:

- **90–100**: The obvious, first-thing-everyone-says answers
- **50–89**: Known but not the first thing that comes to mind
- **20–49**: Requires decent knowledge of the topic
- **1–19**: Obscure, requires strong knowledge
- **0 (Pointless)**: Correct but almost nobody would think of it

Aim for 8–15 valid answers per question to give teams enough room to differentiate. At least one pointless answer per question keeps the dream alive.

---

## Future Enhancements (Out of Scope for V1)

- Student device connectivity for team answer submission
- Question bank editor UI
- Automated scoring from real data sources (e.g. Stack Overflow survey data, GitHub stats)
- Sound effects and music
- Game history / session logging
- Timer per team answer