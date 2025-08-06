import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Cell = 0 | 1 | -1; // 0: empty, 1: black, -1: white
type Pos = { r: number; c: number };

// 盤は8x8のマスだが、交点は9x9（0..8）
const SIZE = 8;
const POINTS = SIZE + 1;
const DIRS: Pos[] = [
  { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 },
  { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
];

function inPoints(r: number, c: number) {
  return r >= 0 && r < POINTS && c >= 0 && c < POINTS;
}

// 交点ベースの初期配置（中央の4交点に斜め対称で配置）
function initialBoard(): Cell[][] {
  const b: Cell[][] = Array.from({ length: POINTS }, () => Array<Cell>(POINTS).fill(0));
  // 中央は (4,4) 周辺4点に従来の配置を合わせる
  b[4][4] = -1; // 白
  b[4][5] = 1;  // 黒
  b[5][4] = 1;  // 黒
  b[5][5] = -1; // 白
  return b;
}

function cloneBoard(b: Cell[][]) {
  return b.map(row => row.slice());
}

function flipsIfPlace(b: Cell[][], r: number, c: number, player: Cell): Pos[] {
  if (b[r][c] !== 0) return [];
  const res: Pos[] = [];
  for (const d of DIRS) {
    const maybe: Pos[] = [];
    let nr = r + d.r, nc = c + d.c;
    while (inPoints(nr, nc) && b[nr][nc] === (player === 1 ? -1 : 1)) {
      maybe.push({ r: nr, c: nc });
      nr += d.r; nc += d.c;
    }
    if (inPoints(nr, nc) && b[nr][nc] === player && maybe.length) {
      res.push(...maybe);
    }
  }
  return res;
}

function legalMoves(b: Cell[][], player: Cell): Pos[] {
  const moves: Pos[] = [];
  for (let r = 0; r < POINTS; r++) {
    for (let c = 0; c < POINTS; c++) {
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
        <h1 class="title">Nip - 円形リバーシ（交点置き）</h1>
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
            置ける交点は淡いハイライトで表示されます。
          </p>
        </div>
      </aside>

      <main class="board-area">
        <div class="square">
          <svg class="board" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" (contextmenu)="$event.preventDefault()">
            <defs>
              <clipPath id="circleClip">
                <circle cx="50" cy="50" r="48"></circle>
              </clipPath>
            </defs>

            <rect x="0" y="0" width="100" height="100" fill="#000"/>
            <g clip-path="url(#circleClip)">
              <rect x="0" y="0" width="100" height="100" fill="#0d401f"/>

              <!-- 8x8グリッド線 -->
              <g stroke="#b9d7be" stroke-width="0.4" stroke-linecap="round" opacity="0.7">
                @for (i of gridIdx; track i) {
                  <line [attr.x1]="grid(0)" [attr.y1]="grid(i)" [attr.x2]="grid(8)" [attr.y2]="grid(i)"></line>
                  <line [attr.x1]="grid(i)" [attr.y1]="grid(0)" [attr.x2]="grid(i)" [attr.y2]="grid(8)"></line>
                }
                <circle cx="50" cy="50" r="48" fill="none" stroke="#e3f2e6" stroke-width="1.2"></circle>
              </g>

              <!-- 合法手の交点ハイライト -->
              <g opacity="0.35">
                @for (m of legalMovesForTurn(); track m.r + '-' + m.c) {
                  <circle class="hint-point"
                          [attr.cx]="pointX(m.c)"
                          [attr.cy]="pointY(m.r)"
                          [attr.r]="hintR"
                          fill="#9ad4a0" />
                }
              </g>

              <!-- クリック領域（交点近傍） -->
              <g>
                @for (r of points; track r) {
                  @for (c of points; track c) {
                    <circle class="hit" [attr.cx]="pointX(c)" [attr.cy]="pointY(r)" [attr.r]="hitR"
                            fill="transparent" (click)="place(r,c)"></circle>
                  }
                }
              </g>

              <!-- 石（交点に配置） -->
              <g>
                @for (r of points; track r) {
                  @for (c of points; track c) {
                    @if (board()[r][c] !== 0) {
                      <circle [attr.cx]="pointX(c)" [attr.cy]="pointY(r)" [attr.r]="discR"
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
    .left { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
    .title { font-size: 24px; font-weight: 700; letter-spacing: 0.02em; }
    .panel { width: 100%; background: #0b0b0b; border: 1px solid #1e1e1e; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
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
    .btn { background: #1b5e20; color: #e8f5e9; border: none; padding: 10px 14px; border-radius: 10px; cursor: pointer; transition: transform 120ms ease, opacity 120ms ease; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn:hover:not(:disabled) { transform: translateY(-1px); }

    .board-area { display: grid; place-items: center; }
    .square { width: 100%; height: 100%; max-width: 100%; display: grid; place-items: center; }
    .board { width: min(100%, calc(100vh - 32px)); height: auto; max-height: calc(100vh - 32px); border-radius: 16px; display: block; background: transparent; }

    .hint-point { pointer-events: none; }
    .hit { cursor: pointer; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReversiBoardComponent {
  // 交点ベースのボード状態
  board = signal<Cell[][]>(initialBoard());
  turn = signal<Cell>(1); // 1: 黒, -1: 白

  // 描画用
  gridIdx = Array.from({ length: SIZE + 1 }, (_, i) => i); // 0..8 for lines
  points = Array.from({ length: POINTS }, (_, i) => i);    // 0..8 for intersections

  // 幾何
  cellSize = 100 / SIZE;           // マス幅（グリッド線の間隔）
  margin = 1;                      // 外周余白(%)
  point = (i: number) => this.margin + i * (this.cellSize); // 交点の座標(%)
  grid = (i: number) => this.point(i); // 線の位置(%)

  // 半径設定（相対%）
  discR = (this.cellSize * 0.28);
  hintR = (this.cellSize * 0.18);
  hitR = (this.cellSize * 0.45);

  pointX = (c: number) => this.point(c);
  pointY = (r: number) => this.point(r);

  legalMovesForTurn = computed(() => legalMoves(this.board(), this.turn()));
  score = computed(() => {
    const b = this.board();
    let black = 0, white = 0;
    for (let r = 0; r < POINTS; r++) for (let c = 0; c < POINTS; c++) {
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

    // 手番交代（置けない場合は自動パス、両者不可で終局）
    const next = (this.turn() === 1 ? -1 : 1) as Cell;
    if (legalMoves(nb, next).length > 0) {
      this.turn.set(next);
    } else if (legalMoves(nb, this.turn()).length === 0) {
      this.turn.set(next);
    }
  }

  pass() {
    if (this.gameOver()) return;
    if (this.legalMovesForTurn().length > 0) return;
    this.turn.set(this.turn() === 1 ? -1 : 1);
  }

  reset() {
    this.board.set(initialBoard());
    this.turn.set(1);
  }

  _log = effect(() => {
    if (this.gameOver()) {
      const s = this.score();
      const result = s.black === s.white ? '引き分け' : (s.black > s.white ? '黒の勝ち' : '白の勝ち');
      console.log(`[Game Over] Black ${s.black} - White ${s.white} => ${result}`);
    }
  });
}