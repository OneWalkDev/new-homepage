// Run from the repository root:
// node scripts/generate-og-image.cjs <Latin TTF/OTF/TTC> <Japanese TTF/OTF/TTC>
// Uses installed Next.js fontkit and sharp only. Font files stay on your machine.
// Text is outlined before rasterizing, so no system font fallback or remote font is used.
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const createFont = require("next/dist/compiled/@next/font/dist/fontkit").default;
const sharp = require("sharp");

async function generate() {
  const [latinPath, japanesePath] = process.argv.slice(2);
  if (!latinPath || !japanesePath) {
    throw new Error("Supply local Latin and Japanese font files (TTF, OTF or TTC).");
  }
  const fonts = Object.fromEntries([
    ["latin", latinPath], ["japanese", japanesePath],
  ].map(([key, path]) => {
    const font = createFont(readFileSync(path));
    return [key, font.fonts || [font]];
  }));
  const source = readFileSync(resolve(__dirname, "assets/og-image.svg"), "utf8");
  const outlined = source.replace(/<text\b([^>]*)>([^<]*)<\/text>/g, (_node, attributes, encoded) => {
    const attr = (name) => attributes.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
    const text = encoded.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
    const candidates = fonts[attr("data-font")];
    if (!candidates) throw new Error("Every text element must select a local font.");
    const supported = candidates.filter((font) => [...text].every((char) => font.hasGlyphForCodePoint(char.codePointAt(0))));
    const bold = attr("font-weight") === "700";
    const font = supported.find((font) => bold ? /bold/i.test(font.subfamilyName) : /^(regular|normal|book)$/i.test(font.subfamilyName)) || supported[0];
    if (!font) throw new Error(`Font is missing glyphs for: ${text}`);
    const scale = Number(attr("font-size")) / font.unitsPerEm;
    const run = font.layout(text);
    let penX = 0, penY = 0;
    const paths = run.glyphs.map((glyph, index) => {
      if (glyph.id === 0) throw new Error(`Missing glyph in: ${text}`);
      const position = run.positions[index];
      const path = `<path transform="translate(${penX + position.xOffset} ${penY + position.yOffset})" d="${glyph.path.toSVG()}"/>`;
      penX += position.xAdvance;
      penY += position.yAdvance;
      return path;
    }).join("");
    // Fail rather than silently clip a wider replacement font.
    const right = Number(attr("x")) + penX * scale;
    if (right > 1100) throw new Error(`Text exceeds the safe inset: ${text}`);
    return `<g fill="${attr("fill")}" transform="translate(${attr("x")} ${attr("y")}) scale(${scale} ${-scale})">${paths}</g>`;
  });
  if (/<text\b/.test(outlined)) throw new Error("Unoutlined text remains.");
  const output = resolve(__dirname, "../public/og-image.png");
  const result = await sharp(Buffer.from(outlined)).png().toFile(output);
  if (result.width !== 1200 || result.height !== 630) throw new Error("Unexpected image dimensions.");
  console.log("Generated public/og-image.png (1200 × 630); all text glyphs verified and outlined.");
}

generate().catch((error) => { console.error(error.message); process.exitCode = 1; });
