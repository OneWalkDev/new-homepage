"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from "react";
import { appendBounded, commandForPath, HIDDEN_FILE, HISTORY_LIMIT, INPUT_LIMIT, interpret, LOG_LIMIT, pathFromHash, ROOT } from "./commands.mjs";
import { clampHeight, completeInput, initialTerminalHeight, terminalBounds } from "./terminal.mjs";
import BehindTheScenes from "./behind-the-scenes";
import { startWelcome } from "./welcome.mjs";

type File = { path: string; label: string; content: ReactNode };
type Listing = { name: string; label: string; directory: boolean }[];
type Entry = { command: string; output: string; error: boolean; listing?: Listing };
const PROMPT = "you@onewalk.dev $ --";
const TYPE_MS = 600;
const REVEAL_MS = 180;
type Sequence = { phase: "idle" | "typing" | "revealing"; command: string; text: string };

export default function Workspace({ files }: { files: File[] }) {
  const [active, setActive] = useState("about.txt");
  const [welcomePlaying, setWelcomePlaying] = useState(false);
  const welcomeResume = useRef(false);
  const welcomeFocus = useRef(false);
  const welcomeControl = useRef<{ skip: () => void; dispose: () => void } | null>(null);
  const [ready, setReady] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);
  const [cwd, setCwd] = useState("");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draft, setDraft] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [panelHeight, setPanelHeight] = useState(0);
  const preferredDesktopHeight = useRef<number | null>(null);
  const [visibleHeight, setVisibleHeight] = useState<number | null>(null);
  const [bounds, setBounds] = useState({ min: 160, max: 300 });
  const [desktopResize, setDesktopResize] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [sequence, setSequence] = useState<Sequence>({ phase: "idle", command: commandForPath("about.txt"), text: commandForPath("about.txt") });
  const output = useRef<HTMLDivElement>(null);
  const terminalViewport = useRef<HTMLDivElement>(null);
  const workspaceWindow = useRef<HTMLDivElement>(null);
  const windowTitlebar = useRef<HTMLDivElement>(null);
  const terminalBar = useRef<HTMLDivElement>(null);
  const drag = useRef<{ element: HTMLDivElement; id: number; y: number; height: number } | null>(null);
  const commandPanel = useRef<HTMLDivElement>(null);
  const commandInput = useRef<HTMLInputElement>(null);
  const dockToggle = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const activeRef = useRef("about.txt");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const generation = useRef(0);
  const reducedMotion = useRef(false);
  const current = active === HIDDEN_FILE.path ? HIDDEN_FILE : files.find((file) => file.path === active) || files[0];
  // The hidden file has no server/noJS body or navigation entry.
  const displayedFiles = ready && active === HIDDEN_FILE.path
    ? [...files, { ...HIDDEN_FILE, content: <BehindTheScenes /> }]
    : files;

  function log(command: string, message: string, error = false, listing?: Listing) {
    setEntries((previous) => appendBounded(previous, { command, output: message, error, listing }, LOG_LIMIT));
    setAnnouncement(message || command);
  }

  const cancelSequence = useCallback(() => {
    generation.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const startSequence = useCallback((command: string) => {
    cancelSequence();
    if (reducedMotion.current) {
      setSequence({ phase: "idle", command, text: command });
      return;
    }
    if (document.activeElement?.closest(".file-output")) main.current?.focus({ preventScroll: true });
    const version = generation.current;
    // Register a bounded timeline before hiding anything. CSS also releases its
    // visual wait after 600ms, so a failed callback cannot conceal the body forever.
    const steps = Math.min(command.length, 30);
    for (let step = 1; step <= steps; step++) {
      timers.current.push(setTimeout(() => {
        if (version !== generation.current) return;
        const text = command.slice(0, Math.ceil(command.length * step / steps));
        setSequence({ phase: step === steps ? "revealing" : "typing", command, text });
      }, TYPE_MS * step / steps));
    }
    timers.current.push(setTimeout(() => {
      if (version !== generation.current) return;
      timers.current = [];
      setSequence({ phase: "idle", command, text: command });
    }, TYPE_MS + REVEAL_MS));
    setSequence({ phase: "typing", command, text: "" });
  }, [cancelSequence]);

  const select = useCallback((path: string, command = commandForPath(path)) => {
    if (path === activeRef.current) return;
    if (document.activeElement?.closest(".file-output")) main.current?.focus({ preventScroll: true });
    if (path !== "about.txt") setShowGuide(false);
    activeRef.current = path;
    setActive(path);
    startSequence(command);
    if (path.startsWith("projects/")) setExpanded(true);
    if (output.current) output.current.scrollTop = 0;
  }, [startSequence]);

  function closeMobileMap() {
    if (window.matchMedia("(max-width: 760px)").matches) setMapOpen(false);
  }

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = motionMedia.matches;
    const motionChange = () => {
      reducedMotion.current = motionMedia.matches;
      if (motionMedia.matches) {
        cancelSequence();
        setSequence((previous) => ({ ...previous, phase: "idle", text: previous.command }));
      }
    };
    motionMedia.addEventListener("change", motionChange);
    const restore = () => {
      const path = pathFromHash(window.location.hash) || "about.txt";
      if (path !== activeRef.current) {
        // A restored document may hide the link that currently has focus.
        if (document.activeElement?.closest(".file-output, .page-map")) main.current?.focus({ preventScroll: true });
        select(path);
        closeMobileMap();
        setCwd(path.startsWith("projects/") ? "projects/" : "");
      }
    };
    restore();
    // Also re-arm after an effect cleanup/setup (including Strict Mode), even
    // when restoring the same direct hash no longer changes activeRef.
    startSequence(commandForPath(activeRef.current));
    // The initial command finishes under the intro, never as a second delay.
    const welcome = startWelcome({
      storage: { getItem: (key: string) => window.sessionStorage.getItem(key), setItem: (key: string, value: string) => window.sessionStorage.setItem(key, value) },
      motion: motionMedia,
      events: window,
      schedule: (callback: () => void, delay: number) => setTimeout(callback, delay),
      cancel: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer),
      resume: welcomeResume.current,
      canPlay: () => !document.activeElement || document.activeElement === document.body,
      onStart: () => { welcomeResume.current = true; setWelcomePlaying(true); },
      onFinish: (explicit: boolean) => {
        cancelSequence();
        setSequence((previous) => ({ ...previous, phase: "idle", text: previous.command }));
        welcomeResume.current = false;
        welcomeFocus.current = explicit || !!document.activeElement?.closest(".welcome-intro");
        setWelcomePlaying(false);
      },
    });
    welcomeControl.current = welcome;
    setReady(true);
    const media = window.matchMedia("(max-width: 760px)");
    const resize = () => setMapOpen(!media.matches);
    resize();
    media.addEventListener("change", resize);
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    return () => {
      welcome.dispose();
      welcomeControl.current = null;
      setWelcomePlaying(false);
      cancelSequence();
      motionMedia.removeEventListener("change", motionChange);
      media.removeEventListener("change", resize);
      window.removeEventListener("hashchange", restore);
      window.removeEventListener("popstate", restore);
    };
  }, [files, cancelSequence, select, startSequence]);

  useEffect(() => {
    if (!welcomePlaying && welcomeFocus.current) {
      welcomeFocus.current = false;
      main.current?.focus({ preventScroll: true });
    }
  }, [welcomePlaying]);

  useEffect(() => {
    if (terminalViewport.current) terminalViewport.current.scrollTop = terminalViewport.current.scrollHeight;
  }, [entries]);

  useEffect(() => {
    if (suggestions.length && terminalViewport.current) terminalViewport.current.scrollTop = terminalViewport.current.scrollHeight;
  }, [suggestions]);

  useEffect(() => {
    if (document.activeElement === commandInput.current && terminalViewport.current) {
      terminalViewport.current.scrollTop = terminalViewport.current.scrollHeight;
    }
  }, [panelHeight]);

  const stopResize = useCallback(() => {
    const current = drag.current;
    drag.current = null;
    if (current?.element.hasPointerCapture(current.id)) current.element.releasePointerCapture(current.id);
  }, []);

  useEffect(() => {
    if (!dockOpen) return;
    const media = window.matchMedia("(max-width: 760px)");
    const resize = () => {
      stopResize();
      setDesktopResize(!media.matches);
      const rect = workspaceWindow.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      setVisibleHeight(viewport?.height ?? null);
      const chromeHeight = (windowTitlebar.current?.offsetHeight ?? 0) + (terminalBar.current?.offsetHeight ?? 0) + 2;
      const available = Math.max(0, Math.min(rect.bottom, bottom) - rect.top - chromeHeight);
      const next = terminalBounds(available, media.matches);
      setBounds(next);
      const preferred = media.matches ? initialTerminalHeight(available, true) : preferredDesktopHeight.current ?? initialTerminalHeight(available);
      setPanelHeight(clampHeight(preferred, next));
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (workspaceWindow.current) observer.observe(workspaceWindow.current);
    media.addEventListener("change", resize);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    return () => {
      stopResize();
      observer.disconnect();
      media.removeEventListener("change", resize);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, [dockOpen, stopResize]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    // Only an explicit opening focuses the input; initial hydration never does.
    if (dockOpen) commandInput.current?.focus({ preventScroll: true });
    const resize = () => {
      if (!dockOpen && commandPanel.current?.contains(document.activeElement)) {
        commandInput.current?.blur();
        dockToggle.current?.focus({ preventScroll: true });
      }
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, [dockOpen]);

  function toggleDock() {
    if (dockOpen) {
      closeDock();
    } else {
      setDockOpen(true);
    }
  }

  function closeDock() {
    stopResize();
    commandInput.current?.blur();
    dockToggle.current?.focus({ preventScroll: true });
    setDockOpen(false);
  }

  function navigate(path: string, command = commandForPath(path), nextCwd = path.startsWith("projects/") ? "projects/" : "") {
    select(path, command);
    closeMobileMap();
    setCwd(nextCwd);
    if (pathFromHash(window.location.hash) !== path) window.history.pushState(null, "", `#${path}`);
    const label = path === HIDDEN_FILE.path ? HIDDEN_FILE.label : files.find((file) => file.path === path)?.label;
    setAnnouncement(`${label}を表示しました。`);
  }

  // Keep ordinary anchors in the server HTML; enhance only known local paths.
  function followFile(event: MouseEvent<HTMLElement>) {
    if (!ready || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
    if (anchor?.hash === "#main") {
      event.preventDefault();
      document.getElementById("main")?.focus();
      return;
    }
    const path = anchor && pathFromHash(anchor.hash);
    if (!path) return;
    event.preventDefault();
    // Move focus out of content that is about to be hidden. Desktop menu links stay focused.
    if (!anchor?.closest(".page-map") || window.matchMedia("(max-width: 760px)").matches) main.current?.focus({ preventScroll: true });
    navigate(path);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuggestions([]);
    const command = input.trim();
    const result = interpret(command, cwd);
    if (result.kind === "empty") return;
    setInput("");
    setDraft("");
    setHistoryIndex(-1);
    setHistory((previous) => appendBounded(previous, command, HISTORY_LIMIT));
    if (result.kind === "clear") {
      setEntries([]);
      setAnnouncement("端末の表示を消去しました。本文と入力履歴はそのままです。");
      return;
    }
    if (result.kind === "navigate") {
      navigate(result.path, command, result.cwd);
      log(command, result.output);
    }
    else log(command, result.output, result.kind === "error", "listing" in result ? result.listing : undefined);
  }

  function recall(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || document.activeElement !== event.currentTarget) return;
    if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
      if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        setEntries([]);
        setSuggestions([]);
        setAnnouncement("端末の表示を消去しました。本文と入力履歴はそのままです。");
        return;
      }
      if (event.key.toLowerCase() === "c") {
        if (event.currentTarget.selectionStart !== event.currentTarget.selectionEnd || window.getSelection()?.toString()) return;
        event.preventDefault();
        setInput("");
        setDraft("");
        setHistoryIndex(-1);
        setSuggestions([]);
        log("^C", "入力を中止しました。");
        return;
      }
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.key === "Tab") {
      const completion = completeInput(input, cwd, event.currentTarget.selectionStart ?? -1, event.currentTarget.selectionEnd ?? -1);
      if (!completion) return;
      event.preventDefault();
      setInput(completion.value);
      setHistoryIndex(-1);
      setSuggestions(completion.total > 1 ? completion.matches : []);
      if (completion.total > 1) setAnnouncement(`補完候補: ${completion.matches.join("、")}`);
      return;
    }
    if (!history.length) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSuggestions([]);
      if (historyIndex === -1) setDraft(input);
      const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setInput(history[next]);
    } else if (event.key === "ArrowDown" && historyIndex !== -1) {
      event.preventDefault();
      setSuggestions([]);
      const next = historyIndex + 1;
      setHistoryIndex(next >= history.length ? -1 : next);
      setInput(next >= history.length ? draft : history[next]);
    }
  }

  function beginResize(event: PointerEvent<HTMLDivElement>) {
    if (!desktopResize || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { element: event.currentTarget, id: event.pointerId, y: event.clientY, height: panelHeight };
  }

  function moveResize(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (current?.id === event.pointerId) {
      const height = clampHeight(current.height + current.y - event.clientY, bounds);
      preferredDesktopHeight.current = height;
      setPanelHeight(height);
    }
  }

  function resizeKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const height = clampHeight(panelHeight + (event.key === "ArrowUp" ? 20 : -20), bounds);
    preferredDesktopHeight.current = height;
    setPanelHeight(height);
  }

  function fileLink(file: File) {
    return <a href={`#${file.path}`} aria-current={active === file.path ? "page" : undefined}>
      <span className="tree-label">{file.label}</span><span className="tree-filename">{file.path === "projects/" ? file.path : file.path.replace("projects/", "")}</span>
    </a>;
  }

  return <div className="workspace" data-enhanced={ready} data-terminal-open={dockOpen} data-welcome={welcomePlaying ? "playing" : undefined} style={dockOpen && visibleHeight !== null ? { "--workspace-height": `${visibleHeight}px` } as CSSProperties : undefined} onClick={followFile}>
    {welcomePlaying && <div className="welcome-intro">
      <div className="welcome-copy" aria-hidden="true">
        <p className="welcome-eyebrow">ONEWALK / PORTFOLIO</p>
        <div className="welcome-boot"><p>&gt; loading portfolio</p><p>&gt; opening workspace</p></div>
        <p className="welcome-message">Welcome, visitor.</p>
      </div>
      <p className="sr-only" role="status">ポートフォリオを開いています。</p>
      <button className="welcome-skip" type="button" onClick={() => welcomeControl.current?.skip()}>スキップ</button>
    </div>}
    <div className="workspace-window" ref={workspaceWindow}>
      <a className="skip-link" href="#main">本文へ移動</a>
      <div className="window-titlebar" ref={windowTitlebar} aria-hidden="true">
        <span className="window-lights"><span /><span /><span /></span>
        <span className="window-caption">Kazuho Utsunomiya — Portfolio</span>
      </div>
      <div className="workspace-panes">
        <main className="terminal-pane" id="main" ref={main} tabIndex={-1} aria-labelledby="current-document-title">
          <div className="document-output" ref={output} aria-busy={sequence.phase !== "idle"}>
            <p className="sr-only">{`${PROMPT} ${sequence.command}`}</p>
            <p className="command-line" key={active} aria-hidden="true"><span className="prompt">{PROMPT}</span>{" "}<span className="command-text"><span className="complete-command">{sequence.command}▍</span><span className="typed-command">{sequence.text}<span className="entry-cursor">▍</span></span></span></p>
            <div className="pane-heading" key={`heading-${active}`} data-phase={ready ? sequence.phase : undefined}><h1 className="current-title" id="current-document-title">{current.label}</h1></div>
            {displayedFiles.map((file) => <section className="file-output" id={file.path} key={file.path} hidden={ready && file.path !== active} data-phase={ready && file.path === active ? sequence.phase : undefined} aria-label={file.label}>
              {!ready && file.path !== "about.txt" && <p className="file-comment fallback-path">{ROOT}{file.path}</p>}
              {file.content}
              {file.path === "about.txt" && showGuide && <p className="browsing-guide"><span className="desktop-guide">右のメニューから、知りたい項目を選んでください。</span><span className="mobile-guide">「メニュー」を開いて、知りたい項目を選んでください。</span></p>}
              <p className="end-of-file" aria-hidden="true">— {file.path} —</p>
            </section>)}
          </div>
        </main>
        <aside className="menu-pane" aria-label="メニューとご相談">
          <a className="menu-contact" href="mailto:contact@onewalk.dev">メールで相談する ↗</a>
          <details className="page-map" open={mapOpen} onToggle={(event) => setMapOpen(event.currentTarget.open)}>
          <summary><span>メニュー</span><span className="map-toggle" aria-hidden="true">{mapOpen ? "▾" : "▸"}</span></summary>
          <div className="map-content">
            <div className="map-title" aria-hidden="true">メニュー</div>
            <nav aria-label="メニュー">
              <p className="tree-root"><span className="prompt">~/onewalk/</span></p>
              <ul className="file-tree">
                {files.filter((file) => !file.path.startsWith("projects/")).slice(0, 2).map((file) => <li key={file.path}>{fileLink(file)}</li>)}
                <li className="tree-folder">
                  <div className="folder-row">{fileLink(files.find((file) => file.path === "projects/")!)}
                    <button type="button" aria-label={expanded ? "開発実績の項目を閉じる" : "開発実績の項目を展開"} aria-expanded={expanded} aria-controls="project-files" onClick={() => setExpanded(!expanded)} disabled={!ready}>{expanded ? "▾" : "▸"}</button>
                  </div>
                  <ul id="project-files" hidden={ready && !expanded}>{files.filter((file) => file.path.startsWith("projects/") && file.path !== "projects/").map((file) => <li key={file.path}>{fileLink(file)}</li>)}</ul>
                </li>
                {files.filter((file) => ["skills.txt", "personal.txt", "contact.txt"].includes(file.path)).map((file) => <li key={file.path}>{fileLink(file)}</li>)}
              </ul>
            </nav>
          </div>
          </details>
        </aside>
      </div>
      <div className="command-dock" data-open={dockOpen}>
        <div className="command-panel" id="command-panel" ref={commandPanel} style={{ "--terminal-height": `${panelHeight}px` } as CSSProperties}>
          {dockOpen && desktopResize && <div className="terminal-resizer" role="separator" tabIndex={0} aria-label="ターミナルの高さ" aria-orientation="horizontal" aria-controls="command-panel" aria-valuemin={bounds.min} aria-valuemax={bounds.max} aria-valuenow={panelHeight} aria-valuetext={`${panelHeight}ピクセル`} onKeyDown={resizeKey} onPointerDown={beginResize} onPointerMove={moveResize} onPointerUp={stopResize} onPointerCancel={stopResize} onLostPointerCapture={stopResize} />}
          <div className="terminal-header">
            <div className="terminal-titlebar">
              <h2 id="terminal-title">Terminal</h2>
              <button className="terminal-close" type="button" onClick={closeDock} aria-label="ターミナルを閉じる" disabled={!ready}><span aria-hidden="true">×</span></button>
            </div>
            <p className="command-cwd">現在地: {ROOT}{cwd}</p>
          </div>
          <div className="terminal-viewport" ref={terminalViewport} role="region" tabIndex={0} aria-label="ターミナルの表示と入力">
          <div className="terminal-content">
          <p className="sr-only" id="command-help">サイト内の仮想ファイルを操作 / help コマンド一覧 / ↑↓ 入力履歴 / Tab 補完、空入力・候補なしは次へ移動 / Shift+Tab 前へ移動 / Ctrl+L 表示消去 / Ctrl+C 入力中止</p>
          {!!entries.length && <div className="command-log" aria-label="コマンド履歴">
            {entries.map((entry, index) => <div className="log-entry" key={index}><p><span className="prompt">{PROMPT} </span>{entry.command}</p>{entry.listing ? <ul className="terminal-listing" aria-label="ファイル一覧">{entry.listing.map((file) => <li key={file.name}><span className={file.directory ? "listing-directory" : "listing-file"}>{file.name}{file.directory && <span className="sr-only">（ディレクトリ）</span>}</span><span className="listing-label">{file.label}</span></li>)}</ul> : <pre className={entry.error ? "command-error" : undefined}>{entry.output}</pre>}</div>)}
          </div>}
          {!!suggestions.length && <ul className="completion-suggestions" aria-label="補完候補">{suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul>}
          <form className="command-form" onSubmit={submit}>
            <label htmlFor="command-input"><span className="prompt" aria-hidden="true">{PROMPT}</span><span className="sr-only">コマンド入力</span></label>
            <input id="command-input" ref={commandInput} name="command" type="text" value={input} onChange={(event) => { setInput(event.target.value); setHistoryIndex(-1); setSuggestions([]); }} onKeyDown={recall} maxLength={INPUT_LIMIT} placeholder="help で使い方を表示" autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="send" aria-describedby="command-help" disabled={!ready} />
            <button type="submit" disabled={!ready} aria-label="コマンドを実行"><span aria-hidden="true">↵</span></button>
          </form>
          </div>
          </div>
        </div>
        <div className="terminal-bar" ref={terminalBar}>
          <button className="command-toggle" type="button" ref={dockToggle} aria-expanded={dockOpen} aria-controls="command-panel" onClick={toggleDock} disabled={!ready}>
            <span><span className="prompt" aria-hidden="true">&gt;_</span> ターミナル</span><span className="dock-chevron" aria-hidden="true">{dockOpen ? "▾" : "▸"}</span>
          </button>
          <p className="copyright"><small>© Kazuho Utsunomiya</small></p>
        </div>
        <noscript><p>コマンドにはJavaScriptが必要です。メニューのリンクからすべての本文を読めます。</p></noscript>
      </div>
    </div>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </div>;
}
