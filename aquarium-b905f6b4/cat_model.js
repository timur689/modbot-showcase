// The cat on the aquarium, after the owner's reference figurine: a white cat of angular forms, a pointed muzzle,
// angular cheeks and tall pyramid ears, its big hip a ball of its own; all of it, ears and tail too, under a long,
// thick coat lit softly, so no facet shows. It lies on a ledge: the hind leg folded along its side, the
// head resting on one front paw while the other hangs over the edge, the tail raised behind. Eyes behind lids
// (green-gold, slit pupils), a small pink nose, whiskers.
// The fur is made of shells: thin copies of the skin lifted along each facet, each keeping fewer hairs, darker at
// the roots, a little heavier at the tips. Units: the cat is about 1.2 long; it lies on y = 0, its front towards +z, its head to the right.

import { THREE, color, curve, merge, mix, noise, painted, smoothNormals, tube } from "./kit.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SHELLS = 14;
const FUR = Object.freeze({ white: "#f4f1ec", shade: "#ddd8d0", nose: "#e79aa4", ear: "#f0b3b9" });

// ---- fur ----

function furPatch(shader, shell, length, density) {
  shader.uniforms.uShell = { value: shell };
  shader.uniforms.uLength = { value: length };
  shader.uniforms.uDensity = { value: density };
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nuniform float uShell; uniform float uLength; varying vec3 vBase;")
    .replace("#include <begin_vertex>", `#include <begin_vertex>
      vBase = position;
      transformed += normalize(objectNormal) * uShell * uLength;
      transformed.y -= uShell * uShell * uLength * 0.3;`);
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>
      uniform float uShell; uniform float uDensity; varying vec3 vBase;
      float furHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }`)
    .replace("#include <map_fragment>", `#include <map_fragment>
      if (uShell > 0.0 && furHash(floor(vBase * uDensity)) < uShell * 0.9) discard;
      diffuseColor.rgb *= mix(0.72, 1.04, uShell);`);
}

// The skin and its shells of fur, all sharing one geometry (so a moving tail moves its fur too), lit softly.
export function furry(geometry, { length = 0.018, density = 240 } = {}) {
  const group = new THREE.Group();
  for (let k = 0; k <= SHELLS; k += 1) {
    const shell = k / SHELLS;
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, envMapIntensity: 0.4 });
    material.onBeforeCompile = (shader) => furPatch(shader, shell, length, density);
    material.customProgramCacheKey = () => "fur";
    const layer = new THREE.Mesh(geometry, material);
    layer.castShadow = k === 0;
    layer.renderOrder = k;
    group.add(layer);
  }
  return group;
}

// ---- facets ----

// Soft: the normals of neighbouring facets averaged, so light (and fur) flows over the edges.
const soft = (geometry) => smoothNormals(geometry.index ? geometry.toNonIndexed() : geometry);

// White, a little creamier in places, the underside a little shaded.
function coat(geometry) {
  const { position } = geometry.attributes;
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const c = mix(color(FUR.white), color(FUR.shade), 0.1 + noise(x * 9, y * 9, z * 9) * 0.12 + Math.max(0, 0.07 - y) * 3);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

// An angular lump: a coarse icosphere, a little irregular, stretched to `scale` and set at `at`.
function gem(scale, at, detail = 1, seed = 0) {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const { position } = geometry.attributes;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const bump = 1 + noise(x * 2.3 + seed, y * 2.3, z * 2.3 - seed) * 0.12;
    position.setXYZ(i, x * bump * scale[0] + at[0], y * bump * scale[1] + at[1], z * bump * scale[2] + at[2]);
  }
  return geometry;
}

// A limb or tail: a tube of few sides and few joints.
const prism = (points, radius, sides = 6) => tube(points, radius, sides);

// A pyramid pointing along +y (ears, the nose).
function pyramid(base, height, sides = 4) {
  const geometry = new THREE.ConeGeometry(base, height, sides, 1);
  geometry.translate(0, height / 2, 0);
  return geometry;
}

// Lying down, the underside flattens against the ledge.
function flatten(geometry, floor = 0.05) {
  const { position } = geometry.attributes;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    if (y < floor) position.setY(i, floor - (floor - y) * 0.2);
  }
  return geometry;
}

// ---- the body, lying on a ledge: rump and tail to the left, head to the right on its far paw, the hind leg
// folded along the side, the near front leg reaching over the ledge's edge ----

export const LEDGE = 0.34; // the ledge's front edge, from the middle of the cat
export const ELBOW = Object.freeze(V(0.27, 0.035, LEDGE)); // where the near front leg bends down over the edge

export function body() {
  const parts = [
    gem([0.37, 0.165, 0.19], [-0.03, 0.155, 0.0], 0, 1),     // the long back, a few broad planes
    gem([0.19, 0.15, 0.145], [-0.25, 0.14, 0.1], 0, 2),      // the big hip, a facet ball of its own
    gem([0.1, 0.045, 0.06], [-0.1, 0.045, 0.19], 0, 3),      // the hind paw, tucked forward
    gem([0.15, 0.14, 0.15], [0.24, 0.14, 0.07], 0, 4),       // the chest and shoulder
    prism(curve(V(0.3, 0.08, 0.0), V(0.45, 0.05, 0.03), V(0.56, 0.048, 0.06), 4), (s) => 0.058 - s * 0.012),
    gem([0.075, 0.042, 0.065], [0.59, 0.043, 0.065], 0, 5),  // the far front paw, the head lies on it
    prism(curve(V(0.24, 0.09, 0.14), V(0.255, 0.055, 0.26), ELBOW.clone(), 4), (s) => 0.058 - s * 0.012),
  ];
  return coat(soft(flatten(merge(parts))));
}

// The near forearm hanging over the edge, from the elbow (its pivot) down to its paw.
export function forearm() {
  const limb = prism(curve(V(0, 0, 0), V(0.005, -0.09, 0.03), V(0.01, -0.165, 0.04), 4), (s) => 0.054 - s * 0.012);
  return coat(soft(merge([limb, gem([0.064, 0.07, 0.06], [0.013, -0.21, 0.052], 0, 6)])));
}

// ---- the head (built facing +z, centred at its own origin): sharp, angular ----

// The texture wraps the whole eyeball (u round it, v top to bottom): the iris is the patch facing forward.
const iris = () => painted(256, 128, (ctx, w, h) => {
  ctx.fillStyle = "#24331b";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w * 2); // a circle on the eyeball is twice as tall in v as in u
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.16);
  grad.addColorStop(0, "#e2c84e");
  grad.addColorStop(0.5, "#a9c24c");
  grad.addColorStop(0.92, "#557f36");
  grad.addColorStop(1, "#24331b");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b0b0c";
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.012, w * 0.11, 0, 0, Math.PI * 2); // the slit pupil
  ctx.fill();
  ctx.restore();
});

// An eye set into the head: the eyeball, a lid that rolls up to open it, and the seam of the closed lids, a thin
// line curving gently down, which shows only while the eye is shut.
function eye(side, irisMap) {
  const group = new THREE.Group();
  group.position.set(side * 0.05, 0.014, 0.084);
  group.rotation.set(0, side * 0.36, side * -0.26);
  group.scale.set(1.25, 0.7, 0.7); // narrow, slanted
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.026, 24, 16), new THREE.MeshStandardMaterial({ map: irisMap, roughness: 0.05, envMapIntensity: 1.2 }));
  ball.rotation.y = -Math.PI / 2; // the sphere's texture centre looks forward
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0295, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: FUR.white, roughness: 0.95 }));
  const arc = Array.from({ length: 12 }, (_, k) => {
    const a = Math.PI * (0.12 + (k / 11) * 0.76);
    return V(-Math.cos(a) * 0.031, -Math.sin(a) * 0.006, Math.sin(a) * 0.031);
  });
  const seam = new THREE.Mesh(tube(arc, () => 0.0026, 4), new THREE.MeshStandardMaterial({ color: "#6a5e5a", roughness: 0.6 }));
  group.add(ball, lid, seam);
  return { group, lid, seam };
}

// Tall, sharp pyramid ears, pink inside.
function ear(side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.07, 0.07, -0.012);
  pivot.rotation.set(-0.12, side * -0.3, side * -0.3);
  const outer = furry(coat(soft(pyramid(0.065, 0.15, 4))), { length: 0.008, density: 300 }); // furry outside too
  outer.scale.z = 0.5;
  outer.rotation.y = Math.PI / 4;
  const inner = new THREE.Mesh(soft(pyramid(0.045, 0.115, 4)), new THREE.MeshStandardMaterial({ color: FUR.ear, roughness: 0.7 }));
  inner.scale.z = 0.3;
  inner.rotation.y = Math.PI / 4;
  inner.position.set(0, 0.008, 0.016);
  pivot.add(outer, inner);
  return pivot;
}

function whiskers() {
  const lines = [];
  [-1, 1].forEach((side) => {
    [-0.015, 0, 0.015].forEach((drop, k) => {
      lines.push(side * 0.03, -0.04 + drop * 0.3, 0.158, side * (0.2 + k * 0.02), -0.055 + drop * 2.5, 0.12 - k * 0.01);
    });
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.7 }));
}

export function head() {
  const group = new THREE.Group();
  const snout = pyramid(0.062, 0.1, 5); // the pointed muzzle, a five-sided wedge forward
  snout.rotateX(Math.PI / 2);
  snout.scale(1, 0.72, 1);
  snout.translate(0, -0.035, 0.075);
  const skull = coat(soft(merge([
    gem([0.125, 0.105, 0.115], [0, 0, 0], 1, 7),                // the skull, cut in broad facets
    gem([0.072, 0.058, 0.062], [-0.062, -0.035, 0.05], 0, 8),  // sharp cheekbones
    gem([0.072, 0.058, 0.062], [0.062, -0.035, 0.05], 0, 9),
    snout,
    gem([0.034, 0.026, 0.03], [0, -0.068, 0.085], 0, 10),      // the chin
  ])));
  group.add(furry(skull, { length: 0.011, density: 300 }));
  const irisMap = iris();
  const eyes = [eye(-1, irisMap), eye(1, irisMap)];
  const ears = [ear(-1), ear(1)];
  const nose = new THREE.Mesh(soft(pyramid(0.016, 0.018, 3)), new THREE.MeshStandardMaterial({ color: FUR.nose, roughness: 0.4 }));
  nose.rotation.x = Math.PI; // a little triangle pointing down
  nose.position.set(0, -0.012, 0.172);
  const mouth = new THREE.Group(); // only seen in a yawn: dark inside, a pink tongue
  mouth.position.set(0, -0.06, 0.13);
  const inside = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshStandardMaterial({ color: "#5a2a2e", roughness: 0.8, flatShading: true }));
  inside.scale.set(1, 1, 0.5);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: "#e88b95", roughness: 0.5, flatShading: true }));
  tongue.scale.set(1, 0.4, 1);
  tongue.position.set(0, -0.015, 0.01);
  mouth.add(inside, tongue);
  mouth.scale.set(1, 0.001, 1);
  group.add(...eyes.map((e) => e.group), ...ears, nose, mouth, whiskers());
  return { group, eyes, ears, mouth };
}

// ---- the tail: a thick furry band, its shape redrawn every frame from `points` ----

const TAIL_SIDES = 10;
const tailRadius = (s) => 0.048 - s * 0.014;

export function tail(points) {
  const geometry = coat(soft(prism(points, tailRadius, TAIL_SIDES)));
  const reshape = (next) => {
    const fresh = soft(prism(next, tailRadius, TAIL_SIDES));
    geometry.attributes.position.array.set(fresh.attributes.position.array);
    geometry.attributes.normal.array.set(fresh.attributes.normal.array);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    geometry.computeBoundingSphere();
    fresh.dispose();
  };
  return { mesh: furry(geometry, { length: 0.02, density: 220 }), reshape };
}
