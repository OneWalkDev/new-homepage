"use client";
import React from "react";
import type { IconType } from "react-icons";
import {
  FaAws,
  FaCss3,
  FaDocker,
  FaEnvelope,
  FaGithub,
  FaHtml5,
  FaJava,
  FaLaravel,
  FaPhp,
  FaPython,
  FaReact,
} from "react-icons/fa";
import {
  SiCsharp,
  SiDotnet,
  SiJavascript,
  SiJquery,
  SiMysql,
  SiNextdotjs,
  SiPostgresql,
  SiRedis,
  SiRubyonrails,
  SiTypescript,
} from "react-icons/si";

const langSkills: { name: string; icon: IconType }[] = [
  { name: "HTML", icon: FaHtml5},
  { name: "CSS", icon: FaCss3},
  { name: "PHP", icon: FaPhp },
  { name: "JavaScript", icon: SiJavascript},
  { name: "TypeScript", icon: SiTypescript },
  { name: "C#", icon: SiCsharp },
  { name: "Java", icon: FaJava },
  { name: "Python", icon: FaPython }
];

const FWSkills: { name: string; icon: IconType }[] = [
  { name: "Laravel", icon: FaLaravel },
  { name: "Ruby on Rails", icon: SiRubyonrails },
  { name: "Jquery", icon: SiJquery },
  { name: "React", icon: FaReact },
  { name: "Next.js", icon: SiNextdotjs },
  { name: ".NET", icon: SiDotnet }
];

const OtherSkills: { name: string; icon: IconType }[] = [
  { name: "Docker", icon: FaDocker },
  { name: "MySQL", icon: SiMysql },
  { name: "PostgreSQL", icon: SiPostgresql },
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

type Experience = {
  title: string;
  period: string;
  details: string[];
};

const repoShowcases: RepoShowcase[] = [
  { owner: "OneWalkDev", name: "myworksystem" , "description": "案件、売上管理システム", "language": "Laravel + Sanctum + Next.js + Typescript"},
  { owner: "SpaceServerDev", name: "Purin" , description: "NewSpaceServerのメインプラグイン", language: "PHP"},
  { owner: "OneWalkDev", name: "PlayerInfoScoreBoard" , description: "ダウンロード数4500回を超えたPMMPプラグイン", language: "PHP"},
  { owner: "SpaceServerUniverse", name: "UniverseCoreV2", "description": "SpaceServerUniverseのメインプラグイン", language: "Java"},
  { owner: "OneWalkDev", name: "Livefuns-scraper" , "description": "Livefunsから指定したアーティストのイベントとセットリストを取得", "language": "python"},
  { owner: "OneWalkDev", name: "smart_room" , "description": "スマートホームを実現。リモコンを家中どこからでも操作", "language": "Python + webiopi"},
  { owner: "OneWalkDev", name: "DiscordMusicBot.py" , "description": "discordの音楽再生bot、元はC#で作っていたものをPythonに移行", "language": "python"},
  { owner: "OneWalkDev", name: "JellyParfait" , "description": "youtube音楽再生ソフトウェア。プレイリストなど幅広く対応", "language": "C#"},
  { owner: "AvailsGroup", name: "Amica" , "description": "専門学校の友達出会い系サイト", "language": "Ruby + Rails5"},
];

const personalProjects: Experience[] = [
  {
    title: "宇宙サーバーの運営",
    period: "2016 - 2021",
    details: [
      "MinecraftBEのサーバー「SpaceServer」を運営していました。",
      "5000人を超えるユーザーにプレイしていただきました。",
      "独自要素の実装のためにPHPを使い、1人で大規模プラグインの開発を行っていました。",
    ],
  },
  {
    title: "WindowsGUIアプリケーションの作成",
    period: "2016 - 現在",
    details: [
      "できることの幅を増やすのを目的にC# WPFを使用し、デスクトップアプリケーションを開発しています。",
      "Chromeのメモリ使用量が気になり、youtubeを使用した省メモリ音楽再生ソフトウェアなどを開発しました。",
    ],
  },
  {
    title: "Ruby on Railsを使用した、専門学校内友達出会い系アプリケーションの開発",
    period: "2016 - 2021",
    details: [
      "学園生活において、コロナウイルスによる影響によるオンライン授業が重なったことによる交友関係の浅さの問題を解決するために開発しました。",
      "6人チームで卒業研究にて開発し、プログラミングリーダーとしてチームを率いた経験があります。",
      "優秀班として全校の前で発表し、開発したアプリケーションをOSSとして公開することによって学校全体の学びの役に立ちました。",
    ],
  },
  {
    title: "OS自作に挑戦",
    period: "2023 - 現在",
    details: [
      "ゼロからのOS自作入門を読みながら、C言語とC++を使用してOSの自作に励んでいます。",
    ],
  },
  {
    title: "SpaceServerUniverseの制作",
    period: "2023 - 2024",
    details: [
      "Minecraft JEのサーバー「SpaceServerUniverse」を開発していました。",
      "Javaを用いた開発で、クリーンアーキテクチャを使用し作成しました。",
      "10人ほどのエンジニアの方々と協力して、運営者・開発者として活躍しました。",
    ],
  },
  {
    title: "玉川大学農学部様への技術提供",
    period: "2024",
    details: [
      "研究室への技術提供を行っていました。",
      "PythonとOpenCVを使用した画像加工ソフトウェアの作成とArduinoを用いた研究機械を作成しました。",
    ],
  },
  {
    title: "フリーランス管理ソフトの開発",
    period: "2025",
    details: [
      "案件管理と売上管理ソフトを開発しています。",
      "バックエンドはLaravel + Sanctum フロントエンドは Next.js + typescriptを利用して、webソフトウェアの開発を行っています。",
    ],
  },
];

const workExperiences: Experience[] = [
  {
    title: "ECサイト、医療系基幹システムのリプレイス",
    period: "2022-2025",
    details: [
      "ECサイト兼医療系基幹システムのリプレイスを行いました。",
      "予約システムから、ECサイト在庫管理の在庫管理システムまで幅広い開発を行っていました。",
      "既存のシステムの問題点を洗い出し、最大で前サイトの300倍の早さを実現しました。",
      "バックエンド側にはLaravelを使用、フロントエンド側はJQueryを使用していました。",
    ],
  },
  {
    title: "小売店向け倉庫管理システムの作成",
    period: "2024",
    details: [
      "小売店向けの在庫管理システムを作成しました。",
      "3人チームでの開発で上手くチームを率いることができました。",
      "バックエンド側にはLaravelを使用、フロントエンド側はJQueryを使用していました。",
    ],
  },
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

function ExperienceCard({ title, period, details }: Experience) {
  return (
    <div className="project-card">
      <div className="mb-3">
        <h3>{title}</h3>
        <span className="project-period">{period}</span>
      </div>
      {details.map((detail) => (
        <p key={detail}>{detail}</p>
      ))}
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
              href="mailto:contact@onewalk.dev"
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
              {personalProjects.map((project) => (
                <ExperienceCard key={project.title} {...project} />
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="section-title">業務経験</h2>
            <div className="projects-grid">
              {workExperiences.map((experience) => (
                <ExperienceCard key={experience.title} {...experience} />
              ))}
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
              <a className="underline" href="mailto:contact@onewalk.dev">
                contact[@]onewalk.dev
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
