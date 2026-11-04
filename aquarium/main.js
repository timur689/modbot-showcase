// Builds the waiting screen's aquarium: the fixed inhabitants, the grown garden and bottom, the lamp's shadows,
// and the visitor's own settings for the light and the ground.

import { growBottom, pave } from "./bottom.js";
import { tankMarkup } from "./objects.js";
import { growFloaters, growPlants } from "./plants.js";
import { castShadows } from "./shadows.js";
import { setUpTuning } from "./tune.js";

function plant(tank) {
  growBottom(tank);
  growPlants(tank);
  growFloaters(tank);
}

export function buildAquarium(scene, panel) {
  const tank = scene.querySelector(".tank");
  tank.innerHTML = tankMarkup(); // fixed markup from objects.js, nothing from outside
  const sand = tank.querySelector(".sand");
  let shadows = null;
  const tuning = setUpTuning(scene, panel, {
    onGround: (ground) => pave(sand, ground),
    onReshuffle: () => {
      tank.querySelectorAll(":scope > .grown").forEach((node) => node.remove());
      plant(tank);
      if (shadows) shadows.refresh();
    },
  });
  pave(sand, tuning.ground());
  plant(tank);
  shadows = castShadows(tank);
}
