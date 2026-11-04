// Shadows from the lamp above: everything standing on the bottom gets a tight dark shadow at its foot; everything
// swimming casts a soft one on the sand below, wider and fainter the higher it swims. Shadows lean away from the lamp
// in the middle of the lid, and follow whoever moves.

const CASTERS = ".fish, .school, .puffer, .jelly, .castle, .coral, .fan, .chest, .rocks, .driftwood, .anemone, .star, .shell, .moss, .crab, .shrimp, .stone-bubbler";
const FLOOR_PX = 28;    // how high above the tank's bottom the sand's surface lies
const GROUNDED_PX = 8;  // closer to the floor than this counts as standing on it
const LEAN = 0.08;      // how far shadows lean away from the lamp, per pixel off the middle
const BASE_W = 100, BASE_H = 20; // the shadow element's own size, scaled to fit each caster

function placeOne(shade, rect, box, floorY) {
  if (!rect.width) {
    shade.style.opacity = "0";
    return;
  }
  const cx = rect.left - box.left + rect.width / 2;
  const foot = rect.bottom - box.top;
  const gap = Math.max(0, floorY - foot);
  const grounded = gap < GROUNDED_PX;
  const near = grounded ? 1 : Math.max(0, 1 - gap / floorY);
  const spread = 1 + (1 - near) * 0.8;
  const width = rect.width * 0.92 * spread;
  const height = Math.min(Math.max(rect.width * 0.16, 3), 12) * spread;
  const y = grounded ? foot - height * 0.3 : floorY + 4;
  const x = cx + (cx - box.width / 2) * LEAN * (grounded ? 0.5 : 1) - width / 2;
  shade.style.transform = `translate(${x.toFixed(1)}px, ${(y - height / 2).toFixed(1)}px) scale(${(width / BASE_W).toFixed(3)}, ${(height / BASE_H).toFixed(3)})`;
  shade.style.opacity = (0.3 + 0.7 * near ** 1.5).toFixed(2);
}

export function castShadows(tank) {
  const layer = document.createElement("div");
  layer.className = "shades";
  tank.append(layer);
  let casters = [];
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const place = () => {
    const box = tank.getBoundingClientRect();
    const floorY = box.height - FLOOR_PX;
    casters.forEach(({ el, shade }) => placeOne(shade, el.getBoundingClientRect(), box, floorY));
  };
  const loop = () => {
    place();
    requestAnimationFrame(loop);
  };
  const refresh = () => {
    casters = [...tank.querySelectorAll(CASTERS)].map((el) => ({ el, shade: document.createElement("i") }));
    layer.replaceChildren(...casters.map(({ shade }) => shade));
    place();
  };

  refresh();
  if (still) window.addEventListener("resize", place);
  else requestAnimationFrame(loop);
  return { refresh };
}
