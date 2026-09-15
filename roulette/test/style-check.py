#!/usr/bin/env python3
"""Style check for the roulette activity.

Three sets of rules apply to this folder:

  ASD-STE100              Code comments and technical documents.
                          Short sentences. One topic in each sentence.
  student-material-voice  Each text that a student reads.
                          No em dash. No en dash.
  teacher-material-voice  Each text that a teacher reads.
                          No em dash. No en dash, except a number range.

This program tests the rules that a program can test:

  1. No em dash and no en dash. A number range is permitted.
  2. A sentence in a comment has 25 words or less.
  3. A comment does not contain a word from the list of unwanted words.

To permit a line, add the marker "style-check: allow" to that line. Use the
marker only when the line must contain the character, for example in a
regular expression that finds an em dash.

Usage:  python3 test/style-check.py
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXTS = {".js", ".css", ".html", ".md", ".sh", ".py"}
# Generated output is not source. The standalone file also embeds
# shared/math.js, which belongs to the repository and not to this activity.
SKIP = {"test/style-check.py", "roulette-student-standalone.html"}

# Words and phrases that ASD-STE100 does not permit: idiom, metaphor and
# informal language. The list holds the terms that occurred in this project.
UNWANTED = [
    "punchline", "load-bearing", "escape hatch", "sandwich", "the whole point",
    "beats ", "bites first", "silently", "quietly", "nonsense", "notorious",
    "wanders", "sawtooth", "falls off", "cliff", "gains nothing", "reads as",
    "feels like", "nobody notices", "goes stale", "in agreement", "hand in hand",
    "of course", "obviously", "simply ", "just ", "magic", "clever", "elegant",
]

MAX_WORDS = 25

def sentences(text):
    for part in re.split(r"(?<=[.!?])\s+", text):
        part = part.strip()
        if part:
            yield part

def comment_blocks(path, text):
    """Yield (line_number, comment_text) for JS and CSS style comments."""
    if path.suffix in {".js", ".css"}:
        for m in re.finditer(r"/\*.*?\*/", text, re.S):
            yield text[:m.start()].count("\n") + 1, re.sub(r"^\s*\*", "", m.group(), flags=re.M)
        for m in re.finditer(r"(?<![:\"'/])//(.*)$", text, re.M):
            yield text[:m.start()].count("\n") + 1, m.group(1)
    elif path.suffix in {".sh", ".py"}:
        for m in re.finditer(r"^\s*#(.*)$", text, re.M):
            yield text[:m.start()].count("\n") + 1, m.group(1)

problems = []
for path in sorted(ROOT.rglob("*")):
    if not path.is_file() or path.suffix not in EXTS:
        continue
    rel = str(path.relative_to(ROOT))
    if rel in SKIP or "/node_modules/" in rel:
        continue
    text = path.read_text(encoding="utf-8")

    # Rule 1: no em dash, no en dash. A range between two digits is permitted.
    for i, line in enumerate(text.splitlines(), 1):
        if "style-check: allow" in line:
            continue
        for m in re.finditer(r"[—–]", line):
            before = line[max(0, m.start() - 1):m.start()]
            after = line[m.end():m.end() + 1]
            if m.group() == "–" and before.isdigit() and after.isdigit():
                continue          # A number range, for example Years 7-8.
            problems.append((rel, i, "dash", line.strip()[:74]))

    # Rules 2 and 3: the comments.
    for line_no, block in comment_blocks(path, text):
        # Examine each paragraph separately. A blank line ends a paragraph.
        # A heading is its own paragraph, thus it does not join the text
        # that comes after it.
        flat_all = []
        for para in re.split(r"\n\s*\n", block):
            lines = []
            for ln in para.splitlines():
                if re.fullmatch(r"[\s=*/#-]*", ln):
                    continue                  # A rule line.
                if re.search(r"\S {3,}\S", ln):
                    continue                  # An aligned table or a list.
                lines.append(ln)
            flat = " ".join(" ".join(lines).split())
            if not flat:
                continue
            flat_all.append(flat)
            for sentence in sentences(flat):
                words = [w for w in sentence.split() if re.search(r"[A-Za-z]", w)]
                if len(words) > MAX_WORDS:
                    problems.append((rel, line_no,
                                     "long sentence (%d words)" % len(words), sentence[:74]))
        joined = " ".join(flat_all)
        if not joined:
            continue
        low = " " + joined.lower()
        for term in UNWANTED:
            if term in low:
                problems.append((rel, line_no, "unwanted term %r" % term.strip(), joined[:74]))

if problems:
    print("Style problems: %d\n" % len(problems))
    for rel, line, kind, snippet in problems:
        print("  %s:%s  %s\n      %s" % (rel, line, kind, snippet))
    sys.exit(1)
print("style: no problems found")
