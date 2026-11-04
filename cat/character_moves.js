// How the character moves: the idle pose, little things it does on its own, and the dances.
// Every move maps its own time to a pose; poses are blended, so moves start and end softly.
import { easeInOut } from "./robot3d.js";

export const IDLE = {
  x: 0, y: 0, yaw: 0, roll: 0, lean: 0, sway: 0, scale: 1,
  headYaw: 0, headPitch: 0, headRoll: 0,
  armL: 0.03, armR: 0.03, armFwdL: 0.03, armFwdR: 0.03, // armFwd: positive swings the arm back, negative forward
  legL: 0, legR: 0, wind: 1, ears: 0, earsBend: 0,
  squint: 0, earFlap: 0, // squint: happy eyes narrowing to arcs; earFlap: how hard the ears wiggle
};

const beatOf = (t, seconds) => (t / seconds) * Math.PI;
const easeOutBack = (p) => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);

// Things it does by itself now and then, between dances. Quiet: no name in the speech bubble.
export const ACTIONS = [
  {
    name: "listen", seconds: 3.6,
    pose(t) { // nodding along to its headphones
      const s = Math.sin(beatOf(t, 0.42));
      return { headPitch: Math.max(0, s) * 0.14, y: Math.max(0, s) * 0.015, earsBend: Math.max(0, s) * 0.25 };
    },
  },
  {
    name: "adjust", seconds: 2.2,
    pose(t, p) { // a hand goes up to the headphones and back
      const up = Math.sin(Math.min(1, p * 1.25) * Math.PI);
      return { armR: 0.1 + up * 2.35, armFwdR: 0.05 - up * 0.35, headRoll: up * 0.12, headYaw: -up * 0.1 };
    },
  },
  {
    name: "glance", seconds: 2.6,
    pose(t, p) { // looks one way, then the other
      return { headYaw: Math.sin(p * Math.PI * 2) * 0.7, headPitch: -Math.sin(p * Math.PI) * 0.06 };
    },
  },
  {
    name: "shift", seconds: 2.4,
    pose(t, p) { // weight from one foot to the other
      const s = Math.sin(p * Math.PI * 2);
      return { sway: s * 0.05, roll: -s * 0.05, legL: Math.max(0, s) * -0.12, legR: Math.max(0, -s) * -0.12 };
    },
  },
];

// More things the guide does on its own.
ACTIONS.push(
  {
    name: "wave", seconds: 2.4,
    pose(t, p) { // a friendly wave
      const up = Math.sin(Math.min(1, p * 1.2) * Math.PI);
      return { armR: 0.1 + up * 2.5, armFwdR: -up * 0.25 + up * Math.sin(t * 14) * 0.35, headRoll: up * 0.1, y: up * 0.01 };
    },
  },
  {
    name: "beanie", seconds: 2.2,
    pose(t, p) { // both hands pull the beanie down a little
      const up = Math.sin(Math.min(1, p * 1.2) * Math.PI);
      return { armL: 0.1 + up * 2.7, armR: 0.1 + up * 2.7, armFwdL: -up * 0.5, armFwdR: -up * 0.5, headPitch: up * 0.12 };
    },
  },
  {
    name: "stretch", seconds: 2.8,
    pose(t, p) { // arms up, up on the toes, and down again
      const up = Math.sin(p * Math.PI);
      return { armL: 0.1 + up * 2.9, armR: 0.1 + up * 2.9, y: up * 0.04, headPitch: -up * 0.15, lean: -up * 0.05 };
    },
  },
  {
    name: "tap", seconds: 2.6,
    pose(t) { // taps a foot to the music
      const s = Math.max(0, Math.sin(beatOf(t, 0.3)));
      return { legR: -s * 0.3, headPitch: s * 0.06, roll: -0.03 };
    },
  },
  {
    name: "kick", seconds: 2.2,
    pose(t, p) { // looks down and kicks a pebble, arms out for balance
      const wind = Math.sin(Math.min(1, p / 0.45) * Math.PI) * (p < 0.45 ? 1 : 0);
      const kick = p >= 0.45 ? Math.sin(Math.min(1, (p - 0.45) / 0.35) * Math.PI) : 0;
      const look = Math.sin(p * Math.PI);
      return {
        legR: wind * 0.35 - kick * 0.95, armL: 0.1 + kick * 0.6, armR: 0.1 + kick * 0.4, armFwdL: kick * 0.3,
        lean: -kick * 0.08, headPitch: look * 0.28 - kick * 0.2, y: kick * 0.02,
      };
    },
  },
  {
    name: "watch", seconds: 2.4,
    pose(t, p) { // checks the time on its wrist
      const up = Math.sin(Math.min(1, p * 1.15) * Math.PI);
      return { armL: 0.1 + up * 0.5, armFwdL: -up * 1.45, headPitch: up * 0.3, headYaw: up * 0.22, headRoll: up * 0.06 };
    },
  },
  {
    name: "shrug", seconds: 1.8,
    pose(t, p) { // a little shrug: hands out, head to one side
      const up = Math.sin(p * Math.PI);
      return { armL: 0.1 + up * 0.55, armR: 0.1 + up * 0.55, armFwdL: -up * 0.35, armFwdR: -up * 0.35, y: up * 0.02, headRoll: up * 0.16 };
    },
  },
  {
    name: "strings", seconds: 2.6,
    pose(t, p) { // tugs at its hoodie strings, a little bounce with each tug
      const hands = Math.sin(Math.min(1, p * 1.1) * Math.PI), tug = Math.max(0, Math.sin(t * 9)) * hands;
      return { armL: 0.1 - hands * 0.25, armR: 0.1 - hands * 0.25, armFwdL: -hands * 0.6, armFwdR: -hands * 0.6, y: -tug * 0.015, headPitch: hands * 0.2 };
    },
  },
);

// Answers to what happens in the app.
export const REACTIONS = {
  greet: { name: "greet", seconds: 1.6, pose(t, p) { // a new page: a little hop and a wave
    const hop = Math.max(0, Math.sin(Math.min(1, p * 2) * Math.PI)), up = Math.sin(p * Math.PI);
    return { y: hop * 0.12, armR: 0.1 + up * 2.3, armFwdR: up * Math.sin(t * 14) * 0.3, headRoll: up * 0.08, squint: up * 0.7, earFlap: hop };
  } },
  happy: { name: "happy", seconds: 1.4, pose(t, p) { // something worked: jumps with both arms up
    const hop = Math.abs(Math.sin(p * Math.PI * 2)), up = Math.sin(p * Math.PI);
    return { y: hop * 0.22, armL: 0.1 + up * 2.6, armR: 0.1 + up * 2.6, headPitch: -hop * 0.12, squint: up, earFlap: up };
  } },
  oops: { name: "oops", seconds: 1.5, pose(t, p) { // something went wrong: shakes its head
    const fade = Math.sin(p * Math.PI);
    return { headYaw: Math.sin(t * 16) * 0.35 * fade, lean: fade * 0.06, armL: 0.15, armR: 0.15, headPitch: fade * 0.1 };
  } },
  look: { name: "look", seconds: 1.2, pose(t, p) { // the page scrolled: glances down at it
    return { headPitch: Math.sin(p * Math.PI) * 0.25, headYaw: -Math.sin(p * Math.PI) * 0.2 };
  } },
  startle: { name: "startle", seconds: 0.85, pose(t, p) { // frightened: jumps up, paws in the air, then crouches to bolt
    const hop = p < 0.55 ? Math.sin((p / 0.55) * Math.PI) : 0;
    const crouch = p >= 0.55 ? Math.sin(((p - 0.55) / 0.45) * Math.PI * 0.5) : 0;
    return {
      y: hop * 0.26 - crouch * 0.05, lean: -hop * 0.12 + crouch * 0.18, armL: 0.1 + hop * 2.0, armR: 0.1 + hop * 2.0,
      legL: -hop * 0.25, legR: hop * 0.25, headPitch: -hop * 0.18, roll: crouch * Math.sin(t * 40) * 0.03,
      earFlap: hop, wind: 1 + hop,
    };
  } },
  shoot: { name: "shoot", seconds: 1.1, pose(t, p) { // shoots a web straight at the owner: paw thrust out, a little recoil
    const thrust = p < 0.25 ? Math.sin((p / 0.25) * Math.PI * 0.5) : Math.max(0, 1 - (p - 0.25) / 0.75);
    return { armR: 0.1 + thrust * 0.5, armFwdR: -thrust * 1.6, lean: -thrust * 0.1, headPitch: -thrust * 0.05, squint: thrust * 0.7, earFlap: thrust * 0.5 };
  } },
  explain: { name: "explain", seconds: 2.6, pose(t, p) { // tapped: turns to the owner and explains, one hand open, nodding
    const open = Math.sin(Math.min(1, p * 1.1) * Math.PI), talk = Math.sin(t * 7) * open;
    return { armR: 0.1 + open * 0.75, armFwdR: -open * 0.9 + talk * 0.12, armL: 0.1 + open * 0.15, headRoll: open * 0.12, headPitch: talk * 0.05, y: Math.max(0, talk) * 0.01 };
  } },
};

// A jump from the greeting down to the bottom of the page, or back up: crouch, a spin with arms up in the air,
// legs apart, then a squashy landing. The panel moves it along the arc; this is what the body does meanwhile.
export const LEAP = {
  name: "leap", seconds: 0.9,
  pose(t, p) {
    const crouch = p < 0.18 ? Math.sin((p / 0.18) * Math.PI) : 0;
    const air = p >= 0.18 && p < 0.82 ? Math.sin(((p - 0.18) / 0.64) * Math.PI) : 0;
    const land = p >= 0.82 ? Math.sin(((p - 0.82) / 0.18) * Math.PI) : 0;
    const spin = p < 0.18 ? 0 : p > 0.82 ? 1 : easeInOut((p - 0.18) / 0.64);
    return {
      y: -crouch * 0.07 - land * 0.06, lean: crouch * 0.2 + land * 0.15, yaw: spin * Math.PI * 2,
      armL: 0.1 + air * 2.4, armR: 0.1 + air * 2.4, legL: -air * 0.35, legR: air * 0.35,
      headPitch: crouch * 0.15 - air * 0.15, squint: air, earFlap: air, wind: 1 + air * 2.5,
    };
  },
};

// Swinging home on a web: one paw up holding it, the other out for balance, legs tucked back, ears in the wind.
// The panel carries it along the swoop and turns its body with the web; this is what the body does meanwhile.
export const SWING = {
  name: "swing", seconds: 1.4,
  pose(t, p) {
    const hang = Math.sin(Math.min(1, p / 0.9) * Math.PI * 0.5), land = p > 0.88 ? Math.sin(((p - 0.88) / 0.12) * Math.PI) : 0;
    return {
      armR: 0.1 + hang * 2.9, armFwdR: -hang * 0.2, armL: 0.1 + hang * 1.1, armFwdL: hang * 0.3,
      legL: hang * 0.45, legR: hang * 0.25, lean: -hang * 0.08, y: -land * 0.06, squint: hang * 0.5, earFlap: hang, wind: 1 + hang * 2,
    };
  },
};

// Having fun on the stroll: what it does now and then when it stops. Bouncy, with happy eyes and wiggling ears.
export const PLAYS = [
  {
    name: "hop-hop", seconds: 1.8,
    pose(t, p) { // two little hops on the spot
      const hop = Math.max(0, Math.sin(p * Math.PI * 2)), up = Math.sin(p * Math.PI);
      return { y: hop * 0.16, armL: 0.1 + hop * 0.9, armR: 0.1 + hop * 0.9, legL: -hop * 0.2, legR: hop * 0.2, squint: up * 0.8, earFlap: hop };
    },
  },
  {
    name: "twirl", seconds: 1.9,
    pose(t, p) { // spins round with its sleeves flying out; the hem flares
      const out = Math.sin(p * Math.PI);
      return { yaw: easeInOut(p) * Math.PI * 2, armL: 0.1 + out * 1.4, armR: 0.1 + out * 1.4, y: out * 0.04, headRoll: out * 0.1, wind: 1 + out * 3, squint: out * 0.6 };
    },
  },
  {
    name: "joy", seconds: 1.6,
    pose(t, p) { // jumps for joy and clicks its heels in the air
      const air = Math.sin(Math.min(1, p / 0.8) * Math.PI), click = Math.sin(Math.min(1, p / 0.8) * Math.PI * 2);
      return {
        y: air * 0.34, armL: 0.1 + air * 2.7, armR: 0.1 + air * 2.7, legL: -0.2 * click, legR: 0.2 * click,
        roll: click * 0.08, headPitch: -air * 0.2, squint: air, earFlap: air * 1.2, wind: 1 + air * 1.5,
      };
    },
  },
  {
    name: "flap", seconds: 2.2,
    pose(t, p) { // flaps its huge sleeves like wings and bobs up and down
      const on = Math.sin(p * Math.PI), beat = Math.sin(t * 13);
      return { armL: 0.2 + on * (1.1 + beat * 0.55), armR: 0.2 + on * (1.1 + beat * 0.55), y: on * Math.max(0, beat) * 0.07, headPitch: -on * 0.1, squint: on * 0.5, earFlap: on };
    },
  },
  {
    name: "vibe", seconds: 3.0,
    pose(t, p) { // bobs to the music in its earbuds, shoulders and head on the beat
      const on = Math.sin(p * Math.PI), s = Math.sin(beatOf(t, 0.36));
      return {
        y: Math.abs(s) * 0.04 * on, sway: s * 0.04 * on, roll: -s * 0.05 * on, headRoll: s * 0.15 * on, headPitch: Math.abs(s) * 0.1 * on,
        armFwdL: -s * 0.35 * on, armFwdR: s * 0.35 * on, armL: 0.1 + on * 0.25, armR: 0.1 + on * 0.25, squint: on * 0.7,
      };
    },
  },
  {
    name: "star", seconds: 2.0,
    pose(t, p) { // two star jumps: arms and legs out, then in
      const jump = Math.max(0, Math.sin(p * Math.PI * 2)), wide = Math.abs(Math.sin(p * Math.PI * 2));
      return { y: jump * 0.18, armL: 0.1 + wide * 2.2, armR: 0.1 + wide * 2.2, legL: 0, legR: 0, roll: 0, sway: 0, headPitch: -jump * 0.08, squint: wide * 0.6, earFlap: jump, wind: 1 + jump };
    },
  },
  {
    name: "peek", seconds: 2.6,
    pose(t, p) { // leans over to peek at the page, then back
      const lean = Math.sin(p * Math.PI);
      return { lean: lean * 0.22, roll: lean * 0.12, headPitch: lean * 0.3, headYaw: Math.sin(p * Math.PI * 3) * 0.3 * lean, armFwdL: -lean * 0.3, armFwdR: -lean * 0.3 };
    },
  },
  {
    name: "wiggle", seconds: 2.0,
    pose(t, p) { // wiggles its hips from side to side
      const on = Math.sin(p * Math.PI), s = Math.sin(t * 11);
      return { sway: s * 0.07 * on, roll: s * 0.09 * on, headRoll: -s * 0.12 * on, armL: 0.3 * on, armR: 0.3 * on, armFwdL: s * 0.3 * on, armFwdR: -s * 0.3 * on, squint: on * 0.6 };
    },
  },
];

// Walking, added on top of whatever else it does: legs and arms swing in opposition, the body bobs at each step.
// With bounce it skips along instead: higher hops, arms swinging up, happy eyes.
const STRIDE = { legL: 0.55, legR: -0.55, armFwdL: -0.45, armFwdR: 0.45, roll: 0.06, sway: 0.02, headRoll: -0.05 };

export function stride(pose, phase, weight, bounce = 0) {
  if (weight <= 0) return pose;
  const s = Math.sin(phase), step = Math.abs(Math.cos(phase)), w = weight;
  const swing = Object.fromEntries(Object.entries(STRIDE).map(([key, amount]) => [key, pose[key] + amount * s * w * (1 + bounce * 0.4)]));
  const lift = bounce * Math.abs(s) * w;
  return {
    ...pose, ...swing, y: pose.y + step * 0.035 * w + lift * 0.11, lean: pose.lean + 0.05 * w,
    armL: pose.armL + 0.06 * w + lift * 0.5, armR: pose.armR + 0.06 * w + lift * 0.5,
    headPitch: pose.headPitch - lift * 0.06, squint: Math.max(pose.squint, bounce * w * 0.6), earFlap: Math.max(pose.earFlap, lift * 0.6),
  };
}

// Dances, one per tap, in this order.
export const DANCES = [
  {
    name: "Покачивание", seconds: 4.2,
    pose(t) {
      const s = Math.sin(beatOf(t, 0.5));
      return {
        y: Math.abs(s) * 0.06, roll: s * 0.07, sway: s * 0.08, headRoll: -s * 0.18, headPitch: Math.sin(beatOf(t, 0.25)) * 0.07,
        armL: 0.3 + Math.max(0, s) * 0.7, armR: 0.3 + Math.max(0, -s) * 0.7, armFwdL: -s * 0.3, armFwdR: s * 0.3,
        legL: -Math.max(0, s) * 0.3, legR: -Math.max(0, -s) * 0.3, wind: 1.7, ears: s * 0.3, earsBend: Math.abs(s) * 0.3,
      };
    },
  },
  {
    name: "Вихрь", seconds: 3.4,
    pose(t, p) {
      const lift = p > 0.82 ? Math.sin(((p - 0.82) / 0.18) * Math.PI) * 0.32 : Math.sin(p * Math.PI) * 0.05;
      return {
        y: lift, yaw: easeInOut(Math.min(1, p / 0.85)) * Math.PI * 4, armL: 1.3, armR: 1.3, armFwdL: 0.15, armFwdR: 0.15,
        headPitch: -0.12, legL: p > 0.82 ? -0.3 : 0, legR: p > 0.82 ? 0.3 : 0, wind: 3.6, ears: 0.6 * Math.sin(t * 9), earsBend: 0.5,
      };
    },
  },
  {
    name: "Прыг-скок", seconds: 3.8,
    pose(t) {
      const s = Math.sin(beatOf(t, 0.45)), up = Math.abs(s);
      return {
        y: up * 0.3, roll: Math.sin(beatOf(t, 0.9)) * 0.06, headRoll: Math.sin(beatOf(t, 0.9)) * 0.14, headPitch: -up * 0.1,
        armL: 2.6 + Math.sin(beatOf(t, 0.225)) * 0.3, armR: 2.6 - Math.sin(beatOf(t, 0.225)) * 0.3,
        legL: s > 0 ? -0.7 * s : 0, legR: s < 0 ? 0.7 * s : 0, wind: 2.3, ears: up * 0.7, earsBend: up * 0.6,
      };
    },
  },
  {
    name: "Лунная походка", seconds: 4.4,
    pose(t, p) {
      const step = Math.sin(beatOf(t, 0.55));
      return {
        x: -Math.sin(p * Math.PI) * 0.55, lean: -0.05, headPitch: Math.abs(step) * 0.08,
        legL: step * 0.28, legR: -step * 0.28, armL: 0.25 + step * 0.15, armR: 0.25 - step * 0.15,
        armFwdL: -step * 0.35, armFwdR: step * 0.35, wind: 1.9, earsBend: Math.abs(step) * 0.2,
      };
    },
  },
  {
    name: "Диджей", seconds: 4.0,
    pose(t) {
      const s = Math.sin(beatOf(t, 0.4)), pump = Math.max(0, s);
      return {
        y: pump * 0.05, headPitch: pump * 0.2, headRoll: 0.12, armR: 2.45, armFwdR: -0.3, // a hand holds the headphone
        armL: 1.2 + pump * 1.4, armFwdL: 0.3, roll: -0.04, ears: pump * 0.4, earsBend: pump * 0.4, wind: 1.5,
      };
    },
  },
  {
    name: "Реверанс", seconds: 2.8,
    pose(t, p) {
      const bow = Math.sin(Math.min(1, p / 0.8) * Math.PI);
      return {
        lean: bow * 0.45, y: -bow * 0.04, headPitch: bow * 0.25, armL: 0.5 + bow * 0.4, armR: 0.5 + bow * 0.4,
        armFwdL: -bow * 0.7, armFwdR: -bow * 0.7, legR: bow * 0.35, ears: -bow * 0.5, earsBend: bow * 0.8, wind: 1.3,
      };
    },
  },
];

// Arriving on screen: rises out of the pedestal with a little turn and a bounce.
export function entrance(t) {
  const p = Math.min(1, t / 1.3);
  return { scale: Math.max(0.001, easeOutBack(p)), yaw: (1 - easeInOut(p)) * -Math.PI * 1.5, wind: 1 + (1 - p) * 2 };
}

// The pose of a move at time `t`, blended with the idle pose at its start and end.
export function blend(move, t, fade = 0.35) {
  if (!move) return IDLE;
  const local = t - move.start, p = Math.min(1, local / move.seconds);
  const weight = easeInOut(Math.max(0, Math.min(1, local / fade, (move.seconds - local) / fade)));
  const target = { ...IDLE, ...move.pose(local, p) };
  return Object.fromEntries(Object.keys(IDLE).map((key) => [key, key === "yaw" ? target.yaw : IDLE[key] + (target[key] - IDLE[key]) * weight]));
}

// Adds an entrance (or any partial pose) on top of a full pose.
export function layer(pose, extra) {
  return { ...pose, scale: pose.scale * (extra.scale ?? 1), yaw: pose.yaw + (extra.yaw ?? 0), wind: Math.max(pose.wind, extra.wind ?? 0) };
}
