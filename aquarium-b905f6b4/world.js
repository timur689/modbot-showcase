// The tank's 3D world: a canvas filling the tank, a camera looking in through the front glass, the lamp in the lid
// (a spotlight throwing dancing caustics and shadows, brighter near the top than at the bottom), a light from behind
// that outlines everything, reflections of the lit tank on whatever is glossy, the water's colour and haze in each
// mood of light, and the frame loop everything living hooks into.

import { THREE, clamp, mix, paint, painted, setClock } from "./kit.js";

export const SURFACE = 6.68; // the water's surface, in the world's units (the tank's front is 7 high; air above it)
const VIEW_HEIGHT = 7;       // how much of the front glass the camera fits in, top to bottom
const FRONT = 2;             // where the front glass stands
const FOV = 34;
const TILT = 0.09;           // the camera looks down into the tank a little
const SETTLE = 2.6;          // how fast a change of light flows (per second)

// The moods, in step with aquarium.css: the water's colours there, and how the lamp and the room light the world.
const MOODS = {
  evening: {
    top: "#a8dccc", mid: "#3f9aa6", bottom: "#1b5468", lamp: "#ffd29a", sky: "#ffe2b8", floor: "#2d5458", fill: "#ffe7c4", rim: "#ffcf96",
    power: 3.4, hemi: 0.75, front: 0.45, back: 1.1, shafts: 0.42, emit: 1, night: 0.15,
  },
  day: {
    top: "#b8ecf7", mid: "#56b3dc", bottom: "#22689e", lamp: "#ffffff", sky: "#eaf7ff", floor: "#2c5878", fill: "#ffffff", rim: "#e8f6ff",
    power: 3.8, hemi: 0.85, front: 0.5, back: 1.2, shafts: 0.34, emit: 0, night: 0,
  },
  night: {
    top: "#24496e", mid: "#142d4c", bottom: "#08142a", lamp: "#9fb4ff", sky: "#6c7cc0", floor: "#0a1430", fill: "#7f8fd0", rim: "#8aa2ff",
    power: 1.0, hemi: 0.22, front: 0.16, back: 0.7, shafts: 0.16, emit: 1.8, night: 1,
  },
};
const COLOURS = ["top", "mid", "bottom", "lamp", "sky", "floor", "fill", "rim"];
const NUMBERS = ["power", "hemi", "front", "back", "shafts", "emit", "night"];
const LAMP_REACH = 14; // the lamp fades with distance: this much power keeps the bottom as bright as before

const moodValues = (name) => {
  const mood = MOODS[name] || MOODS.evening;
  return Object.fromEntries([...COLOURS.map((key) => [key, new THREE.Color(mood[key])]), ...NUMBERS.map((key) => [key, mood[key]])]);
};

// A tile of light netting (the borders between random cells), drawn once; two copies drift across each other.
function causticTile(size = 64, cells = 5) {
  const points = [];
  for (let j = 0; j < cells; j += 1) for (let i = 0; i < cells; i += 1) points.push([(i + Math.random()) / cells, (j + Math.random()) / cells]);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let first = 9, second = 9;
      points.forEach(([px, py]) => {
        for (let dx = -1; dx <= 1; dx += 1) {
          for (let dy = -1; dy <= 1; dy += 1) {
            const d = Math.hypot(x / size - px - dx, y / size - py - dy);
            if (d < first) [first, second] = [d, first];
            else if (d < second) second = d;
          }
        }
      });
      const at = (y * size + x) * 4;
      image.data.set([255, 255, 255, Math.round(255 * Math.exp(-(second - first) * 34))], at);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function caustics() {
  const tile = causticTile();
  const texture = painted(256, 256, () => {}, { colour: false });
  const ctx = texture.image.getContext("2d");
  const layer = (dx, dy, alpha) => {
    ctx.globalAlpha = alpha;
    const ox = ((dx % 64) + 64) % 64, oy = ((dy % 64) + 64) % 64;
    for (let x = -64; x < 256; x += 64) for (let y = -64; y < 256; y += 64) ctx.drawImage(tile, x + ox, y + oy);
  };
  const draw = (t) => {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgb(120,120,120)";
    ctx.fillRect(0, 0, 256, 256);
    layer(t * 7, t * 3, 0.5);
    layer(-t * 5 + 20, t * 6 + 31, 0.45);
    texture.needsUpdate = true;
  };
  draw(0);
  return { texture, draw };
}

// The far water behind everything: a gradient wall the haze fades into.
function backdrop() {
  const geometry = new THREE.PlaneGeometry(60, 26, 1, 26);
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 3, -9);
  const paint = (light) => {
    const { position } = geometry.attributes;
    const colors = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i += 1) {
      const t = clamp((9.5 - (position.getY(i) + 3)) / 13, 0, 1); // 0 at the top of the view, 1 at the bottom
      const c = t < 0.48 ? mix(light.top, light.mid, t / 0.48) : mix(light.mid, light.bottom, (t - 0.48) / 0.52);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  };
  return { mesh, paint };
}

// What glossy things reflect: the tank around them, water-coloured, bright above where the lamp hangs, dark below.
function environment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new THREE.Scene();
  const shell = new THREE.SphereGeometry(10, 32, 16);
  room.add(new THREE.Mesh(shell, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const tube = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.4), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  tube.position.y = 9;
  tube.rotation.x = Math.PI / 2;
  room.add(tube);
  let texture = null;
  return (light) => {
    paint(shell, (x, y) => (y > 0 ? mix(light.mid, light.sky, y / 10) : mix(light.mid, light.floor, -y / 10)));
    tube.material.color.copy(light.lamp).multiplyScalar(light.power * 1.4);
    const next = pmrem.fromScene(room, 0.03).texture;
    scene.environment = next;
    if (texture) texture.dispose();
    texture = next;
  };
}

function lights(scene) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x224444, 1);
  const front = new THREE.DirectionalLight(0xffffff, 0.5);
  front.position.set(-2, 4, 12);
  const back = new THREE.DirectionalLight(0xffffff, 1); // from behind and above: bright outlines on fins, leaves, rocks
  back.position.set(1.5, 9, -12);
  const lamp = new THREE.SpotLight(0xffffff, 3, 0, 0.62, 0.55, 1);
  lamp.position.set(0.6, 15, 2.2);
  lamp.target.position.set(0, 0, -0.6);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(2048, 2048);
  lamp.shadow.camera.near = 6;
  lamp.shadow.camera.far = 24;
  lamp.shadow.bias = -0.0004;
  lamp.shadow.normalBias = 0.025;
  scene.add(hemi, front, back, lamp, lamp.target);
  return { hemi, front, back, lamp };
}

export function createWorld(tank) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.className = "water3d";
  tank.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);
  const far = backdrop();
  const lit = lights(scene);
  const net = caustics();
  const reflect = environment(renderer, scene);
  lit.lamp.map = net.texture;
  scene.add(far.mesh);
  scene.fog = new THREE.Fog(0x3f9aa6, 11, 23);

  let light = moodValues("evening");
  let target = light;
  const apply = () => {
    far.paint(light);
    scene.fog.color.copy(light.mid);
    lit.hemi.color.copy(light.sky);
    lit.hemi.groundColor.copy(light.floor);
    lit.hemi.intensity = light.hemi;
    lit.front.color.copy(light.fill);
    lit.front.intensity = light.front;
    lit.back.color.copy(light.rim);
    lit.back.intensity = light.back;
    lit.lamp.color.copy(light.lamp);
    lit.lamp.intensity = light.power * LAMP_REACH;
  };
  const settle = (dt) => {
    const k = 1 - Math.exp(-dt * SETTLE);
    const moving = NUMBERS.some((key) => Math.abs(light[key] - target[key]) > 0.002) || COLOURS.some((key) => !light[key].equals(target[key]));
    if (!moving) return;
    light = Object.fromEntries([
      ...COLOURS.map((key) => [key, light[key].clone().lerp(target[key], k)]),
      ...NUMBERS.map((key) => [key, light[key] + (target[key] - light[key]) * k]),
    ]);
    apply();
  };

  const fit = () => {
    const width = tank.clientWidth || 370, height = tank.clientHeight || 260;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const distance = VIEW_HEIGHT / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.position.set(0, VIEW_HEIGHT / 2 + distance * TILT, FRONT + distance);
    camera.lookAt(0, VIEW_HEIGHT / 2, FRONT);
    camera.updateProjectionMatrix();
  };
  fit();

  const hooks = [];
  let time = 0, last = performance.now();
  const render = () => renderer.render(scene, camera);
  const frame = (stamp) => {
    const dt = Math.min(0.05, (stamp - last) / 1000);
    last = stamp;
    time += dt;
    setClock(time);
    settle(dt);
    net.draw(time);
    hooks.forEach((hook) => hook(time, dt));
    render();
    requestAnimationFrame(frame);
  };

  const world = {
    scene, camera, still,
    get light() { return light; },
    add: (...objects) => scene.add(...objects),
    every: (hook) => hooks.push(hook),
    mood(name, instant = still) {
      target = moodValues(name);
      reflect(target);
      if (instant) {
        light = target;
        apply();
      }
      if (still) render();
    },
    // Where a point of the world shows on the page.
    toScreen(point) {
      const at = point.clone().project(camera), box = canvas.getBoundingClientRect();
      return { x: box.left + ((at.x + 1) / 2) * box.width, y: box.top + ((1 - at.y) / 2) * box.height };
    },
    start() {
      apply();
      if (still) {
        setClock(2);
        hooks.forEach((hook) => hook(2, 0));
        render();
      } else {
        requestAnimationFrame((stamp) => { last = stamp; frame(stamp); });
      }
    },
    render,
  };

  new ResizeObserver(() => {
    fit();
    if (still) render();
  }).observe(tank);
  return world;
}
