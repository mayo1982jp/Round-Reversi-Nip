# gh-pages フォルダについて

このフォルダは GitHub Pages の公開元に設定するための場所です。初期状態では `index.html` のみを置いてあり、Pages 設定でブランチ（main）/フォルダ（/gh-pages）を指定できるようにしています。

運用フロー（手動運用の場合）
1. Angular の本番ビルドを実行して成果物を生成（出力先は `dist/`）。
2. 公開URLに合わせてベースURLを `/Round-Reversi-Nip/` に設定してビルドしてください。
3. 生成物（`index.html` やアセット一式）を `gh-pages/` にコピーしてコミット/プッシュします。
4. GitHub のリポジトリ設定 → Pages で、公開元を `Branch: main` / `Folder: /gh-pages` に設定します。
5. 数分待つと `https://mayo1982jp.github.io/Round-Reversi-Nip/` で公開されます。

注意
- 生成物のみを配置してください（ソースは `src/` に保持）。
- ルーティングを使う場合、404 対策として `404.html` を同梱し、`index.html` へフォールバックさせるのが一般的です。