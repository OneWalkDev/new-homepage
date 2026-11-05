const assert = require("node:assert/strict");
const test = require("node:test");
const commands = import("../src/app/commands.mjs");

test("help, pwd and empty input have useful deterministic results", async () => {
  const { interpret, ROOT } = await commands;
  assert.equal(interpret("  ").kind, "empty");
  assert.equal(interpret("pwd").output, ROOT);
  assert.equal(interpret("pwd", "projects/").output, `${ROOT}projects/`);
  for (const name of ["help", "ls", "pwd", "cat", "cd", "clear"]) assert.ok(interpret("help").output.includes(name));
  assert.ok(interpret("help").output.includes("メニューからも選択できます。"));
});

test("ls lists only the current directory and accepts known directory paths", async () => {
  const { interpret } = await commands;
  const root = interpret("ls").output;
  for (const name of ["about.txt", "services.txt", "projects/", "skills.txt", "personal.txt", "contact.txt"]) assert.ok(root.includes(name));
  assert.ok(!root.includes("ec-medical.txt"));
  for (const label of ["自己紹介", "できること", "開発実績", "使用技術", "個人の制作・活動", "お問い合わせ"]) assert.ok(root.includes(label));
  const nested = interpret("ls", "projects/").output;
  for (const name of ["ec-medical.txt", "warehouse.txt", "care-matching.txt", "cafe.txt"]) assert.ok(nested.includes(name));
  for (const label of ["ネットショップ", "小売店の小口管理", "要介護者と介護士", "カフェ"]) assert.ok(nested.includes(label));
  assert.doesNotMatch(nested, /在庫|倉庫/);
  assert.equal(interpret("ls projects").output, nested);
  assert.equal(interpret("ls ~/onewalk/projects/").output, nested);
  assert.equal(interpret("ls missing").kind, "error");
});

test("every navigation item maps to a working fixed command", async () => {
  const { FILES, commandForPath, interpret } = await commands;
  assert.equal(FILES.length, new Set(FILES.map((file) => file.path)).size);
  for (const file of FILES) {
    for (const cwd of ["", "projects/"]) {
      const result = interpret(commandForPath(file.path), cwd);
      assert.equal(result.kind, "navigate", file.path);
      assert.equal(result.path, file.path);
    }
  }
});

test("cat supports absolute, home-relative and relative known paths without changing cwd", async () => {
  const { interpret } = await commands;
  for (const path of ["about.txt", "./about.txt", "~/onewalk/about.txt", "/onewalk/about.txt"]) {
    assert.equal(interpret(`cat ${path}`).path, "about.txt");
  }
  assert.equal(interpret("cat warehouse.txt", "projects/").path, "projects/warehouse.txt");
  assert.equal(interpret("cat ../contact.txt", "projects/").path, "contact.txt");
  assert.equal(interpret("cat ../contact.txt", "projects/").cwd, "projects/");
  assert.equal(interpret("cat ~/onewalk/skills.txt", "projects/").path, "skills.txt");
  for (const path of ["projects", "projects/", "~/onewalk/"]) assert.equal(interpret(`cat ${path}`).kind, "error");
});

test("cd selects the project folder and supports returning to the root", async () => {
  const { interpret } = await commands;
  const result = interpret("cd projects");
  assert.equal(result.kind, "navigate");
  assert.equal(result.path, "projects/");
  assert.equal(result.cwd, "projects/");
  const back = interpret("cd ..", result.cwd);
  assert.equal(back.cwd, "");
  assert.equal(back.path, "about.txt");
  assert.equal(interpret("cd ~/onewalk/", "projects/").cwd, "");
  assert.equal(interpret("cd about.txt").kind, "error");
});

test("unknown commands, malformed arguments and paths produce Japanese help", async () => {
  const { interpret } = await commands;
  for (const input of ["sudo", "cat", "cd", "cat missing.txt", "cd missing", "cat about.txt contact.txt", "help extra", "pwd extra", "ls a b", "clear extra", "cat ../../etc/passwd", "cat /etc/passwd", "cat https://example.com"]) {
    const result = interpret(input);
    assert.equal(result.kind, "error", input);
    assert.match(result.output, /help.*コマンド/);
  }
});

test("injection strings are inert text and never become navigation or code", async () => {
  const { interpret } = await commands;
  for (const input of ['<img src=x onerror=alert(1)>', '<script>alert(1)</script>', 'cat about.txt; clear', 'cat $(whoami)', 'cat `pwd`', 'cat about.txt && pwd', 'fetch("https://example.com")', 'cat __proto__', 'cat constructor']) {
    const result = interpret(input);
    assert.equal(result.kind, "error", input);
    assert.equal(result.path, "");
  }
});

test("hash restoration accepts known paths and old anchors, rejecting malformed ones", async () => {
  const { FILES, pathFromHash } = await commands;
  for (const file of FILES) {
    assert.equal(pathFromHash(`#${file.path}`), file.path);
    assert.equal(pathFromHash(`#${encodeURIComponent(file.path)}`), file.path);
  }
  for (const [hash, path] of [["#top", "about.txt"], ["#experience", "projects/"], ["#profile", "personal.txt"], ["#contact", "contact.txt"]]) assert.equal(pathFromHash(hash), path);
  for (const hash of ["", "#unknown", "#%E0%A4%A", "#constructor", "#__proto__", "#toString", "#<script>"]) assert.equal(pathFromHash(hash), null);
});

test("the existing petty cash project path retains command and hash compatibility", async () => {
  const { commandForPath, interpret, pathFromHash } = await commands;
  const path = "projects/warehouse.txt";
  for (const [input, cwd] of [
    ["cat projects/warehouse.txt", ""],
    ["cat ./projects/warehouse.txt", ""],
    ["cat warehouse.txt", "projects/"],
    ["cat ./warehouse.txt", "projects/"],
    ["cat ../projects/warehouse.txt", "projects/"],
    ["cat /onewalk/projects/warehouse.txt", "projects/"],
    [commandForPath(path), ""],
    [commandForPath(path), "projects/"],
  ]) {
    const result = interpret(input, cwd);
    assert.equal(result.kind, "navigate", input);
    assert.equal(result.path, path, input);
    assert.equal(result.cwd, cwd, input);
  }
  for (const hash of [`#${path}`, `#${encodeURIComponent(path)}`]) assert.equal(pathFromHash(hash), path);
  assert.match(interpret("ls projects/").output, /warehouse\.txt\s+小売店の小口管理/);
});

test("clear is a distinct action without selecting or destroying a document", async () => {
  const { interpret } = await commands;
  const result = interpret("clear", "projects/");
  assert.equal(result.kind, "clear");
  assert.equal(result.path, "");
  assert.equal(result.cwd, "projects/");
});

test("input and stored histories remain bounded", async () => {
  const { interpret, appendBounded, HISTORY_LIMIT, LOG_LIMIT, INPUT_LIMIT } = await commands;
  let history = [], log = [];
  for (let index = 0; index < 100; index++) {
    history = appendBounded(history, String(index), HISTORY_LIMIT);
    log = appendBounded(log, String(index), LOG_LIMIT);
  }
  assert.equal(history.length, 40);
  assert.equal(log.length, 12);
  assert.equal(history[0], "60");
  assert.equal(log.at(-1), "99");
  assert.equal(interpret("a".repeat(INPUT_LIMIT + 1)).kind, "error");
});

test("help alone advertises the hidden known file; ordinary listings stay public", async () => {
  const { FILES, HIDDEN_FILE, interpret, pathFromHash } = await commands;
  assert.ok(!FILES.some((file) => file.path === HIDDEN_FILE.path));
  assert.equal(interpret("help").output.split("\n").at(-1), "# おまけ: cat .behind-the-scenes.txt");
  for (const cwd of ["", "projects/"]) {
    const hint = interpret("help", cwd).output.split("\n").at(-1).replace("# おまけ: ", "");
    assert.equal(interpret(hint, cwd).path, HIDDEN_FILE.path);
    for (const input of ["ls", "ls ~/onewalk/", "ls projects/"]) assert.ok(!interpret(input, cwd).output.includes(HIDDEN_FILE.path));
  }
  for (const [path, cwd] of [[HIDDEN_FILE.path, ""], [`./${HIDDEN_FILE.path}`, ""], [`~/onewalk/${HIDDEN_FILE.path}`, "projects/"], [`/onewalk/${HIDDEN_FILE.path}`, ""], [`../${HIDDEN_FILE.path}`, "projects/"]]) {
    const result = interpret(`cat ${path}`, cwd);
    assert.equal(result.kind, "navigate");
    assert.equal(result.path, HIDDEN_FILE.path);
    assert.equal(result.cwd, cwd);
  }
  assert.equal(pathFromHash(`#${HIDDEN_FILE.path}`), HIDDEN_FILE.path);
  for (const input of ["cat .other.txt", "cat .behind-the-scenes.txt; pwd", "cat /etc/.behind-the-scenes.txt", "cat ../../.behind-the-scenes.txt"]) assert.equal(interpret(input).kind, "error");
});

test("ls keeps its text contract and adds only fixed public directory/file metadata", async () => {
  const { interpret, FILES } = await commands;
  const root = interpret("ls");
  assert.equal(root.kind, "output");
  assert.equal(typeof root.output, "string");
  assert.deepEqual(root.listing.find((file) => file.directory), { name: "projects/", label: "開発実績", directory: true });
  assert.equal(root.listing.filter((file) => !file.directory).length, 5);
  for (const result of [root, interpret("ls projects/")]) {
    for (const item of result.listing) {
      assert.ok(FILES.some((file) => file.path.endsWith(item.name) && file.label === item.label));
      assert.ok(!item.name.startsWith("."));
    }
  }
  assert.ok(interpret("ls projects/").listing.every((file) => !file.directory));
  assert.equal(interpret("ls about.txt").output, "about.txt");
  assert.equal(interpret("ls missing").listing, undefined);
});
