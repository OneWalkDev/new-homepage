const assert = require("node:assert/strict");
const test = require("node:test");
const terminal = import("../src/app/terminal.mjs");

test("completion resolves commands and public paths relative to cwd", async () => {
  const { completeInput: complete } = await terminal;
  for (const [input, cwd, expected] of [
    ["he", "", "help"], ["cl", "", "clear"], ["cat sk", "", "cat skills.txt"],
    ["cd pro", "", "cd projects/"], ["cat war", "projects/", "cat warehouse.txt"],
    ["cat ./war", "projects/", "cat ./warehouse.txt"], ["cat ../con", "projects/", "cat ../contact.txt"],
    ["cat ~/onewalk/sk", "projects/", "cat ~/onewalk/skills.txt"],
    ["ls /onewalk/pro", "", "ls /onewalk/projects/"], ["cd ..", "projects/", "cd ../"],
  ]) assert.equal(complete(input, cwd).value, expected, input);
  assert.equal(complete("cd sk"), null, "cd only completes directories");
  assert.equal(complete("cat about.txt "), null, "no second argument");
});

test("ambiguity uses a common prefix, bounded suggestions, and never arbitrarily chooses a file", async () => {
  const { completeInput: complete, COMPLETION_LIMIT } = await terminal;
  assert.deepEqual(complete("c"), { value: "c", matches: ["cat", "cd", "clear"], total: 3 });
  assert.equal(complete("cat ca", "projects/").value, "cat ca");
  assert.deepEqual(complete("cat ca", "projects/").matches, ["care-matching.txt", "cafe.txt"]);
  const all = complete("cat ");
  assert.equal(all.value, "cat ");
  assert.ok(all.matches.length > 1 && all.matches.length <= COMPLETION_LIMIT);
  assert.ok(!all.matches.some((path) => path.startsWith(".")));
});

test("empty/unmatched input, middle carets, selections, hidden paths and injection stay untouched", async () => {
  const { completeInput: complete } = await terminal;
  for (const value of ["", "unknown", "cat missing", "cat .behind", "ls ~/onewalk/.behind", "cat ../../", "cat /etc/", "cat __proto__", "constructor", "toString", "cat $(pwd)", "cat `pwd`", "cat <script>", "cat about.txt;", "cat about.txt && pwd", "x".repeat(301)]) assert.equal(complete(value), null, value);
  assert.equal(complete("cat sk", "", 4, 4), null);
  assert.equal(complete("cat sk", "", 4, 6), null);
});

test("terminal height clamps to 60% available space and adapts its minimum in short viewports", async () => {
  const { terminalBounds, clampHeight } = await terminal;
  for (const available of [0, 50, 160, 250, 400, 718, 1000]) {
    const bounds = terminalBounds(available);
    assert.ok(bounds.max <= available * .6);
    assert.ok(bounds.min <= bounds.max && bounds.min <= 160);
    assert.equal(clampHeight(-1000, bounds), bounds.min);
    assert.equal(clampHeight(10000, bounds), bounds.max);
    const middle = clampHeight(220, bounds);
    assert.ok(middle >= bounds.min && middle <= bounds.max);
  }
});

test("initial panels use 48% on desktop and 60% on mobile, bounded for short keyboards", async () => {
  const { initialTerminalHeight, terminalBounds } = await terminal;
  for (const available of [400, 718, 900, 1200]) {
    assert.equal(initialTerminalHeight(available), Math.round(available * .48));
    assert.equal(initialTerminalHeight(available, true), Math.floor(available * .6));
  }
  for (const available of [0, 50, 160, 250]) {
    for (const mobile of [false, true]) {
      const height = initialTerminalHeight(available, mobile);
      const bounds = terminalBounds(available, mobile);
      assert.ok(height >= bounds.min && height <= bounds.max);
      assert.ok(height <= available);
    }
  }
});

test("a short mobile keyboard viewport reserves a header and full input row without exceeding the app", async () => {
  const { initialTerminalHeight, terminalBounds } = await terminal;
  assert.equal(initialTerminalHeight(176, true), 132);
  assert.deepEqual(terminalBounds(176, true), { min: 132, max: 132 });
  assert.equal(initialTerminalHeight(100, true), 100);
  assert.equal(initialTerminalHeight(0, true), 0);
});
