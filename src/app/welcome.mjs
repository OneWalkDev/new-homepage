export const WELCOME_KEY = "onewalk.welcome.seen";
export const WELCOME_MS = 3000;

// A small cancellable controller, independent of React and the command timeline.
// Storage denial or an already-focused page keeps progressive enhancement immediate.
export function startWelcome({ storage, motion, events, schedule, cancel, canPlay, resume = false, onStart, onFinish }) {
  let live = true;
  let playing = false;
  const timers = [];
  const cleanup = () => {
    timers.forEach(cancel);
    timers.length = 0;
    events.removeEventListener("keydown", escape);
    motion.removeEventListener("change", reduce);
  };
  const finish = (explicit = false) => {
    if (!live || !playing) return;
    playing = false;
    cleanup();
    onFinish(explicit);
  };
  const escape = (event) => {
    if (event.key === "Escape" && !event.isComposing) {
      event.preventDefault();
      finish(true);
    }
  };
  const reduce = () => { if (motion.matches) finish(); };
  try {
    const seen = storage.getItem(WELCOME_KEY) === "1";
    storage.setItem(WELCOME_KEY, "1");
    if ((!seen || resume) && !motion.matches && canPlay()) {
      events.addEventListener("keydown", escape);
      motion.addEventListener("change", reduce);
      timers.push(schedule(() => finish(), WELCOME_MS));
      timers.push(schedule(() => finish(), 3300));
      playing = true;
      onStart();
    }
  } catch {
    // Register timers before covering anything, and release even partial setup.
    cleanup();
    if (playing) finish();
  }
  return {
    skip: () => finish(true),
    dispose: () => { live = false; playing = false; cleanup(); },
  };
}
