// ---- question bank suite ----
console.log("\n== every question is well formed ==");
const KNOWN_TYPES = ["mc", "fraction", "numeric", "pockets", "text"];
const KNOWN_FROM = ["literal", "betProbability", "betComplementProbability",
  "setProbability", "betOutcomes", "complementOutcomes", "outcomeCount",
  "favourableCount", "betPayout", "trueOdds", "betEV", "houseEdge"];

const all = [];
Object.keys(QUESTION_BANK).forEach((mod) => {
  QUESTION_BANK[mod].forEach((q) => all.push({ mod: mod, q: q }));
});
ok("the bank has questions", all.length > 0, all.length + " questions");
ok("every module id in the bank is a real module",
   Object.keys(QUESTION_BANK).every((m) => MODULE_ORDER.indexOf(m) !== -1),
   Object.keys(QUESTION_BANK).filter((m) => MODULE_ORDER.indexOf(m) === -1).join());
ok("every question type is known",
   all.every((x) => KNOWN_TYPES.indexOf(x.q.type) !== -1),
   all.filter((x) => KNOWN_TYPES.indexOf(x.q.type) === -1).map((x) => x.q.id).join());
ok("every answer method is known",
   all.every((x) => x.q.answer && KNOWN_FROM.indexOf(x.q.answer.from) !== -1),
   all.filter((x) => !x.q.answer || KNOWN_FROM.indexOf(x.q.answer.from) === -1).map((x) => x.q.id).join());
ok("every question has a prompt and both feedback messages",
   all.every((x) => x.q.prompt && x.q.feedback && x.q.feedback.correct && x.q.feedback.wrong),
   all.filter((x) => !(x.q.prompt && x.q.feedback && x.q.feedback.correct && x.q.feedback.wrong)).map((x) => x.q.id).join());
ok("every multiple choice question has exactly one correct choice",
   all.filter((x) => x.q.type === "mc").every((x) => x.q.choices.filter((c) => c.correct).length === 1),
   all.filter((x) => x.q.type === "mc" && x.q.choices.filter((c) => c.correct).length !== 1).map((x) => x.q.id).join());
ok("every written question lists keywords",
   all.filter((x) => x.q.type === "text").every((x) => (x.q.acceptText || []).length > 0));
ok("every pocket question is pinned to one wheel",
   all.filter((x) => x.q.type === "pockets").every((x) => !!x.q.wheel),
   all.filter((x) => x.q.type === "pockets" && !x.q.wheel).map((x) => x.q.id).join());

console.log("\n== the resolver can answer every question ==");
function correctResponse(q) {
  const r = resolveAnswer(q, {});
  switch (q.type) {
    case "mc": return q.choices.findIndex((c) => c.correct);
    case "fraction": return { n: String(r.value.num), d: String(r.value.den) };
    case "pockets": return r.value.slice();
    case "text": return q.acceptText[0];
    case "numeric": {
      let v = r.kind === "probability" ? r.value.decimal : r.value;
      if (q.unit === "percent") v = v * 100;
      return String(q.dp == null ? v : v.toFixed(q.dp));
    }
  }
}
let bad = [];
all.forEach((x) => {
  const res = checkAnswer(x.q, correctResponse(x.q), {});
  if (!res.correct) bad.push(x.q.id);
});
ok("marking the right answer gives a pass for all " + all.length + " questions",
   bad.length === 0, bad.join(", "));

let wrongPass = [];
all.forEach((x) => {
  const q = x.q;
  let wrong;
  if (q.type === "mc") wrong = q.choices.findIndex((c) => !c.correct);
  else if (q.type === "fraction") wrong = { n: "999", d: "1000" };
  else if (q.type === "pockets") wrong = ["0"];
  else if (q.type === "numeric") wrong = "-12345";
  else return;                       // written answers are marked by the teacher
  if (checkAnswer(q, wrong, {}).correct) wrongPass.push(q.id);
});
ok("marking a wrong answer gives a fail", wrongPass.length === 0, wrongPass.join(", "));

console.log("\n== no answer can go stale when the wheel changes ==");
// A question may state a number in its text only if it pins its wheel.
// Without a pin, "18 of the 37 pockets" is wrong on an American wheel.
const WHEEL_SPECIFIC = /\b\d+\s*\/\s*3[78]\b|\b3[78]\s+pockets\b|\bout of\s+3[78]\b|\b(2\.70|5\.26|7\.89)\s*%/;
const stale = all.filter((x) => {
  const text = [x.q.prompt, x.q.hint || "", x.q.feedback.correct, x.q.feedback.wrong]
    .concat((x.q.choices || []).map((c) => c.text)).join(" ");
  return WHEEL_SPECIFIC.test(text) && !x.q.wheel;
}).map((x) => x.q.id);
ok("every question naming a wheel-specific number pins its wheel", stale.length === 0,
   stale.join(", "));

console.log("\n== switching the wheel re-answers the bank ==");
const unpinned = all.filter((x) => !x.q.wheel && x.q.answer.from !== "literal");
let moved = 0;
unpinned.forEach((x) => {
  const a = JSON.stringify(resolveAnswer(x.q, { wheel: WHEELS.european }).value);
  const b = JSON.stringify(resolveAnswer(x.q, { wheel: WHEELS.american }).value);
  if (a !== b) moved++;
});
ok("an unpinned question gives a different answer on each wheel",
   unpinned.length === 0 || moved === unpinned.length,
   moved + " of " + unpinned.length + " changed");

const pinned = all.filter((x) => x.q.wheel);
ok("a pinned question ignores the wheel the student picked",
   pinned.every((x) =>
     JSON.stringify(resolveAnswer(x.q, { wheel: WHEELS.european }).value) ===
     JSON.stringify(resolveAnswer(x.q, { wheel: WHEELS.american }).value)),
   "pinned: " + pinned.length);

console.log("\n== student voice ==");
const prose = [];
all.forEach((x) => {
  prose.push([x.q.id, x.q.prompt], [x.q.id, x.q.feedback.correct], [x.q.id, x.q.feedback.wrong]);
  if (x.q.hint) prose.push([x.q.id, x.q.hint]);
  (x.q.choices || []).forEach((c) => prose.push([x.q.id, c.text]));
});
const DASHES = /[—–]/;                                  // style-check: allow
ok("no em dash or en dash in anything a student reads",
   prose.every(([, t]) => !DASHES.test(t)),
   prose.filter(([, t]) => DASHES.test(t)).map(([id]) => id).join());
ok("no appeal to marks",
   prose.every(([, t]) => !/\bmarks?\b|\bassessed\b|\bworth\b/i.test(t)),
   prose.filter(([, t]) => /\bmarks?\b|\bassessed\b|\bworth\b/i.test(t)).map(([id]) => id).join());
ok("no commentary about the lesson itself",
   prose.every(([, t]) => !/\bthe whole point\b|\bthis matters\b|\bimportant to\b|\bremember,/i.test(t)),
   prose.filter(([, t]) => /\bthe whole point\b|\bthis matters\b|\bimportant to\b|\bremember,/i.test(t)).map(([id]) => id).join());

console.log("\n== the module registry ==");
ok("every module in MODULE_ORDER has a definition",
   MODULE_ORDER.every((id) => moduleById(id)),
   MODULE_ORDER.filter((id) => !moduleById(id)).join());
ok("every definition is in MODULE_ORDER",
   MODULE_DEFS.every((m) => MODULE_ORDER.indexOf(m.id) !== -1),
   MODULE_DEFS.filter((m) => MODULE_ORDER.indexOf(m.id) === -1).map((m) => m.id).join());
ok("every module has a title, a blurb and steps",
   MODULE_DEFS.every((m) => m.title && m.blurb && m.steps && m.steps.length));
ok("every question step has questions to draw on",
   MODULE_DEFS.every((m) => !m.steps.some((s) => s.kind === "questions") || moduleQuestions(m.id).length),
   MODULE_DEFS.filter((m) => m.steps.some((s) => s.kind === "questions") && !moduleQuestions(m.id).length).map((m) => m.id).join());
ok("every module runs somewhere",
   MODULE_DEFS.every((m) => m.where.student || m.where.projector));

console.log("\n== syllabus coverage ==");
const DOTPOINTS = [1,2,3,4,5,6,7,8,9,10,11];
const covered = dotpointsCovered(MODULE_ORDER);
DOTPOINTS.forEach((d) => {
  const mods = MODULE_DEFS.filter((m) => m.dotpoints.indexOf(d) !== -1).map((m) => m.id);
  ok("dot point " + d + " is covered", mods.length > 0, mods.join(", "));
});
ok("all 11 dot points are covered", covered.length === DOTPOINTS.length,
   "covered: " + covered.join(", "));

console.log("\n== module blurbs use student voice ==");
const DASH2 = /[—–]/;                                   // style-check: allow
ok("no dash in a title or a blurb",
   MODULE_DEFS.every((m) => !DASH2.test(m.title) && !DASH2.test(m.blurb)),
   MODULE_DEFS.filter((m) => DASH2.test(m.title) || DASH2.test(m.blurb)).map((m) => m.id).join());
const bodies = [];
MODULE_DEFS.forEach((m) => m.steps.forEach((s) => (s.body || []).forEach((b) => bodies.push([m.id, b]))));
ok("no dash in any explanation", bodies.every(([, b]) => !DASH2.test(b)),
   bodies.filter(([, b]) => DASH2.test(b)).map(([id]) => id).join());
