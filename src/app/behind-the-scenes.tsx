export default function BehindTheScenes() {
  return <>
    <h2>制作の裏側</h2>
    <p>このサイトは、名刺のターミナルデザインの続きとして作りました。メニューから読むことも、コマンドを打って開くこともできます。</p>
    <pre className="terminal-doodle" aria-label="小さなターミナルのイラスト">{"+----------------+\n| > hello, web _ |\n+----------------+\n       /__\\"}</pre>
    <p className="muted technical">ここは、このサイト内の仮想ファイルです。</p>
    <a className="text-action" href="#about.txt">自己紹介に戻る</a>
  </>;
}
