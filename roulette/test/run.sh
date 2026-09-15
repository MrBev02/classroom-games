#!/bin/sh
# Runs the pure-logic tests in Node by concatenating the engine files in the
# same order the browser loads them (they are plain scripts sharing globals,
# not modules, so this is exactly what the page does).
#
# This program tests the wheel, the probability engine, the random number
# generator, the session key and the session lifecycle. It does not test the
# screen elements. To test those, open the pages in a browser.
#
#   sh test/run.sh
#
# No dependencies, no package.json. Needs only node on PATH.
set -e
cd "$(dirname "$0")/.."
OUT=$(mktemp -t roulette-test)
{
  cat test/shim.js                       # fake clock + in-memory localStorage
  cat data/config.js js/wheel.js js/bets.js js/probability.js js/rng.js js/stats.js
  cat js/session-key.js js/store.js js/session.js js/answers.js
  cat data/questions.js js/modules.js
  # Each suite runs in its own scope so they can reuse local names freely.
  for suite in engine key session questions; do
    echo '(function(){'; cat "test/$suite-test.js"; echo '})();'
  done
  echo 'finish();' 
  echo 'process.exit(globalThis.__fail ? 1 : 0);'
} > "$OUT.js"
node "$OUT.js"
rm -f "$OUT.js"

# The style rules: ASD-STE100 for the comments, and the voice rules for the
# text that a student or a teacher reads.
if command -v python3 >/dev/null 2>&1; then
  python3 test/style-check.py
  python3 test/ethics-check.py
fi
