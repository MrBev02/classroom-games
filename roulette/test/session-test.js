// ---- session lifecycle suite (needs the fake clock + storage shim) ----
console.log("\n== session: unlocking ==");
const MIN = 60000, HR = 3600000;
function freshKey(o) {
  return RouletteKey.encode(Object.assign({
    expiresAt: __clock + 2*HR, durationMin: 40, moduleIds: ["sample-space","free-play"] }, o || {}));
}
function reset() {
  for (const k in __storage) delete __storage[k];
  __clock = Date.UTC(2026, 8, 10, 9, 0, 0);
}

reset();
let key = freshKey();
let u = Session.unlock(key);
ok("a fresh key unlocks", u.ok === true, u.reason);
ok("...and reports its modules", u.moduleIds.join() === "sample-space,free-play", u.moduleIds.join());
let st = Session.check();
ok("state is open", st.state === "open", st.state + "/" + st.reason);
ok("remaining is the 40-min cap, not the 2-hour expiry",
   Math.abs(st.remainingMs - 40*MIN) < 1000, Math.round(st.remainingMs/MIN) + " min");

console.log("\n== session: normal expiry ==");
reset();
Session.unlock(freshKey({ expiresAt: __clock + 30*MIN, durationMin: 0 }));
__clock += 29*MIN;
ok("still open at 29 minutes", Session.check().state === "open");
__clock += 2*MIN;
st = Session.check();
ok("locked once the expiry passes", st.state === "locked" && st.reason === "EXPIRED", st.reason);

console.log("\n== session: the elapsed-time cap ==");
reset();
key = freshKey({ expiresAt: __clock + 10*HR, durationMin: 20 });
Session.unlock(key);
__clock += 19*MIN;
ok("open at 19 of 20 minutes", Session.check().state === "open");
__clock += 2*MIN;
st = Session.check();
ok("locked at 21 minutes even though the key is valid for 10 hours",
   st.state === "locked" && st.reason === "ELAPSED", st.reason);
ok("...and the key is now burnt", Session.isBurnt(RouletteKey.decode(key).canonical));
ok("...so re-entering it is refused", Session.unlock(key).reason === "BURNT");

console.log("\n== session: closing the laptop and coming back ==");
reset();
key = freshKey({ expiresAt: __clock + 10*HR, durationMin: 20 });
Session.unlock(key);
__clock += 4*HR;                       // recess, lunch, next period
st = Session.check();
ok("a reopened laptop is locked by elapsed time", st.state === "locked" && st.reason === "ELAPSED", st.reason);

console.log("\n== session: winding the clock back ==");
reset();
key = freshKey({ expiresAt: __clock + 1*HR, durationMin: 30 });
Session.unlock(key);
__clock += 10*MIN;
ok("open after 10 minutes", Session.check().state === "open");
__clock -= 45*MIN;                     // The student sets the clock to an earlier time.
st = Session.check();
ok("winding the clock back locks it", st.state === "locked" && st.reason === "CLOCK", st.reason);
ok("...and burns the key, so the rollback gains nothing",
   Session.isBurnt(RouletteKey.decode(key).canonical));
reset();
Session.unlock(freshKey());
__clock -= 30000;                      // a small NTP correction, not tampering
ok("a small backwards nudge is tolerated", Session.check().state === "open");

console.log("\n== session: the teacher's stop code ==");
reset();
key = freshKey();
Session.unlock(key);
const canonical = RouletteKey.decode(key).canonical;
const stop = RouletteKey.stopCode(canonical);
ok("a wrong stop code does nothing", Session.applyStopCode("000000") === false);
ok("...and leaves the session open", Session.check().state === "open");
ok("the right stop code is accepted", Session.applyStopCode(stop) === true);
st = Session.check();
ok("...the session is locked, and says why", st.state === "locked" && st.reason === "STOPPED",
   st.state + "/" + st.reason);
ok("...the student is told what happened",
   Session.explain(st.reason).indexOf("teacher") !== -1, Session.explain(st.reason));
ok("...and the key cannot be re-entered", Session.unlock(key).reason === "BURNT");
ok("...the lock persists across a page reload", Session.check().state === "locked");
Session.dismissLock();
ok("...until the student dismisses it to enter a new code", Session.check().state === "none");
ok("...and a NEW key then works", Session.unlock(freshKey({ moduleIds: ["complement"] })).ok === true);
reset();
Session.unlock(freshKey());
ok("stop code survives being read out with a dash",
   Session.applyStopCode(RouletteKey.formatStopCode(
     RouletteKey.stopCode(Store.get("roulette-session").canonical))) === true);

console.log("\n== session: a lock never destroys the student's work ==");
reset();
key = freshKey({ durationMin: 5 });
Session.unlock(key);
Store.set("roulette-progress-v1", { modules: { complement: { stepIndex: 3 } } });
__clock += 6*MIN;
Session.check();
ok("an expired session explains itself rather than showing a blank code box",
   Session.check().state === "locked" && Session.check().reason === "ELAPSED");
const kept = Store.get("roulette-progress-v1");
ok("progress survives the session ending", kept && kept.modules.complement.stepIndex === 3);
ok("...but the session record is gone", Store.get("roulette-session") === null);

console.log("\n== session: burnt list stays bounded ==");
reset();
for (let i = 0; i < 70; i++) { Session.unlock(freshKey({ moduleIds: ["free-play"] })); Session.burn("test"); }
ok("burnt list is capped at 50", Store.get("roulette-burnt-keys").length === 50,
   Store.get("roulette-burnt-keys").length);

console.log("\n== session: the ungated escape hatch ==");
reset();
ROULETTE_CONFIG.REQUIRE_SESSION_KEY = false;
st = Session.check();
ok("REQUIRE_SESSION_KEY=false opens everything", st.state === "open" && st.ungated === true);
ok("...with every module available", st.moduleIds.length === MODULE_ORDER.length);
ROULETTE_CONFIG.REQUIRE_SESSION_KEY = true;
reset();
ok("with the gate back on, no key means no session", Session.check().state === "none");

console.log("\n== session: refusing bad keys up front ==");
reset();
ok("an expired key is refused at unlock",
   Session.unlock(freshKey({ expiresAt: __clock - HR })).reason === "EXPIRED");
ok("a key opening nothing is refused",
   Session.unlock(freshKey({ moduleIds: [] })).reason === "NO_MODULES");
ok("a mistyped key is refused", Session.unlock("ABCDE-FGHJK-MNPQR").reason === "CHECKSUM");
ok("every refusal has a plain-English explanation",
   ["FORMAT","CHECKSUM","VERSION","EXPIRED","BURNT","NO_MODULES","ELAPSED","CLOCK","STOPPED"]
     .every(r => typeof Session.explain(r) === "string" && Session.explain(r).length > 10));

Session.stopHeartbeat();
console.log("\n" + (fail ? "FAILED " + fail + " / " + (pass+fail) : "all " + pass + " checks passed"));
if (fail) globalThis.__fail = true;

console.log("\n== storage that doesn't work ==");
reset();
ok("Store reports working storage", Store.works === true);
ok("a value written comes back", (Store.set("roulette-probe-x", { a: 1 }), Store.get("roulette-probe-x").a === 1));
ok("clearing storage elsewhere is seen, not masked by a stale copy",
   (delete __storage["roulette-probe-x"], Store.get("roulette-probe-x") === null));
Store.remove("roulette-probe-x");
