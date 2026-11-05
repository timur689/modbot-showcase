// Builds the waiting screen's aquarium in 3D: the world behind the glass (bottom, decorations, garden, the small
// folk and the fish), the lamp's light over it, and the visitor's own settings for the light and the ground.
// Returns where the clownfish is on the page, for the cat to watch.

import { releaseCritters } from "./critters.js";
import { placeDecor } from "./decor.js";
import { releaseFish } from "./fish.js";
import { layBottom } from "./ground.js";
import { growFloaters, growPlants } from "./plants.js";
import { setUpTuning } from "./tune.js";
import { createWorld } from "./world.js";

// Light and glass in front of the world: rays from the lamp, its tint and glow, darker corners, the surface, the pane.
const RAYS = [[26, -18, 34, -1], [38, -8, 46, -4], [50, 1, 52, -2], [62, 9, 40, -6], [74, 18, 32, -3]]
  .map(([x, angle, width, delay]) => `<i style="--x:${x}%; --a:${angle}deg; --w:${width}px; --d:${delay}s"></i>`).join("");
const OVERLAY = `<div class="rays">${RAYS}</div><div class="wash"></div><div class="lampglow"></div><div class="vignette"></div><div class="surface"></div><div class="glass"></div>`;

export function buildAquarium(scene, panel) {
  const tank = scene.querySelector(".tank");
  tank.innerHTML = OVERLAY; // fixed markup, nothing from outside
  const world = createWorld(tank);
  let garden = null;
  let bottom = null;
  const tuning = setUpTuning(scene, panel, {
    onLight: (light) => world.mood(light),
    onGround: (ground) => {
      bottom.pave(ground);
      if (world.still) world.render();
    },
    onReshuffle: () => {
      world.scene.remove(garden);
      garden.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) node.material.dispose();
      });
      garden = growPlants(world);
      if (world.still) world.render();
    },
  });
  bottom = layBottom(world, tuning.ground());
  placeDecor(world);
  garden = growPlants(world);
  growFloaters(world);
  releaseCritters(world);
  const clown = releaseFish(world);
  world.mood(tuning.light(), true);
  world.start();
  return { clownOnScreen: () => world.toScreen(clown.position) };
}
