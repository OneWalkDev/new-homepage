"use client";
import React from "react";
import type { IconType } from "react-icons";
import {
  FaAws,
  FaDocker,
  FaEnvelope,
  FaGithub,
  FaJava,
  FaLaravel,
  FaPhp,
  FaPython,
  FaReact,
} from "react-icons/fa";
import {
  SiCsharp,
  SiDotnet,
  SiJquery,
  SiMysql,
  SiNextdotjs,
  SiRedis,
  SiRubyonrails,
  SiTypescript,
} from "react-icons/si";

const langSkills: { name: string; icon: IconType }[] = [
  { name: "PHP", icon: FaPhp },
  { name: "C#", icon: SiCsharp },
  { name: "TypeScript", icon: SiTypescript },
  { name: "Java", icon: FaJava },
  { name: "Python", icon: FaPython },
];

const FWSkills: { name: string; icon: IconType }[] = [
  { name: "Laravel", icon: FaLaravel },
  { name: ".NET", icon: SiDotnet },
  { name: "Jquery", icon: SiJquery },
  { name: "React", icon: FaReact },
  { name: "Next.js", icon: SiNextdotjs },
  { name: "Ruby on Rails", icon: SiRubyonrails },
];

const OtherSkills: { name: string; icon: IconType }[] = [
  { name: "Docker", icon: FaDocker },
  { name: "AWS", icon: FaAws },
  { name: "MySQL", icon: SiMysql },
  { name: "Redis", icon: SiRedis },
];

const skillCategories: {
  title: string;
  skills: { name: string; icon: IconType }[];
}[] = [
  { title: "言語", skills: langSkills },
  { title: "フレームワーク / ライブラリ", skills: FWSkills },
  { title: "その他", skills: OtherSkills },
];

type RepoShowcase = {
  owner: string;
  name: string;
  description: string;
  language: string;
};

const repoShowcases: RepoShowcase[] = [
  { owner: "SpaceServerDev", name: "Purin" , description: "NewSpaceServerのメインプラグイン", language: "PHP"},
  { owner: "OneWalkDev", name: "PlayerInfoScoreBoard" , description: "ダウンロード数4500回を超えたPMMPプラグイン", language: "PHP"},
  { owner: "SpaceServerUniverse", name: "UniverseCoreV2", "description": "SpaceServerUniverseのメインプラグイン", language: "Java"},
  { owner: "OneWalkDev", name: "Livefuns-scraper" , "description": "Livefunsから指定したアーティストのイベントとセットリストを取得", "language": "python"},
  { owner: "OneWalkDev", name: "smart_room" , "description": "スマートホームを実現。リモコンを家中どこからでも操作", "language": "Python + webiopi"},
  { owner: "OneWalkDev", name: "DiscordMusicBot.py" , "description": "discordの音楽再生bot、元はC#で作っていたものをPythonに移行", "language": "python"},
  { owner: "OneWalkDev", name: "JellyParfait" , "description": "youtube音楽再生ソフトウェア。プレイリストなど幅広く対応", "language": "C#"},
  { owner: "AvailsGroup", name: "Amica" , "description": "専門学校の友達出会い系サイト", "language": "Ruby + Rails5"},
];

function RepoCard({
  owner,
  name,
  description,
  language,
}: RepoShowcase) {
  const [repo, setRepo] = React.useState({
    owner,
    name,
    description,
    language,
    htmlUrl: `https://github.com/${owner}/${name}`,
  });

  return (
    <div className="project-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <a
            className="text-lg font-semibold hover:text-cyan-300 transition-colors"
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {repo.owner} / {repo.name}
          </a>
          <p className="text-sm text-slate-200 mt-2">
            {repo.description ?? "GitHub repository"}
          </p>
        </div>
        {repo.language && (
          <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-100">
            {repo.language}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <main className="page">
        <div className="hero">
          <img
            src="https://avatars.githubusercontent.com/u/23305324?v=4"
            className="w-[200px] rounded-full mx-auto mb-6"
          />
          <h1 className="text-center">Kazuho Utsunomiya</h1>
          <div className="w-full">
            <p className="lede text-center mx-auto w-full">
              Web Developer / Application Developer
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <a
              href="https://github.com/OneWalkDev"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="GitHub"
            >
              <FaGithub size={22} />
            </a>
            <a
              href="mailto:kazuhowork@gmail.com"
              className="social-link"
              aria-label="Email"
            >
              <FaEnvelope size={22} />
            </a>
          </div>

          <div className="mt-12">
            <h2 className="section-title">自己紹介</h2>
            <div className="space-y-4">
              <p>
                多くの人が幸せな気持ちになれるシステムを開発することが目標です。
              </p>
              <p>
                学生時代はデスクトップアプリケーションの作成やwebアプリケーション、PMMP,Bukkitのプラグインの開発をしていました。
              </p>
              <p>
                ArduinoやESP32、RaspberryPi等のマイコンを使った電子工作などにも挑戦したことがあります。
              </p>
              <p>
                現在は、webアプリケーションエンジニアとして活躍しています。バックエンドはLaravelやRails
                フロントエンドはJqueryからNext.jsを使うことができます。
              </p>
              <p>
                趣味はプログラムを書くこと、ドラム、音楽鑑賞、ゲームです。特にラウドロックバンドに夢中です。
              </p>
              <p>
                <a
                  className="underline hover:text-cyan-300 transition-colors"
                  href="https://lasvegas-jp.com/"
                >
                  Fear, and loathing in Las Vegas
                </a>
                や
                <a
                  className="underline hover:text-cyan-300 transition-colors ml-1"
                  href="https://coldrain.jp/"
                >
                  coldrain
                </a>
                が大好きです。
              </p>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="section-title">個人開発</h2>
            <div className="projects-grid">
              <div className="project-card">
                <div className="mb-3">
                  <h3>宇宙サーバーの運営</h3>
                  <span className="project-period">2016 - 2021</span>
                </div>
                <p>MinecraftBEのサーバー「SpaceServer」を運営していました。</p>
                <p>5000人を超えるユーザーにプレイしていただきました。</p>
                <p>
                  独自要素の実装のためにPHPを使い、1人で大規模プラグインの開発を行っていました。
                </p>
              </div>
              <div className="project-card">
                <div className="mb-3">
                  <h3>WindowsGUIアプリケーションの作成</h3>
                  <span className="project-period">2016 - 現在</span>
                </div>
                <p>
                  できることの幅を増やすのを目的にC#
                  WPFを使用し、デスクトップアプリケーションを開発しています。
                </p>
                <p>
                  Chromeのメモリ使用量が気になり、youtubeを使用した省メモリ音楽再生ソフトウェアなどを開発しました。
                </p>
              </div>
              <div className="project-card">
                <div className="mb-3">
                  <h3>
                    Ruby on
                    Railsを使用した、専門学校内友達出会い系アプリケーションの開発
                  </h3>
                  <span className="project-period">2016 - 2021</span>
                </div>
                <p>
                  学園生活において、コロナウイルスによる影響によるオンライン授業が重なったことによる交友関係の浅さの問題を解決するために開発しました。
                </p>
                <p>
                  6人チームで卒業研究にて開発し、プログラミングリーダーとしてチームを率いた経験があります。
                </p>
                <p>
                  優秀班として全校の前で発表し、開発したアプリケーションをOSSとして公開することによって学校全体の学びの役に立ちました。
                </p>
              </div>
              <div className="project-card">
                <div className="mb-3">
                  <h3>OS自作に挑戦</h3>
                  <span className="project-period">2023 - 現在</span>
                </div>
                <p>
                  ゼロからのOS自作入門を読みながら、C言語とC++を使用してOSの自作に励んでいます。
                </p>
              </div>
              <div className="project-card">
                <div className="mb-3">
                  <h3>SpaceServerUniverseの制作</h3>
                  <span className="project-period">2023 - 2024</span>
                </div>
                <p>
                  Minecraft
                  JEのサーバー「SpaceServerUniverse」を開発していました。
                </p>
                <p>
                  Javaを用いた開発で、クリーンアーキテクチャを使用し作成しました。
                </p>
                <p>
                  10人ほどのエンジニアの方々と協力して、運営者・開発者として活躍しました。
                </p>
              </div>
              <div className="project-card">
                <div className="mb-3">
                  <h3>玉川大学農学部様への技術提供</h3>
                  <span className="project-period">2024</span>
                </div>
                <p>研究室への技術提供を行っていました。</p>
                <p>
                  PythonとOpenCVを使用した画像加工ソフトウェアの作成とArduinoを用いた研究機械を作成しました。
                </p>
              </div>
              <div className="project-card">
                <div className="mb-3">
                  <h3>フリーランス管理ソフトの開発</h3>
                  <span className="project-period">2025</span>
                </div>
                <p>案件管理と売上管理ソフトを開発しています。</p>
                <p>
                  バックエンドはLaravel + Sanctum フロントエンドは Next.js +
                  typescriptを利用して、webソフトウェアの開発を行っています。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="section-title">業務経験</h2>
            <div className="projects-grid">
              <div className="project-card">
                <div className="mb-3">
                  <h3>ECサイト、医療系基幹システムのリプレイス</h3>
                  <span className="project-period">2022-2025</span>
                </div>
                <p>ECサイト兼医療系基幹システムのリプレイスを行いました。</p>
                <p>
                  予約システムから、ECサイト在庫管理の在庫管理システムまで幅広い開発を行っていました。
                </p>
                <p>
                  既存のシステムの問題点を洗い出し、最大で前サイトの300倍の早さを実現しました。
                </p>
                <p>
                  バックエンド側にはLaravelを使用、フロントエンド側はJQueryを使用していました。
                </p>
              </div>

              <div className="project-card">
                <div className="mb-3">
                  <h3>小売店向け倉庫管理システムの作成</h3>
                  <span className="project-period">2024</span>
                </div>
                <p>ECサイト兼医療系基幹システムのリプレイスを行いました。</p>
                <p>小売店向けの在庫管理システムを作成しました。</p>
                <p>3人チームでの開発で上手くチームを率いることができました。</p>
                <p>
                  バックエンド側にはLaravelを使用、フロントエンド側はJQueryを使用していました。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="section-title">制作作品</h2>
            <div className="grid gap-5">
              {repoShowcases.map((repo) => (
                <RepoCard key={`${repo.owner}/${repo.name}`} {...repo} />
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="section-title">スキル</h2>
            <div className="skill-group-grid">
              {skillCategories.map((category) => (
                <div key={category.title} className="skill-group">
                  <h3 className="skill-group-title">{category.title}</h3>
                  <div className="skills-grid">
                    {category.skills.map((skill) => {
                      const Icon = skill.icon;
                      return (
                        <div key={skill.name} className="skill-card">
                          <span className="skill-icon" aria-hidden="true">
                            <Icon />
                          </span>
                          <span className="skill-name">{skill.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="section-title">お問い合わせ</h2>
            <p>
              ご連絡はメールにてお願い致します。下記のリンクをクリックして下さい。
            </p>
            <p>
              <a className="underline" href="mailto:kazuhowork@gmail.com">
                kazuhowork[@]gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; Kazuho Utsunomiya All rights reserved.</p>
      </footer>
    </>
  );
}
