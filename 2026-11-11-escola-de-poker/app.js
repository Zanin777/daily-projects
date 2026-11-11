"use strict";

const $ = (id) => document.getElementById(id);
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const cards = (list, cls = "") => list.map((c) => cardHTML(c, cls)).join("");

/* ============================================================
   Topo e Lição 1
   ============================================================ */

function initHero() {
  $("hero-fan").innerHTML = ["Ts", "Js", "Qs", "Ks", "As"]
    .map((c, i) => cardHTML(c).replace('class="card', `style="--i:${i}" class="card`)).join("");
}

function initBasics() {
  const suits = [
    ["s", "Espadas", "spades"], ["h", "Copas", "hearts"], ["d", "Ouros", "diamonds"], ["c", "Paus", "clubs"],
  ];
  $("suits").innerHTML = suits.map(([s, name, en]) => `
    <div class="suit">
      <span class="sym${s === "h" || s === "d" ? " red" : ""}" aria-hidden="true">${SUIT_SYMBOL[s]}${TEXT}</span>
      <div><b>${name}</b><small>${en} · 13 cartas</small></div>
    </div>`).join("");
  const order = "23456789TJQKA".split("").map((r, i) => r + SUITS[i % 4]);
  $("ranks").innerHTML = cards(order);
}

/* ============================================================
   Lição 2: ranking das mãos
   ============================================================ */

const HAND_INFO = [
  { cat: 9, cards: "Ah Kh Qh Jh Th", text: "A, K, Q, J e 10 do mesmo naipe. A melhor mão possível.", odds: 0.0032 },
  { cat: 8, cards: "9c 8c 7c 6c 5c", text: "Cinco cartas em sequência, todas do mesmo naipe.", odds: 0.0279 },
  { cat: 7, cards: "Qs Qh Qd Qc 7s", text: "Quatro cartas do mesmo valor.", odds: 0.168 },
  { cat: 6, cards: "Ks Kd Kc 4h 4s", text: "Uma trinca e um par juntos.", odds: 2.6 },
  { cat: 5, cards: "Ad Jd 8d 6d 2d", text: "Cinco cartas do mesmo naipe, fora de ordem.", odds: 3.03 },
  { cat: 4, cards: "Ts 9h 8d 7c 6s", text: "Cinco cartas em sequência, de naipes misturados.", odds: 4.62 },
  { cat: 3, cards: "7h 7s 7d Kc 2s", text: "Três cartas do mesmo valor.", odds: 4.83 },
  { cat: 2, cards: "Jc Jd 5h 5s As", text: "Dois pares diferentes.", odds: 23.5 },
  { cat: 1, cards: "Th Tc Ks 6d 3c", text: "Duas cartas do mesmo valor.", odds: 43.8 },
  { cat: 0, cards: "As Qd 9c 6h 3s", text: "Nenhuma combinação: vale a carta mais alta.", odds: 17.4 },
];

/** Cartas que formam a combinação (as outras ficam apagadas no exemplo). */
function comboCards(list) {
  const h = evaluate5(list);
  const count = {};
  list.forEach((c) => { count[c[0]] = (count[c[0]] || 0) + 1; });
  if ([1, 2, 3, 7].includes(h.cat)) return list.filter((c) => count[c[0]] >= 2);
  if (h.cat === 0) return [list[0]];
  return list;
}

function initRanking() {
  $("hand-list").innerHTML = HAND_INFO.map((info, i) => {
    const list = info.cards.split(" ");
    const main = comboCards(list);
    const cat = CATEGORIES[info.cat];
    const pct = info.odds < 0.1 ? info.odds.toString().replace(".", ",") : info.odds.toLocaleString("pt-BR");
    const width = Math.max(1.5, (info.odds / 43.8) * 100);
    return `<li class="hand-row">
      <span class="num">${i + 1}</span>
      <div><h3>${cat.name}${cat.name.toLowerCase() !== cat.en.toLowerCase() ? `<small>${cat.en}</small>` : ""}</h3><p>${info.text}</p></div>
      <div class="cards">${list.map((c) => cardHTML(c, main.includes(c) ? "" : "off")).join("")}</div>
      <div class="odds"><b>${pct}%</b><small>com 7 cartas</small><div class="odds-bar"><span style="width:${width}%"></span></div></div>
    </li>`;
  }).join("");

  const a = "Ks Kh Ad 9c 4s".split(" ");
  const b = "Kd Kc Qs 9h 4d".split(" ");
  $("kd-a").innerHTML = a.map((c, k) => cardHTML(c, k === 2 ? "used" : "")).join("");
  $("kd-b").innerHTML = b.map((c, k) => cardHTML(c, k === 2 ? "used" : "")).join("");
}

/* ============================================================
   Lição 3: uma mão do começo ao fim
   ============================================================ */

const SEATS = [
  { id: "voce", name: "Você", seat: "s-bottom", color: "#c9a227" },
  { id: "ana", name: "Ana", seat: "s-left", color: "#b0478f" },
  { id: "bruno", name: "Bruno", seat: "s-top", color: "#2b6fd6" },
  { id: "carla", name: "Carla", seat: "s-right", color: "#2f9a6a" },
];
const ROLES = { bruno: ["D", "dealer"], carla: ["SB", "sb"], voce: ["BB", "bb"] };

const GUIDED = {
  hole: { voce: ["As", "Kd"], ana: ["Kc", "Qh"], bruno: ["7h", "6h"], carla: ["Qd", "Jd"] },
  board: ["Ks", "8d", "3c", "Jh", "8s"],
};

const S = (o) => ({ board: 0, dealt: false, pot: 0, bets: {}, folded: [], tags: {}, reveal: [], winner: null, ...o });
const START = { voce: 100, ana: 100, bruno: 100, carla: 100 };

const GUIDED_STEPS = [
  S({ stage: "blinds", title: "A mesa", stacks: START,
    note: "Quatro jogadores, com 100 fichas cada. O <strong>botão (D)</strong> está com o Bruno: ele é o \"dealer\" desta mão. A vez de jogar anda sempre no sentido horário." }),
  S({ stage: "blinds", title: "Blinds", stacks: { ...START, carla: 99, voce: 98 }, bets: { carla: 1, voce: 2 },
    tags: { carla: "Small blind", voce: "Big blind" },
    note: "Antes das cartas, os dois jogadores à esquerda do botão fazem apostas obrigatórias: a Carla coloca o <strong>small blind</strong> (1 ficha) e você o <strong>big blind</strong> (2 fichas). Assim, toda mão já começa valendo alguma coisa." }),
  S({ stage: "preflop", title: "Pré-flop: as cartas", dealt: true, stacks: { ...START, carla: 99, voce: 98 }, bets: { carla: 1, voce: 2 },
    note: "Cada jogador recebe <strong>2 cartas fechadas</strong>, que só ele vê. As suas são <strong>A♠ K♦</strong>: uma das melhores mãos iniciais do jogo!" }),
  S({ stage: "preflop", title: "Pré-flop: apostas", dealt: true, stacks: { voce: 98, ana: 98, bruno: 100, carla: 98 },
    bets: { ana: 2, carla: 2, voce: 2 }, folded: ["bruno"],
    tags: { ana: "Paga 2", bruno: "Desiste", carla: "Completa", voce: "Passa" },
    note: "A Ana fala primeiro (ela está logo depois do big blind) e <strong>paga</strong> 2. O Bruno <strong>desiste</strong> com 7♥ 6♥. A Carla completa o small blind, e você, que já tinha colocado 2, só <strong>passa</strong>." }),
  S({ stage: "flop", title: "Flop", dealt: true, board: 3, pot: 6, stacks: { voce: 98, ana: 98, bruno: 100, carla: 98 }, folded: ["bruno"],
    note: "As apostas vão para o <strong>pote</strong> (6 fichas) e saem as 3 primeiras cartas comunitárias: o <strong>flop</strong>. Elas valem para todos. Com o K♠ na mesa, você tem um <strong>par de Reis com Ás</strong>." }),
  S({ stage: "flop", title: "Flop: apostas", dealt: true, board: 3, pot: 6, stacks: { voce: 94, ana: 94, bruno: 100, carla: 98 },
    bets: { voce: 4, ana: 4 }, folded: ["bruno", "carla"], tags: { carla: "Passa e depois desiste", voce: "Aposta 4", ana: "Paga 4" },
    note: "Depois do flop, fala primeiro quem está à esquerda do botão: a Carla <strong>passa</strong>. Você <strong>aposta</strong> 4, a Ana paga e a Carla desiste." }),
  S({ stage: "turn", title: "Turn", dealt: true, board: 4, pot: 14, stacks: { voce: 94, ana: 94, bruno: 100, carla: 98 }, folded: ["bruno", "carla"],
    note: "Sai a quarta carta comunitária, o <strong>turn</strong>: J♥. O pote agora tem 14 fichas." }),
  S({ stage: "turn", title: "Turn: apostas", dealt: true, board: 4, pot: 14, stacks: { voce: 86, ana: 86, bruno: 100, carla: 98 },
    bets: { voce: 8, ana: 8 }, folded: ["bruno", "carla"], tags: { voce: "Aposta 8", ana: "Paga 8" },
    note: "Você continua confiante e aposta 8. A Ana paga de novo." }),
  S({ stage: "river", title: "River", dealt: true, board: 5, pot: 30, stacks: { voce: 86, ana: 86, bruno: 100, carla: 98 }, folded: ["bruno", "carla"],
    note: "A última carta, o <strong>river</strong>: 8♠. Agora há um <strong>par de 8 na mesa</strong>, e ele vale para todo mundo!" }),
  S({ stage: "river", title: "River: apostas", dealt: true, board: 5, pot: 30, stacks: { voce: 71, ana: 71, bruno: 100, carla: 98 },
    bets: { ana: 15, voce: 15 }, folded: ["bruno", "carla"], tags: { voce: "Passa e depois paga", ana: "Aposta 15" },
    note: "Você passa, a Ana aposta 15 e você <strong>paga</strong> para ver as cartas dela." }),
  S({ stage: "showdown", title: "Showdown", dealt: true, board: 5, pot: 60, stacks: { voce: 71, ana: 71, bruno: 100, carla: 98 },
    folded: ["bruno", "carla"], reveal: ["ana"], showHands: true,
    tags: { voce: "Dois pares + Ás", ana: "Dois pares + Dama" },
    note: "Hora de mostrar as cartas: o <strong>showdown</strong>. Os dois têm <strong>dois pares, Reis e 8</strong>! O desempate é a quinta carta, o <strong>kicker</strong>: o seu Ás vence a Dama da Ana." }),
  S({ stage: "showdown", title: "Resultado", dealt: true, board: 5, pot: 0, stacks: { voce: 131, ana: 71, bruno: 100, carla: 98 },
    folded: ["bruno", "carla"], reveal: ["ana"], showHands: true, winner: ["voce"], tags: { voce: "+60 fichas" },
    note: "Você ganha o pote de 60 fichas e termina com 131. Repare: o mesmo 8 da mesa ajudou os dois, e quem decidiu a mão foi uma única carta, o kicker." }),
];

const hand = { mode: "guided", steps: GUIDED_STEPS, deal: GUIDED, i: 0, timer: null, shown: null };

function makeRandomHand() {
  const deck = shuffle(fullDeck());
  const hole = {};
  SEATS.forEach((p, k) => { hole[p.id] = [deck[k * 2], deck[k * 2 + 1]]; });
  const board = deck.slice(8, 13);
  const deal = { hole, board };
  const mine = (n) => describe(bestHand([...hole.voce, ...board.slice(0, n)]));
  const yours = hole.voce.map(short).join(" ");
  const pair = hole.voce[0][0] === hole.voce[1][0];

  const all = SEATS.map((p) => ({ id: p.id, h: bestHand([...hole[p.id], ...board]) }));
  const top = all.reduce((best, x) => (compareHands(x.h, best.h) > 0 ? x : best));
  const winners = all.filter((x) => compareHands(x.h, top.h) === 0).map((x) => x.id);
  const names = winners.map((id) => SEATS.find((p) => p.id === id).name);
  const runner = all.filter((x) => !winners.includes(x.id)).sort((a, b) => compareHands(b.h, a.h))[0];
  const tags = Object.fromEntries(all.map((x) => [x.id, describe(x.h)]));
  const result = winners.length > 1
    ? `<strong>Empate</strong> entre ${names.join(" e ")}, com ${describe(top.h)}: o pote é dividido.`
    : `<strong>${names[0]}</strong> vence com <strong>${describe(top.h)}</strong>. ${runner ? explainResult(top.h, runner.h) : ""}`;

  const steps = [
    S({ stage: "preflop", title: "Cartas distribuídas", dealt: true,
      note: `Suas cartas: <strong>${yours}</strong>. ${pair ? "Você já começa com um par!" : "Por enquanto, você só tem carta alta."} Os outros jogadores também receberam 2 cartas cada.` }),
    S({ stage: "flop", title: "Flop", dealt: true, board: 3, note: `Saíram 3 cartas na mesa. Juntando com as suas, você tem: <strong>${mine(3)}</strong>.` }),
    S({ stage: "turn", title: "Turn", dealt: true, board: 4, note: `Saiu a 4ª carta. Sua melhor mão agora: <strong>${mine(4)}</strong>.` }),
    S({ stage: "river", title: "River", dealt: true, board: 5, note: `Saiu a última carta. Sua mão final: <strong>${mine(5)}</strong>. Quem será que ganha?` }),
    S({ stage: "showdown", title: "Showdown", dealt: true, board: 5, reveal: SEATS.map((p) => p.id), tags, winner: winners, note: result }),
  ];
  return { deal, steps };
}

function seatHTML(p, st, prev) {
  const deal = hand.deal;
  const folded = st.folded.includes(p.id);
  const faceUp = p.id === "voce" || st.reveal.includes(p.id);
  const newDeal = st.dealt && !(prev && prev.dealt);
  const flipNow = faceUp && prev && prev.dealt && !(p.id === "voce" || prev.reveal.includes(p.id));
  const winSet = st.winner ? new Set(st.winner.flatMap((id) => bestHand([...deal.hole[id], ...deal.board]).cards)) : null;

  let hole = "";
  if (st.dealt) {
    hole = deal.hole[p.id].map((c, k) => {
      const anim = newDeal ? "deal" : flipNow ? "flip" : "";
      const used = winSet && st.winner.includes(p.id) && winSet.has(c) ? "used" : "";
      const style = `style="--d:${(SEATS.indexOf(p) + k * 4) * 70}ms"`;
      return (faceUp ? cardHTML(c, `${anim} ${used}`) : backHTML(anim)).replace('class="card', `${style} class="card`);
    }).join("");
  }
  const role = hand.mode === "guided" && ROLES[p.id] ? `<span class="role ${ROLES[p.id][1]}">${ROLES[p.id][0]}</span>` : "";
  const stack = st.stacks ? `<span class="stack">${st.stacks[p.id]}</span>` : "";
  let tag = st.tags[p.id] || "";
  if (st.showHands && !tag && !folded) tag = describe(bestHand([...deal.hole[p.id], ...deal.board]));
  const tagCls = folded && tag.includes("esiste") ? "fold" : st.showHands || st.winner ? "hand" : "";
  const bet = st.bets[p.id] ? `<span class="mini-chip"></span>${st.bets[p.id]}` : "";
  const isWinner = st.winner && st.winner.includes(p.id);

  return `<div class="seat ${p.seat}${folded ? " folded" : ""}${isWinner ? " winner" : ""}">
    <div class="hole">${hole}</div>
    <div class="plate"><span class="avatar" style="background:${p.color}">${p.name[0]}</span><span class="who">${p.name}</span>${role}${stack}</div>
    <span class="tag ${tagCls}">${tag}</span>
    <span class="bet">${bet}</span>
  </div>`;
}

function renderHand() {
  const st = hand.steps[hand.i];
  const prev = hand.shown;
  const deal = hand.deal;
  const table = $("table");
  table.querySelectorAll(".seat").forEach((s) => s.remove());
  table.insertAdjacentHTML("beforeend", SEATS.map((p) => seatHTML(p, st, prev)).join(""));

  const winSet = st.winner ? new Set(st.winner.flatMap((id) => bestHand([...deal.hole[id], ...deal.board]).cards)) : null;
  const before = prev ? prev.board : 0;
  let boardHTML = "";
  for (let k = 0; k < 5; k++) {
    if (k < st.board) {
      const anim = k >= before && prev && hand.i > 0 ? "deal" : "";
      const used = winSet && winSet.has(deal.board[k]) ? "used" : "";
      boardHTML += cardHTML(deal.board[k], `${anim} ${used}`).replace('class="card', `style="--d:${(k - before) * 140}ms" class="card`);
    } else {
      boardHTML += '<span class="slot"></span>';
    }
  }
  $("board").innerHTML = boardHTML;
  $("pot").innerHTML = st.pot ? `<span class="mini-chip"></span>Pote: ${st.pot}` : "";

  // Sons: cartas novas e fichas novas.
  if (prev && hand.i > 0) {
    const newCards = (st.dealt && !prev.dealt ? 8 : 0) + Math.max(0, st.board - prev.board);
    for (let k = 0; k < Math.min(newCards, 5); k++) Sfx.card(k * 0.09);
    const chips = Object.keys(st.bets).some((id) => (st.bets[id] || 0) > (prev.bets[id] || 0));
    if (chips || (st.winner && !prev.winner)) Sfx.chip(0.05);
  }

  $("step-count").textContent = `Passo ${hand.i + 1} de ${hand.steps.length}`;
  $("step-title").textContent = st.title;
  $("step-note").innerHTML = st.note;
  const order = ["blinds", "preflop", "flop", "turn", "river", "showdown"];
  const now = order.indexOf(st.stage);
  document.querySelectorAll("#stages li").forEach((li) => {
    const k = order.indexOf(li.dataset.stage);
    li.className = k === now ? "now" : k < now ? "done" : "";
  });
  const at = (a) => document.querySelector(`#rodada [data-act="${a}"]`);
  at("first").disabled = at("prev").disabled = hand.i === 0;
  at("next").disabled = hand.i === hand.steps.length - 1;
  hand.shown = st;
}

function goStep(n) {
  hand.i = Math.max(0, Math.min(hand.steps.length - 1, n));
  if (hand.i === hand.steps.length - 1) stopHand();
  renderHand();
}

function stopHand() {
  clearInterval(hand.timer);
  hand.timer = null;
  document.querySelector('#rodada [data-act="play"]').textContent = "▶ Assistir";
}

function setHandMode(mode) {
  stopHand();
  hand.mode = mode;
  if (mode === "guided") {
    hand.steps = GUIDED_STEPS;
    hand.deal = GUIDED;
  } else {
    const r = makeRandomHand();
    hand.steps = r.steps;
    hand.deal = r.deal;
  }
  hand.i = 0;
  hand.shown = null;
  $("btn-guided").setAttribute("aria-pressed", String(mode === "guided"));
  $("btn-random").setAttribute("aria-pressed", String(mode === "random"));
  $("btn-random").innerHTML = mode === "random" ? "🎲 Outra mão aleatória" : "🎲 Mão aleatória";
  document.querySelector("#stages li[data-stage=blinds]").hidden = mode === "random";
  renderHand();
}

function initHand() {
  document.querySelector("#rodada .controls").addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "play") {
      if (hand.timer) return stopHand();
      if (hand.i === hand.steps.length - 1) goStep(0);
      e.target.textContent = "❚❚ Pausar";
      hand.timer = setInterval(() => goStep(hand.i + 1), 2800);
      return;
    }
    stopHand();
    if (act === "first") goStep(0);
    if (act === "prev") goStep(hand.i - 1);
    if (act === "next") goStep(hand.i + 1);
  });
  $("btn-guided").addEventListener("click", () => setHandMode("guided"));
  $("btn-random").addEventListener("click", () => setHandMode("random"));
  setHandMode("guided");
}

/* ============================================================
   Lição 5: posições
   ============================================================ */

const POS_ORDER = ["BTN", "SB", "BB", "UTG", "HJ", "CO"];
const POS_INFO = {
  BTN: { name: "Botão (Dealer)", power: 100, text: "A melhor posição da mesa. Depois do flop você é sempre o último a falar, e decide já sabendo o que todos fizeram. Daqui dá para jogar mais mãos." },
  SB: { name: "Small Blind", power: 12, text: "Coloca uma aposta obrigatória de metade do big blind antes das cartas. Depois do flop é o primeiro a falar: a pior posição da mesa." },
  BB: { name: "Big Blind", power: 28, text: "Coloca a aposta obrigatória inteira. É o último a falar no pré-flop, mas fala cedo em todas as outras rodadas." },
  UTG: { name: "Under the Gun", power: 35, text: "\"Debaixo da arma\": é o primeiro a falar no pré-flop, com todo mundo ainda para agir depois. Aqui, jogue só mãos fortes." },
  HJ: { name: "Hijack", power: 60, text: "Posição intermediária, duas cadeiras antes do botão. Já dá para entrar com um pouco mais de mãos." },
  CO: { name: "Cutoff", power: 82, text: "Logo antes do botão: a segunda melhor posição. Se o botão desistir, você será o último a falar depois do flop." },
};
const ORDER_PRE = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const ORDER_POST = ["SB", "BB", "UTG", "HJ", "CO", "BTN"];
// Cadeiras no sentido horário, começando embaixo (x%, y%).
const SEAT_XY = [[50, 100], [10, 80], [10, 20], [50, 0], [90, 20], [90, 80]];

const pos = { btn: 0, selected: 0, order: "pre" };

function renderPositions() {
  const table = $("pos-table");
  table.querySelectorAll(".pos-seat, .pos-center").forEach((e) => e.remove());
  const order = pos.order === "pre" ? ORDER_PRE : ORDER_POST;
  const html = SEAT_XY.map(([x, y], i) => {
    const p = POS_ORDER[(i - pos.btn + 6) % 6];
    return `<button class="pos-seat" type="button" data-seat="${i}" aria-pressed="${pos.selected === i}" style="left:${x}%;top:${y}%"
      aria-label="${POS_INFO[p].name}, ${order.indexOf(p) + 1}º a falar">
      <span class="abbr">${p}</span><span class="full">${POS_INFO[p].name}</span><span class="order">${order.indexOf(p) + 1}</span></button>`;
  }).join("");
  table.insertAdjacentHTML("beforeend", html + '<span class="pos-center">sentido horário ↻</span>');

  const [x, y] = SEAT_XY[pos.btn];
  const chip = $("dealer-chip");
  chip.style.left = `${50 + (x - 50) * 0.62}%`;
  chip.style.top = `${50 + (y - 50) * 0.55}%`;

  const p = POS_ORDER[(pos.selected - pos.btn + 6) % 6];
  const info = POS_INFO[p];
  $("pos-info").innerHTML = `<h3>${p} · ${info.name}</h3><p>${info.text}</p>
    <div class="meter">Pior posição <span><i style="width:${info.power}%"></i></span> Melhor</div>`;
  $("order-note").textContent = pos.order === "pre"
    ? "No pré-flop, os blinds já apostaram, então quem começa é o UTG. O big blind fala por último."
    : "Do flop em diante, a ordem recomeça à esquerda do botão. O botão fala sempre por último.";
}

function initPositions() {
  $("pos-table").addEventListener("click", (e) => {
    const seat = e.target.closest(".pos-seat");
    if (!seat) return;
    pos.selected = Number(seat.dataset.seat);
    renderPositions();
  });
  document.querySelectorAll("#posicoes .seg button").forEach((b) => b.addEventListener("click", () => {
    pos.order = b.dataset.order;
    document.querySelectorAll("#posicoes .seg button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    renderPositions();
  }));
  $("btn-move").addEventListener("click", () => {
    pos.btn = (pos.btn + 1) % 6;
    Sfx.chip();
    renderPositions();
  });
  renderPositions();
}

/* ============================================================
   Lição 6: treino
   ============================================================ */

const quiz = { mode: "winner", hits: 0, total: 0, streak: 0, best: 0, answered: false, data: null };
try { quiz.best = Number(localStorage.getItem("poker-recorde")) || 0; } catch { /* ignora */ }

const sortByRank = (list) => list.slice().sort((a, b) => parse(b).r - parse(a).r);

/** Sorteia 5 cartas de uma categoria específica. */
function handOfCategory(cat) {
  const rnd = (n) => Math.floor(Math.random() * n);
  const suit = () => SUITS[rnd(4)];
  const R = RANK_CHARS;
  if (cat === 9) { const s = suit(); return ["A", "K", "Q", "J", "T"].map((r) => r + s); }
  if (cat === 8) {
    const s = suit();
    const top = 5 + rnd(9); // 5 até K (o A é o Royal)
    return [0, 1, 2, 3, 4].map((k) => { const r = top - k; return (r === 1 ? "A" : R[r - 2]) + s; });
  }
  if (cat === 7 || cat === 6) {
    const r1 = rnd(13);
    let r2 = rnd(13);
    while (r2 === r1) r2 = rnd(13);
    if (cat === 7) return [...SUITS.map((s) => R[r1] + s), R[r2] + suit()];
    return [...shuffle(SUITS).slice(0, 3).map((s) => R[r1] + s), ...shuffle(SUITS).slice(0, 2).map((s) => R[r2] + s)];
  }
  const deck = fullDeck();
  for (let tries = 0; tries < 200000; tries++) {
    const five = shuffle(deck).slice(0, 5);
    if (evaluate5(five).cat === cat) return five;
  }
  return handOfCategory(9);
}

function newQuestion() {
  quiz.answered = false;
  $("q-feedback").hidden = true;
  $("q-next").hidden = true;
  const body = $("quiz-body");

  if (quiz.mode === "winner") {
    // Metade das vezes, força as duas mãos a serem da mesma categoria (mais difícil).
    const close = Math.random() < 0.5;
    let d;
    for (let t = 0; t < 400; t++) {
      const deck = shuffle(fullDeck());
      d = { board: deck.slice(0, 5), a: deck.slice(5, 7), b: deck.slice(7, 9) };
      d.ha = bestHand([...d.a, ...d.board]);
      d.hb = bestHand([...d.b, ...d.board]);
      if (!close || d.ha.cat === d.hb.cat) break;
    }
    quiz.data = d;
    body.innerHTML = `
      <p class="q-title">Quem tem a melhor mão?</p>
      <div class="q-board-wrap"><p class="q-label">Mesa</p><div class="q-cards" id="q-board">${cards(d.board, "deal")}</div></div>
      <div class="q-players">
        <button class="q-player" type="button" data-pick="a"><span class="q-name">Jogador A</span><div class="q-cards">${cards(d.a, "deal")}</div><span class="q-hand"></span></button>
        <button class="q-player" type="button" data-pick="b"><span class="q-name">Jogador B</span><div class="q-cards">${cards(d.b, "deal")}</div><span class="q-hand"></span></button>
      </div>
      <button class="btn btn-ghost q-tie" type="button" data-pick="tie">🤝 Empate</button>`;
  } else {
    const cat = Math.floor(Math.random() * 10);
    const five = sortByRank(handOfCategory(cat));
    quiz.data = { five, h: evaluate5(five) };
    body.innerHTML = `
      <p class="q-title">Que mão é essa?</p>
      <div class="q-board-wrap"><div class="q-cards">${cards(five, "deal")}</div></div>
      <div class="q-options">${CATEGORIES.map((c, i) => ({ c, i })).reverse()
        .map(({ c, i }) => `<button type="button" data-cat="${i}">${c.name}</button>`).join("")}</div>`;
  }
  body.querySelectorAll(".card.deal").forEach((c, k) => c.style.setProperty("--d", `${k * 60}ms`));
  Sfx.card(0);
  Sfx.card(0.08);
}

function answer(correct, title, text) {
  quiz.answered = true;
  quiz.total++;
  if (correct) {
    quiz.hits++;
    quiz.streak++;
    if (quiz.streak > quiz.best) {
      quiz.best = quiz.streak;
      try { localStorage.setItem("poker-recorde", String(quiz.best)); } catch { /* ignora */ }
    }
    Sfx.good();
  } else {
    quiz.streak = 0;
    Sfx.bad();
  }
  const fb = $("q-feedback");
  fb.className = `feedback ${correct ? "ok" : "no"}`;
  fb.innerHTML = `<b>${title}</b><p>${text}</p>`;
  fb.hidden = false;
  $("q-next").hidden = false;
  $("q-next").focus({ preventScroll: true });
  paintScore();
}

function paintScore() {
  $("q-hits").textContent = quiz.hits;
  $("q-total").textContent = quiz.total;
  $("q-streak").textContent = quiz.streak;
  $("q-best").textContent = quiz.best;
}

function onQuizClick(e) {
  if (quiz.answered) return;
  const body = $("quiz-body");
  if (quiz.mode === "winner") {
    const btn = e.target.closest("[data-pick]");
    if (!btn) return;
    const d = quiz.data;
    const c = compareHands(d.ha, d.hb);
    const right = c > 0 ? "a" : c < 0 ? "b" : "tie";
    const ok = btn.dataset.pick === right;
    const [pa, pb] = body.querySelectorAll(".q-player");
    pa.querySelector(".q-hand").textContent = describe(d.ha);
    pb.querySelector(".q-hand").textContent = describe(d.hb);
    body.querySelectorAll("[data-pick]").forEach((b) => { b.disabled = true; });
    const target = { a: pa, b: pb, tie: body.querySelector(".q-tie") };
    target[right].classList.add("right");
    if (!ok) btn.classList.add("wrong");
    // Destaca as 5 cartas da mão vencedora (no empate, as do Jogador A).
    const win = right === "b" ? d.hb : d.ha;
    const winBox = right === "b" ? pb : pa;
    body.querySelectorAll("#q-board .card").forEach((el) => el.classList.toggle("used", win.cards.includes(el.dataset.card)));
    winBox.querySelectorAll(".card").forEach((el) => el.classList.toggle("used", win.cards.includes(el.dataset.card)));
    const who = right === "tie" ? "Empate!" : `Jogador ${right.toUpperCase()} vence.`;
    answer(ok, ok ? `Isso! ${who}` : `Não foi dessa vez. ${who}`, explainResult(d.ha, d.hb));
  } else {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    const { h } = quiz.data;
    const ok = Number(btn.dataset.cat) === h.cat;
    body.querySelectorAll("[data-cat]").forEach((b) => { b.disabled = true; });
    body.querySelector(`[data-cat="${h.cat}"]`).classList.add("right");
    if (!ok) btn.classList.add("wrong");
    const info = HAND_INFO.find((x) => x.cat === h.cat);
    answer(ok, ok ? `Acertou: ${describe(h)}!` : `Era ${describe(h)}.`, `${CATEGORIES[h.cat].name}: ${info.text.charAt(0).toLowerCase()}${info.text.slice(1)}`);
  }
}

function initQuiz() {
  document.querySelectorAll("#treino .tabs button").forEach((t) => t.addEventListener("click", () => {
    quiz.mode = t.dataset.quiz;
    document.querySelectorAll("#treino .tabs button").forEach((x) => x.setAttribute("aria-selected", String(x === t)));
    newQuestion();
  }));
  $("quiz-body").addEventListener("click", onQuizClick);
  $("q-next").addEventListener("click", newQuestion);
  paintScore();
  newQuestion();
}

/* ============================================================
   Lição 7: outs
   ============================================================ */

const outs = { n: 9, street: "flop" };

function renderOuts() {
  const o = outs.n;
  const pct = (x) => `${Math.round(x * 100)}%`;
  $("outs-value").textContent = o;
  $("outs").value = o;
  let exact;
  let rule;
  const second = document.querySelector(".outs-facts div:nth-child(2)");
  if (outs.street === "flop") {
    exact = 1 - ((47 - o) * (46 - o)) / (47 * 46);
    rule = Math.min(100, o * 4) / 100;
    $("pct-label").textContent = "chance de acertar até o river (2 cartas)";
    $("rule-label").textContent = "Regra do 4 (outs × 4)";
    second.innerHTML = `<dt>Só na próxima carta</dt><dd>${pct(o / 47)}</dd>`;
  } else {
    exact = o / 46;
    rule = (o * 2) / 100;
    $("pct-label").textContent = "chance de acertar no river (1 carta)";
    $("rule-label").textContent = "Regra do 2 (outs × 2)";
    second.innerHTML = "<dt>Cartas que você não vê</dt><dd>46</dd>";
  }
  $("pct-exact").textContent = pct(exact);
  $("pct-rule").textContent = pct(rule);
  $("pct-bar").style.width = `${exact * 100}%`;
  const unknown = outs.street === "flop" ? 47 : 46;
  const diff = Math.round(rule * 100) - Math.round(exact * 100);
  $("outs-explain").textContent = `Das ${unknown} cartas que você ainda não viu, ${o} ${o === 1 ? "te ajuda" : "te ajudam"}. `
    + (Math.abs(diff) >= 3
      ? `Com muitos outs, a regra rápida exagera um pouco (${pct(rule)} contra ${pct(exact)} exatos), mas continua ótima para decidir na hora.`
      : "A regra rápida chega bem perto do valor exato, e dá para fazer a conta de cabeça na mesa.");
}

function initOuts() {
  $("outs").addEventListener("input", (e) => { outs.n = Number(e.target.value); renderOuts(); });
  document.querySelectorAll("#matematica .seg button").forEach((b) => b.addEventListener("click", () => {
    outs.street = b.dataset.street;
    document.querySelectorAll("#matematica .seg button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    renderOuts();
  }));
  document.querySelectorAll(".examples button").forEach((b) => b.addEventListener("click", () => {
    outs.n = Number(b.dataset.outs);
    renderOuts();
  }));
  renderOuts();
}

/* ============================================================
   Glossário
   ============================================================ */

const GLOSSARY = [
  ["All-in", "", "Apostar todas as fichas que você tem."],
  ["Ante", "", "Pequena aposta obrigatória de todos os jogadores, usada em alguns torneios."],
  ["Big blind", "BB", "A aposta obrigatória maior, colocada pelo segundo jogador à esquerda do botão."],
  ["Blefe", "bluff", "Apostar com uma mão fraca para fazer o adversário desistir de uma mão melhor."],
  ["Board", "mesa", "As cartas comunitárias, abertas no meio da mesa."],
  ["Botão", "dealer", "A ficha que marca quem é o \"dealer\" da mão. Anda uma cadeira a cada mão."],
  ["Call", "pagar", "Igualar a maior aposta da rodada para continuar na mão."],
  ["Check", "passar", "Passar a vez sem apostar, quando ninguém apostou ainda."],
  ["Draw", "projeto", "Mão que ainda precisa de uma carta para ficar forte, como 4 cartas de um flush."],
  ["Flop", "", "As 3 primeiras cartas comunitárias, que saem juntas."],
  ["Fold", "desistir", "Largar as cartas e sair da mão."],
  ["Heads-up", "", "Quando só dois jogadores disputam a mão (ou a mesa)."],
  ["Hole cards", "cartas fechadas", "As 2 cartas que só você vê."],
  ["Kicker", "", "A carta que desempata duas mãos com a mesma combinação."],
  ["Limp", "", "Só pagar o big blind no pré-flop, sem aumentar."],
  ["Muck", "", "Descartar a mão sem mostrar as cartas."],
  ["Nuts", "", "A melhor mão possível com as cartas que estão na mesa naquele momento."],
  ["Outs", "", "As cartas do baralho que ainda podem melhorar a sua mão."],
  ["Pote", "pot", "Todas as fichas apostadas na mão, que vão para o vencedor."],
  ["Pré-flop", "", "A primeira rodada de apostas, antes das cartas comunitárias."],
  ["Raise", "aumentar", "Pagar a aposta e colocar mais fichas por cima."],
  ["River", "", "A 5ª e última carta comunitária."],
  ["Showdown", "", "O momento em que os jogadores que sobraram mostram as cartas."],
  ["Side pot", "pote paralelo", "Pote separado criado quando alguém está all-in e os outros continuam apostando."],
  ["Small blind", "SB", "A aposta obrigatória menor, colocada à esquerda do botão."],
  ["Split pot", "pote dividido", "Quando há empate, o pote é dividido entre os vencedores."],
  ["Stack", "", "A pilha de fichas de um jogador."],
  ["Tilt", "", "Jogar mal por estar nervoso ou irritado depois de perder."],
  ["Turn", "", "A 4ª carta comunitária."],
];

function initGlossary() {
  const dl = $("glossary");
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const render = (q = "") => {
    const nq = norm(q.trim());
    const items = GLOSSARY.filter(([t, alt, d]) => !nq || norm(`${t} ${alt} ${d}`).includes(nq));
    const hl = (s) => {
      if (!nq) return s;
      // Marca o trecho buscado (ignorando acentos).
      const n = norm(s);
      const i = n.indexOf(nq);
      return i < 0 ? s : `${s.slice(0, i)}<mark>${s.slice(i, i + nq.length)}</mark>${s.slice(i + nq.length)}`;
    };
    dl.innerHTML = items.map(([t, alt, d]) => `<div><dt>${hl(t)}${alt ? `<small>(${hl(alt)})</small>` : ""}</dt><dd>${hl(d)}</dd></div>`).join("");
    $("gloss-empty").hidden = items.length > 0;
  };
  $("gloss-search").addEventListener("input", (e) => render(e.target.value));
  render();
}

/* ============================================================
   Efeitos gerais
   ============================================================ */

function initSound() {
  const btn = $("sound");
  const paint = () => {
    btn.setAttribute("aria-pressed", String(Sfx.on));
    btn.innerHTML = `<span aria-hidden="true">${Sfx.on ? "🔊" : "🔇"}</span> Som`;
  };
  btn.addEventListener("click", () => { Sfx.toggle(); paint(); Sfx.chip(); });
  paint();
}

function initReveal() {
  if (REDUCED.matches || !("IntersectionObserver" in window)) return;
  const items = [...document.querySelectorAll(".section-head, .ranks-strip, .kicker-box, .hand-lesson, .positions, .quiz, .outs, .responsible, .note-box, .search")];
  document.querySelectorAll(".suits, .rules, .hand-list, .actions-grid, .tips").forEach((parent) => {
    [...parent.children].forEach((child, k) => {
      child.style.setProperty("--delay", `${Math.min(k, 8) * 70}ms`);
      items.push(child);
    });
  });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -50px 0px", threshold: 0.06 });
  items.forEach((e) => { e.classList.add("reveal"); io.observe(e); });
}

function initScroll() {
  const bar = $("progress");
  const toTop = $("to-top");
  const links = [...document.querySelectorAll('.topbar nav a[href^="#"]')];
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    toTop.hidden = scrollY < 900;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: REDUCED.matches ? "auto" : "smooth" }));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main > section[id]").forEach((s) => spy.observe(s));
  }
}

/* ============================================================
   Início
   ============================================================ */

initSound();
initHero();
initBasics();
initRanking();
initHand();
initPositions();
initQuiz();
initOuts();
initGlossary();
initReveal();
initScroll();
