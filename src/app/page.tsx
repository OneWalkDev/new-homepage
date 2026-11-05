import type { ReactNode } from "react";
import Image from "next/image";
import Workspace from "./workspace";
import { FILES } from "./commands.mjs";
import { services, workExperiences, skillDomains, repositories } from "./content";
import TechnologyStack from "./technology-stack";

const email = "mailto:contact@onewalk.dev";
const github = "https://github.com/OneWalkDev";

function Fields({ rows, syntax = false }: { rows: [string, ReactNode][]; syntax?: boolean }) {
  return <dl className={syntax ? "fields contact-fields" : "fields"}>{rows.map(([label, value]) => <div key={label}><dt>{label}{syntax && <span className="field-operator"> =</span>}</dt><dd>{value}</dd></div>)}</dl>;
}

export default function Home() {
  const content: Record<string, ReactNode> = {
    "about.txt": <>
      <div className="card-identity">
        <div className="identity-name"><h2>Kazuho Utsunomiya</h2>
          <p className="identity-detail">Web Developer</p></div>
        <Image className="profile-image" src="/profile.png" width={96} height={96} alt="Kazuho Utsunomiyaのプロフィール画像" />
      </div>
      <Fields syntax rows={[["mail", <a className="string" href={email} key="mail">&quot;contact@onewalk.dev&quot;</a>], ["web", <a className="string" href="https://onewalk.dev" key="web">&quot;https://onewalk.dev&quot;</a>]]} />
      <div className="profile-copy">
        <h3>予約・ネットショップ・業務システムの開発を承ります。</h3>
        <p>Laravelを中心に、Webアプリケーション・業務システムを開発しています。医療分野の業務システムやネットショップの作り替えでは、予約・配送・支払い・顧客管理の機能を実装してきました。</p>
        <p>予約画面の入力を減らす工夫や、データベースの構造を見直して処理を速くする改善に取り組んできました。社員の方と相談しながら社内向けのデータ変換・翻訳ツールを作り、業務システムの実装・テスト・保守にも携わっています。Web開発に加え、公開作業や運用の手作業を減らす自動化にも取り組んでいます。</p>
      </div>
      <p className="profile-hobbies muted">趣味はプログラミング、ドラム、音楽鑑賞です。</p>
      <p className="file-comment separated"># 詳しく見る</p>
      <ul className="reading-list">
        <li><a href="#services.txt">できること <span>services.txt</span></a></li>
        <li><a href="#projects/">開発実績 <span>projects/</span></a></li>
        <li><a href="#contact.txt">お問い合わせ <span>contact.txt</span></a></li>
      </ul>
      <p className="contact-line">Webシステムの開発・改善について、<a href={email}>メールで相談する ↗</a></p>
      <a className="text-action technical" href={github}>制作物のソースコードを見る（GitHub） ↗</a>
    </>,
    "services.txt": <>
      <h2>サービスづくりと、日々の業務を支える開発。</h2>
      <p>新しいサービスの開発から、日々の業務を支えるシステムの改善まで。</p>
      <ul className="service-list">{services.map((service) => <li key={service.title}><span className="service-bullet" aria-hidden="true">▸</span><div><h3>{service.title}</h3><p>{service.description}</p><p className="muted technical">{service.examples}</p></div></li>)}</ul>
      <p className="service-stack muted technical">Laravel / Next.js / AWS / Terraform</p>
      <a className="text-action" href={email}>メールで相談する ↗</a>
    </>,
    "projects/": <>
      <h2>仕事として取り組んだ開発</h2>
      <p>ネットショップ・予約・在庫管理をはじめ、業務に関わるシステムを開発しています。</p>
      <ul className="project-index">{workExperiences.map((work, index) => <li key={work.title}><span className="muted">{work.period}</span><div><a href={`#${FILES[index + 3].path}`}>{work.title}<span>{FILES[index + 3].path.slice(9)}</span></a><p>{work.purpose}</p></div></li>)}</ul>
    </>,
    "skills.txt": <>
      <h2>開発を支える技術</h2>
      <p>システム内部の処理から、利用者が操作する画面まで。Laravel・Next.jsを中心に開発しています。</p>
      {skillDomains.map((skill) => <div className="text-block ruled" key={skill.title}><h3>{skill.title}</h3><p>{skill.description}</p><TechnologyStack technologies={skill.technologies} /><p className="muted technical">{skill.supporting}</p></div>)}
      <Fields rows={[["その他", <span className="technical" key="other">C# / Java / Python / C / C++ / WPF / Arduino / ESP32 / Raspberry Pi</span>]]} />
    </>,
    "personal.txt": <>
      <h2>個人開発・研究・学生時代の活動</h2>
      <p>ここでは、仕事としての開発実績とは別に、個人の制作や研究、趣味の活動を紹介します。</p>
      <div className="text-block ruled"><h3>これまでに作ったもの</h3>
        <ul className="activity-list">
          <li><h4>Minecraftサーバー運営</h4><p>Minecraftサーバー「SpaceServer」を運営し、5000人を超えるユーザーに遊んでいただきました。独自の機能を実装するため、PHPの大規模なプラグインを1人で開発していました。Javaを使った「SpaceServerUniverse」の開発や、PMMP・Bukkit向けのプラグイン制作にも取り組んできました。</p></li>
          <li><h4>音楽再生ソフト</h4><p>Chromeのメモリ使用量が気になり、C#・WPFでYouTubeを使った省メモリの音楽再生ソフトを開発しました。</p></li>
          <li><h4>OS自作・電子工作</h4><p>C・C++でのOS自作、Arduino・ESP32・Raspberry Piを使った電子工作にも挑戦しています。</p></li>
          <li><h4>友人の研究支援</h4><p>玉川大学農学部に在籍する友人の研究を手伝い、無償で画像加工ソフトウェアと研究機械を制作しました。画像加工にはPython・OpenCV、研究機械にはArduinoを使用しました。</p></li>
          <li><h4>学生向けアプリ</h4><p>専門学校の卒業研究では、オンライン授業が重なって学生同士の交友関係が浅くなった問題に取り組み、友人づくりを支援するアプリをRuby on Railsで開発しました。6人チームのプログラミングリーダーを担当し、優秀班として全校の前で発表。ソースコードも公開（OSS化）しました。</p></li>
          <li><h4>位置履歴可視化・案件売上管理</h4><p>位置履歴のバックアップを地図で可視化するWebアプリや、Laravel・Next.jsによる案件・売上管理ソフトも開発しています。</p></li>
        </ul>
      </div>
      <div className="text-block ruled"><h3>個人の制作物・公開しているソースコード</h3><a className="text-action" href={github}>GitHubで制作物を見る ↗</a>
        <ol className="repository-list">{repositories.map((repo) => <li key={repo.name}><a href={`https://github.com/${repo.owner}/${repo.name}`}><span>{repo.description} ↗</span><span className="muted technical">{repo.owner}/{repo.name}</span></a><p className="muted technical">使用技術：{repo.technologies}</p></li>)}</ol>
      </div>
    </>,
    "contact.txt": <>
      <h2>開発のご相談は、メールで。</h2>
      <p>Webアプリケーションの開発や、既存システムの改善についてお聞かせください。</p>
      <Fields rows={[["メール", <a className="string" href={email} key="email">contact@onewalk.dev</a>], ["制作物", <a href={github} key="github">GitHub / OneWalkDev ↗</a>]]} />
      <p className="contact-line"><a href={email}>メールで相談する ↗</a></p>
      <p className="muted">上のリンクからメールアプリが開きます。</p>
    </>,
  };
  workExperiences.forEach((work, index) => {
    content[FILES[index + 3].path] = <>
      <h2>{work.title}</h2>
      <p>{work.purpose}</p>
      <Fields rows={[["時期", work.period], ["用途", work.domain]]} />
      <div className="text-block ruled"><h3>担当したこと</h3><p>{work.description}</p></div>
      {work.contributions && <ul className="activity-list">{work.contributions.map((item) => <li key={item.title}><h4>{item.title}</h4><p>{item.description}</p></li>)}</ul>}
      <div className="technical-details"><h3>使用技術・開発手法</h3><TechnologyStack technologies={work.technologies} />{work.technicalNote && <p>{work.technicalNote}</p>}</div>
      <a className="text-action" href="#projects/">開発実績の一覧へ <span className="muted technical"> / projects/</span></a>
      <p className="contact-line"><a href={email}>メールで相談する ↗</a></p>
    </>;
  });
  return <Workspace files={FILES.map((file) => ({ ...file, content: content[file.path] }))} />;
}
