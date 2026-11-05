// Verify the actual static server output after `npm run build`.
const { readFileSync, readdirSync } = require("node:fs");
const assert = require("node:assert/strict");
const test = require("node:test");
const sharp = require("sharp");

const origin = "https://onewalk.dev";
const title = "Kazuho Utsunomiya | Portfolio";
const html = readFileSync(".next/server/app/index.html", "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const decode = (value) => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));
const metas = [...head.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attributes(tag));
const meta = (key) => {
  const matches = metas.filter((item) => item.name === key || item.property === key);
  assert.equal(matches.length, 1, `Exactly one server-rendered ${key}`);
  return matches[0].content;
};

test("root canonical and public Japanese SEO are present in server HTML head", () => {
  assert.equal(head.match(/<title>([^<]*)<\/title>/)[1], title);
  const canonicals = [...head.matchAll(/<link\b[^>]*>/g)].map(([tag]) => attributes(tag)).filter((item) => item.rel === "canonical");
  // Next normalizes the root's trailing slash; both spellings identify the same URL.
  assert.deepEqual(canonicals.map((item) => new URL(item.href).href), [`${origin}/`]);
  const description = meta("description");
  for (const term of ["Kazuho Utsunomiya", "Web Developer", "Laravel", "Next.js", "予約", "ネットショップ", "業務システム", "既存システムの改善・作り替え"])
    assert.ok(description.includes(term), term);
  assert.equal(meta("robots"), "index, follow");
  assert.doesNotMatch(head, /noindex|nofollow|nosnippet|noimageindex/i);
});

test("Open Graph and Twitter share a real absolute branded PNG without invented handles", () => {
  assert.equal(meta("og:type"), "website");
  assert.equal(meta("og:locale"), "ja_JP");
  assert.equal(meta("og:site_name"), "Kazuho Utsunomiya");
  assert.equal(new URL(meta("og:url")).href, `${origin}/`);
  assert.equal(meta("og:title"), title);
  assert.equal(meta("og:description"), meta("description"));
  assert.equal(meta("og:image"), `${origin}/og-image.png`);
  assert.equal(meta("og:image:width"), "1200");
  assert.equal(meta("og:image:height"), "630");
  assert.ok(meta("og:image:alt").includes("Webシステムの開発・改善"));
  assert.equal(meta("twitter:card"), "summary_large_image");
  assert.equal(meta("twitter:title"), title);
  assert.equal(meta("twitter:description"), meta("description"));
  assert.equal(meta("twitter:image"), meta("og:image"));
  assert.equal(meta("twitter:image:alt"), meta("og:image:alt"));
  assert.ok(!metas.some((item) => /^twitter:(?:site|creator)(?::id)?$/.test(item.name || item.property || "")));
  assert.ok(!metas.some((item) => /#[^ ]|localhost|127\.0\.0\.1/.test(item.content || "")));
});

test("JSON-LD parses directly from server HTML as the confirmed Person identity", () => {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter((match) => attributes(match[1]).type === "application/ld+json");
  assert.equal(scripts.length, 1);
  const json = scripts[0][2];
  assert.doesNotMatch(json, /<|&quot;/, "No script delimiter or HTML-escaped JSON");
  assert.deepEqual(JSON.parse(json), {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Kazuho Utsunomiya",
    jobTitle: "Web Developer",
    url: `${origin}/`,
    sameAs: ["https://github.com/OneWalkDev"],
  });
  // The only raw HTML sink is the trusted, escaped JSON-LD in the server layout.
  // Interactive command content continues to use React's normal escaping.
  for (const file of readdirSync("src/app").filter((file) => /\.(?:tsx?|mjs)$/.test(file) && file !== "layout.tsx"))
    assert.doesNotMatch(readFileSync(`src/app/${file}`, "utf8"), /dangerouslySetInnerHTML|\.innerHTML\s*=/, file);
});

test("sitemap contains only the actual root, without fragments or fabricated dates", () => {
  const xml = readFileSync(".next/server/app/sitemap.xml.body", "utf8");
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.equal((xml.match(/<url>/g) || []).length, 1);
  assert.deepEqual([...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]), [`${origin}/`]);
  assert.doesNotMatch(xml, /#|<lastmod>|behind-the-scenes|projects|\.txt/);
  const response = JSON.parse(readFileSync(".next/server/app/sitemap.xml.meta", "utf8"));
  assert.equal(response.status, 200);
  assert.match(response.headers["content-type"], /application\/xml/);
});

test("robots allows all public crawling and advertises only the real sitemap", () => {
  const robots = readFileSync(".next/server/app/robots.txt.body", "utf8");
  assert.equal(robots.trim(), `User-Agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml`);
  assert.doesNotMatch(robots, /Disallow:|noindex|#/i);
  const response = JSON.parse(readFileSync(".next/server/app/robots.txt.meta", "utf8"));
  assert.equal(response.status, 200);
  assert.match(response.headers["content-type"], /text\/plain/);
});

test("share asset is a decodable static 1200 by 630 PNG", async () => {
  const png = readFileSync("public/og-image.png");
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(png.toString("ascii", 12, 16), "IHDR");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  const { info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1200);
  assert.equal(info.height, 630);
});
