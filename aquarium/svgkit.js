// Small helpers for drawing the aquarium with SVG from code.

const SVG_NS = "http://www.w3.org/2000/svg";
let lastId = 0;

export const rand = (min, max) => min + Math.random() * (max - min);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];
export const round = (value) => Math.round(value * 10) / 10;

export function make(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, String(value)));
  return node;
}

// A free-standing picture in the tank, sitting on its bottom edge. Everything grown is marked, so it can be regrown.
export function art(cls, width, height, style) {
  const svg = make("svg", { viewBox: `0 0 ${width} ${height}`, class: `${cls} grown`, preserveAspectRatio: "xMidYMax meet" });
  svg.style.cssText = style;
  return svg;
}

// A gradient of its own inside `svg`; stops are [offset, colour, opacity?]. Linear goes from (x1,y1) to (x2,y2),
// radial is centred at (cx,cy). Returns the fill to use.
export function gradient(svg, stops, shape = {}) {
  const id = `aq-g${(lastId += 1)}`;
  const radial = "cx" in shape;
  const attrs = radial ? { id, cx: shape.cx, cy: shape.cy, r: shape.r ?? 0.75 } : { id, x1: 0, y1: 1, x2: 0, y2: 0, ...shape };
  const node = make(radial ? "radialGradient" : "linearGradient", attrs);
  stops.forEach(([offset, color, opacity = 1]) => node.append(make("stop", { offset, "stop-color": color, "stop-opacity": opacity })));
  const defs = make("defs");
  defs.append(node);
  svg.append(defs);
  return `url(#${id})`;
}
