/* =====================================================
   ROULETTE: PRINTED MATERIAL
   =====================================================

   Each function builds a complete HTML page, puts it in a Blob, and opens
   it in a new tab. This is the same method as printAnswerKey() in the
   Jeopardy host.

   The worksheet and the answer key both call resolveAnswer(). Thus the
   printed answer always agrees with the answer on the screen.

   If the browser blocks the new tab, the function writes the page into a
   hidden element on the current page and calls print() there. Safari
   blocks a blob: window in some conditions.
   ===================================================== */

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const PRINT_CSS = [
  "body{font-family:'Hanken Grotesk',system-ui,-apple-system,sans-serif;",
  "max-width:720px;margin:2rem auto;color:#111;line-height:1.5;padding:0 1rem}",
  "h1{font-size:1.5rem;margin-bottom:.25rem}",
  "h2{font-size:1.05rem;margin:1.4rem 0 .4rem;border-bottom:2px solid #111;padding-bottom:.2rem}",
  ".sub{color:#555;margin-bottom:1.2rem;font-size:.9rem}",
  ".q{margin-bottom:1rem;page-break-inside:avoid}",
  ".q__n{font-weight:700;margin-right:.4rem}",
  ".rule{border-bottom:1px solid #999;height:1.6rem;margin-top:.35rem}",
  ".ans{color:#111;font-weight:600}",
  "table{width:100%;border-collapse:collapse;font-size:.85rem;margin:.5rem 0}",
  "th,td{border:1px solid #bbb;padding:.3rem .45rem;text-align:left}",
  "th{background:#f0f0ec;font-size:.75rem;text-transform:uppercase}",
  ".code{font-size:3.2rem;letter-spacing:.14em;font-weight:700;text-align:center;",
  "margin:1.5rem 0;font-variant-numeric:tabular-nums}",
  ".stop{font-size:1.6rem;text-align:center;letter-spacing:.1em;font-weight:600}",
  ".url{font-size:1.3rem;text-align:center;word-break:break-all}",
  ".box{border:2px solid #111;border-radius:10px;padding:1.2rem;margin:1rem 0}",
  ".note{font-size:.8rem;color:#555}",
  "@media print{body{margin:.6cm}}",
].join("");

function openPrintable(title, bodyHtml) {
  const html = "<!DOCTYPE html><html lang=\"en-AU\"><head><meta charset=\"UTF-8\">" +
    "<title>" + esc(title) + "</title><style>" + PRINT_CSS + "</style></head><body>" +
    bodyHtml + "</body></html>";
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    // The browser blocked the tab. Print from this page instead.
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.src = url;
    frame.onload = function () { frame.contentWindow.print(); };
    document.body.appendChild(frame);
  }
}

/** The card for the board. It carries the code, the address and the end code. */
function printCodeCard(opts) {
  const parts = [];
  parts.push("<h1>Roulette and Probability</h1>");
  parts.push("<p class=\"sub\">Type this code to start.</p>");
  if (opts.joinUrl) {
    parts.push("<div class=\"box\"><p class=\"note\">Go to</p><p class=\"url\">" +
      esc(opts.joinUrl) + "</p></div>");
  }
  parts.push("<div class=\"box\"><p class=\"note\">Class code</p><p class=\"code\">" +
    esc(opts.key) + "</p></div>");
  parts.push("<p class=\"note\">This code stops working at " + esc(opts.expiresText) +
    ", or after " + esc(opts.durationText) + " of use on a device.</p>");
  parts.push("<h2>For the teacher</h2>");
  parts.push("<p>Read out the end code to lock every student's page.</p>");
  parts.push("<p class=\"stop\">" + esc(opts.stopCode) + "</p>");
  parts.push("<p class=\"note\">Keep the end code off the board until you want the activity to stop.</p>");
  openPrintable("Class code", parts.join(""));
}

/**
 * The student worksheet. It holds the same questions as the screen, with
 * space to write. Use it when the devices do not work, or for a student
 * who works better on paper.
 */
function printWorksheet(moduleIds, wheel) {
  const w = wheel || currentWheel();
  const parts = ["<h1>Roulette and Probability</h1>",
    "<p class=\"sub\">Name: ______________________________  Class: ______________</p>"];
  let n = 0;
  enabledModules(moduleIds).forEach((mod) => {
    const pool = moduleQuestions(mod.id);
    if (!pool.length) return;
    parts.push("<h2>" + esc(mod.title) + "</h2>");
    pool.forEach((q) => {
      n++;
      parts.push("<div class=\"q\"><span class=\"q__n\">" + n + ".</span>" + esc(q.prompt));
      if (q.type === "mc") {
        parts.push("<ul>" + q.choices.map((c) => "<li>" + esc(c.text) + "</li>").join("") + "</ul>");
      } else {
        parts.push("<div class=\"rule\"></div>");
      }
      parts.push("</div>");
    });
  });
  if (n === 0) parts.push("<p>These activities have no written questions.</p>");
  parts.push("<p class=\"note\">Wheel used: " + esc(w.label) + ".</p>");
  openPrintable("Worksheet", parts.join(""));
}

/** The answer key. Every answer comes from the same call the screen uses. */
function printAnswerKey(moduleIds, wheel) {
  const w = wheel || currentWheel();
  const parts = ["<h1>Answer key</h1>",
    "<p class=\"sub\">Wheel: " + esc(w.label) + ". Keep this page off the projector.</p>"];
  let n = 0;
  enabledModules(moduleIds).forEach((mod) => {
    const pool = moduleQuestions(mod.id);
    if (!pool.length) return;
    parts.push("<h2>" + esc(mod.title) + "</h2>");
    parts.push("<table><tr><th>#</th><th>Question</th><th>Answer</th><th>Dot points</th></tr>");
    pool.forEach((q) => {
      n++;
      const r = resolveAnswer(q, { wheel: w });
      let answer;
      if (q.type === "mc") answer = q.choices.filter((c) => c.correct).map((c) => c.text).join("; ");
      else if (r.kind === "probability") {
        answer = r.value.fractionText + " = " + r.value.decimal.toFixed(3) +
                 " = " + fmtPercent(r.value.decimal, 1);
      } else if (r.kind === "set") answer = r.value.join(", ");
      else if (r.kind === "odds") answer = r.value.text;
      else if (r.kind === "number" && q.unit === "percent") answer = fmtPercent(r.value, q.dp == null ? 2 : q.dp);
      else answer = String(r.value);
      parts.push("<tr><td>" + n + "</td><td>" + esc(q.prompt) + "</td><td class=\"ans\">" +
        esc(answer) + "</td><td>" + esc((q.dotpoints || []).join(", ")) + "</td></tr>");
    });
    parts.push("</table>");
  });
  openPrintable("Answer key", parts.join(""));
}

/** A tally sheet for trials that students run by hand. */
function printTallySheet(wheel) {
  const w = wheel || currentWheel();
  const space = sampleSpace(w);
  const parts = ["<h1>Tally sheet</h1>",
    "<p class=\"sub\">Name: ______________________  Event: ______________________</p>",
    "<p>Record each spin. Then work out the relative frequency.</p>",
    "<table><tr><th>Pocket</th><th>Tally</th><th>Total</th></tr>"];
  space.forEach((p) => {
    parts.push("<tr><td>" + esc(p) + " (" + esc(pocketColour(w, p)) + ")</td><td></td><td></td></tr>");
  });
  parts.push("</table>");
  parts.push("<p>Number of spins: ____________</p>");
  parts.push("<p>Relative frequency of your event: ____________</p>");
  parts.push("<p>Theoretical probability of your event: ____________</p>");
  openPrintable("Tally sheet", parts.join(""));
}
