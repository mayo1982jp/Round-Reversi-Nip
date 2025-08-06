# docs フォルダ公開運用メモ

このフォルダは GitHub Pages の公開元です。リポジトリ設定 → Pages で「Branch: main / Folder: /docs」を選択してください。

運用フロー（手動運用）
1. Angular の本番ビルドを実行して成果物を生成（出力先は `dist/`）。
2. 公開URLに合わせてベースURLを `/Round-Reversi-Nip/` に設定してビルドしてください。
3. 生成物（`index.html` やアセット一式）を `docs/` にコピーしてコミット/プッシュします。
4. 数分待つと `https://mayo1982jp.github.io/Round-Reversi-Nip/` で公開されます。

注意
- 生成物のみを配置してください（ソースは `src/` 以下に保持）。
- ルーティングを使う場合は `404.html` を同梱し、`index.html` へフォールバックさせるのが一般的です。
- 既存の `gh-pages/` を使わない場合は混乱を避けるため削除しても構いません。