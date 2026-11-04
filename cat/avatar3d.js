// The guide in motion: the body (cat_body.js) strolls along the bottom of the panel: walks and skips, blinks,
// breathes, follows the finger, does little things on its own, plays around, leaps, reacts to what happens in the
// app and dances. It squashes when it lands and stretches when it jumps, its head bobs, its eyes narrow happily and
// its ears wiggle; its soft parts follow on springs.
import * as THREE from "./vendor/three.module.min.js";
import { buildAvatar } from "./cat_body.js";
import { dressUp } from "./costumes3d.js";
import { ACTIONS, DANCES, LEAP, PLAYS, REACTIONS, SWING, blend, entrance, layer, stride } from "./character_moves.js";

const WIDTH = 240, HEIGHT = 300; // css px of the canvas; the page scales the whole guide down
const ACTION_EVERY = [7, 12];
const BLINK_EVERY = [2.4, 5.2];
const STEPS_PER_SECOND = 3; // one stride is two steps; the panel moves the guide at a matching speed
const FACE_WALK = 1.05; // walking, it turns this far to the side, so its face still shows
const WALK_EASE = 4; // how fast it starts and stops walking, per second
const STRETCH = 0.06; // squash and stretch per unit of vertical speed
const MAX_STRETCH = 0.12;
const DOUBLE_BLINK = 0.25; // how often a blink comes twice
const CONTACT_SHADOW = 0.32; // the blot under its feet, standing on the ground
const FLOOR_SHADOW = 0.16; // the shadow its whole body casts from the light above

// ---- motion ----

// A soft dark blot on the ground right under the feet. It follows the cat and, the higher the cat is (hopping in
// place, or carried through the air by the panel), the smaller and fainter it gets.
function contactShadow() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const paint = canvas.getContext("2d");
  const fade = paint.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  fade.addColorStop(0, "rgba(40, 44, 52, 1)");
  fade.addColorStop(1, "rgba(40, 44, 52, 0)");
  paint.fillStyle = fade;
  paint.fillRect(0, 0, size, size);
  const blot = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.8), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, opacity: CONTACT_SHADOW,
  }));
  blot.rotation.x = -Math.PI / 2;
  blot.position.y = 0.002;
  return blot;
}

function placeShadows(contact, floor, root, air) {
  const lift = Math.max(0, root.position.y) * 2.2 + air * 2.5, near = 1 / (1 + lift);
  contact.position.x = root.position.x;
  contact.scale.setScalar(0.55 + 0.45 * near);
  contact.material.opacity = CONTACT_SHADOW * near * near;
  floor.material.opacity = FLOOR_SHADOW * (1 - Math.min(1, air * 1.5));
}

// Small springs: the soft parts lag behind the body and swing back.
function spring(state, drive, dt) {
  state.v += (-60 * state.a - 5 * state.v + drive) * dt;
  state.a += state.v * dt;
  return state.a;
}

function apply(figure, pose, t, look, swing) {
  figure.root.position.set(pose.x, pose.y, 0);
  figure.root.rotation.y = pose.yaw + look.yaw * 0.25;
  figure.root.scale.setScalar(pose.scale);
  figure.torso.position.x = pose.sway;
  figure.torso.rotation.set(pose.lean, 0, pose.roll + Math.sin(t * 1.2) * 0.01);
  figure.torso.scale.set(1 + Math.sin(t * 1.9) * 0.006, 1 + Math.sin(t * 1.9) * 0.012, 1);
  // the head lags behind jumps and landings on a spring, so it nods with them
  figure.head.rotation.set(pose.headPitch + look.pitch + swing.head * 0.3, pose.headYaw + look.yaw * 0.75, pose.headRoll + Math.sin(t * 0.8) * 0.02);
  figure.ears.forEach((ear, i) => { ear.rotation.z = (i ? 1 : -1) * pose.earFlap * Math.sin(t * 22 + i) * 0.28; });
  const [armL, armR] = figure.arms;
  armL.rotation.set(pose.armFwdL, 0, -pose.armL - Math.sin(t * 1.9) * 0.015);
  armR.rotation.set(pose.armFwdR, 0, pose.armR + Math.sin(t * 1.9) * 0.015);
  const [legL, legR] = figure.legs;
  legL.rotation.x = pose.legL;
  legR.rotation.x = pose.legR;
  figure.dress(pose, swing, t); // the body's soft parts: for the cat, its tail, ears and belly
  figure.eyes.forEach((group) => { // the shine slides a little the way it looks, so the eyes look alive
    const [big, small] = group.userData.shines, [restBig, restSmall] = group.userData.rest;
    big.position.set(restBig.x + look.x * 0.012, restBig.y - look.y * 0.01, restBig.z);
    small.position.set(restSmall.x + look.x * 0.01, restSmall.y - look.y * 0.008, restSmall.z);
  });
}

export function createAvatar(container) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(WIDTH, HEIGHT, false);
  renderer.domElement.style.width = `${WIDTH}px`;
  renderer.domElement.style.height = `${HEIGHT}px`;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfffaf3, 0x9a958d, 1.05));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(1.0, 6.5, 2.0); // high above: the cast shadow falls short, under the cat, not off the canvas
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 2.8, bottom: -0.5 });
  key.shadow.radius = 5;
  key.shadow.bias = -0.0004;
  const fill = new THREE.DirectionalLight(0xe3ecff, 0.65);
  fill.position.set(-3, 2, 2);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  rim.position.set(0, 3, -3);
  scene.add(key, fill, rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: FLOOR_SHADOW }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const contact = contactShadow();
  scene.add(floor, contact);

  const camera = new THREE.PerspectiveCamera(26, WIDTH / HEIGHT, 0.1, 40);
  camera.position.set(0, 1.4, 6.5);
  camera.lookAt(0, 1.24, 0);
  const figure = buildAvatar();
  let takeOff = () => {}; // removes the costume it wears
  scene.add(figure.root);

  const look = { x: 0, y: 0, at: -10, yaw: 0, pitch: 0 };
  const swing = {
    sides: [0, 0], sway: [0, 0], bounce: 0, head: 0,
    springs: Array.from({ length: 6 }, () => ({ a: 0, v: 0 })), lastY: 0, lastRoll: 0, lastYaw: 0,
  };
  const state = { move: null, kind: null, nextDance: 0, lastPlay: -1, nextAction: ACTION_EVERY[0], blinkAt: 2, running: false, last: 0, air: 0 };
  const walk = { target: 0, weight: 0, facing: 0, phase: 0, bounce: 0, skip: 0, pace: 1, speed: 1 }; // target: -1 walks left, 1 right, 0 stands
  const clock = new THREE.Clock();

  function play(move, kind) {
    state.move = { ...move, start: clock.getElapsedTime() };
    state.kind = kind;
    resume();
  }

  function maybeAct(t) {
    if (state.move || t < state.nextAction || reduced || walk.weight > 0.1) return;
    const move = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    play(move, "action");
    state.nextAction = t + move.seconds + ACTION_EVERY[0] + Math.random() * (ACTION_EVERY[1] - ACTION_EVERY[0]);
  }

  // Blinks now and then, sometimes twice in a row; happy moves narrow the eyes.
  function blink(t, squint) {
    let closed = 0;
    if (t >= state.blinkAt) {
      const p = (t - state.blinkAt) / 0.16;
      if (p < 1) closed = Math.sin(p * Math.PI);
      else if (Math.random() < DOUBLE_BLINK) state.blinkAt = t + 0.12;
      else state.blinkAt = t + BLINK_EVERY[0] + Math.random() * (BLINK_EVERY[1] - BLINK_EVERY[0]);
    }
    figure.eyes.forEach((group) => { group.scale.y = (1 - closed * 0.9) * (1 - squint * 0.55); });
  }

  // Squash and stretch: taller while it flies up, flatter as it lands.
  function stretch(scale, dt) {
    const vy = (figure.root.position.y - swing.lastY) / Math.max(dt, 0.001);
    const s = Math.max(-MAX_STRETCH, Math.min(MAX_STRETCH, vy * STRETCH));
    figure.root.scale.set(scale * (1 - s / 2), scale * (1 + s), scale * (1 - s / 2));
  }

  // Springs: two that lean with the sides, two that sway, one that bounces, and the head's nod.
  function physics(t, dt) {
    const y = figure.root.position.y, roll = figure.torso.rotation.z + figure.head.rotation.z, yaw = figure.root.rotation.y;
    const step = Math.max(dt, 0.001);
    const lift = (y - swing.lastY) / step, tilt = (roll - swing.lastRoll) / step, turn = (yaw - swing.lastYaw) / step;
    Object.assign(swing, { lastY: y, lastRoll: roll, lastYaw: yaw });
    const drives = [
      ...[0, 1].map((i) => -tilt * 6 + lift * 2.5 * (i ? 1 : -1) + Math.sin(t * 2 + i) * 0.4),
      ...[2, 3].map((i) => -tilt * 4 + lift * 4 * (i % 2 ? 1 : -1) + Math.sin(t * 2 + i) * 0.4),
      lift * 3 + Math.abs(turn) * 0.3,
      -lift * 2.5,
    ];
    const values = swing.springs.map((s, i) => Math.max(-0.9, Math.min(0.9, spring(s, drives[i], Math.min(dt, 0.05)))));
    Object.assign(swing, { sides: values.slice(0, 2), sway: values.slice(2, 4), bounce: values[4], head: values[5] });
  }

  function stepWalk(dt) {
    const k = Math.min(1, dt * WALK_EASE);
    walk.weight += (Math.abs(walk.target) - walk.weight) * k;
    walk.facing += (walk.target * FACE_WALK - walk.facing) * k;
    walk.skip += (walk.bounce - walk.skip) * k;
    walk.speed += (walk.pace - walk.speed) * k;
    walk.phase += dt * Math.PI * STEPS_PER_SECOND * walk.weight * (1 + walk.skip * 0.25) * walk.speed;
  }

  function frame() {
    if (!renderer.domElement.isConnected) { state.running = false; return; }
    const t = clock.getElapsedTime(), dt = t - state.last;
    state.last = t;
    if (state.move && t - state.move.start >= state.move.seconds) state.move = null;
    maybeAct(t);
    const idle = t - look.at > 4;
    const targetX = idle ? Math.sin(t * 0.35) * 0.3 : look.x, targetY = idle ? Math.sin(t * 0.27) * 0.15 : look.y;
    look.yaw += (targetX * 0.7 - look.yaw) * 0.08;
    look.pitch += (targetY * 0.3 - look.pitch) * 0.08;
    look.x += (targetX - look.x) * 0.1;
    look.y += (targetY - look.y) * 0.1;
    const dancing = state.kind === "dance";
    stepWalk(dt);
    const moved = stride(layer(blend(state.move, t), entrance(t)), walk.phase, walk.weight, walk.skip);
    // walking sideways, it still turns its head a little towards the owner
    const rush = (walk.speed - 1) * walk.weight; // running: leans into it, ears flat back with the wind
    const pose = {
      ...moved, yaw: moved.yaw + walk.facing, headYaw: moved.headYaw - walk.facing * 0.35,
      lean: moved.lean + rush * 0.08, earFlap: Math.max(moved.earFlap, Math.min(1, rush * 0.4)),
    };
    apply(figure, pose, t, dancing ? { yaw: 0, pitch: 0, x: 0, y: 0 } : look, swing);
    stretch(pose.scale, dt);
    placeShadows(contact, floor, figure.root, state.air);
    physics(t, dt);
    blink(t, pose.squint);
    renderer.render(scene, camera);
    if (reduced && !state.move && t > 1.4) { state.running = false; return; }
    requestAnimationFrame(frame);
  }

  function resume() {
    if (state.running) return;
    state.running = true;
    state.last = clock.getElapsedTime();
    requestAnimationFrame(frame);
  }

  resume();
  return {
    resume,
    look(x, y) { look.at = clock.getElapsedTime(); look.x = x; look.y = y; },
    // Walks on the spot, facing left (-1) or right (1); 0 stops and turns back to the owner. The panel moves it.
    // bounce 1 skips along happily instead of walking.
    // pace above 1 runs: quicker steps and a lean into the run.
    walk(direction, bounce = 0, pace = 1) {
      Object.assign(walk, { target: Math.sign(direction), bounce, pace: direction ? pace : 1 });
      resume();
    },
    // Plays around a little (never the same thing twice running); tells how long it takes.
    frolic() {
      const pick = (state.lastPlay + 1 + Math.floor(Math.random() * (PLAYS.length - 1))) % PLAYS.length;
      state.lastPlay = pick;
      play(PLAYS[pick], "play");
      return PLAYS[pick].seconds;
    },
    // Leaps (the panel carries it along the arc); tells how long the leap takes.
    leap() { play(LEAP, "leap"); return LEAP.seconds; },
    // Swings on a web (the panel carries it); tells how long the swing takes.
    swing() { walk.target = 0; play(SWING, "leap"); return SWING.seconds; },
    // Puts on a costume (costumes3d.js) instead of the one it wears; "none" takes it off.
    wear(costume) {
      takeOff();
      takeOff = dressUp(figure, costume);
      resume();
    },
    // How high the panel is carrying it through the air, 0 on the ground to 1 at the top of a leap: its shadow fades.
    air(level) { state.air = Math.max(0, Math.min(1, level)); },
    // A tap: the next dance; tells its name and length.
    dance() {
      const move = DANCES[state.nextDance];
      state.nextDance = (state.nextDance + 1) % DANCES.length;
      play(move, "dance");
      return { name: move.name, seconds: move.seconds };
    },
    // Something happened in the app: greet a new page, cheer a success, shake its head at an error.
    react(kind) {
      if (state.move && (state.kind === "dance" || state.kind === "leap")) return;
      if (REACTIONS[kind]) play(REACTIONS[kind], "reaction");
    },
  };
}
