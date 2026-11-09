// Run after `npm run build`: node --test tests/*.test.cjs
const { readFileSync } = require("node:fs");
const assert = require("node:assert/strict");
const test = require("node:test");
const html = readFileSync(".next/server/app/index.html", "utf8");
const documentHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
const text = (markup) => markup.replace(/<[^>]*>/g, "");
const section = (id) => {
  const match = [...documentHtml.matchAll(/<section\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)].find((match) => match[1] === id);
  assert.ok(match, `Server-rendered file ${id} exists`);
  return match[2];
};

test("public identity leads Japanese metadata and server-rendered HTML", () => {
  assert.match(documentHtml, /<html[^>]*lang="ja"/);
  assert.equal((documentHtml.match(/<h1\b/g) || []).length, 1);
  assert.match(documentHtml, /<title>Kazuho Utsunomiya \| Portfolio<\/title>/);
  assert.match(documentHtml, /<meta name="description" content="Kazuho Utsunomiya \/ Web Developer。/);
  const about = text(section("about.txt"));
  for (const copy of ["Kazuho Utsunomiya", "Web Developer", "Laravelを中心に、Webアプリケーション・業務システムを開発しています。", "予約・配送・支払い・顧客管理の機能を実装してきました。", "Webシステムの開発・改善について", "メールで相談する"])
    assert.ok(about.includes(copy), copy);
  assert.doesNotMatch(about, /name =|stack =/);
  assert.doesNotMatch(documentHtml, /<(?:h[1-6]|title)\b[^>]*>OneWalk|<span class="prompt">OneWalk<\/span>|ご相談はOneWalk/);
});

test("about follows the card hierarchy with selectable syntax contacts before professional copy", () => {
  const about = section("about.txt");
  assert.match(about, /^<div class="card-identity"><div class="identity-name"><h2>Kazuho Utsunomiya<\/h2><p class="identity-detail">Web Developer<\/p><\/div><img\b/);
  const contacts = about.match(/<dl class="fields contact-fields">([\s\S]*?)<\/dl>/)?.[1];
  assert.ok(contacts, "Contact syntax uses a semantic definition list");
  for (const [key, url, value] of [["mail", "mailto:contact@onewalk.dev", "contact@onewalk.dev"], ["web", "https://onewalk.dev", "https://onewalk.dev"]]) {
    assert.ok(contacts.includes(`<dt>${key}<span class="field-operator"> =</span></dt><dd><a class="string" href="${url}">&quot;${value}&quot;</a></dd>`));
  }
  assert.ok(about.indexOf("card-identity") < about.indexOf("contact-fields"));
  assert.ok(about.indexOf("contact-fields") < about.indexOf("profile-copy"));
  assert.match(about, /<div class="profile-copy"><h3>予約・ネットショップ・業務システムの開発を承ります。<\/h3>/);
  assert.doesNotMatch(about, /tel:|電話|携帯|氏名|本名/);
});

test("about keeps two professional paragraphs and a compact hobbies sentence without repeating the name", () => {
  const about = section("about.txt");
  const profile = about.match(/<div class="profile-copy">([\s\S]*?)<\/div>/)[1];
  const paragraphs = [...profile.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => text(match[1]));
  assert.equal(paragraphs.length, 2, "Two professional paragraphs follow the card identity and contacts");
  assert.equal((text(about).match(/Kazuho Utsunomiya/g) || []).length, 1);
  assert.ok(paragraphs[0].startsWith("Laravelを中心に、Webアプリケーション・業務システムを開発しています。"));
  for (const copy of ["医療分野の業務システムやネットショップの作り替え", "予約・配送・支払い・顧客管理"])
    assert.ok(paragraphs[0].includes(copy), copy);
  for (const copy of ["予約画面の入力を減らす", "データベースの構造を見直して処理を速くする", "社員の方と相談しながら", "社内向けのデータ変換・翻訳ツール", "実装・テスト・保守"])
    assert.ok(paragraphs[1].includes(copy), copy);
  const hobbies = text(about.match(/<p class="profile-hobbies muted">([\s\S]*?)<\/p>/)[1]);
  assert.equal(hobbies, "趣味はプログラミング、ドラム、音楽鑑賞です。");
  assert.doesNotMatch(hobbies, /ゲーム|バンド/);
  assert.doesNotMatch(text(about), /Minecraft|SpaceServer|Chrome|YouTube|卒業研究|研究室|プログラミングを始めた|開発を始めたきっかけ|趣味が仕事/);
  assert.doesNotMatch(about, /5000|6人|3人/);
});

test("a single pane title and full command path remain without duplicate path chrome or footer", async () => {
  const { FILES } = await import("../src/app/commands.mjs");
  assert.doesNotMatch(documentHtml, /<footer\b|workspace-footer/);
  assert.match(documentHtml, /<div class="pane-heading"><h1 class="current-title" id="current-document-title">自己紹介<\/h1><\/div>/);
  assert.doesNotMatch(documentHtml, /class="active-path"|class="pane-mode"|class="map-selected"/);
  assert.match(documentHtml, /class="command-line"[\s\S]*?cat ~\/onewalk\/about.txt/);
  for (const file of FILES) {
    assert.doesNotMatch(section(file.path), /<p class="file-comment"># (?:自己紹介|できること|開発実績|使用技術|個人の制作・活動|お問い合わせ)/);
  }
  assert.ok(text(section("about.txt")).includes("詳しく見る"));
  assert.match(section("skills.txt"), /<h3>システム内部の処理（バックエンド）<\/h3>/);
});

test("every virtual file has real fallback content and a matching navigation anchor", async () => {
  const { FILES } = await import("../src/app/commands.mjs");
  for (const file of FILES) {
    assert.ok(text(section(file.path)).length > 60, `${file.path} has meaningful text`);
    assert.ok(documentHtml.includes(`href="#${file.path}"`), `${file.path} has a native link`);
  }
  // All business and personal text is available before hydration / with JavaScript disabled.
  assert.doesNotMatch(documentHtml, /<section\b[^>]*\bhidden(?:=|\s|>)/);
  assert.match(documentHtml, /<noscript>.*メニューのリンクからすべての本文を読めます。/);
});

test("menu uses native nested navigation, with labelled folder controls", () => {
  assert.match(documentHtml, /<nav aria-label="メニュー">/);
  assert.match(documentHtml, /<ul class="file-tree">[\s\S]*<ul id="project-files">/);
  assert.match(documentHtml, /<button[^>]*aria-label="開発実績の項目を展開"[^>]*aria-expanded="false"[^>]*aria-controls="project-files"/);
  assert.match(documentHtml, /href="#about.txt" aria-current="page"/);
  assert.doesNotMatch(documentHtml, /role="(?:tree|treeitem|application)"/);
  assert.match(documentHtml, /<details class="page-map" open=""><summary><span>メニュー<\/span><span class="map-toggle" aria-hidden="true">▾<\/span>/);
  assert.match(documentHtml, /<div class="folder-row"><a href="#projects\/">[\s\S]*?<\/a><button[^>]*aria-controls="project-files"[^>]*>▸<\/button><\/div>/);
});

test("folder labels share the top-level inset and only children gain extra depth", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.file-tree a\s*\{[^}]*padding:\s*8px 7px/);
  assert.match(css, /\.folder-row\s*\{[^}]*display:\s*flex/);
  assert.match(css, /\.folder-row a\s*\{\s*flex:\s*1;\s*\}/);
  assert.match(css, /\.folder-row button\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px/);
  assert.match(css, /\.file-tree \.tree-folder > ul\s*\{\s*padding-left:\s*22px/);
});

test("card palette keeps small text readable across all interactive surfaces", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const colors = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*(#[\da-f]{6});/g)].map(([, name, color]) => [name, color]));
  for (const [name, color] of Object.entries({ background: "#0d1117", pane: "#161b22", text: "#e6edf3", green: "#7ee787", blue: "#79c0ff", orange: "#ffa657", border: "#30363d" }))
    assert.equal(colors[name], color, name);
  const luminance = (hex) => hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0);
  for (const foreground of ["text", "muted", "green", "blue", "orange"]) {
    for (const background of ["background", "pane", "active", "hover"]) {
      const values = [luminance(colors[foreground]), luminance(colors[background])].sort((a, b) => b - a);
      assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${foreground} on ${background} meets 4.5:1`);
    }
  }
  assert.match(css, /\.file-output\s*\{\s*max-width:\s*40em/);
  assert.match(css, /h2, h3, \.tree-label\s*\{\s*text-wrap:\s*balance/);
  assert.match(css, /@supports \(word-break: auto-phrase\)/);
  assert.doesNotMatch(css, /@import|@font-face|url\(https?:/);
});

test("Japanese menu labels lead filenames and opaque terminal chrome is removed", async () => {
  const { FILES } = await import("../src/app/commands.mjs");
  const nav = documentHtml.match(/<nav aria-label="メニュー">([\s\S]*?)<\/nav>/)[1];
  const expectedLabels = ["自己紹介", "できること", "開発実績", "ネットショップ・医療業務のシステム", "小売店の小口管理", "要介護者と介護士をつなぐサービス", "カフェの予約管理・ネットショップ", "使用技術", "個人の制作・活動", "お問い合わせ"];
  assert.deepEqual(FILES.map((file) => file.label), expectedLabels);
  for (const file of FILES) {
    const link = [...nav.matchAll(/<a\b[^>]*href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].find((match) => match[1] === file.path);
    assert.ok(link, file.path);
    assert.ok(link[2].startsWith(`<span class="tree-label">${file.label}</span><span class="tree-filename">`), file.path);
    assert.ok(link[2].includes(file.path === "projects/" ? "projects/" : file.path.replace("projects/", "")));
  }
  assert.match(nav, /<p class="tree-root"><span class="prompt">~\/onewalk\/<\/span><\/p>/);
  assert.match(documentHtml, /<h1 class="current-title" id="current-document-title">自己紹介<\/h1>/);
  assert.doesNotMatch(text(documentHtml), /01 COMMAND|02 INSPECT|\bREAD\b/);
});

test("a single responsive instruction explains selection without command knowledge", () => {
  assert.equal((documentHtml.match(/class="browsing-guide"/g) || []).length, 1);
  assert.match(documentHtml, /class="desktop-guide">右のメニューから、知りたい項目を選んでください。/);
  assert.match(documentHtml, /class="mobile-guide">「メニュー」を開いて、知りたい項目を選んでください。/);
  assert.ok(documentHtml.indexOf('class="command-line"') < documentHtml.indexOf('class="card-identity"'));
  assert.ok(section("about.txt").indexOf('class="browsing-guide"') > section("about.txt").indexOf('class="profile-copy"'));
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.mobile-guide\s*\{\s*display:\s*none/);
  const mobile = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(mobile, /\.desktop-guide\s*\{\s*display:\s*none/);
  assert.match(mobile, /\.mobile-guide\s*\{\s*display:\s*inline/);
});

test("all native hash links and accessible label references resolve to unique IDs", () => {
  const ids = [...documentHtml.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of documentHtml.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), match[1]);
  for (const match of documentHtml.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g))
    for (const id of match[1].split(" ")) assert.ok(ids.includes(id), id);
  assert.match(documentHtml, /<a[^>]*href="#main"[^>]*>本文へ移動<\/a>/);
});

test("smart_room reflects its FastAPI migration", () => {
  assert.match(text(section("personal.txt")), /Python \/ FastAPI/);
  assert.doesNotMatch(documentHtml, /WebIOPi/i);
});

test("business content and four grounded project records are preserved", () => {
  for (const title of ["予約・マッチング・ネットショップの開発", "在庫・倉庫・売上を管理するシステムの開発", "今あるシステムの改善・作り替え"])
    assert.ok(text(section("services.txt")).includes(title));
  for (const copy of ["予約を受け付ける仕組み", "人と人をつなぐサービス", "日々の業務で使うシステム", "既存システムの課題を洗い出し", "機能や処理速度の改善"])
    assert.ok(text(section("services.txt")).includes(copy), copy);
  const projects = [
    ["ec-medical", "ネットショップ・医療業務システムの作り替え", "2022–2025", "予約・配送・支払い・顧客管理を支えるシステム", "Yiiで動いていた既存システムをLaravelへ作り替え、実装を1人で担当", "予約カレンダーの入力項目を減らし", "スマートフォンでも使いやすい画面", "商品選択から数量入力・支払いまでを1画面", "配送管理や法人向け購入ページの表示を速く", "FullCalendarとAjax", "データ移行・変換を行うPHPバッチ", "cron"],
    ["warehouse", "小売店向け小口管理システムの作り替え", "2024.01–2024.04", "小売店で使う小口管理システム", "日々の細かな支出を管理", "3人チームのメンバーとして参加", "Laravelを初めて使うメンバーの実装をサポート", "質問しやすい環境づくり", "月ごとにデータを分けて保存", "検索時の処理速度を改善", "Laravel / PHP", "AWS Fargate / Aurora MySQL / ElastiCache Redis"],
    ["care-matching", "介護マッチングサービスの開発", "2026–", "スタートアップ企業のサービス開発に、チームの一員として取り組んでいます。", "アジャイル開発", "DDD", "Laravel / Next.js", "介護を必要とする人と介護士をつなぐ、介護保険外のサービスに対応したマッチングサービスです。"],
    ["cafe", "カフェの予約管理・ネットショップの作り替え", "2026–", "予約管理システムとネットショップの開発・作り替えを担当しています。", "Laravel / Alpine.js", "カフェの予約を管理する仕組みと、ネットで商品を販売するためのショップです。"],
  ];
  for (const [file, ...copy] of projects) for (const term of copy)
    assert.ok(text(section(`projects/${file}.txt`)).includes(term), `${file}: ${term}`);
  assert.doesNotMatch(text(documentHtml), /300\s*(倍|x|×)/i);
  assert.ok(text(section("projects/")).includes("仕事として取り組んだ開発"));
  assert.ok(text(section("personal.txt")).includes("仕事としての開発実績とは別に"));
  assert.doesNotMatch(text(section("projects/")), /SpaceServer|卒業研究|研究室|音楽再生/);
  for (const [file] of projects) {
    const project = section(`projects/${file}.txt`);
    assert.match(project, /<div class="technical-details"><h3>使用技術・開発手法<\/h3>/);
    assert.ok(project.indexOf("担当したこと") < project.indexOf("technical-details"));
  }
});

test("services use three green triangle rows with concrete scopes and a restrained stack line", () => {
  const services = section("services.txt");
  const list = services.match(/<ul class="service-list">([\s\S]*?)<\/ul>/)?.[1];
  assert.ok(list);
  assert.equal((list.match(/<li>/g) || []).length, 3);
  assert.equal((list.match(/<span class="service-bullet" aria-hidden="true">▸<\/span>/g) || []).length, 3);
  assert.equal((list.match(/<h3>/g) || []).length, 3);
  assert.doesNotMatch(services, /numbered-output|<ol|<svg/);
  assert.match(services, /<p class="service-stack muted technical">Laravel \/ Next.js \/ AWS \/ Terraform<\/p>/);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.service-bullet\s*\{[^}]*color:\s*var\(--green\)/);
});

test("petty cash is accurately described throughout navigation and project content", async () => {
  const { FILES } = await import("../src/app/commands.mjs");
  const file = FILES.find((file) => file.path === "projects/warehouse.txt");
  assert.equal(file.label, "小売店の小口管理");
  const project = text(section(file.path));
  assert.doesNotMatch(project, /在庫|倉庫|リーダー|リード|率い|主導/);
  assert.match(project, /用途小口管理/);
  const index = section("projects/");
  assert.match(index, /href="#projects\/warehouse\.txt">小売店向け小口管理システムの作り替え/);
  assert.ok(text(index).includes("日々の細かな支出を管理"));
  assert.doesNotMatch(text(documentHtml), /小売店[^。<]*?(?:在庫|倉庫)/);
});

test("anonymous cafe case includes confirmed application and operations work with qualified Security Hub automation", () => {
  const cafe = section("projects/cafe.txt");
  const responsibilities = text(cafe.match(/<div class="text-block ruled"><h3>担当したこと<\/h3><p>([\s\S]*?)<\/p><\/div>/)[1]);
  for (const copy of ["予約管理システムとネットショップの開発・作り替えを担当しています。", "既存環境の問題点を修正", "CIを含む自動デプロイの仕組みを新たに整備", "公開作業やセキュリティ対応の手作業を減らす仕組みづくり"])
    assert.ok(responsibilities.includes(copy), copy);
  const technical = text(cafe.match(/<div class="technical-details">([\s\S]*?)<\/div>/)[1]);
  assert.ok(technical.includes("Laravel / Alpine.js / AWS / Terraform / AWS Security Hub / CI/CD"));
  assert.ok(technical.includes("AWS Security Hubの検出結果をもとに、脆弱性への対応を自動化する仕組みづくりを行っています。"));
  assert.match(cafe, /<h2>カフェの予約管理・ネットショップの作り替え<\/h2>/);
  assert.doesNotMatch(cafe, /href="https?:\/\//);
  assert.doesNotMatch(text(cafe), /すべての脆弱性|全ての脆弱性|完全自動|自動修復|リスクゼロ|ゼロリスク|インフラ全体の設計|削減率|資格|認定/);
  assert.ok(text(section("about.txt")).includes("Web開発に加え、公開作業や運用の手作業を減らす自動化にも取り組んでいます。"));
});

test("cloud skills describe existing environment improvements and detection-based operations automation", () => {
  const skills = section("skills.txt");
  const cloud = skills.match(/<div class="text-block ruled"><h3>クラウド環境・作業の自動化<\/h3>([\s\S]*?)<\/div>/)?.[1];
  assert.ok(cloud, "Dedicated cloud and automation category exists");
  for (const copy of ["既存環境の問題点の修正", "CIを含むデプロイの自動化", "検出結果をもとにした脆弱性対応の自動化", "AWS / Terraform"])
    assert.ok(text(cloud).includes(copy), copy);
  assert.match(cloud, /<p class="muted technical">関連技術：CI\/CD \/ AWS Security Hub（検出結果をもとにした対応の自動化）<\/p>/);
});

test("consultation remains reachable without command knowledge", () => {
  const mailto = 'href="mailto:contact@onewalk.dev"';
  for (const file of ["about.txt", "services.txt", "contact.txt"]) assert.ok(section(file).includes(mailto));
  assert.ok(text(section("contact.txt")).includes("contact@onewalk.dev"));
});

test("desktop consultation sits at the menu top outside both scrolling regions", () => {
  assert.doesNotMatch(documentHtml, /<header\b|workspace-header|header-contact/);
  assert.match(documentHtml, /<main\b[^>]*aria-labelledby="current-document-title"[^>]*>[\s\S]*?<h1[^>]*>自己紹介<\/h1>/);
  const menu = documentHtml.match(/<aside class="menu-pane" aria-label="メニューとご相談">([\s\S]*?)<\/aside>/)?.[1];
  assert.ok(menu, "Right menu pane is labelled");
  assert.match(menu, /^<a class="menu-contact" href="mailto:contact@onewalk.dev">メールで相談する ↗<\/a><details class="page-map"/);
  assert.equal((menu.match(/href="mailto:/g) || []).length, 1, "One shared consultation action");
  assert.doesNotMatch(menu.match(/<details\b[\s\S]*<\/details>/)[0], /href="mailto:/);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.menu-pane\s*\{[^}]*grid-area:\s*map;[^}]*min-height:\s*0/);
  assert.match(css, /\.menu-contact\s*\{[^}]*flex:\s*none;[^}]*min-height:\s*52px/);
  assert.match(css, /\.workspace-panes\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0/);
  assert.doesNotMatch(css, /workspace-header|header-contact/);
});

test("mobile shares a native menu disclosure and a sibling mail action without duplicate controls", () => {
  const summary = documentHtml.match(/<details class="page-map"[^>]*><summary>([\s\S]*?)<\/summary>/)?.[1];
  assert.ok(summary, "Native menu disclosure is present in server HTML");
  assert.match(summary, /<span>メニュー<\/span><span class="map-toggle" aria-hidden="true">▾<\/span>/);
  assert.doesNotMatch(summary, /自己紹介|map-selected/);
  assert.doesNotMatch(summary, /<a\b|<button\b/);
  assert.equal((documentHtml.match(/class="page-map"/g) || []).length, 1);
  assert.equal((documentHtml.match(/class="menu-contact"/g) || []).length, 1);
  const css = readFileSync("src/app/globals.css", "utf8");
  const mobile = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(mobile, /\.menu-pane\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 144px/);
  assert.match(mobile, /\.menu-contact\s*\{[^}]*grid-column:\s*2;[^}]*grid-row:\s*1;[^}]*min-height:\s*44px/);
  assert.match(mobile, /\.page-map > summary\s*\{[^}]*width:\s*calc\(100% - 144px\);[^}]*min-height:\s*44px/);
  assert.doesNotMatch(css, /\.pane-heading\s*\{[^}]*(?:position:\s*absolute|clip-path:)/);
  assert.match(mobile, /\.document-output\s*\{\s*padding: 26px 14px 20px/);
  assert.match(mobile, /\.workspace\s*\{[^}]*padding: 0/);
  assert.match(documentHtml, /class="pane-heading"><h1 class="current-title" id="current-document-title">自己紹介<\/h1>/);
  assert.match(css, /\.page-map > summary\s*\{\s*display:\s*none/);
});

test("a native menu closed on mobile retains a desktop reopening control without JavaScript", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const desktop = css.match(/@media \(min-width: 761px\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(desktop, "Explicit desktop fallback media query");
  assert.match(desktop, /\.workspace\[data-enhanced="false"\] \.page-map:not\(\[open\]\) > summary\s*\{[^}]*display:\s*list-item;[^}]*min-height:\s*44px/);
  assert.match(css, /\.page-map > summary\s*\{\s*display:\s*none/);
  const workspace = readFileSync("src/app/workspace.tsx", "utf8");
  assert.match(workspace, /const resize = \(\) => setMapOpen\(!media.matches\)/);
  assert.match(workspace, /media.addEventListener\("change", resize\)/);
});

test("all existing GitHub URLs survive; favorite-band copy and links are explicitly omitted", () => {
  assert.doesNotMatch(documentHtml, /SpaceServerDev\/Purin|OneWalkDev\/PlayerInfoScoreBoard|Livefuns|Livefans/i);
  const repos = ["OneWalkDev/musical", "OneWalkDev/myworksystem", "OneWalkDev/googlemap-timeline", "SpaceServerUniverse/UniverseCoreV2", "OneWalkDev/smart_room", "OneWalkDev/DiscordMusicBot.py", "OneWalkDev/JellyParfait", "AvailsGroup/Amica"];
  const personal = section("personal.txt");
  for (const repo of ["OneWalkDev", ...repos]) assert.ok(personal.includes(`href="https://github.com/${repo}"`), repo);
  // The user explicitly withdrew preservation of these two activity links and the associated band copy.
  assert.doesNotMatch(documentHtml, /lasvegas-jp\.com|coldrain\.jp|ラウドロック|Fear, and [Ll]oathing in Las Vegas|coldrain/i);
  for (const copy of ["Arduino・ESP32・Raspberry Pi", "Python・OpenCV", "SpaceServerUniverse", "PMMP・Bukkit", "C#・WPF", "OS自作", "卒業研究", "位置履歴", "案件・売上管理"])
    assert.ok(text(personal).includes(copy), copy);
  assert.doesNotMatch(documentHtml, /https:\/\/(?:fonts\.googleapis|fonts\.gstatic|avatars\.githubusercontent)\./);
});

test("personal activities preserve original motivations, team roles and public research scope", () => {
  const personal = text(section("personal.txt"));
  // Facts from original personalProjects; these remain outside professional project records.
  for (const copy of ["5000人を超えるユーザーに遊んでいただきました。", "PHPの大規模なプラグインを1人で開発していました。", "Chromeのメモリ使用量が気になり、C#・WPFでYouTubeを使った省メモリの音楽再生ソフトを開発しました。", "オンライン授業が重なって学生同士の交友関係が浅くなった問題", "友人づくりを支援するアプリをRuby on Railsで開発しました。", "6人チームのプログラミングリーダーを担当", "優秀班として全校の前で発表", "ソースコードも公開（OSS化）", "玉川大学農学部に在籍する友人の研究を手伝い、無償で画像加工ソフトウェアと研究機械を制作しました。画像加工にはPython・OpenCV、研究機械にはArduinoを使用しました。"])
    assert.ok(personal.includes(copy), copy);
});

test("skills preserve primary and supporting technologies", () => {
  for (const term of ["Laravel / PHP", "Next.js / React / TypeScript", "MySQL / PostgreSQL / Docker", "Ruby on Rails / .NET", "Redis", "jQuery", "Alpine.js", "JavaScript / HTML / CSS", "C# / Java / Python"])
    assert.ok(text(section("skills.txt")).includes(term), term);
});

test("primary stack names accompany small decorative icons and supporting text stays plain", () => {
  const skills = section("skills.txt");
  const stacks = [...skills.matchAll(/<p class="technology-stack string technical">([\s\S]*?)<\/p>/g)];
  assert.equal(stacks.length, 5);
  for (const [index, names] of [["Laravel", "PHP"], ["Next.js", "React", "TypeScript"], ["MySQL", "PostgreSQL", "Docker"], ["AWS", "Terraform"]].entries()) {
    const stack = stacks[index][1];
    assert.equal((stack.match(/<svg\b/g) || []).length, names.length);
    for (const name of names) assert.ok(text(stack).includes(name), name);
    for (const svg of stack.matchAll(/<svg\b([^>]*)>/g)) {
      assert.match(svg[1], /aria-hidden="true"/);
      assert.match(svg[1], /focusable="false"/);
      assert.match(svg[1], /height="18"/);
      assert.match(svg[1], /width="18"/);
    }
  }
  assert.equal((stacks[4][1].match(/<svg\b/g) || []).length, 0);
  assert.equal(text(stacks[4][1]), "Claude Code / Codex");
  assert.doesNotMatch(documentHtml.match(/<nav aria-label="メニュー">([\s\S]*?)<\/nav>/)[1], /<svg\b/);
  assert.match(skills, /<p class="muted technical">その他の経験：Ruby on Rails \/ .NET<\/p>/);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.technology-stack\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap/);
  assert.match(css, /\.technology-label\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center/);
  assert.match(css, /\.technology-icon\s*\{[^}]*flex:\s*none/);
});

test("desktop starts with a collapsed terminal and no initial scrollback", () => {
  assert.match(documentHtml, /<div class="command-dock" data-open="false">/);
  assert.doesNotMatch(documentHtml, /<details class="command-dock"|コマンドでも操作する|class="command-log"/);
  assert.match(documentHtml, /<form class="command-form">/);
  assert.match(documentHtml, /<label for="command-input">[\s\S]*?コマンド入力/);
  assert.match(documentHtml, /<input[^>]*id="command-input"[^>]*maxLength="300"[^>]*enterKeyHint="send"[^>]*aria-describedby="command-help"/);
  assert.match(documentHtml, /type="submit"[^>]*aria-label="コマンドを実行"/);
  assert.doesNotMatch(documentHtml, /autofocus/i);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.terminal-viewport\s*\{[^}]*overflow:\s*auto/);
  assert.doesNotMatch(css, /\.command-log\s*\{[^}]*(?:max-height|overflow:\s*auto)/);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*2px solid/);
  const desktop = css.slice(0, css.indexOf("@media (max-width: 760px)"));
  assert.match(desktop, /\.command-toggle\s*\{\s*display:\s*flex/);
  assert.match(desktop, /\.command-panel\s*\{\s*display:\s*grid/);
  assert.match(desktop, /\.command-dock\[data-open="false"\] \.command-panel\s*\{\s*display:\s*none/);
});

test("mobile server HTML starts compact and CSS hides the entire command panel before hydration", () => {
  assert.match(documentHtml, /class="command-toggle"[^>]*type="button"[^>]*aria-expanded="false"[^>]*aria-controls="command-panel"[^>]*disabled=""/);
  assert.match(documentHtml, /class="command-panel" id="command-panel"/);
  assert.equal((documentHtml.match(/id="command-input"/g) || []).length, 1);
  assert.equal((documentHtml.match(/class="command-toggle"/g) || []).length, 1);
  const toggle = documentHtml.match(/<button class="command-toggle"[\s\S]*?<\/button>/)[0];
  assert.match(text(toggle), /&gt;_ ターミナル/);
  assert.doesNotMatch(toggle, /onewalk|現在地|閉じる/);
  const css = readFileSync("src/app/globals.css", "utf8");
  const mobile = css.slice(css.indexOf("@media (max-width: 760px)"), css.indexOf("@media (prefers-reduced-motion: reduce)"));
  // display:none also removes input, submit and any focusable log from the tab order.
  assert.match(css, /\.command-dock\[data-open="false"\] \.command-panel\s*\{\s*display:\s*none/);
  assert.match(css, /\.command-toggle\s*\{[^}]*display:\s*flex;[^}]*min-width:\s*44px;[^}]*min-height:\s*44px/);
  assert.match(css, /\.command-form input\s*\{[^}]*min-height:\s*44px;[^}]*font-size:\s*16px/);
  assert.match(css, /\.command-form button\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px/);
  assert.doesNotMatch(mobile, /\.command-panel\s*\{[^}]*(?:height:\s*auto|max-height:\s*40dvh)/);
  assert.match(mobile, /\.terminal-titlebar\s*\{[^}]*padding-left:\s*14px/);
  assert.match(mobile, /\.terminal-viewport\s*\{[^}]*padding:\s*16px 14px 24px/);
  assert.match(mobile, /\.terminal-resizer\s*\{[^}]*display:\s*none/);
  assert.doesNotMatch(mobile, /\.command-dock\s*\{[^}]*(?:position:\s*(?:fixed|absolute)|height:\s*\d+(?:d?vh|%))/);
  assert.match(documentHtml, /<input[^>]*disabled=""/);
  assert.match(documentHtml, /<noscript><p>コマンドにはJavaScriptが必要です。/);
});

test("console geometry separates fixed header from a top-start scroll flow and permanent footer", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.command-panel\s*\{[^}]*display: grid;[^}]*grid-template-rows: auto minmax\(0, 1fr\);[^}]*height: var\(--terminal-height, 48dvh\);[^}]*background: var\(--background\)/);
  assert.match(css, /\.terminal-header\s*\{[^}]*border-bottom: 1px solid var\(--border\)/);
  assert.match(css, /\.terminal-viewport\s*\{[^}]*min-height: 0;[^}]*overflow: auto;[^}]*padding: 20px 24px 32px/);
  assert.match(css, /\.terminal-content\s*\{[^}]*flex-direction: column;[^}]*justify-content: flex-start/);
  assert.doesNotMatch(css, /\.terminal-content\s*\{[^}]*(?:justify-content: flex-end|column-reverse)/);
  assert.doesNotMatch(css, /\.command-form\s*\{[^}]*(?:position: (?:fixed|absolute|sticky)|margin-top: auto)/);
  assert.match(css, /\.terminal-listing\s*\{[^}]*flex-direction: column/);
  assert.match(css, /\.terminal-close\s*\{[^}]*min-width: 44px;[^}]*min-height: 44px/);
  assert.match(css, /\.workspace\[data-terminal-open="true"\]\s*\{[^}]*height: var\(--workspace-height, 100dvh\);[^}]*min-height: 0/);
  assert.doesNotMatch(css, /user-select:\s*none/);
});

test("motion is finite and disabled for reduced motion; panes have independent overflow", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.doesNotMatch(css, /\binfinite\b|scroll-behavior:\s*smooth/);
  assert.match(css, /animation:\s*cursor-blink\s+[\d.]+s\s+step-end\s+3/);
  assert.match(css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)")), /animation:\s*none\s*!important/);
  assert.match(css, /\.document-output\s*\{[^}]*overflow-y:\s*auto/);
  assert.match(css, /\.page-map\s*\{[^}]*overflow:\s*auto/);
  assert.match(css, /\.command-form input\s*\{[^}]*min-width:\s*0/);
});

test("literal terminal identity is decorative, consistent and never a mail link", () => {
  assert.match(documentHtml, /class="command-line"[^>]*aria-hidden="true"><span class="prompt">you@onewalk.dev \$ --<\/span> /);
  assert.match(documentHtml, /<label[^>]*><span class="prompt" aria-hidden="true">you@onewalk.dev \$ --<\/span>/);
  assert.match(documentHtml, /class="sr-only">you@onewalk.dev \$ -- cat ~\/onewalk\/about.txt<\/p>/);
  assert.doesNotMatch(documentHtml, /mailto:you@onewalk.dev/);
  assert.match(documentHtml, /mailto:contact@onewalk.dev/);
  assert.match(documentHtml, /aria-busy="false"/);
  assert.doesNotMatch(documentHtml, /data-phase=|\binert=/);
});

test("body wait preserves layout, ends without animation events and respects reduced motion", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.file-output\[data-phase="typing"\]\s*\{\s*animation: content-wait 600ms step-end;\s*\}/);
  assert.match(css, /@keyframes content-wait\s*\{ from \{ visibility: hidden; \} to \{ visibility: visible; \} \}/);
  assert.match(css, /\.file-output\[data-phase="revealing"\]\s*\{\s*animation: content-reveal 180ms ease-out;\s*\}/);
  assert.match(css, /@keyframes content-reveal[^\n]*translateY\(4px\)[^\n]*opacity: 1/);
  assert.doesNotMatch(css, /animation-fill-mode|content-wait[^;]*forwards/);
  assert.match(css, /\.command-text\s*\{[^}]*display: inline-grid;[^}]*min-width: 0;[^}]*max-width: 100%;[^}]*overflow-wrap: anywhere/);
  const mobile = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(css, /\.command-form\s*\{[^}]*display:\s*flex/);
  assert.doesNotMatch(mobile, /\.command-form label\s*\{[^}]*grid-column/);
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reduced, /animation: none !important/);
  assert.match(reduced, /\.complete-command \{ visibility: visible; \}/);
  assert.match(reduced, /\.typed-command \{ visibility: hidden; \}/);
});


test("only the local profile image appears, inside the about identity", () => {
  const images = [...documentHtml.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  assert.equal(images.length, 1);
  assert.ok(section("about.txt").includes(images[0]));
  assert.match(images[0], /class="profile-image"/);
  assert.match(images[0], /alt="Kazuho Utsunomiyaのプロフィール画像"/);
  assert.match(images[0], /width="96" height="96"/);
  for (const match of images[0].matchAll(/(?:src|srcSet)="([^"]*)"/g)) {
    assert.doesNotMatch(match[1], /https?:|avatars|data:/);
    assert.ok(match[1].includes("%2Fprofile.png") || match[1].includes("/profile.png"));
  }
  assert.match(readFileSync("src/app/page.tsx", "utf8"), /import Image from "next\/image"/);
});

test("personal activities use labelled semantic bullets separate from the repository list", () => {
  const personal = section("personal.txt");
  const activities = personal.match(/<ul class="activity-list">([\s\S]*?)<\/ul>/)?.[1];
  assert.ok(activities);
  const items = [...activities.matchAll(/<li><h4>([^<]+)<\/h4><p>([\s\S]*?)<\/p><\/li>/g)];
  assert.equal(items.length, 6);
  assert.deepEqual(items.map((item) => item[1]), ["Minecraftサーバー運営", "音楽再生ソフト", "OS自作・電子工作", "友人の研究支援", "学生向けアプリ", "位置履歴可視化・案件売上管理"]);
  assert.match(items[3][2], /玉川大学農学部に在籍する友人.*無償/);
  assert.doesNotMatch(text(personal), /研究室への技術提供|大学からの依頼|受託|公認/);
  assert.ok(personal.indexOf('class="repository-list"') > personal.indexOf('</ul>'));
});

test("AI skills describe confirmed assistance and review without broader service claims", () => {
  const skills = text(section("skills.txt"));
  for (const copy of ["AIを活用した開発・業務効率化", "Claude Code / Codex", "Claude CodeやCodexを活用し、実装の補助やコード・デザインのレビューなど、開発作業の効率化に取り組んでいます。", "用途：実装支援 / レビュー / 作業手順の整理"])
    assert.ok(skills.includes(copy), copy);
  assert.doesNotMatch(skills, /モデル訓練|モデル学習|AIコンサル|AIシステムの構築|完全自律|効率.*[0-9]+%/);
});

test("hidden virtual file is absent from public server content, menu and usual links", async () => {
  const { HIDDEN_FILE } = await import("../src/app/commands.mjs");
  assert.doesNotMatch(documentHtml, /behind-the-scenes|制作の裏側|hello, web|名刺のターミナルデザインの続き/);
  assert.ok(!documentHtml.includes(`href="#${HIDDEN_FILE.path}"`));
});

test("the permanent full-width terminal bar is a sibling of split panes inside one outer window", () => {
  assert.equal((documentHtml.match(/class="workspace-window"/g) || []).length, 1);
  assert.match(documentHtml, /<\/aside><\/div><div class="command-dock" data-open="false">/);
  assert.doesNotMatch(documentHtml.match(/<main\b[\s\S]*?<\/main>/)[0], /command-dock|copyright/);
  assert.doesNotMatch(documentHtml.match(/<aside\b[\s\S]*?<\/aside>/)[0], /copyright|©/);
  assert.equal((documentHtml.match(/© Kazuho Utsunomiya/g) || []).length, 1);
  assert.match(documentHtml, /<div class="terminal-bar"><button class="command-toggle"[\s\S]*?<\/button><p class="copyright"><small>© Kazuho Utsunomiya<\/small><\/p><\/div>/);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.workspace-window\s*\{[^}]*display: flex;[^}]*flex-direction: column;[^}]*border: 1px solid var\(--green\);[^}]*border-radius: 10px/);
  assert.doesNotMatch(css, /\.(?:workspace-panes|window-titlebar|command-dock)\s*\{[^}]*border: 1px solid var\(--green\)/);
  assert.match(css, /\.terminal-bar\s*\{[^}]*display: grid;[^}]*grid-template-columns: auto minmax\(0, 1fr\);[^}]*min-height: 44px/);
  assert.doesNotMatch(css, /\.command-dock\s*\{[^}]*(?:position:\s*(?:fixed|absolute)|overflow:\s*hidden)/);
  assert.match(css, /\.copyright\s*\{[^}]*margin: 0;[^}]*min-width: 0/);
  const mobile = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(mobile, /\.workspace-panes\s*\{[^}]*grid-template-rows: fit-content\(50%\) minmax\(0, 1fr\)/);
  assert.match(mobile, /\.page-map\s*\{[^}]*max-height: min\(45dvh, 100%\)/);
  assert.match(mobile, /\.copyright\s*\{[^}]*max-width: 128px/);
  assert.match(mobile, /\.copyright small\s*\{ font-size: 10px/);
  assert.doesNotMatch(css, /\.copyright[^}]*white-space: nowrap/);
});

test("welcome is progressive, finite, focus-safe through CSS, and has an independent visual fallback", () => {
  assert.doesNotMatch(documentHtml, /welcome-intro|data-welcome=|inert=|autofocus/i);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.welcome-skip\s*\{[^}]*min-width: 88px;[^}]*min-height: 44px/);
  assert.match(css, /\.welcome-intro\s*\{[^}]*visibility: hidden;[^}]*pointer-events: none;[^}]*animation: welcome-cover 3000ms linear/);
  assert.match(css, /@keyframes welcome-enter[^\n]*visibility: hidden[^\n]*100% \{ visibility: visible; opacity: 1/);
  assert.match(css, /@keyframes welcome-cover[^\n]*100% \{ visibility: hidden; opacity: 0/);
  assert.doesNotMatch(css, /welcome-(?:cover|enter)[^;]*forwards|animation-fill-mode/);
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reduced, /\.welcome-intro \{ display: none; \}/);
  assert.match(reduced, /animation: none !important/);
  const source = readFileSync("src/app/workspace.tsx", "utf8");
  assert.doesNotMatch(source, /inert:|\binert=|dangerouslySetInnerHTML/);
  assert.match(source, /className="welcome-copy" aria-hidden="true"/);
});

test("approved about-only typography remains scoped while identity and contacts stay monospace", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.file-output\[id="about.txt"\] \.profile-copy h3\s*\{[^}]*font-size: 24px/);
  assert.match(css, /\.file-output\[id="about.txt"\] \.profile-copy p\s*\{[^}]*font-size: 16px/);
  assert.match(css, /\.card-identity h2\s*\{[^}]*font-family: var\(--mono\)/);
  assert.match(css, /\.contact-fields\s*\{[^}]*font-family: var\(--mono\)/);
});
