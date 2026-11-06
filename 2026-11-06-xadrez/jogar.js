"use strict";

/* Página de jogo: partida completa contra o computador ou entre 2 pessoas. */

const $ = (id) => document.getElementById(id);
const sqName = Chess.name;
const other = (c) => (c === "w" ? "b" : "w");
const LEVEL_NAME = { 1: "Fácil", 2: "Médio", 3: "Difícil" };
const POINTS = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
const COLOR_NAME = { w: "brancas", b: "pretas" };

/* ---------------- Configurações (lembradas no navegador) ---------------- */

const STORE_KEY = "xadrez-jogo-config";
const DEFAULTS = { mode: "ai", color: "w", level: "2", theme: "madeira" };

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}
function saveSettings() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch { /* ignora */ }
}

const settings = loadSettings();
let active = { ...settings }; // configurações da partida em andamento

/* ---------------- Estado da partida ---------------- */

const boardEl = $("play-board");
let board;
let states = [];
let moves = [];
let sans = [];
let human = "w";
let flipped = false;
let selected = null;
let hint = null;
let over = null;
let busy = false;
let gameId = 0;

const cur = () => states[states.length - 1];
const toPos = (st) => {
  const pos = {};
  st.b.forEach((p, i) => { if (p) pos[sqName(i)] = p; });
  return pos;
};
const humanTurn = () => !over && !busy && (active.mode === "2p" || cur().turn === human);
const targets = (from) => Chess.legal(cur()).filter((m) => m.from === from);

function newGame() {
  board?.cancelMenu();
  gameId++;
  active = { ...settings };
  states = [Chess.initial()];
  moves = [];
  sans = [];
  over = null;
  selected = null;
  hint = null;
  busy = false;
  human = active.mode === "ai"
    ? (active.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : active.color)
    : "w";
  flipped = active.mode === "ai" && human === "b";
  board = createBoard(boardEl, { flip: flipped, onClick });
  hideGameOver();
  $("setting-note").hidden = true;
  render();
  updatePanel();
  maybeComputer();
}

/* ---------------- Desenho ---------------- */

function render(anims = []) {
  const st = cur();
  const marks = {};
  const last = moves[moves.length - 1];
  if (last) {
    mark(marks, sqName(last.from), "last");
    mark(marks, sqName(last.to), "last");
  }
  if (Chess.inCheck(st)) mark(marks, sqName(st.b.indexOf(st.turn + "K")), "check");
  if (selected !== null) {
    mark(marks, sqName(selected), "selected");
    for (const m of targets(selected)) mark(marks, sqName(m.to), m.captured ? "capture" : "move");
  }
  if (hint) {
    mark(marks, sqName(hint.from), "hint");
    mark(marks, sqName(hint.to), "hint");
  }
  board.render(toPos(st), marks, anims);
}

function animsFor(m) {
  const a = [{ from: sqName(m.from), to: sqName(m.to) }];
  if (m.castle === "K") a.push({ from: sqName(m.from + 3), to: sqName(m.from + 1) });
  if (m.castle === "Q") a.push({ from: sqName(m.from - 4), to: sqName(m.from - 1) });
  if (m.ep) a.push({ fade: sqName(m.to + (m.piece[0] === "w" ? -8 : 8)) });
  return a;
}

/* ---------------- Lances ---------------- */

function onClick(s) {
  if (suppressClick || !humanTurn()) return;
  const i = Chess.index(s);
  const p = cur().b[i];
  if (selected !== null) {
    const options = targets(selected).filter((m) => m.to === i);
    if (options.length) {
      tryMove(options, true);
      return;
    }
  }
  if (p && p[0] === cur().turn) {
    selected = selected === i ? null : i;
    hint = null;
    render();
  } else if (selected !== null) {
    selected = null;
    render();
  }
}

/** `options` são os lances legais para a mesma casa (mais de um = promoção). */
async function tryMove(options, animate) {
  let m = options[0];
  if (options.length > 1) {
    const id = gameId;
    busy = true;
    const type = await board.choosePromotion(sqName(m.to), cur().turn);
    if (id !== gameId) return;
    busy = false;
    if (!type) {
      selected = null;
      render();
      return;
    }
    m = options.find((o) => o.promo === type);
  }
  doMove(m, animate);
}

function doMove(m, animate = true) {
  const st = cur();
  sans.push(Chess.san(st, m));
  const ns = Chess.make(st, m);
  states.push(ns);
  moves.push(m);
  selected = null;
  hint = null;

  render(animate ? animsFor(m) : []);
  if (m.promo) board.pop(sqName(m.to));

  const status = Chess.status(ns);
  if (status.over) {
    over = status;
    playOnLanding("end");
    const id = gameId;
    setTimeout(() => { if (id === gameId) showGameOver(); }, animate ? MOVE_MS + 350 : 350);
  } else if (m.promo) {
    playOnLanding("promote", { check: status.check });
  } else {
    playOnLanding(m.captured ? "capture" : "move", { check: status.check });
  }
  updatePanel();
  if (!status.over) maybeComputer();
}

function maybeComputer() {
  if (active.mode !== "ai" || over || cur().turn === human) return;
  busy = true;
  updatePanel();
  const id = gameId;
  const plies = moves.length;
  setTimeout(() => {
    if (id !== gameId || plies !== moves.length) return;
    const t0 = performance.now();
    const m = Chess.bestMove(cur(), Number(active.level));
    // Um pequeno atraso deixa o lance do computador mais natural.
    const wait = Math.max(0, 500 - (performance.now() - t0));
    setTimeout(() => {
      if (id !== gameId || plies !== moves.length) return;
      busy = false;
      if (m) doMove(m);
    }, wait);
  }, 80);
}

function undo() {
  if (!moves.length) return;
  board.cancelMenu();
  gameId++; // cancela o computador se ele estiver pensando
  busy = false;
  const popOne = () => { states.pop(); moves.pop(); sans.pop(); };
  popOne();
  // Contra o computador, desfaz também o lance dele para voltar à sua vez.
  if (active.mode === "ai" && cur().turn !== human && moves.length) popOne();
  over = null;
  selected = null;
  hint = null;
  hideGameOver();
  render();
  Sound.play("move");
  updatePanel();
  maybeComputer();
}

function resign() {
  if (over || !states.length || !moves.length) return;
  board.cancelMenu();
  gameId++;
  busy = false;
  const loser = active.mode === "ai" ? human : cur().turn;
  over = { over: true, reason: "resign", result: loser === "w" ? "0-1" : "1-0", loser };
  Sound.play("end");
  render();
  updatePanel();
  showGameOver();
}

function showHint() {
  if (!humanTurn()) return;
  hint = Chess.bestMove(cur(), 2);
  selected = null;
  render();
}

function flip() {
  board.cancelMenu();
  flipped = !flipped;
  board = createBoard(boardEl, { flip: flipped, onClick });
  render();
  updateBars();
}

/* ---------------- Arrastar e soltar ---------------- */

let drag = null;
let suppressClick = false;

boardEl.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || !humanTurn()) return;
  const cell = e.target.closest(".sq");
  if (!cell) return;
  const i = Chess.index(cell.dataset.sq);
  const p = cur().b[i];
  if (!p || p[0] !== cur().turn) return;
  drag = { from: i, x: e.clientX, y: e.clientY, id: e.pointerId, cell, started: false };
});

window.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.started) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    drag.started = true;
    selected = drag.from;
    hint = null;
    render();
    const src = drag.cell.querySelector(".pc:not(.ghost)");
    const piece = src.cloneNode(true);
    const cs = getComputedStyle(src);
    piece.classList.add("drag-piece");
    piece.style.fontSize = cs.fontSize;
    piece.style.textShadow = cs.textShadow;
    document.body.appendChild(piece);
    src.classList.add("drag-src");
    drag.piece = piece;
    drag.src = src;
  }
  e.preventDefault();
  drag.piece.style.left = `${e.clientX}px`;
  drag.piece.style.top = `${e.clientY}px`;
  const under = squareAt(e.clientX, e.clientY);
  boardEl.querySelectorAll(".drag-over").forEach((c) => { if (c !== under) c.classList.remove("drag-over"); });
  under?.classList.add("drag-over");
}, { passive: false });

function endDrag(e, cancelled) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag;
  drag = null;
  if (!d.started) return; // foi só um clique: o onClick cuida
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 0);
  d.piece.remove();
  d.src.classList.remove("drag-src");
  boardEl.querySelectorAll(".drag-over").forEach((c) => c.classList.remove("drag-over"));
  const target = cancelled ? null : squareAt(e.clientX, e.clientY);
  if (target) {
    const options = targets(d.from).filter((m) => m.to === Chess.index(target.dataset.sq));
    if (options.length) {
      tryMove(options, false);
      return;
    }
  }
  render(); // lance inválido: a peça volta (e continua selecionada)
}
window.addEventListener("pointerup", (e) => endDrag(e, false));
window.addEventListener("pointercancel", (e) => endDrag(e, true));

function squareAt(x, y) {
  return document.elementFromPoint(x, y)?.closest("#play-board .sq") || null;
}

/* ---------------- Painel ---------------- */

function updatePanel() {
  updateStatus();
  updateBars();
  updateMoveList();
  $("btn-undo").disabled = !moves.length;
  $("btn-hint").disabled = !humanTurn();
  $("btn-resign").disabled = !!over || !moves.length;
}

function updateStatus() {
  const el = $("status");
  const st = cur();
  el.className = "play-status";
  if (over) {
    el.textContent = resultTitle(over) + " · " + resultText(over);
    el.classList.add("done");
    return;
  }
  if (busy && active.mode === "ai" && st.turn !== human) {
    el.innerHTML = '<span class="thinking">Computador pensando<i>.</i><i>.</i><i>.</i></span>';
    return;
  }
  let text;
  if (active.mode === "ai") text = st.turn === human ? "Sua vez" : "Vez do computador";
  else text = `Vez das ${COLOR_NAME[st.turn]}`;
  if (Chess.inCheck(st)) {
    text += " · Xeque!";
    el.classList.add("check");
  }
  el.textContent = text;
}

function updateBars() {
  const st = cur();
  const count = { w: {}, b: {} };
  for (const p of st.b) if (p) count[p[0]][p[1]] = (count[p[0]][p[1]] || 0) + 1;
  const START = { Q: 1, R: 2, B: 2, N: 2, P: 8 };
  const material = (c) => Object.entries(count[c]).reduce((s, [t, n]) => s + POINTS[t] * n, 0);
  // Peças que a cor `c` capturou = peças da outra cor que sumiram do tabuleiro.
  const captured = (c) => Object.keys(START)
    .flatMap((t) => Array(Math.max(0, START[t] - (count[other(c)][t] || 0))).fill(t));

  const bottom = flipped ? "b" : "w";
  for (const [id, c] of [["bar-bottom", bottom], ["bar-top", other(bottom)]]) {
    const bar = $(id);
    const name = active.mode === "ai"
      ? (c === human ? "Você" : `Computador · ${LEVEL_NAME[active.level]}`)
      : (c === "w" ? "Brancas" : "Pretas");
    bar.querySelector(".avatar").innerHTML = `<span class="pc ${c}">${glyph("K")}</span>`;
    bar.querySelector(".pname").textContent = name;
    bar.querySelector(".captured").innerHTML = captured(c)
      .map((t) => `<span class="pc ${other(c)}">${glyph(t)}</span>`).join("");
    const diff = material(c) - material(other(c));
    bar.querySelector(".adv").textContent = diff > 0 ? `+${diff}` : "";
    bar.classList.toggle("turn", !over && st.turn === c);
  }
}

function updateMoveList() {
  const list = $("move-list");
  if (!sans.length) {
    list.innerHTML = '<li class="empty">Nenhum lance ainda. As brancas começam!</li>';
    return;
  }
  let html = "";
  for (let k = 0; k < sans.length; k += 2) {
    const curW = k === sans.length - 1 ? " cur" : "";
    const curB = k + 1 === sans.length - 1 ? " cur" : "";
    html += `<li><span class="n">${k / 2 + 1}.</span><span class="mv-w${curW}">${sans[k]}</span><span class="mv-b${curB}">${sans[k + 1] || ""}</span></li>`;
  }
  list.innerHTML = html;
  list.scrollTop = list.scrollHeight;
}

/* ---------------- Fim de jogo ---------------- */

function winner(o) {
  return o.result === "1-0" ? "w" : o.result === "0-1" ? "b" : null;
}

function resultTitle(o) {
  return {
    mate: "Xeque-mate!",
    resign: "Desistência",
    stalemate: "Empate por afogamento",
    repetition: "Empate por repetição",
    fifty: "Empate pela regra dos 50 lances",
    material: "Empate por material insuficiente",
  }[o.reason];
}

function resultText(o) {
  const w = winner(o);
  if (!w) {
    return {
      stalemate: "Quem tinha a vez não tinha nenhum lance permitido.",
      repetition: "A mesma posição apareceu 3 vezes.",
      fifty: "Foram 50 lances seguidos sem captura e sem mexer peão.",
      material: "Ninguém tem peças suficientes para dar xeque-mate.",
    }[o.reason];
  }
  if (active.mode === "ai") return w === human ? "Você venceu! Parabéns!" : "O computador venceu. Tente de novo!";
  return `Vitória das ${COLOR_NAME[w]}!`;
}

function showGameOver() {
  if (!over) return;
  const w = winner(over);
  const humanWon = active.mode === "2p" ? !!w : w === human;
  $("go-icon").textContent = !w ? "🤝" : humanWon ? "🏆" : "♟︎";
  $("go-title").textContent = resultTitle(over);
  $("go-text").textContent = resultText(over);
  $("game-over").hidden = false;
  $("go-again").focus({ preventScroll: true });
  if (w && humanWon) confetti();
}

function hideGameOver() {
  $("game-over").hidden = true;
}

/* Confete simples em canvas. */
function confetti() {
  if (REDUCED_MOTION.matches) return;
  const canvas = $("confetti");
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const colors = ["#e2b13c", "#8a4f24", "#2f7d3a", "#c44", "#fffaf0", "#1d6fd6"];
  const parts = Array.from({ length: 140 }, () => ({
    x: rect.width / 2 + (Math.random() - 0.5) * 80,
    y: rect.height * 0.35,
    vx: (Math.random() - 0.5) * 9,
    vy: -Math.random() * 9 - 3,
    size: 5 + Math.random() * 6,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const frame = (now) => {
    const t = now - start;
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const p of parts) {
      p.vy += 0.25;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 2800);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (t < 2800) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, rect.width, rect.height);
  };
  requestAnimationFrame(frame);
}

/* ---------------- Configurações ---------------- */

function applyTheme() {
  document.documentElement.dataset.boardTheme = settings.theme;
}

function paintSettings() {
  document.querySelectorAll(".seg[data-setting]").forEach((seg) => {
    seg.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-checked", String(String(settings[seg.dataset.setting]) === b.dataset.value));
    });
  });
  document.querySelectorAll("[data-ai-only]").forEach((el) => { el.hidden = settings.mode !== "ai"; });
}

document.querySelectorAll(".seg[data-setting]").forEach((seg) => {
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-value]");
    if (!b) return;
    const key = seg.dataset.setting;
    settings[key] = b.dataset.value;
    saveSettings();
    paintSettings();
    if (key === "theme") {
      applyTheme();
      return;
    }
    // Se você ainda não jogou nenhum lance, aplica na hora; senão, no próximo jogo.
    const humanMoved = active.mode === "ai"
      ? moves.some((m) => m.piece[0] === human)
      : moves.length > 0;
    if (!humanMoved || over) newGame();
    else $("setting-note").hidden = false;
  });
});

$("btn-new").addEventListener("click", newGame);
$("btn-undo").addEventListener("click", undo);
$("btn-flip").addEventListener("click", flip);
$("btn-hint").addEventListener("click", showHint);
$("btn-resign").addEventListener("click", resign);
$("go-again").addEventListener("click", newGame);
$("go-close").addEventListener("click", hideGameOver);

/* ---------------- Início ---------------- */

initSoundToggle();
applyTheme();
paintSettings();
newGame();
