import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 円形の見た目で遊ぶ8x8リバーシ（対人戦のみ）
 * - 右側に盤を最大化（正方エリアに収め、円形クリッピング）
 * - 左側に手番/スコア/操作
 * - 盤サイズは親の領域いっぱいでレスポンシブ
 */
type Cell = 0 | 1 | -1; // 0: empty, 1: black, -1: white
type Pos = { r: number; c: number };

const SIZE = 8;
const DIRS: Pos[] = [
  { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 },
  { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
];

function inBoard(r: number, c: number) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

// 初期配置
function initialBoard(): Cell[][] {
  const b: Cell[][] = Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(0));
  b[3][3] = -1;
  b[3][4] = 1;
  b[4][3] = 1;
  b[4][4] = -1;
  return b;
}

function cloneBoard(b: Cell[][]) {
  return b.map(row => row.slice());
}

function flipsIfPlace(b: Cell[][], r: number, c: number, player: Cell): Pos[] {
  if (b[r][c] !== 0) return [];
  const res: Pos[] = [];
  DIRS.forEach(d => {
    const maybe: Pos[] = [];
    let nr = r + d.r, nc = c + d.c;
    while (inBoard(nr, nc) && b[nr][nc] === (player === 1 ? -1 : 1)) {
      maybe.push({ r: nr, c: nc });
      nr += d.r; nc += d.c;
    }
    if (inBoard(nr, nc) && b[nr][nc] === player && maybe.length) {
      res.push(...maybe);
    }
  });
  return res;
}

function legalMoves(b: Cell[][], player: Cell): Pos[] {
  const moves: Pos[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (flipsIfPlace(b, r, c, player).length) moves.push({ r, c });
    }
  }
  return moves;
}

@Component({
  selector: 'app-reversi-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wrap">
      <aside class="left">
        <h1 class="title">Nip - 円形リバーシ</h1>
        <div class="panel">
          <div class="row">
            <span class="label">手番</span>
            <div class="turn">
              <span class="disc" [class.black]="turn()===1" [class.white]="turn()===-1"></span>
              <span class="turn-text">{{ turn()===1 ? '黒' : '白' }}</span>
            </div>
          </div>

          <div class="row">
            <span class="label">スコア</span>
            <div class="score">
              <span class="pill black-pill">● {{ score().black }}</span>
              <span class="pill white-pill">○ {{ score().white }}</span>
            </div>
          </div>

          <div class="row">
            <span class="label">状態</span>
            <div class="status">
              @if (gameOver()) {
                <span class="end">ゲーム終了</span>
              } @else if (!legalMovesForTurn().length) {
                <span class="pass">パス可能です</span>
              } @else {
                <span class="ok">配置できます</span>
              }
            </div>
          </div>

          <div class="buttons">
            <button class="btn" (click)="reset()">リセット</button>
            <button class="btn" (click)="pass()" [disabled]="gameOver() || legalMovesForTurn().length>0">パス</button>
          </div>

          <p class="hint">
            対人戦のみ：同じ端末で交互に石を置いてください。<br>
            置けるマスは淡いハイライトで表示されます。
          </p>
        </div>
      </aside>

      <main class="board-area">
        <!-- 正方形コンテナに円形クリッピングした盤を最大化 -->
        <div class="square">
          <svg class="board" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" (contextmenu)="$event.preventDefault()">
            <!-- 黒背景の上に円形の盤（深緑） -->
            <defs>
              <clipPath id="circleClip">
                <circle cx="50" cy="50" r="48"></circle>
              </clipPath>
            </defs>

            <rect x="0" y="0" width="100" height="100" fill="#000"/>
            <g clip-path="url(#circleClip)">
              <rect x="0" y="0" width="100" height="100" fill="#0d401f"/>
              <!-- 8x8グリッドを円内に描画（柔らかな角の印象を出すため線はやや淡く太め） -->
              <g stroke="#b9d7be" stroke-width="0.4" stroke-linecap="round" opacity="0.7">
                @for (i of rows; track i) {
                  <line [attr.x1]="grid(0)" [attr.y1]="grid(i)" [attr.x2]="grid(8)" [attr.y2]="grid(i)"></line>
                  <line [attr.x1]="grid(i)" [attr.y1]="grid(0)" [attr.x2]="grid(i)" [attr.y2]="grid(8)"></line>
                }
                <!-- 外周に柔らかな縁 -->
                <circle cx="50" cy="50" r="48" fill="none" stroke="#e3f2e6" stroke-width="1.2"></circle>
              </g>

              <!-- ハイライト（合法手） -->
              <g opacity="0.35">
                @for (m of legalMovesForTurn(); track m.r + '-' + m.c) {
                  <rect class="hint-cell"
                        [attr.x]="cellX(m.c)+1"
                        [attr.y]="cellY(m.r)+1"
                        [attr.width]="cellSize-2"
                        [attr.height]="cellSize-2"
                        rx="2" ry="2"
                        fill="#9ad4a0" />
                }
              </g>

              <!-- セルのクリック領域 -->
              <g>
                @for (r of rows; track r) {
                  @for (c of cols; track c) {
                    <rect class="hit" [attr.x]="cellX(c)" [attr.y]="cellY(r)" [attr.width]="cellSize" [attr.height]="cellSize"
                          fill="transparent" (click)="place(r,c)"></rect>
                  }
                }
              </g>

              <!-- 石 -->
              <g>
                @for (r of rows; track r) {
                  @for (c of cols; track c) {
                    @if (board()[r][c] !== 0) {
                      <circle [attr.cx]="cellCenterX(c)" [attr.cy]="cellCenterY(r)" [attr.r]="discR"
                              [attr.fill]="board()[r][c]===1 ? '#101010' : '#f5f5f5'"
                              stroke="rgba(255,255,255,0.18)" stroke-width="0.3"/>
                    }
                  }
                }
              </g>
            </g>
          </svg>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; background: #000; color: #e8f5e9; min-height: 100vh; }
    .wrap {
      display: grid;
      grid-template-columns: minmax(220px, 360px) 1fr;
      gap: 16px;
      padding: 16px;
      height: 100vh;
      box-sizing: border-box;
    }
    .left {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .panel {
      width: 100%;
      background: #0b0b0b;
      border: 1px solid #1e1e1e;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .label { color: #b2dfdb; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
    .turn { display: flex; align-items: center; gap: 8px; }
    .disc { width: 16px; height: 16px; border-radius: 50%; display: inline-block; border: 1px solid rgba(255,255,255,0.2); }
    .disc.black { background: #101010; }
    .disc.white { background: #f5f5f5; }
    .turn-text { font-weight: 600; }
    .score { display: flex; gap: 8px; }
    .pill { padding: 6px 10px; border-radius: 999px; font-weight: 600; font-size: 13px; }
    .black-pill { background: #111; color: #e0e0e0; border: 1px solid #2a2a2a; }
    .white-pill { background: #fafafa; color: #111; border: 1px solid #e0e0e0; }
    .status .end { color: #ffab91; }
    .status .pass { color: #ffe082; }
    .status .ok { color: #a5d6a7; }
    .buttons { display: flex; gap: 8px; }
    .btn {
      background: #1b5e20;
      color: #e8f5e9;
      border: none;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      transition: transform 120ms ease, opacity 120ms ease;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn:hover:not(:disabled) { transform: translateY(-1px); }

    .board-area { display: grid; place-items: center; }
    .square { width: 100%; height: 100%; max-width: 100%; display: grid; place-items: center; }
    /* アスペクト比を正方形に保つために内側要素で制御 */
    .board {
      width: min(100%, calc(100vh - 32px)); /* 画面高に合わせて最大化 */
      height: auto;
      max-height: calc(100vh - 32px);
      border-radius: 16px;
      display: block;
      background: transparent;
    }

    /* タブレット横表示向けの最小サイズ調整 */
    @media (min-width: 900px) {
      .wrap { grid-template-columns: 320px 1fr; }
    }

    /* SVG上のセル */
    .hint-cell { pointer-events: none; }
    .hit { cursor: pointer; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReversiBoardComponent {
  // ボード状態
  board = signal<Cell[][]>(initialBoard());
  turn = signal<Cell>(1); // 1: 黒, -1: 白

  rows = Array.from({ length: SIZE + 1 }, (_, i) => i);
  cols = Array.from({ length: SIZE + 1 }, (_, i) => i);

  cellSize = 100 / SIZE;
  discR = (this.cellSize * 0.42);

  grid = (i: number) => 1 + i * (this.cellSize); // 1% から開始して外周の縁を残す
  cellX = (c: number) => this.grid(c);
  cellY = (r: number) => this.grid(r);
  cellCenterX = (c: number) => this.cellX(c) + this.cellSize / 2;
  cellCenterY = (r: number) => this.cellY(r) + this.cellSize / 2;

  legalMovesForTurn = computed(() => legalMoves(this.board(), this.turn()));
  score = computed(() => {
    const b = this.board();
    let black = 0, white = 0;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (b[r][c] === 1) black++;
      else if (b[r][c] === -1) white++;
    }
    return { black, white };
  });
  gameOver = computed(() => {
    const b = this.board();
    return legalMoves(b, 1).length === 0 && legalMoves(b, -1).length === 0;
  });

  place(r: number, c: number) {
    if (this.gameOver()) return;
    const flips = flipsIfPlace(this.board(), r, c, this.turn());
    if (!flips.length) return;
    const nb = cloneBoard(this.board());
    nb[r][c] = this.turn();
    flips.forEach(p => nb[p.r][p.c] = this.turn());
    this.board.set(nb);

    // 手番交代。置けない場合は自動パス。
    const next = (this.turn() === 1 ? -1 : 1) as Cell;
    if (legalMoves(nb, next).length > 0) {
      this.turn.set(next);
    } else if (legalMoves(nb, this.turn()).length === 0) {
      // 両者置けない → 終局
      this.turn.set(next); // 表示上は切り替わるが gameOver が true になる
    }
  }

  pass() {
    if (this.gameOver()) return;
    if (this.legalMovesForTurn().length > 0) return; // 置けるならパス不可
    this.turn.set(this.turn() === 1 ? -1 : 1);
  }

  reset() {
    this.board.set(initialBoard());
    this.turn.set(1);
  }

  // デバッグ：終局時に勝敗をコンソールへ
  _log = effect(() => {
    if (this.gameOver()) {
      const s = this.score();
      const result = s.black === s.white ? '引き分け' : (s.black > s.white ? '黒の勝ち' : '白の勝ち');
      console.log(`[Game Over] Black ${s.black} - White ${s.white} => ${result}`);
    }
  });
}