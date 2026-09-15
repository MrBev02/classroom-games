/* =====================================================
   ROULETTE: PROJECTOR
   =====================================================

   This screen draws what the teacher console sends. It holds no state of
   its own and it makes no decisions. The screens themselves are in
   js/views.js, which the teacher console also uses.

   The projector sends HELLO when it opens, and the console answers with
   the full state. Thus a projector that opens after the console still
   shows the correct screen.

   The console sends PING. This screen answers PONG, so the console can
   tell the teacher whether the projector is open.
   ===================================================== */

const channel = new GameChannel();
let state = null;

channel.on("STATE", (next) => {
  state = next;
  if (state && state.currencyMode) ROULETTE_CONFIG.currencyMode = state.currencyMode;
  render();
});

channel.on("PING", () => channel.send("PONG"));

function render() {
  fill(document.getElementById("screen"), projectorView(state, {}));
}

/* The support line stays on the screen at all times. */
(function () {
  const box = document.getElementById("support");
  const shown = (typeof SUPPORT_CONTACTS !== "undefined" ? SUPPORT_CONTACTS : [])
    .filter((c) => !c.debriefOnly);
  shown.forEach((c, i) => {
    if (i) box.appendChild(document.createTextNode("   ·   "));
    box.appendChild(document.createTextNode(c.name + " " + c.detail));
  });
})();

channel.send("HELLO");
render();
