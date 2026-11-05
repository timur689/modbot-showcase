// What a real tank has inside besides its decorations: a glass heater hanging from the rim with its glowing
// element, the filter's intake pipe with a strainer, and the airline tube running from the airstone up out of the water.

import { SURFACE } from "./world.js";
import { THREE, color, curve, floorAt, merge, paint, solid, standard, tube } from "./kit.js";
import { halo } from "./water.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TOP = SURFACE + 0.6; // the equipment hangs from the rim above the water
export const AIRSTONE = Object.freeze({ x: -0.55, z: 0.25 });

const glassy = () => standard({ color: "#e6fbff", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false, envMapIntensity: 2 });
const plastic = (tone) => standard({ color: tone, roughness: 0.45 });

function suckers(x, ys, z, group) {
  ys.forEach((y) => {
    const cup = solid(new THREE.SphereGeometry(0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassy(), { cast: false });
    cup.rotation.x = -Math.PI / 2;
    cup.position.set(x, y, z - 0.12);
    group.add(cup);
  });
}

function heater(world) {
  const group = new THREE.Group();
  const x = -3.95, z = -1.75, bottom = 2.4;
  const shell = solid(new THREE.CapsuleGeometry(0.085, TOP - bottom, 6, 16), glassy(), { cast: false });
  shell.position.set(x, (TOP + bottom) / 2, z);
  const coil = solid(new THREE.CylinderGeometry(0.045, 0.045, (TOP - bottom) * 0.6, 10), standard({ color: "#b0603a", roughness: 0.5, emissive: "#ff5a1e", emissiveIntensity: 0 }));
  coil.position.set(x, bottom + (TOP - bottom) * 0.35, z);
  const cap = solid(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 14), plastic("#1d1f24"));
  cap.position.set(x, TOP, z);
  const glow = halo("#ff6a2a", 0.5);
  glow.position.set(x, bottom + 0.5, z + 0.08);
  group.add(shell, coil, cap, glow);
  suckers(x, [bottom + 0.6, TOP - 0.9], z, group);
  world.add(group);
  world.every((t) => { // the element warms up now and then, glowing faintly
    const warm = Math.max(0, Math.sin(t * 0.25)) ** 3;
    coil.material.emissiveIntensity = warm * 1.2;
    glow.material.opacity = warm * 0.35;
  });
}

function intake(world) {
  const group = new THREE.Group();
  const x = 3.95, z = -1.7, bottom = 1.1;
  const pipe = solid(new THREE.CylinderGeometry(0.06, 0.06, TOP - bottom, 12), plastic("#3a4a46"));
  pipe.position.set(x, (TOP + bottom) / 2, z);
  const slots = [];
  for (let k = 0; k < 9; k += 1) { // the strainer: a wider basket of rings at the pipe's foot
    const ring = new THREE.TorusGeometry(0.1, 0.018, 6, 18);
    ring.rotateX(Math.PI / 2);
    ring.translate(x, bottom - 0.05 - k * 0.065, z);
    slots.push(ring);
  }
  const basket = solid(merge(slots), plastic("#26302e"));
  const end = solid(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 14), plastic("#26302e"));
  end.position.set(x, bottom - 0.62, z);
  group.add(pipe, basket, end);
  suckers(x, [bottom + 0.9, TOP - 1.2], z, group);
  world.add(group);
}

// The airline: from the airstone back along the bottom, then up the back and out over the rim.
function airline(world) {
  const { x, z } = AIRSTONE;
  const floor = floorAt(x, z) + 0.05;
  const path = [
    ...curve(V(x - 0.12, floor, z), V(x - 0.35, floor, z - 0.4), V(x - 0.4, floorAt(x - 0.4, -1.4) + 0.04, -1.4), 10),
    ...curve(V(x - 0.4, floorAt(x - 0.4, -1.5) + 0.06, -1.5), V(x - 0.42, 2.2, -2.3), V(x - 0.42, TOP + 0.3, -2.35), 14),
  ];
  const line = solid(paint(tube(path, () => 0.022, 6), color("#d8ece4")), standard({ vertexColors: true, roughness: 0.3, transparent: true, opacity: 0.75 }), { cast: false });
  world.add(line);
}

export function installEquipment(world) {
  heater(world);
  intake(world);
  airline(world);
}
