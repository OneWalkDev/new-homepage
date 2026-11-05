// This virtual filesystem is the only command target. No shell, eval or requests.
export const ROOT = "~/onewalk/";
export const FILES = [
  { path: "about.txt", label: "自己紹介" },
  { path: "services.txt", label: "できること" },
  { path: "projects/", label: "開発実績" },
  { path: "projects/ec-medical.txt", label: "ネットショップ・医療業務のシステム" },
  { path: "projects/warehouse.txt", label: "小売店の小口管理" },
  { path: "projects/care-matching.txt", label: "要介護者と介護士をつなぐサービス" },
  { path: "projects/cafe.txt", label: "カフェの予約管理・ネットショップ" },
  { path: "skills.txt", label: "使用技術" },
  { path: "personal.txt", label: "個人の制作・活動" },
  { path: "contact.txt", label: "お問い合わせ" },
];
// Public navigation/listings use FILES; only explicit known paths open this file.
export const HIDDEN_FILE = { path: ".behind-the-scenes.txt", label: "制作の裏側" };
const knownFiles = [...FILES, HIDDEN_FILE];
export const HISTORY_LIMIT = 40;
export const LOG_LIMIT = 12;
export const INPUT_LIMIT = 300;
const aliases = { top: "about.txt", about: "about.txt", services: "services.txt", experience: "projects/", skills: "skills.txt", profile: "personal.txt", contact: "contact.txt" };

export function pathFromHash(hash) {
  let path;
  try { path = decodeURIComponent(hash.replace(/^#/, "")); }
  catch { return null; }
  return knownFiles.find((file) => file.path === path)?.path || (Object.hasOwn(aliases, path) ? aliases[path] : null);
}

export function resolvePath(value, cwd = "") {
  let path = value.startsWith(ROOT) ? value.slice(ROOT.length)
    : value.startsWith("/onewalk/") ? value.slice(9)
    : value.startsWith("/") ? null : cwd + value;
  if (path === null) return null;
  const parts = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else parts.push(part);
  }
  path = parts.join("/");
  if (!path) return "";
  if (path === "projects") return "projects/";
  return knownFiles.find((file) => file.path === path)?.path ?? null;
}

export function commandForPath(path) {
  return path === "projects/" ? "cd ~/onewalk/projects/" : `cat ${ROOT}${path}`;
}

export function appendBounded(items, item, limit) {
  return [...items, item].slice(-limit);
}

export function listDirectory(directory) {
  return FILES.filter((file) => directory === "projects/"
    ? file.path.startsWith(directory) && file.path !== directory
    : !file.path.includes("/") || file.path === "projects/")
    .map((file) => ({ name: file.path.slice(directory.length), label: file.label, directory: file.path.endsWith("/") }));
}

export function interpret(input, cwd = "") {
  const result = (kind, output = "", path = "", nextCwd = cwd) => ({ kind, output, path, cwd: nextCwd });
  const error = (message) => result("error", `${message}\nhelp で使えるコマンドを確認できます。`);
  if (input.length > INPUT_LIMIT) return error("入力が長すぎます。300文字以内で入力してください。");
  const [command, ...args] = input.trim().split(/\s+/);
  if (!command) return result("empty");
  if (command === "help" && !args.length) return result("output", [
    "help                  コマンド一覧", "ls [path]             ファイル一覧", "pwd                   現在のディレクトリ",
    "cat <path>            ファイルを読む", "cd projects / cd ..   ディレクトリを移動", "clear / Ctrl+L        表示を消去（本文・入力履歴は保持）",
    "パス例: cat ~/onewalk/contact.txt", "↑ ↓ で入力履歴 / メニューからも選択できます。",
    "Tab: 行末でコマンド・公開パスを補完（複数候補は一覧） / Shift+Tab: 前へ移動",
    "空入力・候補なしのTab: 次へ移動 / Ctrl+C: 入力を中止（選択中はコピー）",
    "このサイト内の仮想ファイルを操作できます。",
    `# おまけ: cat ${cwd ? ROOT : ""}.behind-the-scenes.txt`,
  ].join("\n"));
  if (command === "pwd" && !args.length) return result("output", ROOT + cwd);
  if (command === "clear" && !args.length) return result("clear");
  if (command === "ls" && args.length <= 1) {
    const directory = args.length ? resolvePath(args[0], cwd) : cwd;
    if (directory === null) return error("そのパスはありません。");
    if (directory !== "" && directory !== "projects/") return result("output", directory);
    const listing = listDirectory(directory);
    return { ...result("output", listing.map((file) => `${file.name.padEnd(24)} ${file.label}`).join("\n")), listing };
  }
  if ((command === "cat" || command === "cd") && args.length === 1) {
    const path = resolvePath(args[0], cwd);
    if (path === null) return error(`そのパスはありません: ${args[0]}`);
    if (command === "cat") {
      if (path === "" || path === "projects/") return error("ディレクトリです。ls または cd を使ってください。");
      return result("navigate", "ファイルを表示しました。", path);
    }
    if (path !== "" && path !== "projects/") return error("ファイルです。cat で開いてください。");
    return result("navigate", `移動先: ${ROOT}${path}`, path || "about.txt", path);
  }
  return error(`使えないコマンド、または引数です: ${input.trim()}`);
}
