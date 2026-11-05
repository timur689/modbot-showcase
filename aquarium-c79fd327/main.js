// Builds the waiting screen's aquarium in 3D: the world behind the glass (bottom, decorations, garden, the small
// folk and the fish), the lamp's light over it, and the visitor's own settings for the light and the ground.
// Returns where the clownfish is on the page, for the cat to watch.

import { releaseCritters } from "./critters.js";
import { placeDecor } from "./decor.js";
import { installEquipment } from "./equipment.js";
import { releaseFish } from "./fish.js";
import { layBottom } from "./ground.js";
import { growFloaters, growPlants } from "./plants.js";
import { setUpTuning } from "./tune.js";
import { lightShafts, waterSurface } from "./water.js";
import { createWorld } from "./world.js";

// In front of the world: the substrate's side against the glass, the air above the water with drops on the glass,
// the lamp's tint and glow, darker corners, the waterline, the front pane and the glass edges with their seams.
const OVERLAY = `<div class="substrate"></div><div class="air"></div><div class="wash"></div><div class="lampglow"></div>
<div class="vignette"></div><div class="surface"></div><div class="glass"></div><div class="edges"></div>`;

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
  installEquipment(world);
  waterSurface(world);
  lightShafts(world);
  garden = growPlants(world);
  growFloaters(world);
  releaseCritters(world);
  const clown = releaseFish(world);
  world.mood(tuning.light(), true);
  world.start();
  return { clownOnScreen: () => world.toScreen(clown.position) };
}
