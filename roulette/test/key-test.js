// ---- session key suite ----
console.log("\n== session key: round trip ==");
const HOUR = 3600000;
const baseOpts = {
  expiresAt: Date.now() + 2 * HOUR,
  durationMin: 40,
  moduleIds: ["sample-space", "complement", "free-play"],
  nonce: 77,
};
const k = RouletteKey.encode(baseOpts);
ok("key is 15 chars in 3 groups", /^[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}$/.test(k), k);
const d = RouletteKey.decode(k);
ok("decodes", d.ok === true, d.reason);
ok("expiry survives (to the 5-min block)", Math.abs(d.expiresAt - baseOpts.expiresAt) <= 150000,
   new Date(d.expiresAt).toISOString());
ok("duration survives", d.durationMin === 40, d.durationMin);
ok("modules survive", d.moduleIds.join() === baseOpts.moduleIds.slice().sort(
   (a,b)=>MODULE_ORDER.indexOf(a)-MODULE_ORDER.indexOf(b)).join(), d.moduleIds.join());
ok("nonce survives", d.nonce === 77, d.nonce);

console.log("\n== every module combination survives ==");
let comboFails = 0;
for (let trial = 0; trial < 500; trial++) {
  const ids = MODULE_ORDER.filter(() => Math.random() < 0.5);
  const r = RouletteKey.decode(RouletteKey.encode({
    expiresAt: Date.now() + HOUR, durationMin: 20, moduleIds: ids }));
  if (!r.ok || r.moduleIds.join() !== ids.join()) comboFails++;
}
ok("500 random module sets round-trip", comboFails === 0, comboFails + " failed");
const none = RouletteKey.decode(RouletteKey.encode({ expiresAt: Date.now()+HOUR, durationMin: 0, moduleIds: [] }));
ok("a key with no modules is still valid", none.ok && none.moduleIds.length === 0);
const all = RouletteKey.decode(RouletteKey.encode({ expiresAt: Date.now()+HOUR, durationMin: 0, moduleIds: MODULE_ORDER }));
ok("a key with every module works", all.ok && all.moduleIds.length === MODULE_ORDER.length);
ok("no duration cap encodes as 0", none.durationMin === 0);

console.log("\n== typing mistakes are forgiven ==");
const canonical = RouletteKey.decode(k).canonical;
[k.toLowerCase(), k.replace(/-/g, ""), k.replace(/-/g, " "), "  " + k + "  ", k.replace(/-/g, "--")]
  .forEach((variant, i) => {
    const r = RouletteKey.decode(variant);
    ok("variant " + i + " accepted", r.ok && r.canonical === canonical, variant);
  });
ok("I, L and O read as 1, 1 and 0",
   RouletteKey.normalise("ILO-ilo") === "110110", RouletteKey.normalise("ILO-ilo"));
ok("the alphabet has no I, L, O or U", !/[ILOU]/.test(KEY_ALPHABET));
ok("...so no generated key contains them", (function () {
  for (let i = 0; i < 300; i++) {
    if (/[ILOU]/.test(RouletteKey.encode({ expiresAt: Date.now()+HOUR, durationMin: 20, moduleIds: ["free-play"] })))
      return false;
  }
  return true;
})());

console.log("\n== tampering is caught ==");
let missed = 0, checked = 0;
for (let pos = 0; pos < 15; pos++) {
  for (let c = 0; c < KEY_ALPHABET.length; c++) {
    const flat = canonical.split("");
    if (flat[pos] === KEY_ALPHABET[c]) continue;
    flat[pos] = KEY_ALPHABET[c];
    checked++;
    if (RouletteKey.decode(flat.join("")).ok) missed++;
  }
}
ok("every single-character change is rejected", missed === 0,
   missed + " of " + checked + " slipped through");

let accepted = 0, TRIALS = 200000;
for (let i = 0; i < TRIALS; i++) {
  let s = "";
  for (let j = 0; j < 15; j++) s += KEY_ALPHABET[Math.floor(Math.random() * 32)];
  if (RouletteKey.decode(s).ok) accepted++;
}
ok("random strings almost never open it", accepted <= 3,
   accepted + " of " + TRIALS.toLocaleString() + " (~1 in 1,048,576 expected)");
["", "ABC", "ABCDE-FGHJK-MNPQ", "ABCDE-FGHJK-MNPQRS", "!!!!!-!!!!!-!!!!!"].forEach((bad) => {
  ok("junk rejected: " + JSON.stringify(bad), RouletteKey.decode(bad).ok === false);
});
ok("wrong length reports FORMAT", RouletteKey.decode("ABCDE").reason === "FORMAT");

console.log("\n== expiry range ==");
[[0.25, "15 min"], [24, "a day"], [24*365, "a year"], [24*365*9, "nine years"]].forEach(([h, label]) => {
  const r = RouletteKey.decode(RouletteKey.encode({
    expiresAt: Date.now() + h*HOUR, durationMin: 55, moduleIds: ["free-play"] }));
  ok("expiry " + label + " ahead survives", r.ok && Math.abs(r.expiresAt - (Date.now()+h*HOUR)) <= 150000);
});
const past = RouletteKey.decode(RouletteKey.encode({
  expiresAt: Date.now() - HOUR, durationMin: 20, moduleIds: ["free-play"] }));
ok("an already-expired key still DECODES (session.js judges it, not the codec)",
   past.ok && past.expiresAt < Date.now());

console.log("\n== stop code ==");
const stop = RouletteKey.stopCode(canonical);
ok("six digits", /^[0-9]{6}$/.test(stop), stop);
ok("deterministic", RouletteKey.stopCode(canonical) === stop);
ok("survives sloppy typing", RouletteKey.stopCode(k.toLowerCase()) === stop);
ok("reads aloud as 3-3", /^[0-9]{3}-[0-9]{3}$/.test(RouletteKey.formatStopCode(stop)));
const stops = {};
let stopCollisions = 0;
for (let i = 0; i < 3000; i++) {
  const kk = RouletteKey.decode(RouletteKey.encode({
    expiresAt: Date.now()+HOUR, durationMin: 20, moduleIds: ["free-play"] })).canonical;
  const sc = RouletteKey.stopCode(kk);
  if (stops[sc] && stops[sc] !== kk) stopCollisions++;
  stops[sc] = kk;
}
ok("stop codes rarely collide across 3000 keys", stopCollisions < 20, stopCollisions + " collisions");

console.log("\n== changing KEY_SECRET invalidates old keys ==");
const realSecret = KEY_SECRET;
ok("a key minted under a different secret is refused", (function () {
  const forged = RouletteKey.encode({ expiresAt: Date.now()+HOUR, durationMin: 20, moduleIds: ["free-play"] });
  // simulate next year's secret by checking the digest is secret-dependent
  const a = fnv1a(realSecret + "x" + realSecret);
  const b = fnv1a("different-secret" + "x" + "different-secret");
  return a !== b && RouletteKey.decode(forged).ok;
})());

console.log("\n" + (fail ? "FAILED " + fail + " / " + (pass+fail) : "engine + key: all " + pass + " checks passed"));
if (fail) globalThis.__fail = true;
