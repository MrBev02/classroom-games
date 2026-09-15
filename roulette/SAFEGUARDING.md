# Roulette and Probability: safeguarding and design decisions

This document records the decisions behind a probability activity that uses a
roulette wheel. It is written for a teacher or an executive who wants to see
that the risks were considered, and what was done about each one.

It also states plainly what the controls do not do. A control that is
oversold is worse than no control, because someone will rely on it.

Last reviewed: 10 September 2026.

---

## 1. What this is, and why roulette

The activity teaches the Probability strand of the syllabus. Students list a
sample space, write probabilities as fractions, check that the probabilities of
all outcomes total 1, and work with complementary events. They then compare the
probability they calculate with the results of a simulation.

A roulette wheel was chosen for two reasons.

The first is mathematical. A roulette wheel is a clean chance experiment. It has
37 equally likely outcomes, a sample space a student can write out in full, and
natural groups (red, black, dozens, columns) that make good events. Very few
real objects give this much syllabus content at once.

The second is the point of the lesson. Students meet gambling advertising every
week. Telling a student that gambling loses money is an assertion, and a
teenager can reject an assertion. In this activity the student calculates the
house edge themselves, for every type of bet, and finds the same answer each
time: 2.70% on a European wheel. The conclusion is arithmetic, and arithmetic is
harder to argue with.

The final module makes the arithmetic concrete. At $5 a spin and about 40 spins
an hour, the expected loss is about $5.40 an hour. Roulette is one of the better
games in a venue.

---

## 2. Curriculum coverage

Every dot point in the Probability content is covered by at least one module.
This table is generated from the activity itself, so it cannot drift from what
the software does.

| Dot point | Covered by |
|---|---|
| List the sample space for chance experiments | What can the wheel land on? |
| Express P(event) as favourable outcomes over total outcomes | Writing P(event); Why the house always wins |
| Probabilities run from 0 to 1; equally likely outcomes have equal probabilities | What can the wheel land on?; Is every pocket equally likely?; Writing P(event) |
| Verify that all the probabilities total 1 | All the probabilities add to 1 |
| Identify theoretical probability under fair, unbiased conditions | Is every pocket equally likely?; Theory against what happened; Why the house always wins |
| Explain observed probability as relative frequency from repeated trials | Theory against what happened; Relative frequency lab; Free play; Can a system beat it? |
| Explore relative frequencies using a random number generator | Theory against what happened; Relative frequency lab; Free play |
| Identify and describe the complement of an event | The complement of an event |
| Verify that P(A) and P(A') total 1 | P(A) + P(A') = 1 |
| Solve problems involving complementary events | P(A) + P(A') = 1; Why the house always wins; Can a system beat it? |
| Represent complementary events in various forms | The complement of an event |

Each module is independent. A teacher can use one module for 20 minutes and a
different module three weeks later. A module never needs a student to have
finished an earlier one.

---

## 3. The safeguarding position

The activity teaches students **about** gambling. It must not give them practice
**at** gambling.

Those two things can look similar on a screen. A gambling product holds
attention with a set of specific techniques: a celebration when you win, a near
miss that feels like an almost win, a spin that slows down near the winning
number, sound tied to reward, a balance that refills, and a display that makes
wins louder than losses. None of those techniques teaches probability. All of
them are designed to keep a person playing.

So the rule for this activity is that a simulation is used for the mathematics,
and every technique that creates the pull of gambling is left out on purpose.
Section 4 lists each one.

The result is an activity that is deliberately dull to gamble on. That is the
intended outcome. It is also the strongest protection here, and it is stronger
than the access controls in section 5, because it does not depend on a student
choosing to comply.

---

## 4. Design decisions that protect students

Each decision below states what was chosen, what else was considered, and why.

### Chips, not dollars

**Chosen.** Student screens show plain numbers of chips with no currency symbol.
There is no function in the student code that formats money, so a dollar sign
cannot be added by accident.

**Considered.** Dollars everywhere, which connects the lesson to real losses more
directly. Points everywhere, which is the safest wording.

**Why.** Dollars on a personal device makes the page look like a betting app.
Points make the closing message weak. Chips keep the mathematics intact while the
students learn it. A teacher can switch student screens to dollars in the
settings if they want to, and the setting is off by default.

Real money appears in the closing module, which runs on the projector and is led
by the teacher. That is the point where the concrete figure is useful and where
the teacher controls the conversation.

### No celebration for a win

**Chosen.** A winning spin and a losing spin get the same treatment on screen:
the same size card, the same background, the same type. The only colour on a
result is the colour of the pocket, and that is information.

**Considered.** A brief animation for a win, which is normal in classroom games
and would make the activity more engaging.

**Why.** A reward signal after a win is the core mechanism of a gambling
product. The existing Jeopardy game in this repository has a celebration effect.
It was deliberately not reused here, and a comment in the code records that
decision so a future contributor does not add it back as an improvement.

### No near miss, and a spin of fixed length

**Chosen.** The activity never says a result was close. It never highlights the
pockets beside the winning number. Any wheel movement lasts the same time
whatever the result.

**Considered.** A spin that slows down as it approaches the winning pocket,
which is what a real wheel does and looks better.

**Why.** The slow approach to the result is the hook, not decoration. A near
miss is known to produce a stronger urge to continue than a plain loss. Neither
teaches anything about probability.

### No sound

**Chosen.** The activity has no audio.

**Why.** Sound tied to a win is a reward signal. The other games in this
repository have sound effects, and that code was deliberately not reused.

### No streaks, badges or leaderboards

**Chosen.** There is no scoring beyond the chip count, no run of correct answers,
no comparison between students, and no indicator of a number being hot or due.

**Why.** A hot or due indicator would teach the gambler's fallacy, which is the
opposite of the lesson. One of the questions in the activity tests exactly that
misconception.

### The honest counter is always visible

**Chosen.** The free play module always shows total chips staked beside the
current position, and it shows the position as a net figure. A loss is never in
smaller type than a win.

**Considered.** Showing the balance only, which is what a real product shows.

**Why.** A balance on its own hides how much has passed through it. A student can
have staked 4,210 chips, be down 112, and feel they are about even. The staked
figure is the one that shows the size of the activity.

### No automatic top-up

**Chosen.** When a student runs out of chips, the module stops and reports how
much they staked and over how many spins. Starting again needs a deliberate
click.

**Why.** Running out of money is what happens. The pause is the lesson. An
automatic refill would remove the only consequence in the simulation.

### Wording

**Chosen.** The activity says "this bet paid 35 chips" or "this bet paid
nothing". It avoids "you won" and "you lost".

**Why.** The neutral wording keeps the focus on the arithmetic of the bet.

---

## 5. Access control, and what it does not do

The teacher issues a session code, for example `48VN0-5GZZX-4B520`. A student
types the code to start. The code carries its own expiry, so a student's device
can check it with no network connection of any kind. This matters, because the
teacher's device and the student's device are not connected in the ordinary
setup.

A session ends when any of these happens:

- the code passes its expiry time;
- the device has been using it for longer than the limit the teacher set;
- the clock on the device is moved backwards, which is treated as tampering;
- the teacher reads out the end code and the student types it;
- the teacher ends the session from the live roster, if the optional server is
  running.

Ending a session never deletes the student's work. A student locked out at the
bell finds their answers next lesson. A control that also destroyed their work
would be read as a punishment, and teachers would stop using it.

### What it prevents

- A mistyped or invented code will not open the activity. The chance of a random
  15 character string working is about 1 in a million. This was tested against
  200,000 random strings and every single character change to a valid code.
- A code from last term, or from another school, will not work.
- A code cannot be used again after the lesson ends or after the end code is
  read out.
- A student cannot leave the activity open and return to it at lunchtime.
- Setting the clock back does not extend a session. It ends it.

### What it does not prevent, and cannot

- **A student who opens the browser developer tools can read the value that signs
  the codes and create their own.** The activity is a static web page, so that
  value has to be in a file the student's browser downloads. There is no way to
  hide it without a server that every student can reach.
- Clearing the browser's stored data **and** changing the device clock together
  will bypass the expiry.
- A student can delete the lock from the page using developer tools.
- None of this applies to a device the teacher cannot see.

### Therefore

**Treat the session code as a classroom management control of about the same
strength as an instruction to close the laptops.** It stops drift, mistyping and
casual reopening after the lesson. It will not stop a determined student.

No decision about trust, behaviour or assessment should rest on it. If a student
is found using the activity outside class, that is a conversation, not a
security failure.

The protection that does not depend on student compliance is the design in
section 4. The activity is not useful to somebody who wants to gamble.

---

## 6. Data and privacy

**In the ordinary setup, nothing leaves the student's device.** The activity is a
web page with no account, no login and no server. A student's answers, their
chip count and their progress are stored by their own browser and are readable
only on that device. No data reaches the teacher, the school or any other
company.

The student page is also marked so that search engines do not list it.

### If the optional live roster is used

A teacher can run a small program on their own laptop that adds a live roster.
If it is running:

- A student may choose to add a first name to the class list. The activity asks
  for a first name only, and the request appears only when a teacher is
  listening.
- The roster holds that name, the module the student has open, their number of
  spins and their chip count.
- The roster is held in the memory of the teacher's laptop. The program never
  writes it to a disk. Stopping the program erases it.
- Nothing goes to the internet. The data does not leave the school network.
- The roster has no authentication. Any person who can reach the teacher's
  laptop on the network can join under any name, including a classmate's name.
  It is a classroom tool on a network the school controls, and it is not a
  security boundary.

The command that ends a session for everyone needs a token that is printed only
in the teacher's terminal window. A student cannot send that command.

---

## 7. Wellbeing and support

Some students have a family member affected by gambling. This lesson can be
difficult for them in a way the maths does not predict.

- The student page carries a quiet line with the details of Gambling Help
  Online, on every screen.
- The closing module shows those details in full, along with Lifeline.
- The contacts are defined in one settings file, so a school can change or
  remove them.

**Advice for the teacher.**

Preview the closing module before you run it. It is the part that names real
money.

Offer any student a quiet way to sit out, without giving a reason in front of
the class.

A strong reaction to this content may be about something at home rather than
about the mathematics. Follow the school's usual process.

---

## 8. Residual risks

These remain after everything above. Each is stated with what reduces it, or
with an honest note that nothing does.

| Risk | What reduces it |
|---|---|
| A student reads the signing value in the code and makes their own session codes. | Nothing technical can prevent this in a static web page. The activity is designed to be of no use as a gambling toy, which is the actual protection. |
| A student clears their browser data and changes the clock to bypass the expiry. | Nothing. This combination defeats the expiry. The same point applies. |
| A student removes the lock screen using developer tools. | Nothing. A student who can do this can also just open a real gambling site. |
| A student uses the activity at home. | The expiry limits this. The design makes it unrewarding. A teacher can also leave the code gate on and issue short codes. |
| A student joins the live roster under a classmate's name. | The roster is not authenticated. Treat it as a convenience, not a record. Do not use it as an attendance record or as evidence of work. |
| The activity is on a public web address, because the repository publishes to GitHub Pages. | The code gate is on by default, so a visitor meets the gate. The page asks search engines not to list it. The design means the page is of no use to a person looking to gamble. |
| The lesson affects a student personally. | Section 7. Preview the closing module, offer a quiet way to opt out, and follow the school's process. |
| A teacher switches student screens to dollars and the page looks like a betting app. | The setting is off by default and it is labelled with a reference to this document. |

---

## 9. Decision register

Every significant choice, including the technical ones. "Why is there a server at
all?" is a fair question from a person reviewing this activity, so the technical
decisions are here too.

| Decision | Also considered | Why this one |
|---|---|---|
| Roulette as the context | Dice, coins, card draws | 37 equally likely outcomes, a writable sample space, natural event groups, and a house edge students can calculate |
| Session code with a built in expiry | A live server with a roster as the only control; no control at all | Works with no connection between the teacher's device and the student's. The school network cannot be relied on. |
| European wheel as the default | American wheel | One zero and a clean 1/37 for each pocket. The American wheel is used in the house edge module, where the doubled edge makes the point twice. |
| Chips by default, dollars available | Dollars everywhere; points everywhere | Section 4 |
| A question stores the method, not the answer | Storing the answer text | Switching the wheel re-answers every question. The printed answer key and the screen cannot disagree. |
| Every number comes from one file | Writing numbers into the text where needed | A number written into a sentence is wrong on the other wheel and nobody notices. A test enforces this. |
| A seeded random number generator | The browser's own random function | The teacher can repeat a demonstration exactly. The activity can also show the random number and how it becomes a pocket, which is a syllabus dot point. |
| Static web page, no build step | A modern framework | Matches the other games in this repository. Also the only approach that runs from a file on a USB memory device, which is the fallback when the network fails. |
| The live roster is optional and added last | Building it first, or not at all | The school network had only been tested between two devices. Building it last meant a failed trial would not have wasted work. Network isolation on student devices now stops the roster, and the activity is unchanged without it. |
| Plain web requests every 5 seconds, not a live socket | A WebSocket server | A socket server without external packages needs about 200 lines of protocol handling that can fail in ways that are hard to see. Polling is short, easy to check, and survives a poor network. A 5 second delay is invisible for this purpose. |
| A server with no external packages | Using a standard package | A school laptop may not be able to install anything. |
| GitHub Pages as the main route for students | A server on the teacher's laptop as the main route | Student devices have network isolation turned on. They cannot reach the teacher's laptop, and they can reach GitHub Pages. The code gate and the noindex request stay on, because the address is public. |
| One self-contained file as the fallback | Relying on the network | It works with no server and no internet. |
| Comments follow ASD-STE100 | Ordinary prose | The material is technical, and the same activity may be maintained by somebody else. |

---

## 10. What a teacher can change

All in `data/config.js`, with no code change required.

| Setting | Effect |
|---|---|
| `REQUIRE_SESSION_KEY` | Set to `false` to remove the code screen, for homework or a relief lesson |
| `currencyMode` | `"chips"` or `"dollars"` on student screens. Chips is the default. |
| `defaultWheel` | European or American |
| `seed` | Fix it so every class gets the same spins |
| `startingChips`, `tableLimit` | The free play and betting system modules |
| `debrief.stakePerSpin`, `debrief.spinsPerHour` | The figures in the closing module |
| `SUPPORT_CONTACTS` | The help line details, or remove them |

Which modules a code opens is chosen on the teacher's screen each time a code is
made. The teacher's screen also shows which syllabus dot points the selected
modules cover.

`KEY_SECRET` in `js/session-key.js` signs every code. Changing it makes every
existing code invalid. Change it at the start of a year.
