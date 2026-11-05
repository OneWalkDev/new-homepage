const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const loadTsx = require("./helpers/load-tsx.cjs");

test("stack parsing preserves compound technology names and unknown tools as readable text", () => {
  const TechnologyStack = loadTsx("src/app/technology-stack.tsx");
  const html = renderToStaticMarkup(React.createElement(TechnologyStack, {
    technologies: "Laravel / C#/.NET / Ruby on Rails / Unlisted Tool",
  }));
  assert.equal(html.replace(/<[^>]*>/g, ""), "Laravel / C#/.NET / Ruby on Rails / Unlisted Tool");
  assert.equal((html.match(/class="technology-entry"/g) || []).length, 4);
  assert.equal((html.match(/<svg\b/g) || []).length, 1, "Only mapped primary technology gets an icon");
  assert.doesNotMatch(html, /aria-label=|<img\b|(?:src|href)="https?:\/\//);
});

test("AWS and Terraform use their local decorative icons alongside readable names", () => {
  const TechnologyStack = loadTsx("src/app/technology-stack.tsx");
  const { FaAws } = require("react-icons/fa");
  const { SiTerraform } = require("react-icons/si");
  const html = renderToStaticMarkup(React.createElement(TechnologyStack, {
    technologies: "AWS / Terraform / AWS Security Hub / CI/CD",
  }));
  assert.equal(html.replace(/<[^>]*>/g, ""), "AWS / Terraform / AWS Security Hub / CI/CD");
  assert.equal((html.match(/<svg\b/g) || []).length, 2);
  for (const Icon of [FaAws, SiTerraform]) {
    const icon = renderToStaticMarkup(React.createElement(Icon, {
      className: "technology-icon", size: 18, "aria-hidden": "true", focusable: "false",
    }));
    assert.ok(html.includes(icon), "Mapped icon remains small, decorative and local");
  }
  assert.doesNotMatch(html, /aria-label=|<img\b|(?:src|href)="https?:\/\//);
});

test("Claude Code and Codex remain readable text without invented icons", () => {
  const TechnologyStack = loadTsx("src/app/technology-stack.tsx");
  const html = renderToStaticMarkup(React.createElement(TechnologyStack, {
    technologies: "Claude Code / Codex",
  }));
  assert.equal(html.replace(/<[^>]*>/g, ""), "Claude Code / Codex");
  assert.equal((html.match(/class="technology-entry"/g) || []).length, 2);
  assert.doesNotMatch(html, /<svg\b|<img\b|(?:src|href)="https?:\/\//);
});
