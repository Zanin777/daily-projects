"use strict";

/* ============================================================
   Mesa de No-Limit Texas Hold'em contra o computador.
   Você + 3 bots, 1.000 fichas de mentira cada, blinds 5/10.
   ============================================================ */

const GAME = { SB: 5, BB: 10, START: 1000 };
const LEVEL_NAME = { 1: "Fácil", 2: "Médio", 3: "Difícil" };

const G = {
  level: 2,
  players: [],
  dealer: -1,
  sbI: -1,
  bbI: -1,
  handNo: 0,
  deck: [],
  board: [],
  street: "preflop",
  currentBet: 0,
  minRaise: GAME.BB,
  toAct: -1,
  handOver: false,
  matchOver: null,
  thinking: null,
  token: 0,
  fast: false, // usado nos testes automáticos: sem esperas e sem desenhar
  simScale: 1, // nos testes, menos simulações para rodar milhares de mãos
  log: [],
  anim: { deal: false, board: 0 },
  message: "",
};

const PLAYER_DEFS = [
  { id: "voce", name: "Você", seat: "s-bottom", color: "#c9a227", human: true },
  { id: "ana", name: "Ana", seat: "s-left", color: "#b0478f" },
  { id: "bruno", name: "Bruno", seat: "s-top", color: "#2b6fd6" },
  { id: "carla", name: "Carla", seat: "s-right", color: "#2f9a6a" },
];

/* ---------------- Ajudantes ---------------- */

const live = (p) => !p.out;
const inHand = (p) => !p.out && !p.folded;
const canAct = (p) => !p.out && !p.folded && !p.allIn;
const human = () => G.players[0];
const potTotal = () => G.players.reduce((s, p) => s + p.total, 0);

/** Próximo jogador (sentido horário) depois de `i` que satisfaz `pred`; -1 se ninguém. */
function nextIdx(i, pred) {
  const n = G.players.length;
  for (let k = 1; k <= n; k++) {
    const j = (i + k + n) % n;
    if (pred(G.players[j])) return j;
  }
  return -1;
}

function addLog(text, cls = "") {
  G.log.unshift({ text, cls });
  if (G.log.length > 60) G.log.pop();
}

function wait(ms) {
  return G.fast ? 0 : ms;
}

function later(fn, ms) {
  const token = G.token;
  const run = () => { if (token === G.token) fn(); };
  if (G.fast) run();
  else setTimeout(run, ms);
}

/** Coloca fichas do jogador na mesa (limitado ao que ele tem). */
function putChips(p, amount) {
  const a = Math.max(0, Math.min(amount, p.stack));
  p.stack -= a;
  p.bet += a;
  p.total += a;
  if (p.stack === 0) p.allIn = true;
  return a;
}

/* ---------------- Partida e mãos ---------------- */

function newMatch() {
  G.token++;
  G.players = PLAYER_DEFS.map((d) => ({
    ...d, stack: GAME.START, hole: [], bet: 0, total: 0, folded: false, allIn: false,
    acted: false, noRaise: false, out: false, tag: "", won: 0, show: false,
  }));
  G.dealer = Math.floor(Math.random() * G.players.length);
  G.handNo = 0;
  G.log = [];
  G.matchOver = null;
  addLog(`Nova partida. Todos começam com ${GAME.START} fichas. Nível: ${LEVEL_NAME[G.level]}.`, "sys");
  startHand();
}

function startHand() {
  G.token++;
  for (const p of G.players) if (p.stack <= 0) p.out = true;
  if (human().out) return endMatch(false);
  if (G.players.filter(live).length === 1) return endMatch(true);

  for (const p of G.players) {
    Object.assign(p, { hole: [], bet: 0, total: 0, folded: p.out, allIn: false, acted: false, noRaise: false, tag: "", won: 0, show: false, best: null });
  }
  G.handNo++;
  G.board = [];
  G.deck = shuffle(fullDeck());
  G.street = "preflop";
  G.handOver = false;
  G.thinking = null;
  G.message = "";

  const alive = G.players.filter(live).length;
  G.dealer = nextIdx(G.dealer, live);
  // No mano a mano (2 jogadores), o botão é o small blind e fala primeiro no pré-flop.
  G.sbI = alive === 2 ? G.dealer : nextIdx(G.dealer, live);
  G.bbI = nextIdx(G.sbI, live);

  const sb = G.players[G.sbI];
  const bb = G.players[G.bbI];
  putChips(sb, GAME.SB);
  putChips(bb, GAME.BB);
  sb.tag = "Small blind";
  bb.tag = "Big blind";

  // Distribui 2 cartas para cada um, começando pelo small blind.
  for (let round = 0; round < 2; round++) {
    let i = G.sbI;
    for (let k = 0; k < G.players.length; k++) {
      const p = G.players[(i + k) % G.players.length];
      if (live(p)) p.hole.push(G.deck.pop());
    }
  }
  G.currentBet = GAME.BB;
  G.minRaise = GAME.BB;
  G.toAct = nextIdx(G.bbI, canAct);
  G.anim = { deal: true, board: 0 };

  addLog(`Mão #${G.handNo} · botão com ${G.players[G.dealer].name}`, "hand");
  if (!G.fast) {
    Sfx.card(0);
    Sfx.card(0.1);
    Sfx.card(0.2);
  }
  proceed();
}

function endMatch(won) {
  G.matchOver = won ? "win" : "lose";
  G.toAct = -1;
  addLog(won ? "Você ganhou todas as fichas da mesa!" : "Você ficou sem fichas.", "sys");
  if (!G.fast) (won ? Sfx.good : Sfx.bad)();
  render();
}

/* ---------------- Rodadas de apostas ---------------- */

function roundComplete() {
  const actors = G.players.filter(canAct);
  if (actors.length === 0) return true;
  if (actors.length === 1 && actors[0].bet >= G.currentBet) return true;
  return actors.every((p) => p.acted && p.bet === G.currentBet);
}

function proceed() {
  if (G.players.filter(inHand).length === 1) return winByFold();
  if (roundComplete()) return nextStreet();
  if (G.toAct < 0 || !canAct(G.players[G.toAct])) G.toAct = nextIdx(G.toAct, canAct);

  const p = G.players[G.toAct];
  if (p.human) {
    G.thinking = null;
    render();
    return;
  }
  G.thinking = p.id;
  render();
  const base = G.level === 1 ? 550 : G.level === 2 ? 800 : 1000;
  later(() => {
    G.thinking = null;
    act(G.toAct, botDecide(p));
  }, wait(base + Math.random() * 600));
}

/** Ações possíveis para o jogador i. */
function options(i) {
  const p = G.players[i];
  const toCall = Math.max(0, G.currentBet - p.bet);
  const maxTo = p.bet + p.stack;
  const minTo = G.currentBet === 0 ? Math.min(GAME.BB, maxTo) : Math.min(G.currentBet + G.minRaise, maxTo);
  return {
    toCall,
    callAmount: Math.min(toCall, p.stack),
    canCheck: toCall === 0,
    canRaise: !p.noRaise && maxTo > G.currentBet,
    minTo,
    maxTo,
    isBet: G.currentBet === 0,
  };
}

/** a = { type: "fold" | "check" | "call" | "raise", to } */
function act(i, a) {
  const p = G.players[i];
  const o = options(i);
  let type = a.type;
  if (type === "check" && !o.canCheck) type = "call";
  if (type === "fold" && o.canCheck) type = "check";
  if (type === "raise" && !o.canRaise) type = o.canCheck ? "check" : "call";

  if (type === "fold") {
    p.folded = true;
    p.tag = "Desiste";
    addLog(`${p.name} desiste.`);
  } else if (type === "check") {
    p.tag = "Passa";
    addLog(`${p.name} passa.`);
  } else if (type === "call") {
    const amt = putChips(p, o.toCall);
    p.tag = p.allIn ? `All-in (${p.bet})` : `Paga ${amt}`;
    addLog(`${p.name} ${p.allIn ? `paga ${amt} e fica all-in` : `paga ${amt}`}.`);
    if (!G.fast) Sfx.chip();
  } else {
    const to = Math.max(o.minTo, Math.min(o.maxTo, Math.round(a.to)));
    putChips(p, to - p.bet);
    const raiseBy = to - G.currentBet;
    const full = raiseBy >= G.minRaise;
    if (to > G.currentBet) {
      for (const q of G.players) {
        if (q === p || !canAct(q)) continue;
        if (full) {
          q.acted = false;
          q.noRaise = false;
        } else if (q.acted) {
          // Aumento all-in menor que o mínimo não reabre as apostas para quem já agiu.
          q.acted = false;
          q.noRaise = true;
        }
      }
      if (full) G.minRaise = raiseBy;
      G.currentBet = to;
    }
    const verb = o.isBet ? "aposta" : "aumenta para";
    p.tag = p.allIn ? `All-in (${to})` : `${o.isBet ? "Aposta" : "Aumenta para"} ${to}`;
    addLog(`${p.name} ${verb} ${to}${p.allIn ? " (all-in)" : ""}.`);
    if (!G.fast) Sfx.chip();
  }
  p.acted = true;
  p.noRaise = false;
  G.toAct = nextIdx(i, canAct);
  proceed();
}

function nextStreet() {
  for (const p of G.players) {
    p.bet = 0;
    p.acted = false;
    p.noRaise = false;
    if (!p.folded && !p.out) p.tag = p.allIn ? "All-in" : "";
  }
  G.currentBet = 0;
  G.minRaise = GAME.BB;

  if (G.street === "river") return showdown();
  const next = { preflop: "flop", flop: "turn", turn: "river" }[G.street];
  G.deck.pop(); // carta queimada, como no jogo de verdade
  const n = next === "flop" ? 3 : 1;
  for (let k = 0; k < n; k++) G.board.push(G.deck.pop());
  G.street = next;
  G.anim.board = G.board.length - n;
  addLog(`${{ flop: "Flop", turn: "Turn", river: "River" }[next]}: ${G.board.slice(-n).map(short).join(" ")}`, "street");
  if (!G.fast) for (let k = 0; k < n; k++) Sfx.card(k * 0.12);

  // Se ninguém mais pode apostar (todos all-in), as cartas são abertas e a mesa é completada.
  if (G.players.filter(canAct).length <= 1) {
    for (const p of G.players) if (inHand(p)) p.show = true;
    G.toAct = -1;
    render();
    later(nextStreet, wait(1300));
    return;
  }
  G.toAct = nextIdx(G.dealer, canAct);
  later(proceed, wait(450));
  render();
}

function winByFold() {
  const w = G.players.find(inHand);
  const total = potTotal();
  w.stack += total;
  w.won = total;
  w.tag = `Ganha ${total}`;
  for (const p of G.players) p.bet = 0;
  G.handOver = true;
  G.toAct = -1;
  G.message = `${w.name === "Você" ? "Você ganha" : `${w.name} ganha`} ${total} fichas: todos os outros desistiram.`;
  addLog(G.message, "win");
  if (!G.fast) (w.human ? Sfx.good : Sfx.chip)();
  render();
}

/** Divide o dinheiro em potes (principal e paralelos) conforme quanto cada um colocou. */
function buildPots() {
  const levels = [...new Set(G.players.filter((p) => p.total > 0).map((p) => p.total))].sort((a, b) => a - b);
  const pots = [];
  let prev = 0;
  for (const lvl of levels) {
    const part = (p) => Math.max(0, Math.min(p.total, lvl) - prev);
    const amount = G.players.reduce((s, p) => s + part(p), 0);
    const eligible = G.players.filter((p) => inHand(p) && p.total >= lvl);
    // "fromOthers": se alguém fora dos que disputam também colocou fichas nesta faixa.
    const fromOthers = G.players.some((p) => part(p) > 0 && !eligible.includes(p));
    const last = pots[pots.length - 1];
    if (!eligible.length && last) {
      last.amount += amount; // dinheiro de quem desistiu acima de todos
      last.fromOthers = true;
    } else if (last && last.eligible.length === eligible.length && last.eligible.every((p, k) => p === eligible[k])) {
      last.amount += amount;
      last.fromOthers ||= fromOthers;
    } else pots.push({ amount, eligible, fromOthers });
    prev = lvl;
  }
  return pots;
}

function showdown() {
  G.street = "showdown";
  G.toAct = -1;
  const contenders = G.players.filter(inHand);
  for (const p of contenders) {
    p.show = true;
    p.best = bestHand([...p.hole, ...G.board]);
    p.tag = describe(p.best);
  }
  const pots = buildPots();
  const contested = pots.filter((p) => p.eligible.length > 1).length;
  let sideNo = 0;
  const lines = [];
  pots.forEach((pot) => {
    const top = pot.eligible.reduce((a, b) => (compareHands(b.best, a.best) > 0 ? b : a));
    const winners = pot.eligible.filter((p) => compareHands(p.best, top.best) === 0);
    const share = Math.floor(pot.amount / winners.length);
    let rest = pot.amount - share * winners.length;
    // Ficha que sobra na divisão vai para o primeiro vencedor depois do botão.
    const ordered = winners.slice().sort((a, b) => ((G.players.indexOf(a) - G.dealer + 4) % 4 || 4) - ((G.players.indexOf(b) - G.dealer + 4) % 4 || 4));
    for (const w of ordered) {
      const amt = share + (rest > 0 ? 1 : 0);
      if (rest > 0) rest--;
      w.stack += amt;
      w.won += amt;
    }
    if (pot.eligible.length === 1) {
      const who = pot.eligible[0].name;
      lines.push(pot.fromOthers
        ? `${who} leva mais ${pot.amount} fichas de um pote em que só ${who === "Você" ? "você" : "ele(a)"} continuava.`
        : `${who} recebe de volta ${pot.amount} fichas que ninguém pagou.`);
      return;
    }
    const potName = contested > 1 ? (sideNo === 0 ? "Pote principal" : `Pote paralelo ${sideNo}`) : "Pote";
    sideNo++;
    if (winners.length > 1) {
      lines.push(`${potName} (${pot.amount}): empate entre ${winners.map((w) => w.name).join(" e ")} com ${describe(top.best)}.`);
    } else {
      lines.push(`${potName} (${pot.amount}): ${top.name} ganha com ${describe(top.best)}.`);
    }
  });
  for (const p of G.players) {
    p.bet = 0;
    if (p.won > 0 && inHand(p)) p.tag = `${describe(p.best)} · +${p.won}`;
  }
  G.handOver = true;
  G.message = lines.join(" ");
  lines.forEach((l) => addLog(l, "win"));
  if (!G.fast) {
    if (human().won > 0) Sfx.good();
    else if (inHand(human())) Sfx.bad();
    else Sfx.chip();
  }
  render();
}

/* ============================================================
   Inteligência artificial
   ============================================================ */

/** Chance de ganhar (0 a 1) simulando o resto da mão contra cartas aleatórias. */
function equity(p, sims) {
  const opps = G.players.filter((o) => o !== p && inHand(o)).length;
  if (opps === 0) return 1;
  const known = new Set([...p.hole, ...G.board]);
  const rest = fullDeck().filter((c) => !known.has(c));
  const need = opps * 2 + (5 - G.board.length);
  let score = 0;
  for (let s = 0; s < sims; s++) {
    // Sorteio parcial (Fisher-Yates só do que precisamos).
    for (let k = 0; k < need; k++) {
      const j = k + Math.floor(Math.random() * (rest.length - k));
      [rest[k], rest[j]] = [rest[j], rest[k]];
    }
    const board = [...G.board, ...rest.slice(opps * 2, need)];
    const mine = bestHand([...p.hole, ...board]);
    let lost = false;
    let ties = 0;
    for (let o = 0; o < opps; o++) {
      const c = compareHands(mine, bestHand([rest[o * 2], rest[o * 2 + 1], ...board]));
      if (c < 0) { lost = true; break; }
      if (c === 0) ties++;
    }
    if (!lost) score += 1 / (ties + 1);
  }
  return score / sims;
}

function botDecide(p) {
  const i = G.players.indexOf(p);
  const o = options(i);
  const L = p.level || G.level; // p.level só é usado nos testes automáticos
  const opps = G.players.filter((q) => q !== p && inHand(q)).length;
  const pot = potTotal();
  const potOdds = o.toCall > 0 ? o.toCall / (pot + o.toCall) : 0;
  const r = Math.random();

  let e = equity(p, Math.max(20, Math.round((L === 1 ? 120 : L === 2 ? 350 : 700) * G.simScale)));
  if (L === 1) e = Math.min(1, Math.max(0, e + (Math.random() - 0.5) * 0.3)); // o fácil "lê" mal a mão

  // O que é uma mão boa depende de quantos adversários ainda estão na mão.
  const fair = 1 / (opps + 1);
  const strong = Math.min(0.85, fair + (L === 3 ? 0.27 : 0.22));
  const good = fair + 0.1;

  /** Aumentar para uma fração do pote (já contando o que precisa pagar). */
  const raiseTo = (frac) => {
    let to = G.currentBet + Math.round(((pot + o.toCall) * frac) / 5) * 5;
    to = Math.max(o.minTo, to);
    // Se a aposta for comprometer boa parte das fichas, vai logo all-in.
    if (to - p.bet > p.stack * 0.65) to = o.maxTo;
    return { type: "raise", to: Math.min(to, o.maxTo) };
  };
  const check = { type: "check" };
  const call = { type: "call" };
  const fold = { type: "fold" };

  if (L === 1) {
    // Fácil: passivo, paga quase tudo e raramente aumenta.
    if (o.toCall === 0) return e > strong && r < 0.5 ? raiseTo(0.5) : check;
    if (e > strong + 0.1 && o.canRaise && r < 0.3) return { type: "raise", to: o.minTo };
    if (e < potOdds * 0.6 && r < 0.7) return fold;
    return call;
  }

  if (L === 2) {
    // Médio: segue as pot odds, aposta mãos boas e blefa de vez em quando.
    if (o.toCall === 0) {
      if (e > strong) return r < 0.85 ? raiseTo(0.66) : check;
      if (e > good && r < 0.35) return raiseTo(0.5);
      if (r < 0.06) return raiseTo(0.5);
      return check;
    }
    if (e > strong && o.canRaise && r < 0.7) return raiseTo(0.75);
    if (e >= potOdds - 0.02) return call;
    if (o.canRaise && r < 0.03) return raiseTo(0.6);
    return fold;
  }

  // Difícil: pot odds com margem para cartas futuras, mais agressivo, semi-blefes e às vezes disfarça.
  const lastToAct = nextIdx(i, canAct) === -1 || G.players.filter(canAct).every((q) => q === p || q.acted);
  const callLine = potOdds - (G.street !== "river" ? 0.05 : 0.01);
  if (o.toCall === 0) {
    if (e > strong) return r < 0.15 && G.street !== "river" ? check : raiseTo(0.75);
    if (e > good) return r < 0.6 ? raiseTo(0.5) : check;
    if ((lastToAct || opps === 1) && r < 0.18) return raiseTo(0.6);
    return check;
  }
  if (e > strong + 0.15 && o.canRaise) return raiseTo(1);
  if (e > strong && o.canRaise && r < 0.5) return raiseTo(0.75);
  if (e >= callLine) return call;
  if (o.canRaise && G.street !== "river" && e > fair * 0.8 && r < 0.08) return raiseTo(0.7);
  return fold;
}

/* ============================================================
   Tela
   ============================================================ */

const $g = (id) => document.getElementById(id);
let showHint = false;

function gSeatHTML(p, i) {
  const roles = [];
  if (!p.out && G.handNo) {
    if (i === G.dealer) roles.push('<span class="role dealer">D</span>');
    if (i === G.sbI && G.players.filter(live).length > 2) roles.push('<span class="role sb">SB</span>');
    if (i === G.bbI) roles.push('<span class="role bb">BB</span>');
  }
  const faceUp = p.human || p.show;
  const winSet = G.handOver && p.won > 0 && p.best ? new Set(p.best.cards) : null;
  let hole = "";
  if (!p.out && p.hole.length) {
    hole = p.hole.map((c, k) => {
      const anim = G.anim.deal ? "deal" : "";
      const used = winSet && winSet.has(c) ? "used" : "";
      const style = `style="--d:${(i + k * 4) * 60}ms"`;
      return (faceUp ? cardHTML(c, `${anim} ${used}`) : backHTML(anim)).replace('class="card', `${style} class="card`);
    }).join("");
  }
  const tagCls = p.folded && !p.out ? "fold" : p.won > 0 ? "hand" : "";
  const bet = p.bet ? `<span class="mini-chip"></span>${p.bet}` : "";
  const cls = [
    p.seat, p.folded && !p.out ? "folded" : "", p.out ? "out" : "",
    p.won > 0 && G.handOver ? "winner" : "", G.thinking === p.id ? "thinking" : "",
    G.toAct === i && !G.handOver ? "turn" : "",
  ].join(" ");
  const level = p.human ? "" : `<span class="lvl">${LEVEL_NAME[G.level]}</span>`;
  return `<div class="seat ${cls}">
    <div class="hole">${hole}</div>
    <div class="plate"><span class="avatar" style="background:${p.color}">${p.name[0]}</span><span class="who">${p.name}</span>${level}${roles.join("")}<span class="stack">${p.out ? "fora" : p.stack}</span></div>
    <span class="tag ${tagCls}">${G.thinking === p.id ? "pensando…" : p.tag}</span>
    <span class="bet">${bet}</span>
  </div>`;
}

function render() {
  if (G.fast) return;
  const table = $g("g-table");
  table.querySelectorAll(".seat").forEach((s) => s.remove());
  table.insertAdjacentHTML("beforeend", G.players.map(gSeatHTML).join(""));

  // Mesa (board)
  const winners = G.handOver ? G.players.filter((p) => p.won > 0 && p.best) : [];
  const used = new Set(winners.flatMap((p) => p.best.cards));
  let html = "";
  for (let k = 0; k < 5; k++) {
    if (k < G.board.length) {
      const anim = k >= G.anim.board ? "deal" : "";
      html += cardHTML(G.board[k], `${anim} ${used.has(G.board[k]) ? "used" : ""}`)
        .replace('class="card', `style="--d:${(k - G.anim.board) * 120}ms" class="card`);
    } else html += '<span class="slot"></span>';
  }
  $g("g-board").innerHTML = html;
  G.anim.board = G.board.length;
  G.anim.deal = false;

  // Total em jogo nesta mão (inclui as apostas que ainda estão na frente dos jogadores).
  $g("g-pot").innerHTML = G.handNo && !G.handOver ? `<span class="mini-chip"></span>Pote: ${potTotal()}` : "";

  // Fim de partida
  const over = $g("g-over");
  if (G.matchOver) {
    over.hidden = false;
    $g("g-over-icon").textContent = G.matchOver === "win" ? "🏆" : "🃏";
    $g("g-over-title").textContent = G.matchOver === "win" ? "Você limpou a mesa!" : "Suas fichas acabaram";
    $g("g-over-text").textContent = G.matchOver === "win"
      ? `Você ganhou as ${GAME.START * 4} fichas em ${G.handNo} mãos no nível ${LEVEL_NAME[G.level]}.`
      : `Você jogou ${G.handNo} mãos. Tente de novo, talvez num nível mais fácil, ou com a dica de chance ligada.`;
  } else {
    over.hidden = true;
  }

  renderControls();
  renderLog();
  $g("g-handno").textContent = G.handNo ? `Mão #${G.handNo}` : "";
}

function renderControls() {
  const me = human();
  const myTurn = !G.handOver && !G.matchOver && G.toAct === 0;
  const status = $g("g-status");
  const box = $g("g-actions");
  const next = $g("g-next");

  if (G.matchOver) status.textContent = "Partida encerrada.";
  else if (G.handOver) status.innerHTML = G.message;
  else if (myTurn) status.innerHTML = "<strong>Sua vez!</strong>";
  else if (me.folded) status.textContent = "Você desistiu desta mão. Acompanhe o resto.";
  else if (me.allIn) status.textContent = "Você está all-in. Agora é com as cartas!";
  else status.textContent = G.thinking ? `${G.players.find((p) => p.id === G.thinking).name} está pensando…` : "Aguarde a sua vez.";

  next.hidden = !G.handOver || !!G.matchOver;
  box.classList.toggle("disabled", !myTurn);
  box.querySelectorAll("button, input").forEach((el) => { el.disabled = !myTurn; });

  // Sua mão
  let handText = "";
  if (me.hole.length && !me.out) {
    if (G.board.length >= 3) handText = describe(bestHand([...me.hole, ...G.board]));
    else handText = me.hole[0][0] === me.hole[1][0] ? `Par de ${plural(parse(me.hole[0]).r)}` : `${rankName(Math.max(parse(me.hole[0]).r, parse(me.hole[1]).r))} alto`;
  }
  $g("g-myhand").textContent = handText ? `Sua mão: ${handText}` : "";

  if (!myTurn) {
    $g("g-hint").hidden = true;
    return;
  }
  const o = options(0);
  const fold = $g("g-fold");
  const call = $g("g-call");
  const raise = $g("g-raise");
  const slider = $g("g-amount");
  fold.disabled = o.canCheck;
  call.textContent = o.canCheck ? "Passar" : o.callAmount >= me.stack ? `Pagar all-in (${o.callAmount})` : `Pagar ${o.callAmount}`;
  const raiseWrap = $g("g-raise-box");
  raiseWrap.hidden = !o.canRaise;
  raise.disabled = !o.canRaise;
  if (o.canRaise) {
    slider.min = o.minTo;
    slider.max = o.maxTo;
    slider.step = 5;
    if (Number(slider.dataset.hand) !== G.handNo * 10 + ["preflop", "flop", "turn", "river"].indexOf(G.street) || Number(slider.value) < o.minTo) {
      slider.value = o.minTo;
      slider.dataset.hand = G.handNo * 10 + ["preflop", "flop", "turn", "river"].indexOf(G.street);
    }
    updateRaiseLabel();
  }

  // Dica: chance de ganhar contra as pot odds.
  const hint = $g("g-hint");
  hint.hidden = !showHint;
  if (showHint) {
    const e = equity(me, 900);
    const pot = potTotal();
    const need = o.toCall > 0 ? o.toCall / (pot + o.toCall) : 0;
    const verdict = o.toCall === 0
      ? "Ninguém apostou: passar é de graça."
      : e >= need
        ? "Sua chance é maior do que o necessário: pagar compensa a longo prazo."
        : "Sua chance é menor do que o necessário: pagar perde fichas a longo prazo.";
    hint.innerHTML = `<b>${Math.round(e * 100)}%</b> de chance de ganhar contra ${G.players.filter((q) => q !== me && inHand(q)).length} adversário(s).`
      + (o.toCall > 0 ? ` Para pagar ${o.callAmount} num pote de ${pot}, você precisa de <b>${Math.round(need * 100)}%</b>.` : "")
      + ` <span>${verdict}</span>`;
  }
}

function updateRaiseLabel() {
  const o = options(0);
  const v = Number($g("g-amount").value);
  const to = v >= o.maxTo - 4 ? o.maxTo : v;
  $g("g-raise").textContent = to === o.maxTo ? `All-in (${to})` : `${o.isBet ? "Apostar" : "Aumentar para"} ${to}`;
}

function renderLog() {
  $g("g-log").innerHTML = G.log.map((l) => `<li class="${l.cls}">${l.text}</li>`).join("");
}

function initGame() {
  $g("g-fold").addEventListener("click", () => act(0, { type: "fold" }));
  $g("g-call").addEventListener("click", () => act(0, { type: options(0).canCheck ? "check" : "call" }));
  $g("g-raise").addEventListener("click", () => {
    const o = options(0);
    const v = Number($g("g-amount").value);
    act(0, { type: "raise", to: v >= o.maxTo - 4 ? o.maxTo : v });
  });
  $g("g-amount").addEventListener("input", updateRaiseLabel);
  document.querySelectorAll("#g-quick button").forEach((b) => b.addEventListener("click", () => {
    const o = options(0);
    const pot = potTotal();
    const to = b.dataset.frac === "all" ? o.maxTo : G.currentBet + Math.round(((pot + o.toCall) * Number(b.dataset.frac)) / 5) * 5;
    $g("g-amount").value = Math.max(o.minTo, Math.min(o.maxTo, to));
    updateRaiseLabel();
  }));
  $g("g-next").addEventListener("click", startHand);
  $g("g-new").addEventListener("click", newMatch);
  $g("g-again").addEventListener("click", newMatch);
  $g("g-hint-toggle").addEventListener("change", (e) => {
    showHint = e.target.checked;
    renderControls();
  });
  document.querySelectorAll("#g-level button").forEach((b) => b.addEventListener("click", () => {
    G.level = Number(b.dataset.level);
    document.querySelectorAll("#g-level button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    addLog(`Nível dos adversários: ${LEVEL_NAME[G.level]}.`, "sys");
    render();
  }));
  newMatch();
}

initGame();
