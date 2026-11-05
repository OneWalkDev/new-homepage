import { INPUT_LIMIT, listDirectory, resolvePath } from "./commands.mjs";

export const COMPLETION_LIMIT = 8;
const COMMANDS = ["help", "ls", "pwd", "cat", "cd", "clear"];

// Complete only a collapsed caret at the end; text is never executed or inspected
// outside the fixed public virtual filesystem. Hidden files are excluded here.
export function completeInput(input, cwd = "", start = input.length, end = start) {
  if (!input || input.length > INPUT_LIMIT || start !== end || end !== input.length) return null;
  let candidates, prefix, before;
  if (/^[a-z]+$/.test(input)) {
    candidates = COMMANDS;
    prefix = input;
    before = "";
  } else {
    const match = input.match(/^(cat|cd|ls)(\s+)([-\w./~]*)$/);
    if (!match) return null;
    const [, command, space, path] = match;
    const slash = path.lastIndexOf("/");
    const parent = path.slice(0, slash + 1);
    prefix = path.slice(slash + 1);
    const directory = resolvePath(parent, cwd);
    if (directory !== "" && directory !== "projects/") return null;
    candidates = listDirectory(directory).filter((file) => command !== "cd" || file.directory).map((file) => file.name);
    if (cwd && !parent) candidates.push("../");
    before = command + space + parent;
  }
  const matches = candidates.filter((candidate) => candidate.startsWith(prefix));
  if (!matches.length) return null;
  let common = matches[0];
  for (const candidate of matches.slice(1)) {
    while (!candidate.startsWith(common)) common = common.slice(0, -1);
  }
  const value = before + common;
  if (value.length > INPUT_LIMIT) return null;
  return { value, matches: matches.slice(0, COMPLETION_LIMIT), total: matches.length };
}

// Both values and separator ARIA use CSS pixels. Desktop leaves 40% for the
// document/menu; mobile can use more in a short keyboard viewport so its header
// and a full input row still fit, always within the available app space.
export function terminalBounds(available, mobile = false) {
  const maximum = mobile ? Math.min(available, Math.max(132, available * 0.6)) : available * 0.6;
  const max = Math.max(0, Math.floor(maximum));
  return { min: Math.min(160, max), max };
}

export function clampHeight(height, bounds) {
  return Math.round(Math.max(bounds.min, Math.min(bounds.max, height)));
}

export function initialTerminalHeight(available, mobile = false) {
  return clampHeight(available * (mobile ? 0.6 : 0.48), terminalBounds(available, mobile));
}
