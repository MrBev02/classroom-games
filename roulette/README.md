# Roulette and Probability

A probability activity for secondary maths. Students use a roulette wheel to
learn the syllabus content, and they calculate the house edge themselves.

The activity has 12 modules. Each one is independent, so you can use one module
for 20 minutes and a different module three weeks later.

**Read [SAFEGUARDING.md](SAFEGUARDING.md) before you run this with a class.** It
records the decisions behind the activity and states what the session code can
and cannot do.

## Start it

1. Open `host.html`. This is your screen. Do not project it.
2. Choose the activities the code opens, then select **Make a code**.
3. Select **Open projector** and move that window to the projector.
4. Select **Show the code on the projector**.
5. Students open the address and type the code.

To end the activity on every device, reveal the end code on your screen and read
it to the class. Each student types it. Their page locks and the code stops
working on that device.

## Give students the page

Three ways. Student devices have network isolation turned on, so they cannot
reach your laptop. Plan for the first two.

### From a web address

The activity runs from any static host, including GitHub Pages:

```
https://mrbev02.github.io/classroom-games/roulette/
```

Type that address into the **Address students type** field so it prints on the
code card. This address has been unreliable in the past, so make the single file
before the lesson and keep it ready.

### As one file, when the network does not work

```
python3 roulette/build-standalone.py
```

This writes `roulette-student-standalone.html`, which holds every script and
stylesheet. Send that one file through Teams, Google Drive or a USB memory
device. A student opens it and the activity runs with no server and no internet.

The separate files stay the source of truth. Run the program again after any
change.

### From your laptop, over the school network

```
node serve.js
```

The program prints the address for students and a teacher token. Type the
address into the **Address students type** field so it prints on the code card.

This route needs the student device to reach your laptop. Network isolation
stops it. Test it with one student device before you plan a lesson around it.

`python -m http.server 8080` also works. You then get the activity without the
live roster.

## The live roster (optional)

`node serve.js` adds a roster to the bottom of `host.html`. Paste the teacher
token from the terminal. You then see each student who joined, with their
activity, their spins and their chips. You can pause one student, pause
everyone, or end the session on every device. A command arrives within about 5
seconds.

The roster is optional. Without it the session code still controls the activity.

The roster needs the student device to reach your laptop, thus it does nothing
from GitHub Pages or from the single file. The student page stays silent about
this. It shows no error, and it does not ask the student for a name.

The roster has no authentication and it is not a security boundary. Any person
on the network can join with any name. The roster is in memory only, and it is
gone when you stop the program.

## The modules

| Module | Length | Runs on | Questions | Dot points |
|---|---|---|---|---|
| What can the wheel land on? | 20 min | student + projector | 4 | 1, 3 |
| Is every pocket equally likely? | 20 min | student + projector | 4 | 3, 5 |
| Writing P(event) | 25 min | student + projector | 5 | 2, 3 |
| All the probabilities add to 1 | 20 min | student + projector | 4 | 4 |
| Theory against what happened | 25 min | student + projector | 4 | 5, 6, 7 |
| Relative frequency lab | 25 min | student | 0 | 6, 7 |
| The complement of an event | 20 min | student | 4 | 8, 11 |
| P(A) + P(A') = 1 | 20 min | student | 4 | 9, 10 |
| Free play | 20 min | student + projector | 0 | 6, 7 |
| Why the house always wins | 25 min | student + projector | 6 | 2, 5, 10 |
| Can a system beat it? | 25 min | student + projector | 4 | 6, 10 |
| What this costs people | 15 min | projector | 0 | teacher led |

## Print

The host screen prints four pages: a code card for the board, a student
worksheet, an answer key, and a tally sheet for trials that students run by
hand. The worksheet and the answer key are generated from the same functions as
the screen, so they cannot disagree with it.

## Settings

Edit `data/config.js`.

| Setting | What it does |
|---|---|
| `REQUIRE_SESSION_KEY` | `false` removes the code screen. Use it for homework. |
| `currencyMode` | `"chips"` or `"dollars"` on student screens. Chips is the default. |
| `defaultWheel` | `"european"` (37 pockets) or `"american"` (38 pockets). |
| `seed` | A number gives every class the same spins. |
| `startingChips`, `tableLimit` | The free play and betting system modules. |
| `SUPPORT_CONTACTS` | The help line shown to students. |

`data/questions.js` holds the questions. A question stores the method to work
out its answer, not the answer itself. Thus the European and American wheels
both give correct answers, and the printed answer key always agrees with the
screen.

## Change the session code secret

`KEY_SECRET` in `js/session-key.js` signs every code. Change it to make all the
existing codes invalid. Do this at the start of a year, or if a copy of this
folder goes to a different school.

## Files

```
serve.js                 Optional. Static server plus the live roster API.
roulette/
  index.html             The student page. It must work from a file.
  host.html              Your screen.
  display.html           The projector.
  build-standalone.py    Makes the single student file.
  js/wheel.js            Pocket order, colours and angles.
  js/bets.js             Each bet, as the set of pockets that win it.
  js/probability.js      Every number in the activity comes from here.
  js/rng.js              The seeded random number generator.
  js/stats.js            Tallies, relative frequency and the chart series.
  js/session-key.js      The code format. It has no DOM and no storage.
  js/session.js          Unlock, expiry and lock.
  js/live.js             The student side of the live roster. Fails silently.
  js/student.js          The student page.
  js/host.js             Your screen.
  js/display.js          The projector.
  data/config.js         Settings.
  data/questions.js      The questions.
  test/run.sh            The tests.
```

## Tests

```
sh test/run.sh
```

This runs 218 checks on the wheel, the probability engine, the random number
generator, the session code and the session lifecycle. It then checks the
writing style. It needs only `node` and `python3`.

The tests do not open a browser. To check the screens, open the pages.

## Notes for developers

- No build step, no framework and no npm packages. Plain `<script src>` tags,
  loaded in order. The globals are the module system.
- The student page never loads `js/channel.js`. It does not talk to the host,
  thus it works from a file. Do not add a dependency on the host to that page.
- `js/probability.js` produces every probability, percentage and house edge. Do
  not write one of those numbers as a literal in a different file.
- Comments follow ASD-STE100. Text that a student reads follows the
  `student-material-voice` skill, and text that a teacher reads follows
  `teacher-material-voice`. `test/style-check.py` tests the parts a program can
  test.
