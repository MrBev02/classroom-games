/* This file contains replacements for two browser functions: a clock that
   the tests can move forward, and a localStorage. It also contains the test
   functions. Node loads this file first. Each test suite then operates in
   its own function scope. */
var __clock = Date.UTC(2026, 8, 10, 9, 0, 0);
var __storage = {};
Date.now = function () { return __clock; };
var performance = { now: function () { return __clock - Date.UTC(2026, 8, 10); } };
var localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(__storage, k) ? __storage[k] : null; },
  setItem: function (k, v) { __storage[k] = String(v); },
  removeItem: function (k) { delete __storage[k]; },
};

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (extra ? "  -> " + extra : "")); }
}
function near(a, b, tol) { return Math.abs(a - b) < (tol || 1e-9); }
function finish() {
  console.log("\n" + (fail ? "FAILED " + fail + " of " + (pass + fail) + " checks"
                           : "all " + pass + " checks passed"));
  if (fail) globalThis.__fail = true;
}
