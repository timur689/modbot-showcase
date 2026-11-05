// The bot in 3D: a soft white robot with a glossy black face, standing on a ribbed pedestal.
// It breathes, blinks, looks where the finger is, waves now and then and hops with a spin when tapped.
import * as THREE from "./vendor/three.module.min.js";

const HEIGHT = 330;
const BODY = { w: 1.6, h: 1.46, d: 1.28, r: 0.44, y: 1.0 };
const HOP_SECONDS = 0.95;
const HOP_HEIGHT = 0.45; // keeps the ears inside the picture at the top of the jump
const WAVE_EVERY = 7.5;
const BLINK_MIN = 2.6, BLINK_SPREAD = 2.8;

// A box whose edges and corners are rounded with radius r: every vertex of a finely split box is pulled
// onto the surface of the inner box grown by r, and its normal points straight out of that inner box.
export function roundedBox(w, h, d, r, segments = 8) {
  const geometry = new THREE.BoxGeometry(w, h, d, segments * 2, segments * 2, segments * 2);
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const inner = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  const v = new THREE.Vector3(), core = new THREE.Vector3(), out = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i);
    core.set(THREE.MathUtils.clamp(v.x, -inner.x, inner.x), THREE.MathUtils.clamp(v.y, -inner.y, inner.y), THREE.MathUtils.clamp(v.z, -inner.z, inner.z));
    out.subVectors(v, core).normalize();
    position.setXYZ(i, core.x + out.x * r, core.y + out.y * r, core.z + out.z * r);
    normal.setXYZ(i, out.x, out.y, out.z);
  }
  return geometry;
}

// A flat rounded rectangle with softly bevelled edges, lying in the XY plane and centred on the origin.
// Used where one radius must be big (the corners) and the other small (the edges): the face, the button, the seam.
function roundedPlate(width, height, depth, radius, bevel) {
  const w = width - 2 * bevel, h = height - 2 * bevel, r = Math.min(radius, w / 2, h / 2);
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0);
  shape.lineTo(w / 2, h / 2 - r);
  shape.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: 32,
  });
  geometry.center();
  return geometry;
}

// The pedestal's side, with fine vertical ribs.
function ribbedCylinder(radius, height, ribs) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, ribs * 4, 1, true);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i), z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const r = radius + 0.016 * Math.abs(Math.cos(angle * ribs));
    position.setX(i, Math.cos(angle) * r);
    position.setZ(i, Math.sin(angle) * r);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function materials() {
  return {
    shell: new THREE.MeshStandardMaterial({ color: 0xf4f3f0, roughness: 0.55, metalness: 0 }), // the panel's own warm white
    seam: new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: 0.6 }),
    screen: new THREE.MeshPhysicalMaterial({ color: 0x0a0b0e, roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06 }),
    eye: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.3 }),
    glint: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.25, metalness: 0.9 }),
    button: new THREE.MeshStandardMaterial({ color: 0xd4d7dc, roughness: 0.4 }),
    pedestal: new THREE.MeshStandardMaterial({ color: 0xefeeeb, roughness: 0.7 }),
  };
}

function ear(m, side) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.1, 40), m.shell);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.07, 40), m.metal);
  ring.position.y = 0.085;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.32, 40), m.shell);
  cap.position.y = 0.28;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.03, 40), m.seam);
  top.position.y = 0.45;
  group.add(base, ring, cap, top);
  group.position.set(side * 0.46, BODY.y + BODY.h / 2 - 0.06, -0.05);
  group.rotation.z = -side * 0.55;
  group.userData.rest = group.rotation.z;
  return group;
}

function arm(m, side) {
  const pivot = new THREE.Group(); // the shoulder
  const flipper = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.26, 8, 20), m.shell);
  flipper.scale.set(1, 1, 0.62);
  flipper.position.y = -0.2;
  pivot.add(flipper);
  pivot.position.set(side * (BODY.w / 2 - 0.02), BODY.y - 0.12, 0.08);
  pivot.rotation.z = side * 0.5;
  pivot.userData.rest = pivot.rotation.z;
  return pivot;
}

function buildRobot(m) {
  const robot = new THREE.Group();
  const body = new THREE.Mesh(roundedBox(BODY.w, BODY.h, BODY.d, BODY.r), m.shell);
  body.position.y = BODY.y;
  const seam = new THREE.Mesh(roundedPlate(BODY.w + 0.014, BODY.d + 0.014, 0.016, BODY.r, 0), m.seam);
  seam.rotation.x = Math.PI / 2; // a thin line all around the shell, where its two halves meet
  seam.position.y = BODY.y + 0.02;
  for (const side of [-1, 1]) {  // two feet with a little arch between them
    const foot = new THREE.Mesh(roundedBox(0.62, 0.3, 1.02, 0.13, 4), m.shell);
    foot.position.set(side * 0.43, 0.15, 0.02);
    robot.add(foot);
  }
  const screen = new THREE.Mesh(roundedPlate(1.14, 0.92, 0.2, 0.3, 0.014), m.screen);
  screen.position.set(0, BODY.y + 0.14, BODY.d / 2 - 0.04); // its back sinks into the shell, its face stands proud
  const eyes = new THREE.Group();
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.15, 6, 16), m.eye);
    eye.position.x = side * 0.17;
    eye.scale.z = 0.35;
    eyes.add(eye);
  }
  eyes.position.set(0, BODY.y + 0.06, BODY.d / 2 + 0.085);
  const glint = new THREE.Mesh(new THREE.CircleGeometry(1, 32), m.glint);
  glint.scale.set(0.09, 0.035, 1);
  glint.rotation.z = 0.35;
  glint.position.set(-0.33, BODY.y + 0.44, BODY.d / 2 + 0.083);
  const button = new THREE.Mesh(roundedPlate(0.34, 0.1, 0.03, 0.05, 0.015), m.button);
  button.position.set(0, BODY.y - 0.47, BODY.d / 2 - 0.02);
  const ears = [ear(m, -1), ear(m, 1)];
  const arms = [arm(m, -1), arm(m, 1)];
  robot.add(body, seam, screen, eyes, glint, button, ...ears, ...arms);
  robot.traverse((part) => { if (part.isMesh) { part.castShadow = true; part.receiveShadow = true; } });
  glint.castShadow = false;
  return { robot, eyes, ears, arms };
}

function buildPedestal(m) {
  const pedestal = new THREE.Group();
  const side = new THREE.Mesh(ribbedCylinder(1.3, 1.1, 64), m.pedestal);
  side.position.y = -0.62;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.36, 0.12, 96), m.pedestal);
  top.position.y = -0.06;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.012, 8, 96), m.seam);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.12;
  pedestal.add(side, top, rim);
  pedestal.traverse((part) => { if (part.isMesh) part.receiveShadow = true; });
  return pedestal;
}

function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xfffdf8, 0x9e9a91, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.7);
  key.position.set(2.2, 5.5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -2; key.shadow.camera.right = 2; key.shadow.camera.top = 3; key.shadow.camera.bottom = -1;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.7);
  fill.position.set(-4, 2, 2);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(0, 3, -4);
  scene.add(key, fill, rim);
}

// The ribbed white pedestal and the studio lights, shared with the character on the home screen.
export function makePedestal() {
  return buildPedestal(materials());
}

export function studioLights(scene) {
  lights(scene);
}

export const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

export function createRobot(container) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 2.0, 7.0);
  camera.lookAt(0, 0.85, 0);
  lights(scene);
  const m = materials();
  const { robot, eyes, ears, arms } = buildRobot(m);
  const pedestal = buildPedestal(m);
  scene.add(robot, pedestal);

  const look = { x: 0, y: 0, at: -10 }; // where the finger is, -1..1, and when it last moved
  const motion = { hop: -1, blink: 0, nextBlink: 2, yaw: 0, pitch: 0 };
  const clock = new THREE.Clock();
  let running = false;

  function resize() {
    const width = container.clientWidth;
    if (!width) return; // off screen for now; the observer fires again when it is back
    renderer.setSize(width, HEIGHT, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = `${HEIGHT}px`;
    camera.aspect = width / HEIGHT;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  function blink(t) {
    if (t > motion.nextBlink) { motion.blink = t; motion.nextBlink = t + BLINK_MIN + Math.random() * BLINK_SPREAD; }
    const p = (t - motion.blink) / 0.16;
    const open = p >= 0 && p <= 1 ? Math.abs(1 - 2 * p) : 1;
    eyes.scale.y = 0.12 + 0.88 * open;
  }

  function hop(t) {
    if (motion.hop < 0) return { lift: 0, spin: 0, squash: 0 };
    const p = (t - motion.hop) / HOP_SECONDS;
    if (p >= 1) { motion.hop = -1; return { lift: 0, spin: 0, squash: 0 }; }
    const air = Math.max(0, Math.min(1, (p - 0.12) / 0.76));
    return {
      lift: Math.sin(Math.PI * air) * HOP_HEIGHT,
      spin: easeInOut(air) * Math.PI * 2,
      squash: p < 0.12 ? Math.sin((p / 0.12) * Math.PI) * 0.12 : p > 0.88 ? Math.sin(((p - 0.88) / 0.12) * Math.PI) * 0.1 : 0,
    };
  }

  function frame() {
    if (!renderer.domElement.isConnected) { running = false; return; }
    const t = clock.getElapsedTime();
    const idle = t - look.at > 3; // nobody pointing: look around on its own
    const targetYaw = idle ? Math.sin(t * 0.45) * 0.4 : look.x * 0.7;
    const targetPitch = idle ? Math.sin(t * 0.33) * 0.05 : look.y * 0.22;
    motion.yaw += (targetYaw - motion.yaw) * 0.07;
    motion.pitch += (targetPitch - motion.pitch) * 0.07;

    const jump = hop(t);
    const breathe = Math.sin(t * 2.1) * 0.012;
    robot.position.y = jump.lift;
    robot.rotation.set(motion.pitch, motion.yaw + jump.spin, Math.sin(t * 1.2) * 0.025);
    robot.scale.set(1 + jump.squash * 0.6, 1 + breathe - jump.squash, 1 + jump.squash * 0.6);
    eyes.position.x = motion.yaw * 0.06;
    blink(t);
    if (motion.hop >= 0) eyes.scale.y = 0.35; // a happy squint in the air

    ears.forEach((part, i) => { part.rotation.z = part.userData.rest + Math.sin(t * 3 + i) * 0.05 + (motion.hop >= 0 ? Math.sin(t * 30) * 0.12 : 0); });
    const waving = t % WAVE_EVERY;
    const [leftArm, rightArm] = arms;
    leftArm.rotation.z = leftArm.userData.rest + Math.sin(t * 2) * 0.06;
    rightArm.rotation.z = waving < 1.6
      ? rightArm.userData.rest + Math.sin((waving / 1.6) * Math.PI) * 1.9 + Math.sin(waving * 14) * 0.25
      : rightArm.userData.rest - Math.sin(t * 2) * 0.06;
    pedestal.rotation.y = t * 0.12;

    renderer.render(scene, camera);
    if (reduced) { running = false; return; }
    requestAnimationFrame(frame);
  }

  function resume() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  resume();
  return {
    resume,
    poke() { motion.hop = clock.getElapsedTime(); resume(); },
    look(x, y) { look.x = x; look.y = y; look.at = clock.getElapsedTime(); },
  };
}
