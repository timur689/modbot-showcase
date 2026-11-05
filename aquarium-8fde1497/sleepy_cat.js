// The cat asleep on the aquarium's lid (cat_model.js), on its own canvas laid over the top of the tank: curled up,
// chin on its paws, the tail hanging down over the front edge. It breathes, twitches an ear, flicks the tip of its
// tail; now and then it wakes, lifts its head, watches the clownfish, yawns and settles back to sleep. A tap on it:
// it looks at you, blinks slowly and purrs.

import { body, furry, head, tail } from "./cat_model.js";
import { THREE, clamp, rand } from "./kit.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TILT = THREE.MathUtils.degToRad(14); // we look at the lid a little from above
const EDGE = 0.34;                          // the lid's front edge, from the middle of the cat
const ABOVE = 0.66, BELOW = 0.62;           // how much of the world shows above and below that edge
const CAT_SHARE = 0.36;                     // the cat's length (about 1.2) as a share of the lid's width, roughly
const BREATH = 3.8;                         // seconds a breath
const LID_OPEN = 0.55;                      // how far back the lid rolls when the eye is wide open
const NAP = [22, 38];                       // seconds asleep between wakings
const ease = (p) => p * p * (3 - 2 * p);
const window01 = (p, from, to) => clamp((p - from) / (to - from), 0, 1);

function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x5d5c62, 1.15));
  const key = new THREE.DirectionalLight(0xfff3e2, 2.3);
  key.position.set(-1.6, 3.2, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 0.5, far: 8 });
  key.shadow.bias = -0.0008;
  key.shadow.radius = 4;
  const rim = new THREE.DirectionalLight(0xffffff, 1.5); // from behind: the fur's edge glows
  rim.position.set(1.6, 1.4, -2.4);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.45);
  fill.position.set(2.5, 0.6, 2);
  scene.add(key, rim, fill);
}

// The lid's top under the cat: dark plastic, catching the light at its front edge; the cat's shadow falls on it.
function lidTop(width) {
  const top = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.8), new THREE.MeshStandardMaterial({ color: "#3a3e47", roughness: 0.55, metalness: 0.1 }));
  top.rotation.x = -Math.PI / 2;
  top.position.set(0, 0, EDGE - 0.4);
  top.receiveShadow = true;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(width, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: "#6b707a" }));
  lip.position.set(0, 0, EDGE);
  return [top, lip];
}

// Where the tail lies: back from the hip, over the edge, hanging down in front of the glass, the tip curling.
function tailPath(t, flick) {
  const sway = Math.sin(t * 0.9) * 0.025 + flick * 0.05;
  return new THREE.CatmullRomCurve3([
    V(0.34, 0.14, -0.02), V(0.46, 0.1, 0.1), V(0.52, 0.045, 0.24), V(0.535, 0.03, EDGE - 0.02),
    V(0.54 + sway * 0.5, -0.14, EDGE + 0.035), V(0.545 + sway, -0.3, EDGE + 0.04),
    V(0.53 + sway * 1.6 + flick * 0.06, -0.42, EDGE + 0.03 + flick * 0.03), V(0.5 + sway * 2 + flick * 0.1, -0.46 + flick * 0.05, EDGE + 0.02),
  ]).getPoints(25);
}

function buildCat() {
  const cat = new THREE.Group();
  const chest = new THREE.Group(); // breathes
  chest.add(furry(body(), { length: 0.016, density: 260 }));
  const neck = new THREE.Group();
  neck.position.set(-0.36, 0.2, 0.06);
  const face = head();
  const holder = new THREE.Group();
  holder.position.set(-0.15, -0.04, 0.05);
  holder.add(face.group);
  neck.add(holder);
  const tailPart = tail(tailPath(0, 0));
  cat.add(chest, neck, tailPart.mesh);
  return { cat, chest, neck, holder, face, tailPart };
}

// A catchlight in each eye, so an open eye looks wet and alive.
function catchlights(face) {
  face.eyes.forEach(({ group }) => {
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    glint.position.set(-0.008, 0.012, 0.024);
    group.add(glint);
  });
}

export function putCatToSleep(scene, { clownOnScreen = () => null } = {}) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = document.createElement("div");
  box.className = "sleeper";
  scene.append(box);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.title = "Погладить кота";
  box.append(canvas);

  const world = new THREE.Scene();
  lights(world);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  const { cat, chest, neck, holder, face, tailPart } = buildCat();
  catchlights(face);
  world.add(cat);
  let lid = [];

  // Sizes the canvas to the lid and lines the world's lid edge up with the page's lid.
  const fit = () => {
    const width = box.clientWidth || 380, perUnit = (width * CAT_SHARE) / 1.2;
    const height = Math.round((ABOVE + BELOW) * perUnit);
    renderer.setSize(width, height, false);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.top = `${-Math.round(ABOVE * perUnit)}px`;
    const half = width / perUnit / 2, edgeY = -EDGE * Math.sin(TILT);
    Object.assign(camera, { left: -half, right: half, top: edgeY + ABOVE, bottom: edgeY - BELOW });
    camera.position.set(0, 6 * Math.sin(TILT), 6 * Math.cos(TILT));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    lid.forEach((mesh) => world.remove(mesh));
    lid = lidTop(half * 2 + 0.2);
    world.add(...lid);
    cat.position.x = half * 0.18; // a little right of the middle, clear of the feeding hatch's side
  };
  fit();

  const mind = { wakeAt: rand(6, 12), waking: null, petted: null, earAt: rand(3, 8), ear: 0, earSide: 1, flickAt: rand(4, 9), flick: 0 };
  const look = { yaw: 0, pitch: 0 };
  const sleepingHead = { x: 0.28, y: -0.5, z: 0.18 };

  // What it is doing now: lift (0 asleep .. 1 head up), open (eyes), yawn, purr, and where it looks.
  function state(t) {
    if (mind.petted) {
      const p = (t - mind.petted) / 4.5;
      if (p >= 1) mind.petted = null;
      else {
        const up = ease(window01(p, 0, 0.12)) * (1 - ease(window01(p, 0.8, 1)));
        const blink = Math.exp(-(((p - 0.45) * 9) ** 2)) + Math.exp(-(((p - 0.62) * 9) ** 2));
        return { lift: up, open: up * (0.75 - blink * 0.7), yawn: 0, purr: up, gaze: "you" };
      }
    }
    if (!mind.waking && t > mind.wakeAt) mind.waking = t;
    if (!mind.waking) return { lift: 0, open: 0, yawn: 0, purr: 0, gaze: null };
    const p = (t - mind.waking) / 8;
    if (p >= 1) {
      mind.waking = null;
      mind.wakeAt = t + rand(...NAP);
      return { lift: 0, open: 0, yawn: 0, purr: 0, gaze: null };
    }
    const up = ease(window01(p, 0, 0.1)) * (1 - ease(window01(p, 0.82, 0.97)));
    const yawn = Math.sin(window01(p, 0.45, 0.63) * Math.PI);
    const blink = Math.exp(-(((p - 0.3) * 30) ** 2));
    const open = up * (0.6 - yawn * 0.6 - blink * 0.55) * (1 - window01(p, 0.72, 0.85));
    return { lift: up, open: Math.max(0, open), yawn, purr: 0, gaze: p < 0.45 ? "fish" : null };
  }

  // Head turn and tilt towards the clownfish (or towards you), in the head's own terms.
  function aim(gaze) {
    let yaw = 0, pitch = 0;
    if (gaze) {
      const at = new THREE.Vector3();
      face.group.getWorldPosition(at);
      at.project(camera);
      const rect = canvas.getBoundingClientRect();
      const here = { x: rect.left + ((at.x + 1) / 2) * rect.width, y: rect.top + ((1 - at.y) / 2) * rect.height };
      const there = gaze === "fish" ? clownOnScreen() : null;
      if (there) {
        yaw = clamp((there.x - here.x) / 260, -0.9, 0.9);
        pitch = clamp((there.y - here.y) / 320, -0.1, 0.38);
      }
    }
    look.yaw += (yaw - look.yaw) * 0.06;
    look.pitch += (pitch - look.pitch) * 0.06;
  }

  function pose(t, dt) {
    const now = state(t);
    aim(now.gaze);
    const breath = Math.sin((t / BREATH) * Math.PI * 2) * (1 - now.lift * 0.4);
    const purr = now.purr * Math.sin(t * 60) * 0.004;
    chest.scale.set(1, 1 + breath * 0.022 + purr, 1 + breath * 0.018);
    neck.rotation.z = -now.lift * 0.62 + breath * 0.012;
    neck.position.y = 0.2 + now.lift * 0.03;
    const awake = now.lift;
    face.group.rotation.set(
      sleepingHead.x * (1 - awake) + (look.pitch - now.yawn * 0.35) * awake,
      sleepingHead.y * (1 - awake) + (look.yaw * 0.9 - 0.15) * awake,
      sleepingHead.z * (1 - awake) + Math.sin(t * 0.7) * 0.03 * awake,
    );
    holder.position.y = -0.04 + now.lift * 0.02;
    face.eyes.forEach(({ lid }) => { lid.rotation.x = Math.PI / 2 - now.open * (Math.PI / 2 + LID_OPEN); }); // closed: the lid's dome faces forward
    face.mouth.scale.y = Math.max(0.001, now.yawn);
    // an ear twitches now and then, in its sleep too
    if (t > mind.earAt) {
      mind.earAt = t + rand(4, 11);
      mind.ear = 1;
      mind.earSide = Math.random() < 0.5 ? 0 : 1;
    }
    mind.ear = Math.max(0, mind.ear - dt * 4);
    face.ears.forEach((ear, i) => { ear.rotation.y = (i ? 1 : -1) * 0.25 + (i === mind.earSide ? Math.sin(mind.ear * 18) * 0.35 * mind.ear : 0); });
    // the tip of the tail flicks, more when it is awake
    if (t > mind.flickAt) {
      mind.flickAt = t + rand(2.5, 7) * (1 - awake * 0.6);
      mind.flick = 1;
    }
    mind.flick = Math.max(0, mind.flick - dt * 1.6);
    tailPart.reshape(tailPath(t, Math.sin(mind.flick * Math.PI) * (0.6 + awake * 0.6)));
  }

  let last = performance.now(), time = 0;
  const frame = (stamp) => {
    const dt = Math.min(0.05, (stamp - last) / 1000);
    last = stamp;
    time += dt;
    pose(time, dt);
    renderer.render(world, camera);
    requestAnimationFrame(frame);
  };
  if (still) {
    pose(0, 0);
    renderer.render(world, camera);
  } else {
    requestAnimationFrame((stamp) => { last = stamp; frame(stamp); });
  }

  const ray = new THREE.Raycaster();
  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1), camera);
    if (!ray.intersectObject(cat, true).length) return;
    mind.waking = null;
    mind.wakeAt = time + rand(...NAP);
    mind.petted = time;
    const feedback = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback;
    if (feedback) feedback.impactOccurred("soft");
  });
  new ResizeObserver(() => {
    fit();
    if (still) renderer.render(world, camera);
  }).observe(box);
}
