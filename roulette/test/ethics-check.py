#!/usr/bin/env python3
"""Test the claims that SAFEGUARDING.md makes about the code.

That document tells a teacher what this activity does not do. Each claim
below can be tested by a program, so it is tested here rather than trusted.
If a claim and the code disagree, one of them must change.

    python3 test/ethics-check.py
"""

import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent.parent

# The files a student's browser loads.
STUDENT_FILES = [
    "index.html", "js/student.js", "js/ui.js", "js/charts.js", "js/wheel.js",
    "js/bets.js", "js/probability.js", "js/rng.js", "js/stats.js",
    "js/modules.js", "js/answers.js", "js/progress.js", "js/live.js",
    "data/questions.js", "css/student.css", "css/wheel.css",
]
ALL_FILES = [p for p in HERE.rglob("*")
             if p.is_file() and p.suffix in {".js", ".css", ".html"}
             and "test" not in p.parts
             and p.name != "roulette-student-standalone.html"]

failures = []


def check(name, ok, detail=""):
    if ok:
        print("  ok   " + name)
    else:
        failures.append(name)
        print("  FAIL " + name + ("  -> " + detail if detail else ""))


def student_text():
    out = []
    for rel in STUDENT_FILES:
        p = HERE / rel
        if p.exists():
            out.append((rel, p.read_text(encoding="utf-8")))
    return out


def all_text():
    return [(str(p.relative_to(HERE)), p.read_text(encoding="utf-8")) for p in ALL_FILES]


print("\n== no reward feedback ==")
hits = [f for f, t in all_text() if "confetti" in t.lower()]
check("no confetti anywhere", not hits, ", ".join(hits))

audio = [f for f, t in all_text()
         if re.search(r"new Audio\(|AudioContext|\.play\(\)|<audio", t)]
check("no sound anywhere", not audio, ", ".join(audio))

print("\n== the spin does not depend on the result ==")
ui = (HERE / "js/ui.js").read_text(encoding="utf-8")
check("the spin has one fixed duration", "const SPIN_MS = " in ui)
# The duration must be that constant, and nothing else.
durations = re.findall(r"/ *SPIN_MS|SPIN_MS *\)|\* *SPIN_MS", ui)
check("the duration is used as a constant", len(durations) >= 1, str(durations))
body = ui[ui.index("function animateBall"):]
body = body[:body.index("\n}")] if "\n}" in body else body
suspicious = re.search(r"SPIN_MS *[*/+-] *(?!\))", body)
check("the duration is not scaled by anything", suspicious is None,
      suspicious.group(0) if suspicious else "")
check("the number of turns is fixed", "360 * 3" in ui)

print("\n== no near miss ==")
# "almost" is not listed. A sentence may compare two numbers, for example
# "almost double the European wheel". What is banned is language that
# treats a loss as a near win.
near = [f for f, t in all_text()
        if re.search(r"so close|near miss|nearly won|just missed|unlucky|bad luck", t, re.I)]
check("no text treating a loss as a near win", not near, ", ".join(near))
check("nothing highlights the pockets beside the winner",
      "adjacent" not in ui.lower())

print("\n== no progression mechanics ==")
# The question bank is examined separately below, because it must be able
# to quote a wrong idea in order to test it.
mech = [f for f, t in all_text()
        if f != "data/questions.js"
        and re.search(r"\bstreak\b|leaderboard|\bjackpot\b|hot number|\bdue\b", t, re.I)]
check("no streaks, leaderboards or jackpots", not mech, ", ".join(mech))

# The gambler's fallacy may appear in the question bank, but only as an
# answer that is marked wrong. The activity teaches against it.
qb = (HERE / "data/questions.js").read_text(encoding="utf-8")
bad_lines = [ln.strip() for ln in qb.splitlines()
             if re.search(r"\bdue\b|hot\b|running hot|streak", ln, re.I)]
unmarked = [ln for ln in bad_lines if "correct: false" not in ln]
check("the gambler's fallacy appears only as a wrong answer", not unmarked,
      " | ".join(unmarked))
check("...and it is actually tested", len(bad_lines) >= 1, str(len(bad_lines)))

print("\n== chips, not dollars, on student screens ==")
# js/ui.js defines fmtAUD, because the projector and the printed pages need
# it. What matters is that nothing on the student path calls it.
callers = [f for f, t in student_text()
           if f != "js/ui.js" and "fmtAUD(" in t]
check("nothing on the student path formats money", not callers, ", ".join(callers))
check("the money formatter is only used by the projector views",
      "fmtAUD(" in (HERE / "js/views.js").read_text(encoding="utf-8"))
# A dollar sign may appear in a question about real money, but never as a
# formatter in the student controller.
sc = (HERE / "js/student.js").read_text(encoding="utf-8")
check("the student controller has no dollar sign", '"$"' not in sc and "'$'" not in sc)

print("\n== the honest counter ==")
check("free play shows the total staked", 'stat("Staked"' in sc)
check("free play shows the net position", 'stat("Net"' in sc)
check("there is no automatic refill",
      "run out of chips" in sc and "Start again with" in sc)

print("\n== support contacts ==")
cfg = (HERE / "data/config.js").read_text(encoding="utf-8")
check("support contacts are defined once", "SUPPORT_CONTACTS" in cfg)
idx = (HERE / "index.html").read_text(encoding="utf-8")
check("the student page shows them", "SUPPORT_CONTACTS" in idx)

print("\n== the safeguarding document exists and is linked ==")
sg = HERE / "SAFEGUARDING.md"
check("SAFEGUARDING.md is present", sg.exists())
if sg.exists():
    text = sg.read_text(encoding="utf-8")
    check("it states what the code cannot prevent",
          "does not prevent" in text and "developer tools" in text)
    check("the README points to it", "SAFEGUARDING.md" in (HERE / "README.md").read_text(encoding="utf-8"))

print("")
if failures:
    print("ethics: FAILED %d checks" % len(failures))
    sys.exit(1)
print("ethics: every claim in SAFEGUARDING.md holds")
