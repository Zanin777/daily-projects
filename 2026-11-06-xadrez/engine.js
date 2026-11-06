"use strict";

/**
 * Motor de xadrez completo, sem bibliotecas.
 *
 * Tabuleiro: array de 64 casas (0 = a1, 7 = h1, 56 = a8, 63 = h8).
 * Cada casa tem null ou uma string como "wK" (rei branco) e "bP" (peão preto).
 *
 * Regras: todos os movimentos, xeque, roque (com todas as condições), en passant,
 * promoção, xeque-mate, afogamento, regra dos 50 lances, repetição tripla e
 * material insuficiente. Também gera a notação em português e escolhe lances
 * para o computador (minimax com poda alfa-beta + busca de capturas).
 */
const Chess = (() => {
  const FILES_ = "abcdefgh";
  const LETRA = { K: "R", Q: "D", R: "T", B: "B", N: "C" };

  const KNIGHT_ = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const KING_ = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ROOK_ = KING_.slice(0, 4);
  const BISHOP_ = KING_.slice(4);

  const at = (f, r) => (f >= 0 && f < 8 && r >= 0 && r < 8 ? r * 8 + f : -1);
  const name = (i) => FILES_[i & 7] + ((i >> 3) + 1);
  const index = (s) => (Number(s[1]) - 1) * 8 + FILES_.indexOf(s[0]);
  const other = (c) => (c === "w" ? "b" : "w");

  /* ---------------- Estado ---------------- */

  function initial() {
    const b = Array(64).fill(null);
    const back = "RNBQKBNR";
    for (let f = 0; f < 8; f++) {
      b[f] = "w" + back[f];
      b[8 + f] = "wP";
      b[48 + f] = "bP";
      b[56 + f] = "b" + back[f];
    }
    const st = { b, turn: "w", castle: { wK: true, wQ: true, bK: true, bQ: true }, ep: -1, half: 0, full: 1 };
    st.keys = [key(st)];
    return st;
  }

  /** Identidade da posição (para a repetição tripla). */
  function key(st) {
    const c = st.castle;
    const rights = (c.wK ? "K" : "") + (c.wQ ? "Q" : "") + (c.bK ? "k" : "") + (c.bQ ? "q" : "");
    // A casa de en passant só conta se alguém puder mesmo capturar nela.
    let ep = -1;
    if (st.ep >= 0) {
      const dir = st.turn === "w" ? -1 : 1;
      const f = st.ep & 7;
      const r = (st.ep >> 3) + dir;
      for (const df of [-1, 1]) {
        const j = at(f + df, r);
        if (j >= 0 && st.b[j] === st.turn + "P") ep = st.ep;
      }
    }
    return st.b.map((p) => p || "--").join("") + st.turn + rights + ep;
  }

  /* ---------------- Ataques ---------------- */

  /** A casa `i` está atacada por alguma peça da cor `by`? */
  function attacked(b, i, by) {
    const f = i & 7;
    const r = i >> 3;
    const pawnRow = by === "w" ? r - 1 : r + 1;
    for (const df of [-1, 1]) {
      const j = at(f + df, pawnRow);
      if (j >= 0 && b[j] === by + "P") return true;
    }
    for (const [df, dr] of KNIGHT_) {
      const j = at(f + df, r + dr);
      if (j >= 0 && b[j] === by + "N") return true;
    }
    for (const [df, dr] of KING_) {
      const j = at(f + df, r + dr);
      if (j >= 0 && b[j] === by + "K") return true;
    }
    const slide = (dirs, a, c) => {
      for (const [df, dr] of dirs) {
        let ff = f + df;
        let rr = r + dr;
        while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
          const p = b[rr * 8 + ff];
          if (p) {
            if (p[0] === by && (p[1] === a || p[1] === c)) return true;
            break;
          }
          ff += df;
          rr += dr;
        }
      }
      return false;
    };
    return slide(ROOK_, "R", "Q") || slide(BISHOP_, "B", "Q");
  }

  const kingSquare = (b, color) => b.indexOf(color + "K");
  const inCheck = (st) => attacked(st.b, kingSquare(st.b, st.turn), other(st.turn));

  /* ---------------- Geração de lances ---------------- */

  /** Lances possíveis sem checar se o próprio rei fica em xeque (o roque já é checado). */
  function pseudo(st) {
    const { b, turn } = st;
    const opp = other(turn);
    const out = [];
    const add = (from, to, extra = {}) =>
      out.push({ from, to, piece: b[from], captured: extra.ep ? opp + "P" : b[to], ...extra });

    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p || p[0] !== turn) continue;
      const f = i & 7;
      const r = i >> 3;
      const t = p[1];

      if (t === "P") {
        const dir = turn === "w" ? 1 : -1;
        const startRank = turn === "w" ? 1 : 6;
        const lastRank = turn === "w" ? 7 : 0;
        const pawnMove = (to, extra = {}) => {
          if (to >> 3 === lastRank) for (const promo of ["Q", "R", "B", "N"]) add(i, to, { ...extra, promo });
          else add(i, to, extra);
        };
        const one = at(f, r + dir);
        if (one >= 0 && !b[one]) {
          pawnMove(one);
          const two = at(f, r + 2 * dir);
          if (r === startRank && !b[two]) add(i, two, { double: true });
        }
        for (const df of [-1, 1]) {
          const j = at(f + df, r + dir);
          if (j < 0) continue;
          if (b[j] && b[j][0] === opp) pawnMove(j);
          else if (j === st.ep) add(i, j, { ep: true });
        }
      } else if (t === "N" || t === "K") {
        for (const [df, dr] of t === "N" ? KNIGHT_ : KING_) {
          const j = at(f + df, r + dr);
          if (j >= 0 && (!b[j] || b[j][0] === opp)) add(i, j);
        }
        // Roque: rei e torre sem ter mexido, caminho livre, e o rei não está,
        // não passa e não termina em casa atacada.
        const home = turn === "w" ? 4 : 60;
        if (t === "K" && i === home && !attacked(b, i, opp)) {
          if (st.castle[turn + "K"] && !b[i + 1] && !b[i + 2] && b[i + 3] === turn + "R"
            && !attacked(b, i + 1, opp) && !attacked(b, i + 2, opp)) {
            add(i, i + 2, { castle: "K" });
          }
          if (st.castle[turn + "Q"] && !b[i - 1] && !b[i - 2] && !b[i - 3] && b[i - 4] === turn + "R"
            && !attacked(b, i - 1, opp) && !attacked(b, i - 2, opp)) {
            add(i, i - 2, { castle: "Q" });
          }
        }
      } else {
        const dirs = t === "R" ? ROOK_ : t === "B" ? BISHOP_ : KING_;
        for (const [df, dr] of dirs) {
          let ff = f + df;
          let rr = r + dr;
          while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
            const j = rr * 8 + ff;
            if (!b[j]) add(i, j);
            else {
              if (b[j][0] === opp) add(i, j);
              break;
            }
            ff += df;
            rr += dr;
          }
        }
      }
    }
    return out;
  }

  /** Aplica um lance (sem atualizar o histórico de repetição: rápido, para a busca). */
  function apply(st, m) {
    const b = st.b.slice();
    const turn = st.turn;
    b[m.to] = m.promo ? turn + m.promo : b[m.from];
    b[m.from] = null;
    if (m.ep) b[m.to + (turn === "w" ? -8 : 8)] = null;
    if (m.castle === "K") { b[m.from + 1] = b[m.from + 3]; b[m.from + 3] = null; }
    if (m.castle === "Q") { b[m.from - 1] = b[m.from - 4]; b[m.from - 4] = null; }

    const castle = { ...st.castle };
    if (m.piece[1] === "K") castle[turn + "K"] = castle[turn + "Q"] = false;
    for (const s of [m.from, m.to]) {
      if (s === 0) castle.wQ = false;
      if (s === 7) castle.wK = false;
      if (s === 56) castle.bQ = false;
      if (s === 63) castle.bK = false;
    }
    return {
      b,
      turn: other(turn),
      castle,
      ep: m.double ? (m.from + m.to) / 2 : -1,
      half: m.piece[1] === "P" || m.captured ? 0 : st.half + 1,
      full: st.full + (turn === "b" ? 1 : 0),
      keys: st.keys,
    };
  }

  const leavesKingSafe = (st, m) => {
    const ns = apply(st, m);
    return !attacked(ns.b, kingSquare(ns.b, st.turn), ns.turn);
  };

  function legal(st) {
    return pseudo(st).filter((m) => leavesKingSafe(st, m));
  }

  /** Aplica um lance de verdade (guarda a posição para a repetição tripla). */
  function make(st, m) {
    const ns = apply(st, m);
    ns.keys = st.keys.concat(key(ns));
    return ns;
  }

  /* ---------------- Fim de jogo ---------------- */

  function insufficient(b) {
    const minors = [];
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p || p[1] === "K") continue;
      if (p[1] === "P" || p[1] === "R" || p[1] === "Q") return false;
      minors.push({ t: p[1], color: ((i & 7) + (i >> 3)) % 2 });
    }
    if (minors.length <= 1) return true; // rei sozinho, ou rei + um bispo/cavalo
    // Só bispos, todos em casas da mesma cor: ninguém consegue dar mate.
    return minors.every((m) => m.t === "B" && m.color === minors[0].color);
  }

  /**
   * { over: false, check, moves } ou
   * { over: true, result: "1-0" | "0-1" | "1/2", reason: "mate" | "stalemate" | "fifty" | "repetition" | "material" }
   */
  function status(st) {
    const moves = legal(st);
    const check = inCheck(st);
    if (!moves.length) {
      if (check) return { over: true, result: st.turn === "w" ? "0-1" : "1-0", reason: "mate", check };
      return { over: true, result: "1/2", reason: "stalemate", check };
    }
    if (insufficient(st.b)) return { over: true, result: "1/2", reason: "material", check };
    if (st.half >= 100) return { over: true, result: "1/2", reason: "fifty", check };
    const last = st.keys[st.keys.length - 1];
    if (st.keys.filter((k) => k === last).length >= 3) return { over: true, result: "1/2", reason: "repetition", check };
    return { over: false, check, moves };
  }

  /* ---------------- Notação (em português) ---------------- */

  function san(st, m, legalMoves = legal(st)) {
    let s;
    if (m.castle) s = m.castle === "K" ? "O-O" : "O-O-O";
    else if (m.piece[1] === "P") {
      s = m.captured ? FILES_[m.from & 7] + "x" + name(m.to) : name(m.to);
      if (m.promo) s += "=" + LETRA[m.promo];
    } else {
      // Desambiguação: quando duas peças iguais podem ir para a mesma casa.
      const rivals = legalMoves.filter((o) => o.to === m.to && o.piece === m.piece && o.from !== m.from);
      let dis = "";
      if (rivals.length) {
        const sameFile = rivals.some((o) => (o.from & 7) === (m.from & 7));
        const sameRank = rivals.some((o) => o.from >> 3 === m.from >> 3);
        if (!sameFile) dis = FILES_[m.from & 7];
        else if (!sameRank) dis = String((m.from >> 3) + 1);
        else dis = name(m.from);
      }
      s = LETRA[m.piece[1]] + dis + (m.captured ? "x" : "") + name(m.to);
    }
    const ns = apply(st, m);
    if (inCheck(ns)) s += legal(ns).length ? "+" : "#";
    return s;
  }

  /* ---------------- Computador ---------------- */

  const VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };

  // Tabelas de posição (do ponto de vista das brancas, fileira 8 em cima).
  const PST = {
    P: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    N: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    B: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    R: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    Q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    K: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10,
      20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
    KE: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30,
      -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50],
  };

  /** Avaliação do ponto de vista de quem joga (positivo = bom para quem tem a vez). */
  function evaluate(st) {
    const b = st.b;
    let heavy = 0;
    for (let i = 0; i < 64; i++) if (b[i] && b[i][1] !== "P" && b[i][1] !== "K") heavy += VALUE[b[i][1]];
    const endgame = heavy <= 1300;
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p) continue;
      const t = p[1];
      const table = t === "K" && endgame ? PST.KE : PST[t];
      const f = i & 7;
      const r = i >> 3;
      const v = VALUE[t] + (p[0] === "w" ? table[(7 - r) * 8 + f] : table[r * 8 + f]);
      score += p[0] === "w" ? v : -v;
    }
    return st.turn === "w" ? score : -score;
  }

  const MATE = 100000;
  const orderScore = (m) => (m.captured ? 10 * VALUE[m.captured[1]] - VALUE[m.piece[1]] + 1000 : 0) + (m.promo ? 800 : 0);
  const order = (moves) => moves.sort((a, b) => orderScore(b) - orderScore(a));

  function quiesce(st, alpha, beta, depth) {
    const stand = evaluate(st);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (depth >= 4) return alpha;
    const caps = order(pseudo(st).filter((m) => m.captured || m.promo === "Q"));
    for (const m of caps) {
      const ns = apply(st, m);
      if (attacked(ns.b, kingSquare(ns.b, st.turn), ns.turn)) continue;
      const score = -quiesce(ns, -beta, -alpha, depth + 1);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function search(st, depth, alpha, beta, ply) {
    if (depth <= 0) return quiesce(st, alpha, beta, 0);
    const moves = order(legal(st));
    if (!moves.length) return inCheck(st) ? -MATE + ply : 0;
    for (const m of moves) {
      const score = -search(apply(st, m), depth - 1, -beta, -alpha, ply + 1);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  const LEVELS = {
    1: { depth: 1, noise: 220 }, // fácil: erra bastante
    2: { depth: 2, noise: 35 }, // médio
    3: { depth: 4, noise: 0 }, // difícil
  };

  /** Escolhe um lance para quem tem a vez. */
  function bestMove(st, level = 2) {
    const { depth, noise } = LEVELS[level] || LEVELS[2];
    const moves = legal(st);
    if (!moves.length) return null;
    // Embaralha antes de ordenar: lances igualmente bons variam de partida para partida.
    for (let i = moves.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [moves[i], moves[j]] = [moves[j], moves[i]];
    }
    order(moves);

    let best = moves[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    for (const m of moves) {
      // Com "ruído" cada lance precisa da nota exata; sem ruído, a poda alfa-beta acelera.
      const a = noise ? -Infinity : alpha;
      let score = -search(apply(st, m), depth - 1, -Infinity, -a, 1);
      if (noise) score += (Math.random() * 2 - 1) * noise;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
      if (score > alpha) alpha = score;
    }
    return best;
  }

  return { initial, legal, make, status, san, inCheck, bestMove, name, index, attacked, VALUE };
})();
