# 日常にワクワクを — 第1話「呼ばれた昼」

> 更新: 物語中心の作りに変わりました。位置情報は使いません（どこでも遊べます）。
> 物語・謎・持ち物はすべて `story.ts` にあります。以下の「場所の座標」「位置情報」に関する説明は古いので、読み飛ばしてください。


街を歩きながら手がかりを集め、物語を解き進めるスマートフォン向けの謎解きアプリです。
まずは AR/MR ではなく「位置情報つきの謎解き」で、**実際に街を歩いて最後まで遊びたいか**を確かめるための最小構成です。

- 技術: Vite + React + TypeScript / Supabase（進行状況の保存）/ Vercel（公開）/ GA4（計測）
- ストーリー: 『灯守の置き手紙』全4ステージ（約30分想定）。街ごとの差し替えは `story.ts` だけ

---

## 0. いまの状態（正直な現状）

| 項目 | 状態 |
| --- | --- |
| 画面（トップ／謎解き／ヒント／クリア） | 実装済み |
| 答えの判定（ひらがな・カタカナ・漢字・全角半角のゆれ吸収） | 実装済み・動作確認済み |
| 位置情報での到着判定と、位置情報なしの代替（デモモード／「位置情報を使わずに進める」） | 実装済み・距離計算は動作確認済み |
| Supabase への進行状況の保存（匿名ログイン） | コード・SQL は用意済み。**接続は未実施** |
| GA4 の計測（開始数・クリア数など） | コードは用意済み。**測定IDの設定は未実施** |
| GitHub / Vercel | **未接続**（下の手順で接続します） |

**未確認のこと**: `npm install`・`npm run build`・実際のブラウザ表示・スマホ実機での位置情報は、作成した環境では実行できていません。最初に下の「1」を行い、エラーが出たら全文を Claude Code に貼ってください。

---

## 1. 自分のPCで動かす

必要なもの: **Node.js 20.19 以上**（`node -v` で確認。なければ https://nodejs.org の LTS をインストール）

```bash
cd machi-nazo-walk
npm install
npm run dev
```

表示された `http://localhost:5173` をブラウザで開きます。スマホの見た目は、ブラウザの開発者ツール（F12）でスマホ表示に切り替えて確認できます。

動作確認用のコマンド:

```bash
npm run check:logic    # 答えの判定・距離計算・ストーリーデータの整合性
npm run check:render   # 各画面が必要な内容を表示しているか
npm run typecheck      # 型のチェック
npm run build          # 公開用ビルド（Vercel でも同じことが行われます）
```

---

## 2. 自分の街に合わせる（`story.ts`）

各ステージの `spot` を実際の場所に書き換えます。

- `name` / `description`: 画面に出す場所の名前と探し方
- `lat` / `lng`: Google マップで場所を長押しすると出る「35.xxxx, 135.xxxx」の数字
- `radiusM`: 到着とみなす半径（メートル）。最初は 80〜100 が目安

**`lat` / `lng` が `null` のままの場所は、到着チェックなしで謎が表示されます。** 今は全部 `null` なので、そのままでも最後まで遊べます。座標を入れると、街歩きモードでは「現在地を確認」が必須になります。

謎は現地に行かなくても解ける内容にしてあります。現地でしか分からない謎（看板の文字など）に変える場合は、位置情報が使えない人のために、必ずヒントを手厚くしてください。

---

## 3. Supabase をつなぐ（進行状況の保存）

保存する情報は「匿名ID・モード・クリアしたステージ数・ヒント回数・誤答回数・時刻」だけです。名前・メール・**位置情報は保存しません**。

1. https://supabase.com でプロジェクトを作成します（リージョンは東京が近くておすすめ）。
2. 左メニュー **SQL Editor** → **New query** を開き、`schema.sql` の中身をすべて貼り付けて **Run**。`Success` と出れば完了です。
3. 左メニュー **Authentication** → **Sign In / Providers** を開き、**Allow anonymous sign-ins** を ON にして保存します（画面の表記が少し違うときは「anonymous」で探してください）。
   これで、ユーザーに登録やログインをさせずに遊んでもらえます。
4. **Project Settings** の **API**（API Keys）画面で、次の2つをコピーします。
   - Project URL
   - 公開用キー（`anon` または `publishable`）。**`service_role` キーは絶対に使わないでください**
5. `.env.example` をコピーして `.env.local` を作り、値を貼ります。

   ```bash
   cp .env.example .env.local
   ```

   ```
   VITE_SUPABASE_URL=（Project URL）
   VITE_SUPABASE_ANON_KEY=（公開用キー）
   ```

6. `npm run dev` を再起動し、デモモードで最後まで遊びます。Supabase の **Table Editor** → `play_sessions` に行が増えていれば成功です。

`.env.local` は `.gitignore` に入っているので GitHub には上がりません。

> プロジェクト ref（`<your-supabase-project>`）は、ダッシュボードの URL `https://supabase.com/dashboard/project/〇〇〇` の「〇〇〇」の部分です。MVP では Supabase CLI は使わないので、通常は控えておくだけで大丈夫です。

遊んだ人数・クリア率は、Supabase の SQL Editor で `schema.sql` の末尾にある集計クエリ（コメントアウトされています）を実行すると見られます。

---

## 4. GitHub に上げる

1. https://github.com にログインし、右上の **＋** → **New repository**。
2. 名前（例: `machi-nazo-walk`）を入れ、**README や .gitignore は追加せずに** **Create repository**（公開／非公開はどちらでも、Vercel と連携できます）。
3. 作業フォルダで、次を順に実行します（`ユーザー名` と `リポジトリ名` は自分のものに置き換えます）。

```bash
git init
git add .
git status          # .env.local が一覧に出ていないことを確認
git commit -m "MVP: 謎解きアプリの初期実装"
git branch -M main
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
git push -u origin main
```

`git status` に `.env.local` が出てきたら、`push` せずに Claude Code に相談してください。

---

## 5. Vercel で公開する

1. https://vercel.com にログインし、**Add New…** → **Project**。
2. **Import Git Repository** で、先ほどの GitHub リポジトリを **Import**（初回は GitHub との連携許可が必要です）。
3. **Framework Preset** が **Vite** になっていることを確認します（自動で選ばれます）。
4. **Environment Variables** に、`.env.local` と同じ3つを追加します。

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Supabase の Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase の公開用キー |
   | `VITE_GA_MEASUREMENT_ID` | GA4 の測定ID（次の手順で取得。後から追加してもOK） |

5. **Deploy**。完了すると公開URLが表示されます。スマホで開いて確認してください（HTTPS なので位置情報も使えます）。

環境変数を後から変えたときは、Vercel の **Deployments** から **Redeploy** しないと反映されません。

---

## 6. GA4 で需要を測る

1. https://analytics.google.com で **プロパティ** を作成し、**データストリーム** → **ウェブ** に Vercel の公開URLを登録します。
2. 表示される **測定ID**（`G-` で始まる文字列）を、Vercel の `VITE_GA_MEASUREMENT_ID` に設定して Redeploy します。
3. 自分で公開URLを開いて遊び、GA4 の **レポート** → **リアルタイム** にイベントが出ることを確認します。

送られるイベント:

| 見たいもの | 見る場所・イベント |
| --- | --- |
| 訪問数 | 標準の「ユーザー数」「page_view」 |
| ゲーム開始数 | `game_start`（`mode` が `geo`=街歩き / `demo`=デモ） |
| ステージごとの到達 | `stage_clear`（`stage_index` 1〜4） |
| ヒントの使用 | `hint_used` |
| クリア数 | `game_clear`（ヒント回数・誤答数・所要分つき） |

目安にしたい指標: **開始率 = game_start ÷ ユーザー数**、**クリア率 = game_clear ÷ game_start**。「実際に街を歩いて遊びたいか」を見るには、`mode = geo` に絞って見るのがおすすめです。`game_start` と `game_clear` は GA4 の **管理 → イベント** で「重要なイベントとしてマーク」しておくと集計しやすくなります。

---

## 7. 位置情報と AR について

- 位置情報は **HTTPS（または localhost）でしか使えません**。端末・ブラウザの設定で拒否されていると取得できません。
- 屋内やビルの間では誤差が大きくなります。そのため、精度が悪いときは判定の半径に最大 50m のゆとりを持たせています。
- どんな場合でも、**「位置情報を使わずに進める」ボタン**で先に進めます。デモモードなら最初から位置情報は不要です。
- AR/MR は、このMVPで「街歩きの需要」が確認できてから検討する想定です。

---

## 8. エラーが出たら

画面や黒い画面（ターミナル）に出たエラーの**全文をそのままコピーして Claude Code に貼ってください**。どのコマンドを実行したかも添えると、すぐ原因を特定できます。

---

## 9. 公開前チェックリスト

- [ ] `story.ts` の場所・座標・文言を、実際の街に合わせた
- [ ] 実際に歩いて、各場所で到着チェックが通ることを確認した
- [ ] iPhone（Safari）と Android（Chrome）の実機で、最初から最後まで遊べた
- [ ] 位置情報を拒否した状態でも、最後まで進めた
- [ ] 注意事項（歩きスマホ・私有地・交通ルールなど）の文面を、自分の街に合わせて確認した
- [ ] Supabase の `play_sessions` に行が保存されている
- [ ] GA4 のリアルタイムにイベントが出ている

## 構成

```
src/
  data/story.ts        ストーリー・謎・場所（街ごとに書き換える）
  screens/             トップ／謎解き／クリア画面
  lib/                 答えの判定・位置情報・保存（端末／Supabase）・GA4
  App.tsx              画面の切り替えと進行状況の管理
schema.sql    テーブルとアクセス制限（RLS）
scripts/               動作確認スクリプト
```
