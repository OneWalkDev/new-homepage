const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { createRequire } = require("node:module");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

// Exercise the actual TSX components with the installed compiler, without a test dependency.
module.exports = function loadTsx(path, overrides = {}, globals = {}) {
  const filename = resolve(path);
  const localRequire = createRequire(filename);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  runInNewContext(output, {
    module, exports: module.exports,
    require: (name) => Object.hasOwn(overrides, name) ? overrides[name] : localRequire(name),
    ...globals,
  }, { filename });
  return module.exports.default;
};
