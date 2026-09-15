/* =====================================================
   ROULETTE: CHARTS
   =====================================================

   Inline SVG charts. There is no chart library, because the student page
   must operate with no internet connection.

   COLOURS

   Each chart reads its colours from CSS custom properties. Thus the light
   theme and the dark theme both work, and each screen sets its own values.
   The two series colours passed the colour-vision checks in both themes.

   A chart with two series has a legend. It also has a label on each line.
   Thus a reader does not need the colours to identify a line.

   ONE EXCEPTION

   A chart of the wheel colours uses red, black and green. Those colours
   are the data. They are not a choice of palette.
   ===================================================== */

const CHART_NS = "http://www.w3.org/2000/svg";

/* A convergence line starts here. Below this many spins the relative
   frequency is 0 or 1, and that one point would set the scale for the
   whole chart. */
const CHART_MIN_SPINS = 20;

function svgEl(tag, attrs) {
  const e = document.createElementNS(CHART_NS, tag);
  Object.keys(attrs || {}).forEach((k) => e.setAttribute(k, attrs[k]));
  return e;
}

/**
 * A line chart with one or two series.
 *
 * opts.series     [{label, points:[{x,y}], role:"observed"|"theory", dashed}]
 * opts.reference  Optional {value, label}. The program draws a horizontal
 *                 line, for example the theoretical probability.
 * opts.yDomain    Optional [min, max]. Without it the function calculates
 *                 the range from the data.
 * opts.xLabel     The label under the horizontal axis.
 * opts.yLabel     The label beside the vertical axis.
 * opts.percent    true shows the vertical axis as percentages.
 */
function lineChart(opts) {
  const o = opts || {};
  const W = 640, H = 260;
  const pad = { top: 16, right: 96, bottom: 40, left: 56 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const all = [];
  o.series.forEach((s) => s.points.forEach((p) => all.push(p)));
  if (o.reference) all.push({ x: 0, y: o.reference.value });
  if (!all.length) return el("div", { class: "chart chart--empty", text: "No data yet." });

  const xs = all.map((p) => p.x), ys = all.map((p) => p.y);
  const xMin = Math.min.apply(null, xs), xMax = Math.max.apply(null, xs);
  let yMin = o.yDomain ? o.yDomain[0] : Math.min.apply(null, ys);
  let yMax = o.yDomain ? o.yDomain[1] : Math.max.apply(null, ys);
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const padY = (yMax - yMin) * 0.12;
  if (!o.yDomain) { yMin -= padY; yMax += padY; }

  const sx = (x) => pad.left + (xMax === xMin ? 0 : (x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y) => pad.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const svg = svgEl("svg", {
    viewBox: "0 0 " + W + " " + H, class: "chart__svg",
    role: "img", "aria-label": o.title || "line chart",
  });

  // Grid and axis labels. These are recessive.
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = yMin + (i / ticks) * (yMax - yMin);
    const y = sy(v);
    svg.appendChild(svgEl("line", {
      x1: pad.left, x2: pad.left + plotW, y1: y, y2: y, class: "chart__grid",
    }));
    const t = svgEl("text", { x: pad.left - 8, y: y, class: "chart__tick", "text-anchor": "end",
      "dominant-baseline": "central" });
    t.textContent = o.percent ? (v * 100).toFixed(0) + "%" : formatTick(v);
    svg.appendChild(t);
  }
  [xMin, xMax].forEach((v, i) => {
    const t = svgEl("text", { x: sx(v), y: pad.top + plotH + 20, class: "chart__tick",
      "text-anchor": i === 0 ? "start" : "end" });
    t.textContent = Math.round(v).toLocaleString();
    svg.appendChild(t);
  });
  if (o.xLabel) {
    const t = svgEl("text", { x: pad.left + plotW / 2, y: H - 4, class: "chart__axis-label",
      "text-anchor": "middle" });
    t.textContent = o.xLabel;
    svg.appendChild(t);
  }

  // The reference line for the theoretical value.
  if (o.reference) {
    const y = sy(o.reference.value);
    svg.appendChild(svgEl("line", {
      x1: pad.left, x2: pad.left + plotW, y1: y, y2: y, class: "chart__reference",
    }));
    const t = svgEl("text", { x: pad.left + plotW + 8, y: y, class: "chart__series-label is-theory",
      "dominant-baseline": "central" });
    t.textContent = o.reference.label;
    svg.appendChild(t);
  }

  // The series.
  o.series.forEach((s) => {
    if (s.points.length < 2) return;
    const d = s.points.map((p, i) => (i ? "L" : "M") + sx(p.x) + " " + sy(p.y)).join(" ");
    svg.appendChild(svgEl("path", {
      d: d, class: "chart__line is-" + (s.role || "observed"), fill: "none",
    }));
    const last = s.points[s.points.length - 1];
    const t = svgEl("text", {
      x: Math.min(sx(last.x) + 8, W - 4), y: sy(last.y),
      class: "chart__series-label is-" + (s.role || "observed"), "dominant-baseline": "central",
    });
    t.textContent = s.label;
    svg.appendChild(t);
  });

  // The crosshair and the tooltip.
  const cross = svgEl("line", { class: "chart__crosshair", y1: pad.top, y2: pad.top + plotH,
    x1: 0, x2: 0, opacity: 0 });
  svg.appendChild(cross);
  const dot = svgEl("circle", { class: "chart__dot", r: 4, cx: 0, cy: 0, opacity: 0 });
  svg.appendChild(dot);

  const tip = el("div", { class: "chart__tip", hidden: true });
  const wrap = el("figure", { class: "chart" }, svg, tip);
  if (o.title) wrap.appendChild(el("figcaption", { class: "chart__caption", text: o.title }));

  const main = o.series[0];
  if (main && main.points.length > 1) {
    svg.addEventListener("mousemove", (ev) => {
      const box = svg.getBoundingClientRect();
      const x = ((ev.clientX - box.left) / box.width) * W;
      let best = main.points[0], bestD = Infinity;
      main.points.forEach((p) => {
        const d = Math.abs(sx(p.x) - x);
        if (d < bestD) { bestD = d; best = p; }
      });
      cross.setAttribute("x1", sx(best.x));
      cross.setAttribute("x2", sx(best.x));
      cross.setAttribute("opacity", 1);
      dot.setAttribute("cx", sx(best.x));
      dot.setAttribute("cy", sy(best.y));
      dot.setAttribute("opacity", 1);
      tip.hidden = false;
      tip.textContent = "After " + Math.round(best.x).toLocaleString() + " spins: " +
        (o.percent ? (best.y * 100).toFixed(1) + "%" : formatTick(best.y));
      tip.style.left = ((sx(best.x) / W) * 100) + "%";
    });
    svg.addEventListener("mouseleave", () => {
      cross.setAttribute("opacity", 0);
      dot.setAttribute("opacity", 0);
      tip.hidden = true;
    });
  }
  return wrap;
}

function formatTick(v) {
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1000) return Math.round(v).toLocaleString();
  if (a >= 10) return v.toFixed(0);
  if (a >= 1) return v.toFixed(1);
  return v.toFixed(3);
}

/**
 * A bar chart of the count for each pocket.
 *
 * The bars use one colour. The colour does not carry any meaning here,
 * because the height already shows the count.
 *
 * opts.rows       [{label, value, colour}] The colour is optional.
 * opts.reference  Optional {value, label} for the theoretical count.
 */
function barChart(opts) {
  const o = opts || {};
  const rows = o.rows || [];
  if (!rows.length) return el("div", { class: "chart chart--empty", text: "No data yet." });

  const W = 640, H = 220;
  const pad = { top: 14, right: 12, bottom: 34, left: 44 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const maxV = Math.max(o.reference ? o.reference.value : 0,
                        Math.max.apply(null, rows.map((r) => r.value))) * 1.1 || 1;
  // A 2px gap between the bars.
  const slot = plotW / rows.length;
  const barW = Math.max(1, slot - 2);

  const svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "chart__svg",
    role: "img", "aria-label": o.title || "bar chart" });

  const sy = (v) => pad.top + plotH - (v / maxV) * plotH;

  for (let i = 0; i <= 4; i++) {
    const v = (i / 4) * maxV, y = sy(v);
    svg.appendChild(svgEl("line", { x1: pad.left, x2: pad.left + plotW, y1: y, y2: y, class: "chart__grid" }));
    const t = svgEl("text", { x: pad.left - 8, y: y, class: "chart__tick", "text-anchor": "end",
      "dominant-baseline": "central" });
    t.textContent = formatTick(v);
    svg.appendChild(t);
  }

  rows.forEach((r, i) => {
    const h = Math.max(0, plotH - (sy(r.value) - pad.top));
    const g = svgEl("g", { class: "chart__bar-group" });
    const rect = svgEl("rect", {
      x: pad.left + i * slot + 1, y: sy(r.value), width: barW, height: h,
      rx: Math.min(4, barW / 2), class: "chart__bar" + (r.colour ? " is-" + r.colour : ""),
    });
    const title = svgEl("title", {});
    title.textContent = r.label + ": " + r.value.toLocaleString();
    g.appendChild(rect); g.appendChild(title);
    svg.appendChild(g);
    // Show a label only when there is space for the text. With many bars
    // the program labels a subset, thus the reader can still find a bar.
    const labelEvery = rows.length <= 20 ? 1 : Math.ceil(rows.length / 8);
    if (i % labelEvery === 0) {
      const t = svgEl("text", { x: pad.left + i * slot + slot / 2, y: pad.top + plotH + 16,
        class: "chart__tick", "text-anchor": "middle" });
      t.textContent = r.label;
      svg.appendChild(t);
    }
  });

  if (o.reference) {
    const y = sy(o.reference.value);
    svg.appendChild(svgEl("line", { x1: pad.left, x2: pad.left + plotW, y1: y, y2: y,
      class: "chart__reference" }));
    const t = svgEl("text", { x: pad.left + 6, y: y - 6, class: "chart__series-label is-theory" });
    t.textContent = o.reference.label;
    svg.appendChild(t);
  }

  const wrap = el("figure", { class: "chart" }, svg);
  if (o.title) wrap.appendChild(el("figcaption", { class: "chart__caption", text: o.title }));
  return wrap;
}

/**
 * A single bar divided into parts. The sum-to-one module uses it to show
 * that the parts fill the bar exactly.
 *
 * parts: [{label, value, colour}]
 */
function stackedBar(parts, total, opts) {
  const o = opts || {};
  const sum = parts.reduce((a, p) => a + p.value, 0);
  const scale = total || sum || 1;
  const row = el("div", { class: "stack" + (sum > scale ? " is-over" : "") });
  parts.forEach((p) => {
    const seg = el("div", {
      class: "stack__part" + (p.colour ? " is-" + p.colour : ""),
      style: "flex-grow:" + p.value,
      title: p.label + ": " + p.value + "/" + scale,
    }, el("span", { class: "stack__label", text: p.label }));
    row.appendChild(seg);
  });
  if (sum < scale) {
    row.appendChild(el("div", { class: "stack__part is-gap", style: "flex-grow:" + (scale - sum) },
      el("span", { class: "stack__label", text: "not covered" })));
  }
  return el("div", { class: "stack-wrap" }, row,
    o.caption ? el("p", { class: "stack__caption", text: o.caption }) : null);
}

/** A legend. A chart with two or more series always has one. */
function chartLegend(items) {
  return el("ul", { class: "legend" }, ...items.map((it) =>
    el("li", { class: "legend__item" },
      el("span", { class: "legend__swatch is-" + it.role }),
      el("span", { class: "legend__text", text: it.label }))));
}
