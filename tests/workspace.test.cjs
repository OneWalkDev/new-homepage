const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const loadTsx = require("./helpers/load-tsx.cjs");

function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)];
}

async function workspace(hash = "", reduced = false, mobile = false, options = {}) {
  const commands = await import("../src/app/commands.mjs");
  const welcome = await import("../src/app/welcome.mjs");
  const terminal = await import("../src/app/terminal.mjs");
  const storage = options.storage || new Map(options.fresh ? [] : [[welcome.WELCOME_KEY, "1"]]);
  const files = commands.FILES.map((file) => ({ ...file, content: React.createElement("a", { href: "#contact.txt" }, file.label) }));
  const hooks = [], effects = [], cleanups = new Map(), setups = new Map(), timers = new Map(), scheduled = [];
  const listeners = new Map();
  let cursor = 0, now = 0, nextTimer = 0, focused = 0;
  function media(matches) {
    const handlers = new Set();
    return {
      matches,
      addEventListener(_event, handler) { handlers.add(handler); },
      removeEventListener(_event, handler) { handlers.delete(handler); },
      change(matches) { this.matches = matches; handlers.forEach((handler) => handler()); },
      get listenerCount() { return handlers.size; },
    };
  }
  const motionMedia = media(reduced), mobileMedia = media(mobile);
  const document = { activeElement: null };
  const focusEvents = [];
  const commandInput = {
    selectionStart: 0, selectionEnd: 0,
    closest: () => null,
    focus(options) { focusEvents.push(["input", { ...options }]); document.activeElement = this; },
    blur() { focusEvents.push(["blur"]); if (document.activeElement === this) document.activeElement = null; },
  };
  const dockToggle = {
    closest: () => null,
    focus(options) { focusEvents.push(["toggle", { ...options }]); document.activeElement = this; },
  };
  const commandLog = { closest: () => null, scrollTop: 0, scrollHeight: 100 };
  let workspaceHeight = options.height ?? 800, selectedText = "", observer;
  const captures = new Set();
  const separator = {
    focus() { document.activeElement = this; },
    setPointerCapture(id) { captures.add(id); },
    hasPointerCapture(id) { return captures.has(id); },
    releasePointerCapture(id) { captures.delete(id); },
  };
  const viewportListeners = new Set();
  const commandPanel = { contains: (element) => element === commandInput || element === commandLog };
  const window = {
    innerHeight: workspaceHeight,
    getSelection: () => ({ toString: () => selectedText }),
    visualViewport: {
      offsetTop: 0, height: workspaceHeight,
      addEventListener(_event, handler) { viewportListeners.add(handler); },
      removeEventListener(_event, handler) { viewportListeners.delete(handler); },
    },
    sessionStorage: {
      getItem(key) { if (options.storageError) throw Error("storage unavailable"); return storage.get(key) ?? null; },
      setItem(key, value) { if (options.storageError) throw Error("storage unavailable"); storage.set(key, value); },
    },
    location: { hash }, matchMedia: (query) => query.includes("prefers-reduced-motion") ? motionMedia : mobileMedia,
    history: { pushState: (_state, _unused, hash) => { window.location.hash = hash; } },
    addEventListener(event, handler) { if (!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event).add(handler); },
    removeEventListener(event, handler) { listeners.get(event)?.delete(handler); },
  };
  const Component = loadTsx("src/app/workspace.tsx", {
    "./commands.mjs": commands,
    "./terminal.mjs": terminal,
    "./welcome.mjs": welcome,
    "./behind-the-scenes": { default: loadTsx("src/app/behind-the-scenes.tsx") },
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in hooks)) hooks[index] = initial;
        return [hooks[index], (value) => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }];
      },
      useRef(initial) {
        const index = cursor++;
        return hooks[index] ||= { current: initial };
      },
      useCallback(callback, deps) {
        const index = cursor++;
        if (!hooks[index] || deps.some((value, i) => value !== hooks[index].deps[i])) hooks[index] = { callback, deps };
        return hooks[index].callback;
      },
      useEffect(callback, deps) {
        const index = cursor++;
        if (!hooks[index] || deps.some((value, i) => value !== hooks[index][i])) effects.push({ index, callback });
        hooks[index] = deps;
      },
    },
  }, {
    window, document,
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; observer = this; }
      observe() { this.observing = true; }
      disconnect() { this.observing = false; }
    },
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { callback, time: now + delay });
      scheduled.push(callback);
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
  });
  let tree;
  function render() {
    cursor = 0;
    tree = Component({ files });
    const main = nodes(tree).find((node) => node.type === "main");
    // Stable DOM stand-ins exercise the component's focus and scroll behavior.
    main.ref.current = { focus() { focused++; document.activeElement = null; } };
    nodes(tree).find((node) => node.props.id === "command-input").ref.current = commandInput;
    nodes(tree).find((node) => node.props.className === "command-toggle").ref.current = dockToggle;
    nodes(tree).find((node) => node.props.id === "command-panel").ref.current = commandPanel;
    nodes(tree).find((node) => node.props.className === "workspace-window").ref.current = { getBoundingClientRect: () => ({ top: 0, bottom: workspaceHeight }) };
    nodes(tree).find((node) => node.props.className === "window-titlebar").ref.current = { get offsetHeight() { return mobileMedia.matches ? 30 : 36; } };
    nodes(tree).find((node) => node.props.className === "terminal-bar").ref.current = { offsetHeight: 44 };
    nodes(tree).find((node) => node.props.className === "terminal-viewport").ref.current = commandLog;
    return renderToStaticMarkup(tree);
  }
  function find(predicate) { return nodes(tree).find(predicate); }
  return {
    render,
    hydrate() {
      let html;
      do {
        effects.splice(0).forEach(({ index, callback }) => { cleanups.get(index)?.(); setups.set(index, callback); cleanups.set(index, callback()); });
        html = render();
      } while (effects.length);
      return html;
    },
    replayEffects() {
      cleanups.forEach((cleanup) => cleanup?.());
      setups.forEach((callback, index) => cleanups.set(index, callback()));
      return render();
    },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const pending = [...timers].filter(([, timer]) => timer.time <= end).sort((a, b) => a[1].time - b[1].time)[0];
        if (!pending) break;
        const [id, timer] = pending;
        now = timer.time;
        timers.delete(id);
        timer.callback();
      }
      now = end;
      return render();
    },
    follow(path) {
      const anchor = { hash: `#${path}`, closest: () => ({}) };
      tree.props.onClick({ button: 0, target: { closest: () => anchor }, preventDefault() {} });
      return render();
    },
    submit(command) {
      find((node) => node.type === "input").props.onChange({ target: { value: command } });
      render();
      find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
      render();
      return this.hydrate();
    },
    key(key, composing = false, modifiers = {}) {
      let prevented = false;
      if (!modifiers.outside) document.activeElement = commandInput;
      const value = find((node) => node.type === "input").props.value;
      commandInput.selectionStart = modifiers.start ?? value.length;
      commandInput.selectionEnd = modifiers.end ?? commandInput.selectionStart;
      find((node) => node.type === "input").props.onKeyDown({ key, currentTarget: commandInput, ...modifiers, nativeEvent: { isComposing: composing, keyCode: modifiers.keyCode }, preventDefault() { prevented = true; } });
      return { html: render(), prevented, value: find((node) => node.type === "input").props.value };
    },
    type(value) {
      find((node) => node.type === "input").props.onChange({ target: { value } });
      return render();
    },
    toggleDock() {
      find((node) => node.props.className === "command-toggle").props.onClick();
      render();
      return this.hydrate();
    },
    closeDock() {
      document.activeElement = { closest: () => null };
      find((node) => node.props.className === "terminal-close").props.onClick();
      render();
      return this.hydrate();
    },
    skipWelcome() {
      find((node) => node.props.className === "welcome-skip").props.onClick();
      return render();
    },
    escape(composing = false) {
      let prevented = false;
      listeners.get("keydown")?.forEach((handler) => handler({ key: "Escape", isComposing: composing, preventDefault() { prevented = true; } }));
      return { html: render(), prevented };
    },
    selection(value) { selectedText = value; },
    resizeHeight(height, keyboard = false) {
      if (!keyboard) workspaceHeight = height;
      window.visualViewport.height = height;
      viewportListeners.forEach((handler) => handler());
      if (observer?.observing) observer.callback();
      return render();
    },
    resizeKey(key) {
      let prevented = false;
      find((node) => node.props.role === "separator").props.onKeyDown({ key, nativeEvent: {}, preventDefault() { prevented = true; } });
      return { html: render(), prevented };
    },
    pointer(action, y, id = 1, extra = {}) {
      const handlers = { down: "onPointerDown", move: "onPointerMove", up: "onPointerUp", cancel: "onPointerCancel", lost: "onLostPointerCapture" };
      find((node) => node.props.role === "separator").props[handlers[action]]({ currentTarget: separator, clientY: y, pointerId: id, button: 0, isPrimary: true, preventDefault() {}, ...extra });
      return render();
    },
    get captureCount() { return captures.size; },
    get observing() { return observer?.observing ?? false; },
    get hash() { return window.location.hash; },
    get storage() { return storage; },
    restore(hash, event = "popstate") {
      window.location.hash = hash;
      listeners.get(event).forEach((handler) => handler());
      return render();
    },
    reduce(matches) { motionMedia.change(matches); return render(); },
    mobile(matches) { mobileMedia.change(matches); return render(); },
    focusBody() { document.activeElement = { closest: () => ({}) }; },
    focusInput() { document.activeElement = commandInput; },
    focusWelcome() { document.activeElement = { closest: (selector) => selector === ".welcome-intro" ? {} : null }; },
    focusLog() { document.activeElement = commandLog; },
    scrollLog(top) { commandLog.scrollTop = top; },
    unmount() { cleanups.forEach((cleanup) => cleanup?.()); },
    staleCallbacks() { return [...scheduled]; },
    get pending() { return timers.size; },
    get focused() { return focused; },
    get commandFocus() { return document.activeElement === commandInput ? "input" : document.activeElement === dockToggle ? "toggle" : null; },
    get focusEvents() { return focusEvents; },
    get logScrollTop() { return commandLog.scrollTop; },
    get listenerCount() { return viewportListeners.size + motionMedia.listenerCount + mobileMedia.listenerCount + [...listeners.values()].reduce((n, set) => n + set.size, 0); },
  };
}

function body(html, path) {
  const section = [...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].find((match) => match[1].includes(`id="${path}"`));
  assert.ok(section, path);
  return { attributes: section[1], content: section[2] };
}
function phase(html, path, value) { assert.match(body(html, path).attributes, new RegExp(`data-phase="${value}"`)); }
function visibleFiles(html) {
  return [...html.matchAll(/<section\b([^>]*)>/g)].filter((match) => !/\shidden=/.test(match[1])).map((match) => match[1].match(/id="([^"]+)"/)[1]);
}

test("guidance appears on the initial about view and stays dismissed after browsing", async () => {
  const app = await workspace();
  assert.match(app.render(), /data-enhanced="false"/);
  assert.match(app.hydrate(), /class="browsing-guide"/);
  for (const path of ["services.txt", "skills.txt", "projects/warehouse.txt", "about.txt"])
    assert.doesNotMatch(app.follow(path), /class="browsing-guide"/, path);
});

test("restoring a direct file hash shows its title and omits the initial about guidance", async () => {
  const app = await workspace("#skills.txt");
  app.render();
  const html = app.hydrate();
  assert.match(html, /id="current-document-title">使用技術<\/h1>/);
  assert.doesNotMatch(html, /class="browsing-guide"/);
  phase(html, "skills.txt", "typing");
  phase(app.advance(600), "skills.txt", "revealing");
});

test("literal identity prefix stays plain text in both prompts and cwd stays available", async () => {
  const app = await workspace();
  const html = app.render();
  assert.match(html, /class="command-line"[^>]*aria-hidden="true"><span class="prompt">you@onewalk.dev \$ --<\/span> /);
  assert.match(html, /<label[^>]*><span class="prompt" aria-hidden="true">you@onewalk.dev \$ --<\/span>/);
  assert.match(html, /class="sr-only">you@onewalk.dev \$ -- cat ~\/onewalk\/about.txt<\/p>/);
  assert.doesNotMatch(html, /mailto:you@onewalk.dev/);
  assert.match(html, /mailto:contact@onewalk.dev/);
  app.hydrate();
  assert.match(app.submit("cd projects"), /class="command-cwd">現在地: ~\/onewalk\/projects\//);
});

test("noJS renders every body, with no busy, inert or animation wait", async () => {
  const app = await workspace("#skills.txt");
  const html = app.render();
  assert.equal(visibleFiles(html).length, 10);
  assert.match(html, /aria-busy="false"/);
  assert.doesNotMatch(html, /data-phase=|\binert=|<section[^>]*aria-hidden=/);
  assert.match(body(html, "about.txt").content, /自己紹介/);
  assert.match(body(html, "skills.txt").content, /使用技術/);
  assert.equal(app.pending, 0);
});

test("initial enhancement types for 600ms, then reveals for 180ms with static accessible text", async () => {
  const app = await workspace();
  app.render();
  let html = app.hydrate();
  phase(html, "about.txt", "typing");
  assert.match(html, /aria-busy="true"/);
  assert.doesNotMatch(body(html, "about.txt").attributes, /inert|aria-hidden/, "CSS visibility handles focus without stale React 18 inert attributes");
  assert.match(html, /class="typed-command"><span class="entry-cursor"/);
  assert.doesNotMatch(html, /<input[^>]*disabled|<button[^>]*disabled/);
  html = app.advance(300);
  phase(html, "about.txt", "typing");
  assert.match(html, /class="typed-command">cat ~\/onew/);
  phase(app.advance(299), "about.txt", "typing");
  html = app.advance(1);
  phase(html, "about.txt", "revealing");
  assert.doesNotMatch(body(html, "about.txt").attributes, /inert|aria-hidden/);
  assert.match(html, /class="typed-command">cat ~\/onewalk\/about.txt/);
  phase(app.advance(179), "about.txt", "revealing");
  html = app.advance(1);
  phase(html, "about.txt", "idle");
  assert.match(html, /aria-busy="false"/);
  assert.equal(app.pending, 0);
});

test("rapid navigation cancels old timelines and stale callbacks cannot reveal previous files", async () => {
  const app = await workspace();
  app.render(); app.hydrate(); app.advance(780);
  app.follow("services.txt"); app.advance(300);
  const stale = app.staleCallbacks();
  app.follow("skills.txt"); app.advance(150);
  let html = app.follow("projects/warehouse.txt");
  stale.forEach((callback) => callback());
  html = app.render();
  assert.deepEqual(visibleFiles(html), ["projects/warehouse.txt"]);
  phase(html, "projects/warehouse.txt", "typing");
  phase(app.advance(599), "projects/warehouse.txt", "typing");
  phase(app.advance(1), "projects/warehouse.txt", "revealing");
  html = app.advance(180);
  assert.deepEqual(visibleFiles(html), ["projects/warehouse.txt"]);
  phase(html, "projects/warehouse.txt", "idle");
  assert.equal(app.pending, 0);
});

test("same-file, help, errors and clear never restart or extend a sequence", async () => {
  const app = await workspace();
  app.render(); app.hydrate(); app.advance(300);
  const pending = app.pending;
  app.follow("about.txt"); app.submit("cat about.txt");
  app.submit("help"); app.submit("unknown"); app.submit("clear");
  assert.equal(app.pending, pending);
  phase(app.advance(300), "about.txt", "revealing");
  app.advance(180);
  for (const operation of [() => app.follow("about.txt"), () => app.submit("cat about.txt"), () => app.submit("help"), () => app.submit("unknown"), () => app.submit("clear")]) {
    const html = operation();
    phase(html, "about.txt", "idle");
    assert.match(html, /aria-busy="false"/);
    assert.equal(app.pending, 0);
  }
});

test("known cat and history navigation type selected commands; duplicate history events do not restart", async () => {
  const app = await workspace();
  app.render(); app.hydrate(); app.advance(780);
  let html = app.submit("cat skills.txt");
  phase(html, "skills.txt", "typing");
  assert.match(html, /class="sr-only">you@onewalk.dev \$ -- cat skills.txt<\/p>/);
  app.advance(780);
  html = app.restore("#services.txt");
  phase(html, "services.txt", "typing");
  app.advance(300);
  app.restore("#services.txt", "hashchange");
  phase(app.advance(300), "services.txt", "revealing");
  app.advance(180);
  html = app.restore("#skills.txt");
  phase(html, "skills.txt", "typing");
  assert.deepEqual(visibleFiles(app.advance(780)), ["skills.txt"]);
});

test("reduced motion is immediate on hydration, navigation and history", async () => {
  const app = await workspace("", true);
  app.render();
  for (const html of [app.hydrate(), app.follow("services.txt"), app.submit("cat skills.txt"), app.restore("#contact.txt")]) {
    assert.match(html, /aria-busy="false"/);
    assert.doesNotMatch(html, /data-phase="(?:typing|revealing)"|inert=""/);
  }
  assert.equal(app.pending, 0);
});

test("enabling reduced motion during typing or reveal cancels timers and reveals immediately", async () => {
  for (const elapsed of [200, 650]) {
    const app = await workspace();
    app.render(); app.hydrate(); app.advance(elapsed);
    const stale = app.staleCallbacks();
    const html = app.reduce(true);
    phase(html, "about.txt", "idle");
    assert.match(html, /aria-busy="false"/);
    assert.doesNotMatch(body(html, "about.txt").attributes, /inert|aria-hidden/);
    assert.equal(app.pending, 0);
    stale.forEach((callback) => callback());
    phase(app.render(), "about.txt", "idle");
    phase(app.reduce(false), "about.txt", "idle");
    phase(app.follow("skills.txt"), "skills.txt", "typing");
  }
});

test("focus leaves disappearing body; unmount cleans timers and media/history listeners", async () => {
  const app = await workspace();
  app.render(); app.hydrate(); app.advance(780);
  app.focusBody();
  app.submit("cat skills.txt");
  assert.equal(app.focused, 1);
  assert.ok(app.pending > 0);
  assert.equal(app.listenerCount, 5);
  const stale = app.staleCallbacks();
  app.unmount();
  assert.equal(app.pending, 0);
  assert.equal(app.listenerCount, 0);
  stale.forEach((callback) => callback());
  phase(app.render(), "skills.txt", "typing"); // No stale state update after unmount.
});

test("effect cleanup/setup re-arms a direct-hash sequence and completes its reveal", async () => {
  const app = await workspace("#skills.txt");
  app.render(); app.hydrate(); app.advance(200);
  const stale = app.staleCallbacks();
  phase(app.replayEffects(), "skills.txt", "typing");
  stale.forEach((callback) => callback());
  phase(app.render(), "skills.txt", "typing");
  phase(app.advance(600), "skills.txt", "revealing");
  const html = app.advance(180);
  phase(html, "skills.txt", "idle");
  assert.doesNotMatch(body(html, "skills.txt").attributes, /inert|aria-hidden/);
  assert.equal(app.pending, 0);
  assert.equal(app.listenerCount, 5);
});

test("initial enhancement moves focus out of SSR content before waiting", async () => {
  const app = await workspace();
  app.render(); app.focusBody();
  phase(app.hydrate(), "about.txt", "typing");
  assert.equal(app.focused, 1);
});

test("help opens hidden content with the normal sequence, no false menu selection, and return/back works", async () => {
  const app = await workspace();
  assert.doesNotMatch(app.render(), /behind-the-scenes|制作の裏側/);
  app.hydrate(); app.advance(780);
  let html = app.submit("help");
  assert.match(html, /# おまけ: cat .behind-the-scenes.txt/);
  assert.match(html, /class="command-log"[^>]*aria-label="コマンド履歴"/);
  html = app.submit("cat .behind-the-scenes.txt");
  phase(html, ".behind-the-scenes.txt", "typing");
  assert.match(html, /id="current-document-title">制作の裏側<\/h1>/);
  assert.doesNotMatch(html, /aria-current="page"/);
  assert.doesNotMatch(html.match(/<nav[\s\S]*?<\/nav>/)[0], /behind-the-scenes|制作の裏側/);
  phase(app.advance(600), ".behind-the-scenes.txt", "revealing");
  html = app.advance(180);
  assert.deepEqual(visibleFiles(html), [".behind-the-scenes.txt"]);
  assert.match(body(html, ".behind-the-scenes.txt").content, /名刺のターミナルデザインの続き/);
  assert.match(html, /href="#about.txt">自己紹介に戻る/);
  assert.deepEqual(visibleFiles(app.follow("about.txt")), ["about.txt"]);
  assert.doesNotMatch(app.render(), /<section[^>]*id=".behind-the-scenes.txt"/);
  assert.deepEqual(visibleFiles(app.restore("#.behind-the-scenes.txt")), [".behind-the-scenes.txt"]);
  assert.deepEqual(visibleFiles(app.restore("#about.txt")), ["about.txt"]);
});

test("direct hidden hashes stay absent without JS and restore safely with reduced motion", async () => {
  const app = await workspace("#.behind-the-scenes.txt", true);
  assert.doesNotMatch(app.render(), /behind-the-scenes|制作の裏側/);
  const html = app.hydrate();
  assert.deepEqual(visibleFiles(html), [".behind-the-scenes.txt"]);
  phase(html, ".behind-the-scenes.txt", "idle");
  assert.equal(app.pending, 0);
});

test("menu browsing creates no scrollback; command scrollback is bounded and clear retains body", async () => {
  const app = await workspace("", true);
  app.render(); app.hydrate();
  for (const path of ["services.txt", "skills.txt", "about.txt"]) assert.doesNotMatch(app.follow(path), /class="command-log"/);
  for (let index = 0; index < 30; index++) app.submit(`unknown-${index}`);
  let html = app.render();
  assert.equal((html.match(/class="log-entry"/g) || []).length, 12);
  assert.doesNotMatch(html, /unknown-0<\/p>/);
  html = app.submit("clear");
  assert.doesNotMatch(html, /class="command-log"/);
  assert.deepEqual(visibleFiles(html), ["about.txt"]);
  assert.equal(app.key("ArrowUp").value, "clear");
  assert.equal(app.key("ArrowUp").value, "unknown-29");
});

test("input recalls history and draft; IME and unmatched Tab retain native keyboard behavior", async () => {
  const app = await workspace("", true);
  app.render(); app.hydrate();
  app.submit("help"); app.submit("ls"); app.type("draft");
  assert.equal(app.key("ArrowUp", true).prevented, false);
  assert.equal(app.key("ArrowUp").value, "ls");
  assert.equal(app.key("ArrowUp").value, "help");
  assert.equal(app.key("ArrowUp").value, "help");
  assert.equal(app.key("ArrowDown").value, "ls");
  assert.equal(app.key("ArrowDown").value, "draft");
  assert.equal(app.key("Tab").prevented, false);
  assert.equal(app.key("Enter").prevented, false);
});

test("mobile dock starts closed without focus, opens intentionally, and closes with keyboard blur and focus return", async () => {
  const app = await workspace("", true, true);
  assert.match(app.render(), /class="command-dock" data-open="false"/);
  let html = app.hydrate();
  assert.match(html, /class="command-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="command-panel"/);
  assert.deepEqual(app.focusEvents, []);
  html = app.toggleDock();
  assert.match(html, /class="command-dock" data-open="true"/);
  assert.match(html, /class="command-toggle"[^>]*aria-expanded="true"/);
  assert.match(html, /class="dock-chevron" aria-hidden="true">▾/);
  assert.equal(app.commandFocus, "input");
  assert.deepEqual(app.focusEvents, [["input", { preventScroll: true }]]);
  html = app.toggleDock();
  assert.match(html, /class="command-dock" data-open="false"/);
  assert.equal(app.commandFocus, "toggle");
  assert.deepEqual(app.focusEvents.slice(-2), [["blur"], ["toggle", { preventScroll: true }]]);
  app.unmount();
  assert.equal(app.listenerCount, 0);
});

test("closing/reopening mobile preserves the draft, recall position, scrollback and its scroll position", async () => {
  const app = await workspace("", true, true);
  app.render(); app.hydrate(); app.toggleDock();
  app.submit("help"); app.submit("ls"); app.type("cat sk");
  assert.equal(app.key("ArrowUp").value, "ls");
  app.scrollLog(17);
  app.toggleDock();
  let html = app.toggleDock();
  assert.equal(app.logScrollTop, 17);
  assert.equal((html.match(/id="command-input"/g) || []).length, 1);
  assert.equal((html.match(/class="command-log"/g) || []).length, 1);
  assert.equal((html.match(/class="log-entry"/g) || []).length, 2);
  assert.match(html, /<input[^>]*value="ls"/);
  assert.equal(app.key("ArrowDown").value, "cat sk");
  app.toggleDock();
  html = app.toggleDock();
  assert.match(html, /<input[^>]*value="cat sk"/);
});

test("responsive changes retain disclosure state and move focus away from newly hidden controls", async () => {
  const app = await workspace("", true, true);
  app.render(); app.hydrate();
  app.toggleDock(); app.type("draft"); app.toggleDock();
  assert.equal(app.commandFocus, "toggle");
  // Desktop and mobile preserve the same collapsed terminal state.
  let html = app.mobile(false);
  assert.match(html, /class="command-panel" id="command-panel"/);
  assert.doesNotMatch(html, /class="command-panel"[^>]*(?:hidden=|inert=|aria-hidden=)/);
  assert.equal(app.commandFocus, "toggle");
  html = app.mobile(true);
  assert.match(html, /class="command-dock" data-open="false"/);
  assert.equal(app.commandFocus, "toggle");
  app.mobile(false); app.submit("help"); app.focusLog();
  app.mobile(true);
  assert.equal(app.commandFocus, "toggle");
  app.toggleDock();
  html = app.mobile(false);
  assert.match(html, /class="command-dock" data-open="true"/);
  assert.equal(app.commandFocus, "input");
  assert.match(app.mobile(true), /class="command-dock" data-open="true"/);
  app.toggleDock();
  assert.equal(app.listenerCount, 5, "disclosure changes do not leak media listeners");
});

test("mobile help and hidden cat remain open to read, including normal navigation and reduced motion", async () => {
  for (const reduced of [false, true]) {
    const app = await workspace("", reduced, true);
    app.render(); app.hydrate(); app.advance(780); app.toggleDock();
    let html = app.submit("help");
    assert.match(html, /class="command-dock" data-open="true"/);
    assert.match(html, /# おまけ: cat .behind-the-scenes.txt/);
    html = app.submit("cat .behind-the-scenes.txt");
    assert.match(html, /class="command-dock" data-open="true"/);
    assert.equal(app.commandFocus, "input");
    html = app.advance(780);
    assert.deepEqual(visibleFiles(html), [".behind-the-scenes.txt"]);
    assert.match(body(html, ".behind-the-scenes.txt").content, /名刺のターミナルデザインの続き/);
    assert.match(app.follow("about.txt"), /class="command-dock" data-open="true"/);
    assert.match(app.toggleDock(), /class="command-dock" data-open="false"/);
  }
});

test("desktop and mobile have one permanent credit outside the menu and panel", async () => {
  for (const mobile of [false, true]) {
    const app = await workspace("", true, mobile);
    app.render();
    for (const html of [app.hydrate(), app.toggleDock(), app.toggleDock()]) {
      assert.equal((html.match(/© Kazuho Utsunomiya/g) || []).length, 1);
      assert.doesNotMatch(html.match(/<aside\b[\s\S]*?<\/aside>/)[0], /copyright|©/);
      assert.match(html, /<div class="terminal-bar"><button class="command-toggle"[\s\S]*?<\/button><p class="copyright"><small>© Kazuho Utsunomiya<\/small><\/p><\/div>/);
    }
    const html = app.render();
    assert.match(html, /data-open="false"/);
    assert.deepEqual(app.focusEvents[0], ["input", { preventScroll: true }]);
  }
});

test("fresh tab welcome overlaps command typing and completes in 3000ms with a readable direct hash", async () => {
  const app = await workspace("#skills.txt", false, false, { fresh: true });
  const server = app.render();
  assert.doesNotMatch(server, /welcome-intro|data-welcome=|スキップ/);
  let html = app.hydrate();
  assert.match(html, /data-welcome="playing"/);
  assert.match(html, /class="welcome-copy" aria-hidden="true"/);
  assert.match(html, /Welcome, visitor\./);
  assert.match(html, /role="status">ポートフォリオを開いています。/);
  assert.match(html, /<button class="welcome-skip" type="button">スキップ<\/button>/);
  assert.deepEqual(app.focusEvents, []);
  assert.equal(app.focused, 0);
  phase(app.advance(780), "skills.txt", "idle");
  assert.match(app.advance(2219), /data-welcome="playing"/);
  html = app.advance(1);
  assert.doesNotMatch(html, /welcome-intro|data-welcome=/);
  assert.match(html, /aria-busy="false"/);
  assert.equal(app.hash, "#skills.txt");
  assert.deepEqual(visibleFiles(html), ["skills.txt"]);
  assert.equal(app.pending, 0);
  assert.equal(app.listenerCount, 5);
  assert.equal(app.focused, 0, "normal completion never steals focus");
  assert.equal(app.storage.get("onewalk.welcome.seen"), "1");
  assert.doesNotMatch(app.restore("#contact.txt"), /data-welcome=/);
  assert.doesNotMatch(app.restore("#skills.txt", "hashchange"), /data-welcome=/);
  const reload = await workspace("#skills.txt", false, false, { storage: app.storage });
  reload.render();
  assert.doesNotMatch(reload.hydrate(), /welcome-intro|data-welcome=/);
});

test("welcome skip and Escape release the current document immediately and stop intercepting keys", async () => {
  for (const method of ["skip", "escape"]) {
    const app = await workspace("#contact.txt", false, true, { fresh: true });
    app.render(); app.hydrate(); app.advance(120);
    const stale = app.staleCallbacks();
    if (method === "skip") app.skipWelcome();
    else {
      assert.equal(app.escape(true).prevented, false, "IME Escape remains native");
      assert.equal(app.escape().prevented, true);
    }
    const html = app.hydrate();
    assert.doesNotMatch(html, /welcome-intro|data-welcome=/);
    phase(html, "contact.txt", "idle");
    assert.equal(app.pending, 0);
    assert.equal(app.focused, 1, "explicit dismissal focuses the now-visible main");
    assert.equal(app.commandFocus, null);
    assert.equal(app.hash, "#contact.txt");
    stale.forEach((callback) => callback());
    assert.equal(app.escape().prevented, false);
    assert.doesNotMatch(app.render(), /data-welcome=/);
    app.toggleDock(); app.type("draft");
    assert.equal(app.escape().prevented, false);
    assert.match(app.render(), /value="draft"/);
  }
});

test("welcome bypasses reduced motion, seen tab, storage denial and preexisting focus", async () => {
  for (const mode of ["reduced", "seen", "storage", "focused"]) {
    const app = await workspace("#services.txt", mode === "reduced", false, { fresh: mode !== "seen", storageError: mode === "storage" });
    app.render();
    if (mode === "focused") app.focusInput();
    const html = app.hydrate();
    assert.doesNotMatch(html, /welcome-intro|data-welcome=/, mode);
    assert.equal(app.hash, "#services.txt");
    if (mode === "reduced") {
      phase(html, "services.txt", "idle");
      assert.equal(app.pending, 0);
    }
  }
});

test("welcome motion changes and StrictMode cleanup cannot leave stale blocking state", async () => {
  const app = await workspace("#skills.txt", false, false, { fresh: true });
  app.render(); app.hydrate(); app.advance(200);
  const stale = app.staleCallbacks();
  assert.match(app.replayEffects(), /data-welcome="playing"/);
  stale.forEach((callback) => callback());
  assert.match(app.render(), /data-welcome="playing"/);
  let html = app.advance(3000);
  assert.doesNotMatch(html, /data-welcome=/);
  phase(html, "skills.txt", "idle");
  assert.equal(app.pending, 0);
  assert.equal(app.listenerCount, 5);
  app.unmount();
  assert.equal(app.listenerCount, 0);

  const reduced = await workspace("", false, false, { fresh: true });
  reduced.render(); reduced.hydrate(); reduced.advance(100);
  html = reduced.reduce(true);
  assert.doesNotMatch(html, /data-welcome=/);
  phase(html, "about.txt", "idle");
  assert.equal(reduced.pending, 0);
  assert.doesNotMatch(reduced.reduce(false), /data-welcome=/);

  const removed = await workspace("", false, false, { fresh: true });
  removed.render(); removed.hydrate();
  const callbacks = removed.staleCallbacks();
  removed.unmount();
  assert.equal(removed.pending, 0);
  assert.equal(removed.listenerCount, 0);
  callbacks.forEach((callback) => callback());
  // Cleanup releases state; stale callbacks cannot restart or focus removed UI.
  assert.doesNotMatch(removed.render(), /data-welcome=/);
  assert.equal(removed.focused, 0);
});


test("natural welcome completion returns focus only when its skip control held focus", async () => {
  const app = await workspace("#contact.txt", false, false, { fresh: true });
  app.render(); app.hydrate(); app.focusWelcome(); app.advance(3000);
  app.hydrate();
  assert.equal(app.focused, 1);
  assert.equal(app.commandFocus, null);
  assert.equal(app.hash, "#contact.txt");
});

test("one viewport contains selectable scrollback followed by the native prompt/input, with structured ls", async () => {
  const app = await workspace("", true);
  app.render(); app.hydrate(); app.toggleDock();
  const html = app.submit("ls");
  assert.equal((html.match(/class="terminal-viewport"/g) || []).length, 1);
  assert.ok(html.indexOf('class="command-log"') < html.indexOf('class="command-form"'));
  assert.match(html, /class="listing-directory">projects\/<span class="sr-only">（ディレクトリ）/);
  assert.match(html, /class="listing-file">about.txt/);
  assert.match(html, /<ul class="terminal-listing" aria-label="ファイル一覧">/);
  assert.doesNotMatch(html, /contenteditable|user-select: ?none|behind-the-scenes/);
  assert.match(html, /<input[^>]*type="text"/);
  assert.equal(app.logScrollTop, 100);
  app.scrollLog(17);
  app.type("cat s"); app.hydrate();
  assert.equal(app.logScrollTop, 17, "typing does not pull readers away from old output");
  app.submit("pwd");
  assert.equal(app.logScrollTop, 100, "new output scrolls to the input");
});

function terminalHeight(html) {
  return Number(html.match(/--terminal-height:(\d+)px/)[1]);
}

test("both widths open a large independent panel with title, close, directory, then one log/input flow", async () => {
  for (const mobile of [false, true]) {
    const app = await workspace("", true, mobile, { height: 800 });
    assert.match(app.render(), /data-open="false"/);
    app.hydrate();
    const opened = app.toggleDock();
    const available = 800 - (mobile ? 30 : 36) - 44 - 2;
    assert.equal(terminalHeight(opened), mobile ? Math.floor(available * .6) : Math.round(available * .48));
    const html = app.submit("ls");
    assert.equal((html.match(/class="terminal-close"/g) || []).length, 1);
    assert.match(html, /<h2 id="terminal-title">Terminal<\/h2>/);
    assert.match(html, /class="terminal-close"[^>]*type="button"[^>]*aria-label="ターミナルを閉じる"/);
    const header = html.indexOf('class="terminal-header"');
    const directory = html.indexOf('class="command-cwd"');
    const viewport = html.indexOf('class="terminal-viewport"');
    const log = html.indexOf('class="command-log"');
    const input = html.indexOf('class="command-form"');
    const footer = html.indexOf('class="terminal-bar"');
    assert.ok(header < directory && directory < viewport && viewport < log && log < input && input < footer);
    assert.match(html, /class="sr-only" id="command-help">サイト内の仮想ファイルを操作 \/ help コマンド一覧/);
    assert.doesNotMatch(html, /class="input-help"/);
    assert.match(html, /placeholder="help で使い方を表示"/);
    assert.equal((html.match(/id="command-input"/g) || []).length, 1);
    assert.equal((html.match(/class="command-log"/g) || []).length, 1);
    app.unmount();
  }
});

test("header close returns focus and preserves draft, recall, scrollback, completion and desktop size", async () => {
  for (const mobile of [false, true]) {
    const app = await workspace("", true, mobile);
    app.render(); app.hydrate(); app.toggleDock();
    if (!mobile) app.resizeKey("ArrowUp");
    app.submit("help"); app.submit("ls"); app.type("cat sk"); app.key("ArrowUp");
    const height = terminalHeight(app.render());
    app.scrollLog(17);
    assert.match(app.closeDock(), /data-open="false"/);
    assert.equal(app.commandFocus, "toggle");
    assert.deepEqual(app.focusEvents.slice(-2), [["blur"], ["toggle", { preventScroll: true }]]);
    let html = app.toggleDock();
    assert.equal(terminalHeight(html), height);
    assert.equal(app.logScrollTop, 17);
    assert.equal((html.match(/class="log-entry"/g) || []).length, 2);
    assert.match(html, /<input[^>]*value="ls"/);
    assert.equal(app.key("ArrowDown").value, "cat sk");
    app.type("c"); app.key("Tab"); app.hydrate();
    app.closeDock();
    html = app.toggleDock();
    assert.match(html, /aria-label="補完候補"><li>cat<\/li><li>cd<\/li><li>clear<\/li>/);
    app.unmount();
  }
});

test("keyboard shrink uses visible app height and restores preferred desktop size after resize or mobile", async () => {
  const app = await workspace("", true);
  app.render(); app.hydrate(); app.toggleDock();
  const preferred = terminalHeight(app.resizeKey("ArrowUp").html);
  app.type("cat sk");
  let html = app.resizeHeight(260, true);
  app.hydrate();
  assert.match(html, /data-terminal-open="true"[^>]*style="--workspace-height:260px"/);
  assert.equal(terminalHeight(html), 106);
  assert.match(html, /<input[^>]*value="cat sk"/);
  html = app.resizeHeight(800, true);
  assert.equal(terminalHeight(html), preferred);
  app.mobile(true);
  assert.equal(terminalHeight(app.render()), 434);
  app.closeDock(); app.toggleDock();
  html = app.mobile(false);
  assert.equal(terminalHeight(html), preferred);
  app.pointer("down", 500);
  app.closeDock();
  assert.equal(app.captureCount, 0);
  assert.equal(app.commandFocus, "toggle");
  app.unmount();
});

test("Tab completes at the caret, offers bounded ambiguity, and preserves native escape routes", async () => {
  const app = await workspace("", true);
  app.render(); app.hydrate(); app.toggleDock();
  for (const value of ["", "unknown", "cat missing", "cat .behind"]) {
    app.type(value);
    assert.equal(app.key("Tab").prevented, false, value);
  }
  app.type("cat sk");
  assert.equal(app.key("Tab", false, { shiftKey: true }).prevented, false);
  assert.equal(app.key("Tab", false, { start: 3, end: 3 }).prevented, false);
  assert.equal(app.key("Tab", false, { start: 4, end: 6 }).prevented, false);
  assert.equal(app.key("Tab", true).prevented, false);
  let result = app.key("Tab");
  assert.equal(result.prevented, true);
  assert.equal(result.value, "cat skills.txt");
  app.type("c");
  result = app.key("Tab");
  assert.equal(result.value, "c");
  assert.match(result.html, /aria-label="補完候補"><li>cat<\/li><li>cd<\/li><li>clear<\/li>/);
  assert.doesNotMatch(result.html, /behind-the-scenes/);
  assert.equal(app.key("Tab", false, { shiftKey: true }).prevented, false);
  app.submit("cd projects"); app.type("cat war");
  assert.equal(app.key("Tab").value, "cat warehouse.txt");
});

test("Ctrl+L clears only display and suggestions, preserving draft, cwd, body and recall history", async () => {
  const app = await workspace("", true);
  app.render(); app.hydrate(); app.toggleDock();
  app.submit("cd projects"); app.submit("ls"); app.type("cat ca"); app.key("Tab");
  let result = app.key("l", false, { ctrlKey: true });
  assert.equal(result.prevented, true);
  assert.equal(result.value, "cat ca");
  assert.doesNotMatch(result.html, /class="command-log"|class="completion-suggestions"/);
  assert.match(result.html, /現在地: ~\/onewalk\/projects\//);
  assert.deepEqual(visibleFiles(result.html), ["projects/"]);
  assert.equal(app.key("ArrowUp").value, "ls");
  assert.equal(app.key("ArrowDown").value, "cat ca");
  result = { html: app.submit("clear") };
  assert.doesNotMatch(result.html, /class="command-log"/);
  assert.equal(app.key("ArrowUp").value, "clear");
  assert.equal(app.key("ArrowUp").value, "ls");
});

test("Ctrl+C cancels drafts safely while native copy, Command+C, IME and outside focus stay native", async () => {
  const app = await workspace("", true);
  app.render(); app.hydrate(); app.toggleDock(); app.submit("help"); app.type("cat sk");
  for (const [key, composing, options] of [
    ["c", false, { ctrlKey: true, start: 0, end: 3 }],
    ["c", false, { metaKey: true }],
    ["c", true, { ctrlKey: true }], ["l", true, { ctrlKey: true }],
    ["c", false, { ctrlKey: true, keyCode: 229 }],
  ]) {
    const result = app.key(key, composing, options);
    assert.equal(result.prevented, false);
    assert.equal(result.value, "cat sk");
  }
  app.selection("selected output");
  assert.equal(app.key("c", false, { ctrlKey: true }).prevented, false);
  app.selection("");
  app.focusLog();
  for (const key of ["c", "l", "Tab", "ArrowUp"]) assert.equal(app.key(key, false, { ctrlKey: key !== "Tab" && key !== "ArrowUp", outside: true }).prevented, false);
  const result = app.key("c", false, { ctrlKey: true });
  assert.equal(result.prevented, true);
  assert.equal(result.value, "");
  assert.match(result.html, /\^C<\/p><pre>入力を中止しました。/);
  assert.equal(app.key("ArrowUp").value, "help", "cancel is not entered into recall history");
  assert.equal(app.key("ArrowDown").value, "", "cancel discards the recalled draft too");
});

function separatorValues(html) {
  const tag = html.match(/<div class="terminal-resizer"[^>]*>/)?.[0];
  assert.ok(tag);
  assert.match(tag, /role="separator" tabindex="0"/);
  assert.match(tag, /aria-orientation="horizontal"/);
  return Object.fromEntries(["min", "max", "now"].map((key) => [key, Number(tag.match(new RegExp(`aria-value${key}="(\\d+)"`))[1])]));
}

test("desktop resize uses captured pointers, pixel ARIA, bounds, keyboard and in-memory reopen height", async () => {
  const app = await workspace("", true, false, { height: 800 });
  assert.doesNotMatch(app.render(), /role="separator"/);
  app.hydrate();
  let html = app.toggleDock();
  assert.deepEqual(separatorValues(html), { min: 160, max: 430, now: 345 });
  assert.equal(app.observing, true);
  app.pointer("down", 500);
  assert.equal(app.captureCount, 1);
  html = app.pointer("move", -1000);
  assert.equal(separatorValues(html).now, 430);
  app.pointer("move", 0, 9);
  assert.equal(separatorValues(app.render()).now, 430, "other pointers cannot resize");
  html = app.pointer("move", 1000);
  assert.equal(separatorValues(html).now, 160);
  app.pointer("up", 1000);
  assert.equal(app.captureCount, 0);
  html = app.resizeKey("ArrowUp").html;
  assert.equal(separatorValues(html).now, 180);
  assert.equal(app.resizeKey("Tab").prevented, false);
  app.toggleDock();
  assert.equal(app.observing, false);
  assert.equal(app.listenerCount, 5);
  assert.doesNotMatch(app.render(), /role="separator"/);
  html = app.toggleDock();
  assert.equal(separatorValues(html).now, 180);
  app.pointer("down", 500); app.pointer("cancel", 500);
  assert.equal(app.captureCount, 0);
  app.pointer("down", 500); app.pointer("lost", 500);
  assert.equal(app.captureCount, 0);
  app.pointer("down", 500); app.unmount();
  assert.equal(app.captureCount, 0);
  assert.equal(app.listenerCount, 0);
  assert.equal(app.observing, false);
});

test("viewport/keyboard changes re-clamp desktop height; mobile never renders a resize tab stop", async () => {
  for (const width of [320, 390, 1440]) {
    const mobile = width <= 760;
    const app = await workspace("", true, mobile, { height: 800 });
    app.render(); app.hydrate();
    let html = app.toggleDock();
    if (mobile) assert.doesNotMatch(html, /role="separator"/);
    else {
      assert.equal(separatorValues(html).now, 345);
      app.pointer("down", 400);
    }
    html = app.resizeHeight(260, true);
    assert.equal(app.captureCount, 0);
    if (mobile) {
      assert.doesNotMatch(html, /role="separator"/);
      assert.equal(terminalHeight(html), 132, "short mobile panels fit header and input above the footer");
      assert.match(html, /data-terminal-open="true"[^>]*style="--workspace-height:260px"/);
    }
    else assert.deepEqual(separatorValues(html), { min: 106, max: 106, now: 106 });
    assert.match(html, /class="terminal-bar"/);
    assert.equal((html.match(/© Kazuho Utsunomiya/g) || []).length, 1);
    html = app.resizeHeight(600);
    if (!mobile) assert.deepEqual(separatorValues(html), { min: 160, max: 310, now: 249 });
    app.unmount();
    assert.equal(app.listenerCount, 0);
  }
  const app = await workspace("", true);
  app.render(); app.hydrate(); app.toggleDock(); app.pointer("down", 500);
  assert.doesNotMatch(app.mobile(true), /role="separator"/);
  assert.equal(app.captureCount, 0);
  assert.match(app.mobile(false), /role="separator"/);
  app.pointer("down", 500); app.toggleDock();
  assert.equal(app.captureCount, 0, "closing during a drag releases capture");
});

test("injection error text is escaped through the actual React terminal renderer", async () => {
  const app = await workspace("", true);
  app.render(); app.hydrate(); app.toggleDock();
  const html = app.submit('<img src=x onerror=alert(1)>');
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img|<script|innerHTML/);
  assert.match(html, /class="command-error"/);
});
