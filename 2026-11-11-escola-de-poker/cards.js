"use strict";

/* ============================================================
   Cartas
   Cada carta é um código de 2 letras: valor + naipe.
   Valores: 2-9, T (10), J, Q, K, A.   Naipes: s ♠, h ♥, d ♦, c ♣.
   Ex.: "As" = Ás de Espadas, "Td" = 10 de Ouros.
   ============================================================ */

const RANK_CHARS = "23456789TJQKA";
const SUITS = ["s", "h", "d", "c"];
const SUIT_SYMBOL = { s: "♠", h: "♥", d: "♦", c: "♣" };
const SUIT_NAME = { s: "Espadas", h: "Copas", d: "Ouros", c: "Paus" };
const RANK_LABEL = { 10: "10", 11: "J", 12: "Q", 13: "K", 14: "A" };
const RANK_NAME = { 11: "Valete", 12: "Dama", 13: "Rei", 14: "Ás" };
const RANK_PLURAL = { 11: "Valetes", 12: "Damas", 13: "Reis", 14: "Ases" };
const TEXT = "︎"; // mostra o naipe como símbolo de texto, não como emoji

const parse = (code) => ({ r: RANK_CHARS.indexOf(code[0]) + 2, s: code[1] });
const label = (r) => RANK_LABEL[r] || String(r);
const rankName = (r) => RANK_NAME[r] || String(r);
const plural = (r) => RANK_PLURAL[r] || String(r);
/** "o Rei", "a Dama", "o 9" */
const withArticle = (r) => (r === 12 ? "a " : "o ") + rankName(r);
const cardName = (code) => {
  const { r, s } = parse(code);
  return `${rankName(r)} de ${SUIT_NAME[s]}`;
};
/** Texto curto para usar em frases: "A♠", "10♥" */
const short = (code) => {
  const { r, s } = parse(code);
  return label(r) + SUIT_SYMBOL[s] + TEXT;
};

function cardHTML(code, cls = "") {
  const { r, s } = parse(code);
  const red = s === "h" || s === "d" ? " red" : "";
  const sym = SUIT_SYMBOL[s] + TEXT;
  const l = label(r);
  const center = r > 10 && r < 14 ? `<em>${l}</em><i>${sym}</i>` : sym;
  return `<div class="card${red} ${cls}" data-card="${code}" role="img" aria-label="${cardName(code)}">`
    + `<span class="corner tl"><b>${l}</b><i>${sym}</i></span>`
    + `<span class="pip">${center}</span>`
    + `<span class="corner br"><b>${l}</b><i>${sym}</i></span></div>`;
}

const backHTML = (cls = "") => `<div class="card back ${cls}" role="img" aria-label="Carta fechada"></div>`;

function fullDeck() {
  const deck = [];
  for (const s of SUITS) for (const ch of RANK_CHARS) deck.push(ch + s);
  return deck;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================
   Avaliador de mãos
   ============================================================ */

const CATEGORIES = [
  { name: "Carta alta", en: "High card", main: 0 },
  { name: "Um par", en: "One pair", main: 1 },
  { name: "Dois pares", en: "Two pair", main: 2 },
  { name: "Trinca", en: "Three of a kind", main: 1 },
  { name: "Sequência", en: "Straight", main: 1 },
  { name: "Flush", en: "Flush", main: 0 },
  { name: "Full House", en: "Full house", main: 2 },
  { name: "Quadra", en: "Four of a kind", main: 1 },
  { name: "Straight Flush", en: "Straight flush", main: 1 },
  { name: "Royal Flush", en: "Royal flush", main: 1 },
];

/** Avalia exatamente 5 cartas: { cat, tb } (categoria e cartas de desempate, da mais importante para a menos). */
function evaluate5(cards) {
  const parsed = cards.map(parse);
  const rs = parsed.map((c) => c.r).sort((a, b) => b - a);
  const flush = parsed.every((c) => c.s === parsed[0].s);
  let straightTop = 0;
  if (new Set(rs).size === 5) {
    if (rs[0] - rs[4] === 4) straightTop = rs[0];
    else if (rs[0] === 14 && rs[1] === 5) straightTop = 5; // A-2-3-4-5: o Ás vale 1
  }
  const counts = {};
  rs.forEach((r) => { counts[r] = (counts[r] || 0) + 1; });
  // Grupos ordenados por quantidade e depois por valor: [[valor, quantidade], ...]
  const groups = Object.entries(counts).map(([r, n]) => [Number(r), n]).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const byGroup = groups.map((g) => g[0]);

  if (straightTop && flush) return { cat: straightTop === 14 ? 9 : 8, tb: [straightTop] };
  if (groups[0][1] === 4) return { cat: 7, tb: byGroup };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { cat: 6, tb: byGroup };
  if (flush) return { cat: 5, tb: rs };
  if (straightTop) return { cat: 4, tb: [straightTop] };
  if (groups[0][1] === 3) return { cat: 3, tb: byGroup };
  if (groups[0][1] === 2 && groups[1][1] === 2) return { cat: 2, tb: byGroup };
  if (groups[0][1] === 2) return { cat: 1, tb: byGroup };
  return { cat: 0, tb: rs };
}

function compareHands(a, b) {
  if (a.cat !== b.cat) return a.cat - b.cat;
  for (let i = 0; i < Math.max(a.tb.length, b.tb.length); i++) {
    const d = (a.tb[i] || 0) - (b.tb[i] || 0);
    if (d) return d;
  }
  return 0;
}

/** Melhor mão de 5 cartas entre 5, 6 ou 7 cartas. Devolve também as 5 cartas usadas. */
function bestHand(cards) {
  let best = null;
  const n = cards.length;
  const pick = [];
  const walk = (start) => {
    if (pick.length === 5) {
      const combo = pick.map((i) => cards[i]);
      const h = evaluate5(combo);
      if (!best || compareHands(h, best) > 0) best = { ...h, cards: combo };
      return;
    }
    for (let i = start; i <= n - (5 - pick.length); i++) {
      pick.push(i);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return best;
}

/** Nome da mão em português: "Par de Reis", "Full House: 8 com Ases"... */
function describe(h) {
  const [a, b] = h.tb;
  switch (h.cat) {
    case 9: return "Royal Flush";
    case 8: return `Straight Flush até ${withArticle(a)}`;
    case 7: return `Quadra de ${plural(a)}`;
    case 6: return `Full House: ${plural(a)} com ${plural(b)}`;
    case 5: return `Flush com ${rankName(a)} alto`;
    case 4: return `Sequência até ${withArticle(a)}`;
    case 3: return `Trinca de ${plural(a)}`;
    case 2: return `Dois pares: ${plural(a)} e ${plural(b)}`;
    case 1: return `Par de ${plural(a)}`;
    default: return `Carta alta: ${rankName(a)}`;
  }
}

/** Explica por que a mão `a` vence a `b` (ou o empate). */
function explainResult(a, b) {
  const c = compareHands(a, b);
  if (c === 0) return "Empate: as duas melhores mãos de 5 cartas têm os mesmos valores, então o pote é dividido.";
  const [w, l] = c > 0 ? [a, b] : [b, a];
  if (w.cat !== l.cat) return `${CATEGORIES[w.cat].name} vence ${CATEGORIES[l.cat].name}: está acima no ranking das mãos.`;
  let i = 0;
  while (w.tb[i] === l.tb[i]) i++;
  const main = CATEGORIES[w.cat].main;
  const name = CATEGORIES[w.cat].name.toLowerCase();
  if (main === 0) {
    return `As duas são ${name}: compara-se carta por carta, da maior para a menor. A diferença aparece em ${withArticle(w.tb[i])} contra ${withArticle(l.tb[i])}.`;
  }
  if (i < main) {
    return `As duas são ${name}, mas a combinação de uma é mais alta: ${plural(w.tb[i])} contra ${plural(l.tb[i])}.`;
  }
  return `As combinações são iguais (${describe(w)}). Quem decide é o kicker, a carta que sobra: ${withArticle(w.tb[i])} vence ${withArticle(l.tb[i])}.`;
}

/* ============================================================
   Sons (gerados na hora com Web Audio, sem arquivos)
   ============================================================ */

const Sfx = (() => {
  let ctx = null;
  let on = true;
  try { on = localStorage.getItem("poker-som") !== "off"; } catch { /* sem localStorage */ }

  const audio = () => {
    if (!on) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  const noise = (c, dur) => {
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    return src;
  };

  // Carta deslizando na mesa: um "shh" curto de ruído filtrado.
  function card(delay = 0) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime + delay;
    const src = noise(c, 0.09);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(5200, t);
    bp.frequency.exponentialRampToValueAtTime(1800, t + 0.08);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
    src.connect(bp).connect(g).connect(c.destination);
    src.start(t);
  }

  // Ficha batendo em ficha: dois cliques agudos e secos.
  function chip(delay = 0) {
    const c = audio();
    if (!c) return;
    const t0 = c.currentTime + delay;
    [0, 0.045].forEach((dt, k) => {
      const t = t0 + dt;
      const o = c.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(k ? 3100 : 3600, t);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.06);
    });
  }

  function tone(notes) {
    const c = audio();
    if (!c) return;
    const t0 = c.currentTime;
    notes.forEach(([f, dt]) => {
      const t = t0 + dt;
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
  }

  return {
    get on() { return on; },
    toggle() {
      on = !on;
      try { localStorage.setItem("poker-som", on ? "on" : "off"); } catch { /* ignora */ }
      return on;
    },
    card,
    chip,
    good: () => tone([[660, 0], [990, 0.08]]),
    bad: () => tone([[330, 0], [247, 0.1]]),
  };
})();
