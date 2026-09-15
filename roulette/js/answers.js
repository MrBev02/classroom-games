/* =====================================================
   ROULETTE: RESOLVING AND CHECKING ANSWERS
   =====================================================

   A question in data/questions.js does not contain its answer. It
   contains a method. An example of a method is "the probability of a bet
   on red". This file then asks js/probability.js for the value.

   This method gives three results:

     - If the user changes the wheel, the program calculates a new answer
       for each question. No question keeps an old answer.
     - The printed answer key uses the same function as the screen. Thus
       the two always agree.
     - A person cannot type an incorrect probability into the question
       bank. The question bank contains no probabilities.

   The answer types are mc, fraction, numeric, pockets and text.
   ===================================================== */

/** This function calculates the correct answer for the wheel that is in
    use. */
function resolveAnswer(q, ctx) {
  const w = q.wheel ? wheelById(q.wheel) : (ctx && ctx.wheel) || currentWheel();
  const a = q.answer || {};
  const arg = a.arg === undefined ? null : a.arg;

  switch (a.from) {
    case "literal":
      return { kind: "literal", value: a.value, wheel: w };

    case "betProbability":
      return { kind: "probability", value: probabilityOfBet(a.bet, arg, w), wheel: w };

    case "betComplementProbability":
      return { kind: "probability", value: probability(complementOfBet(a.bet, arg, w), w), wheel: w };

    case "setProbability":
      return { kind: "probability", value: probability(a.outcomes, w), wheel: w };

    case "betOutcomes":
      return { kind: "set", value: betOutcomes(a.bet, arg, w), wheel: w };

    case "complementOutcomes":
      return { kind: "set", value: complementOfBet(a.bet, arg, w), wheel: w };

    case "outcomeCount":
      return { kind: "number", value: pocketCount(w), wheel: w };

    case "favourableCount":
      return { kind: "number", value: betOutcomes(a.bet, arg, w).length, wheel: w };

    case "betPayout":
      return { kind: "number", value: betById(a.bet).payout, wheel: w };

    case "trueOdds":
      return { kind: "odds", value: trueOdds(a.bet, arg, w), wheel: w };

    case "betEV":
      return { kind: "number", value: expectedValuePerUnit(a.bet, arg, w), wheel: w };

    case "houseEdge":
      return { kind: "number", value: houseEdge(a.bet, arg, w), wheel: w };

    default:
      // An unknown method is a fault in the question bank. The lesson
      // must continue. The program shows the question and accepts each
      // answer. It also writes a message in the console for the person
      // who edits questions.js.
      if (typeof console !== "undefined") console.warn("Unknown answer.from:", a.from, "in", q.id);
      return { kind: "unknown", value: null, wheel: w };
  }
}

/** This function tests if two fractions have the same value. */
function fractionEquals(given, expectedNum, expectedDen, accept) {
  const n = parseInt(given.n, 10), d = parseInt(given.d, 10);
  if (!isFinite(n) || !isFinite(d) || d === 0) return false;
  const a = accept || {};
  if (a.reduced === false && a.unreduced === false) return false;
  // Multiply the terms across. Thus 18/37 and 36/74 are equal. Also 1/3
  // is equal to 12/36.
  const sameValue = n * expectedDen === expectedNum * d;
  if (!sameValue) return false;
  if (a.exactDenominator) return d === expectedDen;
  return true;
}

function withinTolerance(value, target, tol) {
  return isFinite(value) && Math.abs(value - target) <= (tol == null ? 1e-9 : tol);
}

function setEquals(a, b) {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

function setDiff(chosen, expected) {
  const se = new Set(expected), sc = new Set(chosen);
  return {
    correct: chosen.filter((x) => se.has(x)),
    extra: chosen.filter((x) => !se.has(x)),
    missing: expected.filter((x) => !sc.has(x)),
  };
}

function normaliseText(s) {
  return String(s == null ? "" : s).toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * This function marks an answer from a student.
 * @returns {correct, expected, message, partial?}
 */
function checkAnswer(q, response, ctx) {
  const resolved = resolveAnswer(q, ctx);
  const w = resolved.wheel;

  switch (q.type) {
    case "mc": {
      const choice = q.choices[response];
      return {
        correct: !!(choice && choice.correct),
        expected: q.choices.filter((c) => c.correct).map((c) => c.text).join(" / "),
      };
    }

    case "fraction": {
      const p = resolved.value;
      return {
        correct: fractionEquals(response, p.num, p.den, q.accept),
        expected: p.fractionText,
      };
    }

    case "numeric": {
      const raw = String(response).replace(/[%\s,]/g, "");
      const given = parseFloat(raw);
      let target = resolved.kind === "probability" ? resolved.value.decimal : resolved.value;
      if (q.unit === "percent") target = target * 100;
      return {
        correct: withinTolerance(given, target, q.tolerance),
        expected: q.unit === "percent"
          ? target.toFixed(q.dp == null ? 1 : q.dp) + "%"
          : String(q.dp == null ? target : target.toFixed(q.dp)),
      };
    }

    case "pockets": {
      const expected = resolved.value;
      const diff = setDiff(response || [], expected);
      const exact = setEquals(response || [], expected);
      return {
        correct: exact,
        expected: expected,
        partial: q.partialCredit ? diff : null,
        message: exact ? null : describePocketDiff(diff),
      };
    }

    case "text": {
      const given = normaliseText(response);
      if (!given) return { correct: false, expected: resolved.value, message: "Write a sentence." };
      const keywords = (q.acceptText || []).map(normaliseText);
      const hit = q.matchMode === "allKeywords"
        ? keywords.every((k) => given.indexOf(k) !== -1)
        : keywords.some((k) => given.indexOf(k) !== -1);
      // A written answer does not stop the student. The program then
      // shows the model answer. The teacher marks this answer type.
      return { correct: hit, expected: resolved.value, openResponse: true };
    }

    default:
      return { correct: false, expected: resolved.value, message: "Unknown question type." };
  }
}

function describePocketDiff(diff) {
  const bits = [];
  if (diff.missing.length) {
    bits.push(diff.missing.length + (diff.missing.length === 1 ? " pocket is" : " pockets are") + " missing");
  }
  if (diff.extra.length) {
    bits.push(diff.extra.length + (diff.extra.length === 1 ? " pocket shouldn't be" : " pockets shouldn't be") + " selected");
  }
  return bits.join(", ") + ".";
}
