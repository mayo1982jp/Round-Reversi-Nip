# Dyad Angular テンプレート（Nip 円形リバーシ）

このリポジトリは 最小構成 Angular アプリです。現在は「角のない円形のリバーシ（Nip）」の対人戦モードを搭載しています。

遊べるリンク
- こちらで遊べます: https://mayo1982jp/github.io/Round-Reversi-Nip

概要
- 最新の安定版 Angular (v17)
- TypeScript 対応
- CSS スタイリング
- 開発サーバ（ホットリロード対応）
- 本番ビルド設定

特徴（Nip 円形リバーシ）
- 角のない円形ボード（円形クリッピング）
- 対人戦モードのみ（同じ端末で交互に操作）
- 文字やボタンは左側、盤面は右側で最大化表示
- タブレット横表示で全要素が収まるレイアウト
- 背景は黒色

開発
- 開発サーバを起動すると、http://localhost:4200/ で動作し、変更時に自動リロードされます。
- Dyad.sh 上では画面右上の Restart/Refresh を利用できます。

ビルド
- 本番ビルドを作成すると、成果物は dist/ ディレクトリに出力されます。

プロジェクト構成
src/
├── app/
│   ├── app.component.ts       # メインコンポーネント（ロジック）
│   ├── app.component.html     # メインコンポーネント（テンプレート）
│   ├── app.component.css      # メインコンポーネント（スタイル）
│   └── reversi/
│       └── reversi-board.component.ts  # 円形リバーシ（対人戦・交点置き）
├── index.html                 # エントリーポイント
├── main.ts                    # ブートストラップ
└── styles.css                 # グローバルスタイル

はじめに
1. src/app/reversi/reversi-board.component.ts にゲームロジックとUIがあります。
2. src/app/app.component.html にレイアウト（左UI/右盤面）があります。
3. スタイルは app.component.css とコンポーネント内 styles に定義しています。

使用技術
- Angular 17（スタンドアロンコンポーネント）
- TypeScript
- CSS

ライセンス
このプロジェクトはオープンソースで自由にご利用いただけます。