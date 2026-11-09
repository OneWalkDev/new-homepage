export const services = [
  {
    title: "予約・マッチング・ネットショップの開発",
    description: "ブラウザで使うWebアプリケーションを開発します。予約を受け付ける仕組みや、人と人をつなぐサービス、ネットショップなどに対応します。",
    examples: "予約システム / マッチングサービス / ネットショップ（ECサイト）",
  },
  {
    title: "在庫・倉庫・売上を管理するシステムの開発",
    description: "在庫・倉庫管理や案件・売上管理など、日々の業務で使うシステムを開発します。",
    examples: "在庫管理 / 倉庫管理 / 案件・売上管理",
  },
  {
    title: "今あるシステムの改善・作り替え",
    description: "既存システムの課題を洗い出し、機能や処理速度の改善、システムの作り替え（リプレイス）に対応します。",
    examples: "業務の中心となるシステム / ネットショップ / 処理速度の改善",
  },
];

export const workExperiences = [
  {
    title: "ネットショップ・医療業務システムの作り替え",
    period: "2022–2025",
    purpose: "ネットショップでの商品購入と、医療分野の予約・配送・支払い・顧客管理を支えるシステムです。",
    description: "Yiiで動いていた既存システムをLaravelへ作り替え、実装を1人で担当しました。予約カレンダーの入力項目を減らし、スマートフォンでも使いやすい画面に改善しました。商品選択から数量入力・支払いまでを1画面で行えるPOS（店頭会計）画面も開発しました。データベース構造や処理を見直し、配送管理や法人向け購入ページの表示を速くしました。",
    technicalNote: "予約カレンダーにはFullCalendarとAjaxを使用しました。旧・新データベース間のデータ移行・変換を行うPHPバッチや、cronで実行するスクリプトも作成しました。",
    technologies: "Laravel / PHP / JavaScript / jQuery / FullCalendar / MySQL / Bootstrap / C# / .NET / WPF / AngleSharp / DeepL API",
    contributions: [
      { title: "医療業務を支える管理機能の作り替え", description: "Yiiで構築された既存システムをLaravelへ作り替え、予約・配送・支払い・顧客管理に加え、処方箋の作成機能を実装しました。実装を1人で担当し、テスト・保守にも携わりました。" },
      { title: "予約する人・管理する人、双方の操作を改善", description: "表形式だった予約管理画面をFullCalendarによるカレンダー表示へ変更。利用者向けの予約受付ページも新たに作成し、Ajaxを使って必要な入力を絞り、スマートフォンでも使いやすい画面にしました。" },
      { title: "配送管理と法人向け購入ページの表示改善", description: "データベースの構造とデータの取得方法を見直し、配送管理画面や法人向け商品購入ページの読み込みを高速化しました。情報が集中していたカラムを整理・正規化し、処理速度と保守性の改善に取り組みました。" },
      { title: "店舗ごとのルールに対応したPOS画面", description: "商品検索・選択、数量変更、支払い処理、ポイント付与までを1画面で行えるレジ機能を開発しました。複数店舗で使えるよう、店舗ごとに異なるポイント率や割引ルールを反映できる仕組みにしました。" },
      { title: "新旧データの変換と定期処理", description: "旧システムと新システムのデータベース間でデータを変換するPHPバッチを作成。mysqliを使ったスクリプトやcronによる定期処理で、データベースの一時情報を管理する仕組みも実装しました。" },
      { title: "社員の作業を支えるC#の社内ツール", description: "社員の方と相談しながら、リッチテキストをHTMLへ変換し、文字色や斜体などのルールをもとに情報を抽出してCSVへ出力するツールを.NET・AngleSharpで開発しました。DeepL APIとWPFを使い、HTMLの命名作業に合わせた翻訳ツールも作成しました。" },
    ],
    domain: "ネットショップ・予約・配送・支払い・顧客管理",
  },
  {
    title: "小売店向け小口管理システムの作り替え",
    period: "2024.01–2024.04",
    purpose: "小売店で使う小口管理システムです。日々の細かな支出を管理する仕組みです。",
    description: "古くなった小口管理システムをLaravelへ作り替える開発に、3人チームのメンバーとして参加しました。Laravelを初めて使うメンバーの実装をサポートし、質問しやすい環境づくりを心がけました。大量のデータを扱うため、月ごとにデータを分けて保存し、検索時の処理速度を改善しました。",
    technologies: "Laravel / PHP / JavaScript / jQuery / SQL / Bootstrap / Docker",
    technicalNote: "AWS Fargate / Aurora MySQL / ElastiCache Redisを使用した環境で開発しました。",
    domain: "小口管理",
  },
  {
    title: "介護マッチングサービスの開発",
    period: "2026–",
    purpose: "介護を必要とする人と介護士をつなぐ、介護保険外のサービスに対応したマッチングサービスです。",
    description: "スタートアップ企業のサービス開発に、チームの一員として取り組んでいます。",
    technicalNote: "アジャイル開発に参加し、DDDを活用した開発に取り組んでいます。",
    technologies: "Laravel / Next.js",
    domain: "マッチングサービス",
  },
  {
    title: "カフェの予約管理・ネットショップの作り替え",
    period: "2026–",
    purpose: "カフェの予約を管理する仕組みと、ネットで商品を販売するためのショップです。",
    description: "予約管理システムとネットショップの開発・作り替えを担当しています。既存環境の問題点を修正し、CIを含む自動デプロイの仕組みを新たに整備しています。公開作業やセキュリティ対応の手作業を減らす仕組みづくりにも取り組んでいます。",
    technicalNote: "AWS Security Hubの検出結果をもとに、脆弱性への対応を自動化する仕組みづくりを行っています。",
    technologies: "Laravel / Alpine.js / AWS / Terraform / AWS Security Hub / CI/CD / GitHub Actions / ECS Fargate / RDS / S3 / CloudWatch / EventBridge / Lambda / Secrets Manager",
    contributions: [
      { title: "運営に合わせて変更できる管理画面", description: "商品や会員向け情報の項目を、管理画面から追加・編集できる仕組みを開発しています。" },
      { title: "入金・配送までつながる業務機能", description: "入金状態の管理や配送用CSVの出力、配送先の変更画面を実装。未保存の変更への警告や保存結果の表示など、操作の結果が分かりやすい画面づくりにも取り組んでいます。" },
      { title: "通知の再試行と、旧システムからの段階移行", description: "予約・入金通知の送信記録と失敗時の再試行、会員情報の同期・メール配信の定期処理を整備。移行バッチや新旧処理の比較機能を用意し、既存データと業務の流れを引き継ぐ作り替えを進めています。" },
      { title: "AWSの検証環境をコードで管理", description: "TerraformでECS Fargate・RDS・S3などの構成を管理し、Web・キュー・定期処理をコンテナで実行する環境を整備しています。DB接続やHTTPS配下の動作など、既存環境の問題点にも対応しています。" },
      { title: "デプロイと認証情報更新への追随を自動化", description: "GitHub ActionsとOIDCを使い、コンテナイメージの登録からDBマイグレーション、ECSの更新へつなぐデプロイを整備。Secrets Managerの認証情報更新をEventBridgeで検知し、Lambdaでアプリを再デプロイする仕組みにも対応しています。" },
      { title: "監視・バックアップ・起動停止の運用整備", description: "CloudWatchによるエラーログ・HTTPエラーの監視通知、DBのバックアップ設定、S3のバージョニングを整備。検証環境の時間帯に応じた自動起動・停止や、計画停止中の不要な通知の抑制にも取り組んでいます。" },
    ],
    domain: "予約管理・ネットショップ",
  },
];

export const skillDomains = [
  {
    title: "システム内部の処理（バックエンド）",
    technologies: "Laravel / PHP",
    description: "ネットショップ・予約・在庫管理など、業務の処理を支える部分や、マッチングサービスの開発で使用しています。",
    supporting: "その他の経験：Ruby on Rails / .NET",
  },
  {
    title: "利用者が操作する画面（フロントエンド）",
    technologies: "Next.js / React / TypeScript",
    description: "Webアプリケーションの画面開発に使用。既存システムではjQueryやAlpine.jsを使った開発も行っています。",
    supporting: "関連技術：JavaScript / HTML / CSS",
  },
  {
    title: "情報を保存する仕組み・開発環境",
    technologies: "MySQL / PostgreSQL / Docker",
    description: "システムの情報を保存するデータベースや、開発に必要な環境を整える技術として扱っています。",
    supporting: "その他の技術：Redis",
  },
  {
    title: "クラウド環境・作業の自動化",
    technologies: "AWS / Terraform",
    description: "既存環境の問題点の修正や、CIを含むデプロイの自動化、検出結果をもとにした脆弱性対応の自動化に取り組んでいます。",
    supporting: "関連技術：CI/CD / AWS Security Hub（検出結果をもとにした対応の自動化）",
  },
  {
    title: "AIを活用した開発・業務効率化",
    technologies: "Claude Code / Codex",
    description: "Claude CodeやCodexを活用し、実装の補助やコード・デザインのレビューなど、開発作業の効率化に取り組んでいます。",
    supporting: "用途：実装支援 / レビュー / 作業手順の整理",
  },
];

export const repositories = [
  { owner: "OneWalkDev", name: "myworksystem", description: "案件・売上管理システム", technologies: "Laravel / Sanctum / Next.js / TypeScript" },
  { owner: "OneWalkDev", name: "musical", description: "1日1回の音楽交換サイト", technologies: "Laravel / Sanctum / Next.js / TypeScript" },
  { owner: "OneWalkDev", name: "googlemap-timeline", description: "位置履歴のバックアップをPCの地図上で可視化するWebアプリ", technologies: "Next.js / TypeScript / Leaflet" },
  { owner: "SpaceServerUniverse", name: "UniverseCoreV2", description: "SpaceServerUniverseの主要な拡張機能（プラグイン）", technologies: "Java" },
  { owner: "OneWalkDev", name: "smart_room", description: "家の中からリモコンを操作するスマートホームシステム", technologies: "Python / FastAPI" },
  { owner: "OneWalkDev", name: "DiscordMusicBot.py", description: "C#からPythonへ移行したDiscordの音楽再生Bot", technologies: "Python" },
  { owner: "OneWalkDev", name: "JellyParfait", description: "プレイリストに対応したYouTube音楽再生ソフトウェア", technologies: "C#" },
  { owner: "AvailsGroup", name: "Amica", description: "専門学校内の友人づくりを支援するアプリ", technologies: "Ruby on Rails" },
];
