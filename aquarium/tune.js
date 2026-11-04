// The visitor's own aquarium: the light (warm evening, day, moonlit night) and the ground, kept in this browser;
// and «пересадить» — plant the garden anew.

const KEY = "showcase.aquarium";
export const LIGHTS = ["evening", "day", "night"];
export const GROUNDS = ["sand", "gravel", "soil"];
const DEFAULTS = Object.freeze({ light: "evening", ground: "sand" });

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      light: LIGHTS.includes(saved.light) ? saved.light : DEFAULTS.light,
      ground: GROUNDS.includes(saved.ground) ? saved.ground : DEFAULTS.ground,
    };
  } catch (_) {
    return { ...DEFAULTS };
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) {
    // private mode or blocked storage: the choice just lasts this visit
  }
}

function haptic() {
  const feedback = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback;
  if (feedback) feedback.selectionChanged();
}

// Shows the choice on the radio buttons; only the chosen one is in the tab order, arrows move between them.
function mark(group, value) {
  group.querySelectorAll("button[data-value]").forEach((button) => {
    const chosen = button.dataset.value === value;
    button.setAttribute("aria-checked", String(chosen));
    button.tabIndex = chosen ? 0 : -1;
  });
}

export function setUpTuning(scene, panel, { onGround, onReshuffle }) {
  let state = load();
  const groups = [...panel.querySelectorAll("[data-key]")];
  const apply = () => {
    scene.dataset.light = state.light;
    scene.dataset.ground = state.ground;
    groups.forEach((group) => mark(group, state[group.dataset.key]));
  };
  const choose = (key, value) => {
    if (state[key] === value) return;
    state = { ...state, [key]: value };
    apply();
    save(state);
    haptic();
    if (key === "ground") onGround(value);
  };

  groups.forEach((group) => {
    const key = group.dataset.key;
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");
      if (button) choose(key, button.dataset.value);
    });
    group.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const values = key === "light" ? LIGHTS : GROUNDS;
      const next = values[(values.indexOf(state[key]) + step + values.length) % values.length];
      choose(key, next);
      group.querySelector(`button[data-value="${next}"]`).focus();
    });
  });
  panel.querySelector("[data-reshuffle]").addEventListener("click", () => {
    haptic();
    onReshuffle();
  });

  apply();
  panel.hidden = false;
  return { ground: () => state.ground };
}
