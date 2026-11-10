"use strict";

/* ============================================================
   Dados
   au: distância média do Sol (unidades astronômicas)
   period: tempo de uma volta em torno do Sol (dias terrestres)
   L0: posição (longitude média, em graus) em 1º/jan/2000 12h
   r: raio no desenho (não está em escala real!)
   gravity: gravidade em relação à da Terra
   ============================================================ */

const BODIES = [
  {
    id: "sol", name: "Sol", kind: "Estrela", r: 30, au: 0, period: 0, gravity: 27.9,
    colors: ["#fff7d6", "#ffb52e"],
    summary: "A estrela no centro de tudo. Uma bola gigante de gás quente que gera luz e calor por fusão nuclear.",
    facts: [["Diâmetro", "1.392.700 km"], ["Temperatura", "5.500 °C (superfície)"], ["Rotação", "≈ 25 dias (no equador)"], ["Idade", "≈ 4,6 bilhões de anos"]],
    curios: [
      "Concentra cerca de 99,8% de toda a massa do Sistema Solar.",
      "A luz do Sol leva cerca de 8 minutos e 20 segundos para chegar à Terra.",
      "Caberiam cerca de 1,3 milhão de Terras dentro dele.",
    ],
    weightNote: "(se desse para ficar lá, o que não dá!)",
  },
  {
    id: "mercurio", name: "Mercúrio", kind: "Planeta rochoso", r: 4, au: 0.387, period: 87.97, L0: 252.25, gravity: 0.38,
    colors: ["#cfcac4", "#7d7873"],
    summary: "O menor planeta e o mais próximo do Sol. Cheio de crateras, parecido com a nossa Lua.",
    facts: [["Distância do Sol", "58 milhões de km"], ["Ano", "88 dias"], ["Rotação", "59 dias"], ["Diâmetro", "4.879 km"], ["Luas", "0"], ["Temperatura", "−173 a 427 °C"]],
    curios: [
      "Quase não tem atmosfera, por isso esquenta muito de dia e congela à noite.",
      "De um nascer do Sol ao outro passam 176 dias terrestres: mais que o ano de lá, que tem 88 dias.",
      "É o planeta que dá a volta no Sol mais rápido.",
    ],
  },
  {
    id: "venus", name: "Vênus", kind: "Planeta rochoso", r: 7, au: 0.723, period: 224.7, L0: 181.98, gravity: 0.91,
    colors: ["#fbe3a8", "#c9944a"],
    summary: "Quase do tamanho da Terra, mas coberto por nuvens ácidas e com um calor de derreter chumbo.",
    facts: [["Distância do Sol", "108 milhões de km"], ["Ano", "225 dias"], ["Rotação", "243 dias (ao contrário)"], ["Diâmetro", "12.104 km"], ["Luas", "0"], ["Temperatura", "464 °C"]],
    curios: [
      "É o planeta mais quente, mesmo não sendo o mais perto do Sol: a atmosfera grossa prende o calor (efeito estufa).",
      "Gira ao contrário da maioria dos planetas: lá o Sol nasce no oeste.",
      "Depois da Lua, é o objeto mais brilhante do céu à noite.",
    ],
  },
  {
    id: "terra", name: "Terra", kind: "Planeta rochoso", r: 7.5, au: 1, period: 365.256, L0: 100.46, gravity: 1,
    colors: ["#7fb8ff", "#1f4fa8"],
    summary: "A nossa casa. O único lugar conhecido no universo com vida.",
    facts: [["Distância do Sol", "150 milhões de km"], ["Ano", "365,25 dias"], ["Rotação", "24 horas"], ["Diâmetro", "12.742 km"], ["Luas", "1"], ["Temperatura", "15 °C (média)"]],
    curios: [
      "Cerca de 71% da superfície é coberta por água.",
      "Não é uma bola perfeita: é um pouco achatada nos polos.",
      "É o planeta mais denso do Sistema Solar.",
    ],
  },
  {
    id: "marte", name: "Marte", kind: "Planeta rochoso", r: 5.5, au: 1.524, period: 686.98, L0: 355.45, gravity: 0.38,
    colors: ["#f08a5d", "#9a3412"],
    summary: "O planeta vermelho: frio, seco e com o maior vulcão conhecido do Sistema Solar.",
    facts: [["Distância do Sol", "228 milhões de km"], ["Ano", "687 dias"], ["Rotação", "24 h 37 min"], ["Diâmetro", "6.779 km"], ["Luas", "2"], ["Temperatura", "−63 °C (média)"]],
    curios: [
      "A cor vermelha vem do óxido de ferro (ferrugem) no solo.",
      "O Monte Olimpo tem cerca de 22 km de altura, quase 2,5 vezes o Everest.",
      "As duas luas, Fobos e Deimos, são pequenas e têm formato de batata.",
    ],
  },
  {
    id: "jupiter", name: "Júpiter", kind: "Gigante gasoso", r: 16, au: 5.203, period: 4332.6, L0: 34.40, gravity: 2.53,
    colors: ["#f1d9b5", "#a8774f"], bands: ["#c99c6f", "#e8cfa8", "#b07d55", "#f3e2c4", "#c48b5c"],
    summary: "O maior planeta, feito principalmente de hidrogênio e hélio. Não tem chão firme.",
    facts: [["Distância do Sol", "778 milhões de km"], ["Ano", "11,9 anos"], ["Rotação", "9 h 56 min"], ["Diâmetro", "139.820 km"], ["Luas", "mais de 90"], ["Temperatura", "−110 °C (nuvens)"]],
    curios: [
      "Caberiam mais de 1.300 Terras dentro dele.",
      "A Grande Mancha Vermelha é uma tempestade maior que a Terra, observada há mais de 150 anos.",
      "É o planeta que gira mais rápido: um dia dura menos de 10 horas.",
    ],
    weightNote: "(no topo das nuvens: não dá para ficar em pé num planeta de gás!)",
  },
  {
    id: "saturno", name: "Saturno", kind: "Gigante gasoso", r: 13, au: 9.537, period: 10759.2, L0: 49.94, gravity: 1.07,
    colors: ["#f6e6b8", "#c2a368"], bands: ["#d9c08a", "#efdcae", "#cdb27a", "#f5e8c4"], rings: true,
    summary: "O senhor dos anéis: tem o sistema de anéis mais impressionante do Sistema Solar.",
    facts: [["Distância do Sol", "1,43 bilhão de km"], ["Ano", "29,5 anos"], ["Rotação", "10 h 34 min"], ["Diâmetro", "116.460 km"], ["Luas", "mais de 270"], ["Temperatura", "−140 °C (nuvens)"]],
    curios: [
      "É tão pouco denso que flutuaria na água, se existisse uma banheira grande o bastante.",
      "Os anéis são feitos de pedaços de gelo e rocha, de grãos de poeira até blocos do tamanho de casas.",
      "A lua Titã tem lagos e rios de metano líquido.",
    ],
    weightNote: "(no topo das nuvens: não dá para ficar em pé num planeta de gás!)",
  },
  {
    id: "urano", name: "Urano", kind: "Gigante de gelo", r: 10, au: 19.19, period: 30687, L0: 313.23, gravity: 0.89,
    colors: ["#c9f4f5", "#5bb8c4"], faintRing: true,
    summary: "Um gigante gelado e azul-esverdeado que gira deitado de lado.",
    facts: [["Distância do Sol", "2,87 bilhões de km"], ["Ano", "84 anos"], ["Rotação", "17 h 14 min"], ["Diâmetro", "50.724 km"], ["Luas", "mais de 25"], ["Temperatura", "−195 °C"]],
    curios: [
      "O eixo dele é inclinado cerca de 98 graus: ele gira como uma bola rolando.",
      "Por isso, cada polo passa cerca de 42 anos de dia e depois 42 anos de noite.",
      "Foi o primeiro planeta descoberto com telescópio, por William Herschel, em 1781.",
    ],
    weightNote: "(no topo das nuvens)",
  },
  {
    id: "netuno", name: "Netuno", kind: "Gigante de gelo", r: 10, au: 30.07, period: 60190, L0: 304.88, gravity: 1.14,
    colors: ["#8fb0ff", "#2b47c9"],
    summary: "O planeta mais distante: escuro, gelado e com ventos furiosos.",
    facts: [["Distância do Sol", "4,5 bilhões de km"], ["Ano", "165 anos"], ["Rotação", "16 h 6 min"], ["Diâmetro", "49.244 km"], ["Luas", "16"], ["Temperatura", "−200 °C"]],
    curios: [
      "Tem os ventos mais rápidos do Sistema Solar, com mais de 2.000 km/h.",
      "Foi descoberto em 1846 graças à matemática: cálculos previram onde ele estaria antes de alguém vê-lo.",
      "Desde que foi descoberto, completou só uma volta em torno do Sol (em 2011).",
    ],
    weightNote: "(no topo das nuvens)",
  },
  {
    id: "lua", name: "Lua", kind: "Satélite natural da Terra", r: 2.6, parent: "terra", period: 27.32, gravity: 0.165,
    colors: ["#f2f0ea", "#8f8c86"],
    summary: "A única lua da Terra e o único lugar fora do nosso planeta onde pessoas já pisaram.",
    facts: [["Distância da Terra", "384.400 km"], ["Volta na Terra", "27,3 dias"], ["Diâmetro", "3.474 km"], ["Temperatura", "−173 a 127 °C"]],
    curios: [
      "Mostra sempre a mesma face para a Terra.",
      "Está se afastando da Terra cerca de 3,8 cm por ano.",
      "12 astronautas já caminharam nela, entre 1969 e 1972.",
    ],
  },
];

const byId = Object.fromEntries(BODIES.map((b) => [b.id, b]));
const PLANETS = BODIES.filter((b) => b.au > 0);
const OUTER = byId.netuno;

/* ============================================================
   Tempo e posições
   ============================================================ */

const J2000 = Date.UTC(2000, 0, 1, 12);
const DAY_MS = 86400000;
const todayDays = () => (Date.now() - J2000) / DAY_MS;
// Lua nova de referência (6/jan/2000 18h14 UTC): Lua entre a Terra e o Sol.
const NEW_MOON = (Date.UTC(2000, 0, 6, 18, 14) - J2000) / DAY_MS;

let simDays = todayDays();
let playing = true;

/** Ângulo (rad) do planeta em torno do Sol: órbita circular com a velocidade média real. */
function orbitAngle(b, days) {
  return ((b.L0 + (360 * days) / b.period) * Math.PI) / 180;
}

/** Distância no desenho: compacta (raiz quadrada) ou real (proporcional às UA). */
let realMix = 0; // 0 = compacta, 1 = real (animado)
let realTarget = 0;
const compactDist = (au) => 60 + 120 * Math.sqrt(au);
const realDist = (au) => au * 110;
const distOf = (au) => compactDist(au) + (realDist(au) - compactDist(au)) * realMix;
const sunRadius = () => 30 + (14 - 30) * realMix;

/* Cinturão de asteroides (entre Marte e Júpiter). */
const ASTEROIDS = Array.from({ length: 900 }, () => {
  const au = 2.15 + Math.random() * 1.15;
  return { au, period: 365.256 * au ** 1.5, a0: Math.random() * Math.PI * 2, size: Math.random() < 0.15 ? 1.6 : 1 };
});

/* Estrelas de fundo (posição normalizada). */
const STARS = Array.from({ length: 520 }, () => ({
  x: Math.random(), y: Math.random(), size: Math.random() ** 3 * 1.6 + 0.3,
  alpha: 0.25 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2, depth: 0.2 + Math.random() * 0.8,
}));

/* ============================================================
   Canvas e câmera
   ============================================================ */

const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
let W = 0;
let H = 0;
let DPR = 1;

const cam = { x: 0, y: 0, zoom: 0.5, tx: 0, ty: 0, tzoom: 0.5, offX: 0, offY: 0, toffX: 0, toffY: 0 };
let selected = null;
let following = false;
let overview = true;
let showOrbits = true;
let showLabels = true;
let hovered = null;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  updatePanelOffset();
}

const isMobile = () => W <= 760;

/** Zoom que faz o Sistema Solar inteiro caber na tela (descontando os menus). */
function fitZoom() {
  const usableH = H - (isMobile() ? 260 : 170);
  const usableW = W - 32;
  return Math.max(0.02, Math.min(usableW, usableH) / 2 / (distOf(OUTER.au) + 36));
}

/** Escala mínima das bolinhas: em telas pequenas os planetas ficam menores. */
const minScale = () => Math.min(1, Math.max(0.45, fitZoom() * 2));
const screenRadius = (b, zoom = cam.zoom) => b.r * Math.max(zoom, minScale());

function updatePanelOffset() {
  if (!selected) {
    cam.toffX = 0;
    cam.toffY = 0;
  } else if (isMobile()) {
    cam.toffX = 0;
    cam.toffY = -Math.min(H * 0.52, 420) / 2 + 40;
  } else {
    cam.toffX = -(Math.min(380, W - 32) + 16) / 2;
    cam.toffY = 0;
  }
}

/** Posição de cada corpo no "mundo" (antes da câmera). */
function positions() {
  const pos = { sol: { x: 0, y: 0 } };
  for (const b of PLANETS) {
    const a = orbitAngle(b, simDays);
    const d = distOf(b.au);
    pos[b.id] = { x: Math.cos(a) * d, y: -Math.sin(a) * d, angle: a };
  }
  // Lua: a distância no desenho acompanha o tamanho da Terra na tela.
  const earth = pos.terra;
  const earthAngle = orbitAngle(byId.terra, NEW_MOON);
  const moonAngle = earthAngle + Math.PI + (2 * Math.PI * (simDays - NEW_MOON)) / byId.lua.period;
  const moonDist = (screenRadius(byId.terra) * 1.9 + 6) / cam.zoom;
  pos.lua = { x: earth.x + Math.cos(moonAngle) * moonDist, y: earth.y - Math.sin(moonAngle) * moonDist };
  return pos;
}

const toScreen = (p) => ({
  x: (p.x - cam.x) * cam.zoom + W / 2 + cam.offX,
  y: (p.y - cam.y) * cam.zoom + H / 2 + cam.offY,
});
const toWorld = (sx, sy) => ({
  x: (sx - W / 2 - cam.offX) / cam.zoom + cam.x,
  y: (sy - H / 2 - cam.offY) / cam.zoom + cam.y,
});

/* ============================================================
   Desenho
   ============================================================ */

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function drawStars(t) {
  for (const s of STARS) {
    const px = ((s.x * W - cam.x * cam.zoom * 0.02 * s.depth) % W + W) % W;
    const py = ((s.y * H - cam.y * cam.zoom * 0.02 * s.depth) % H + H) % H;
    const tw = REDUCED.matches ? 1 : 0.65 + 0.35 * Math.sin(t * 0.0015 + s.phase);
    ctx.globalAlpha = s.alpha * tw;
    ctx.fillStyle = "#dfe6ff";
    ctx.fillRect(px, py, s.size, s.size);
  }
  ctx.globalAlpha = 1;
}

function drawOrbits(pos) {
  if (!showOrbits) return;
  const c = toScreen({ x: 0, y: 0 });
  for (const b of PLANETS) {
    const d = distOf(b.au) * cam.zoom;
    const isSel = selected === b;
    ctx.strokeStyle = isSel ? "rgba(255, 195, 92, .45)" : "rgba(140, 160, 255, .13)";
    ctx.lineWidth = isSel ? 1.5 : 1;
    circle(c.x, c.y, d);
    ctx.stroke();

    // Rastro: um arco que vai sumindo atrás do planeta.
    const a = -pos[b.id].angle;
    const steps = 14;
    for (let k = 0; k < steps; k++) {
      ctx.strokeStyle = `rgba(160, 180, 255, ${(0.4 * (steps - k)) / steps})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, d, a + k * 0.035, a + (k + 1) * 0.035);
      ctx.stroke();
    }
  }
}

function drawBelt() {
  const c = toScreen({ x: 0, y: 0 });
  ctx.fillStyle = "rgba(190, 180, 165, .55)";
  for (const a of ASTEROIDS) {
    const ang = a.a0 + (2 * Math.PI * simDays) / a.period;
    const d = distOf(a.au) * cam.zoom;
    const x = c.x + Math.cos(ang) * d;
    const y = c.y - Math.sin(ang) * d;
    if (x < -2 || y < -2 || x > W + 2 || y > H + 2) continue;
    ctx.fillRect(x, y, a.size, a.size);
  }
}

function drawSun(t) {
  const s = toScreen({ x: 0, y: 0 });
  const R = sunRadius() * Math.max(cam.zoom, minScale());
  const pulse = REDUCED.matches ? 1 : 1 + 0.04 * Math.sin(t * 0.002);
  const glow = ctx.createRadialGradient(s.x, s.y, R * 0.6, s.x, s.y, R * 4 * pulse);
  glow.addColorStop(0, "rgba(255, 190, 80, .55)");
  glow.addColorStop(0.35, "rgba(255, 140, 40, .16)");
  glow.addColorStop(1, "rgba(255, 120, 20, 0)");
  ctx.fillStyle = glow;
  circle(s.x, s.y, R * 4 * pulse);
  ctx.fill();
  const core = ctx.createRadialGradient(s.x - R * 0.2, s.y - R * 0.2, R * 0.1, s.x, s.y, R);
  core.addColorStop(0, "#fffbe8");
  core.addColorStop(0.55, "#ffd45c");
  core.addColorStop(1, "#ff9a1f");
  ctx.fillStyle = core;
  circle(s.x, s.y, R);
  ctx.fill();
  return { ...s, R };
}

function drawRings(b, s, R, front) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(-0.38);
  const from = front ? 0 : Math.PI;
  const to = front ? Math.PI : Math.PI * 2;
  const layers = [[2.25, 0.32, "rgba(214, 196, 150, .55)"], [1.85, 0.26, "rgba(236, 220, 176, .8)"], [1.55, 0.12, "rgba(180, 160, 120, .5)"]];
  for (const [k, w, color] of layers) {
    ctx.strokeStyle = color;
    ctx.lineWidth = R * w;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * k, R * k * 0.34, 0, from, to);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlanet(b, s, R, sun) {
  const a = Math.atan2(sun.y - s.y, sun.x - s.x);
  const lx = Math.cos(a);
  const ly = Math.sin(a);

  if (b.rings) drawRings(b, s, R, false);

  // Cor base, com o lado iluminado voltado para o Sol.
  const base = ctx.createRadialGradient(s.x + lx * R * 0.35, s.y + ly * R * 0.35, R * 0.1, s.x, s.y, R);
  base.addColorStop(0, b.colors[0]);
  base.addColorStop(1, b.colors[1]);
  ctx.fillStyle = base;
  circle(s.x, s.y, R);
  ctx.fill();

  ctx.save();
  circle(s.x, s.y, R);
  ctx.clip();
  if (b.bands) {
    // Faixas de nuvens dos gigantes gasosos.
    const n = b.bands.length * 2;
    for (let k = 0; k < n; k++) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = b.bands[k % b.bands.length];
      ctx.fillRect(s.x - R, s.y - R + (k * 2 * R) / n, 2 * R, (R * 2) / n * 0.6);
    }
    ctx.globalAlpha = 1;
    if (b.id === "jupiter" && R > 6) {
      ctx.fillStyle = "rgba(190, 80, 50, .85)";
      ctx.beginPath();
      ctx.ellipse(s.x + R * 0.3, s.y + R * 0.35, R * 0.22, R * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (b.id === "terra" && R > 4) {
    // Continentes e nuvens simples, girando devagar.
    const spin = (simDays % 1) * Math.PI * 2;
    ctx.fillStyle = "rgba(76, 160, 88, .9)";
    for (const [ox, oy, rx, ry] of [[-0.3, -0.25, 0.32, 0.22], [0.35, 0.1, 0.25, 0.35], [-0.1, 0.45, 0.2, 0.12]]) {
      const x = ((ox + spin / Math.PI) % 2 + 2) % 2 - 1;
      ctx.beginPath();
      ctx.ellipse(s.x + x * R * 1.2, s.y + oy * R, rx * R, ry * R, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255, 255, 255, .35)";
    ctx.beginPath();
    ctx.ellipse(s.x - R * 0.1, s.y - R * 0.6, R * 0.5, R * 0.1, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sombra no lado oposto ao Sol.
  const shade = ctx.createLinearGradient(s.x + lx * R, s.y + ly * R, s.x - lx * R, s.y - ly * R);
  shade.addColorStop(0, "rgba(0, 0, 0, 0)");
  shade.addColorStop(0.45, "rgba(0, 0, 0, .08)");
  shade.addColorStop(1, "rgba(0, 0, 8, .8)");
  ctx.fillStyle = shade;
  ctx.fillRect(s.x - R, s.y - R, R * 2, R * 2);
  ctx.restore();

  // Atmosfera fininha.
  if (["terra", "venus", "urano", "netuno"].includes(b.id) && R > 5) {
    ctx.strokeStyle = b.id === "venus" ? "rgba(255, 220, 160, .35)" : "rgba(140, 200, 255, .35)";
    ctx.lineWidth = Math.max(1, R * 0.08);
    circle(s.x, s.y, R * 1.04);
    ctx.stroke();
  }
  if (b.rings) drawRings(b, s, R, true);
  if (b.faintRing) {
    ctx.strokeStyle = "rgba(200, 240, 245, .3)";
    ctx.lineWidth = Math.max(0.6, R * 0.06);
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, R * 0.45, R * 1.6, 0.15, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSelection(s, R, t) {
  const pulse = REDUCED.matches ? 0 : Math.sin(t * 0.004) * 2;
  ctx.strokeStyle = "rgba(255, 195, 92, .8)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 5]);
  circle(s.x, s.y, R + 7 + pulse);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Desenha o nome do corpo, a não ser que bata em outro nome já desenhado. */
function drawLabel(b, s, R, placed) {
  const important = b === selected || b === hovered;
  if (!showLabels && !important) return;
  ctx.font = `${b === selected ? 600 : 500} 12px "Space Grotesk", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = b === selected ? "#ffc35c" : b === hovered ? "#ffffff" : "rgba(210, 218, 255, .75)";
  const extra = b.rings ? R * 0.9 : b.faintRing ? R * 0.7 : 0;
  const y = s.y + R + extra + 15;
  const half = ctx.measureText(b.name).width / 2 + 4;
  const hit = placed.some((p) => Math.abs(p.x - s.x) < p.half + half && Math.abs(p.y - y) < 14);
  if (hit && !important) return;
  placed.push({ x: s.x, y, half });
  ctx.fillText(b.name, s.x, y);
}

/* ============================================================
   Loop principal
   ============================================================ */

let last = performance.now();
let screenCache = [];

function frame(t) {
  const dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  if (playing) simDays += speedDays() * dt;

  // Transição suave entre escala compacta e real.
  const k = 1 - Math.exp(-dt * 4);
  realMix += (realTarget - realMix) * k;
  if (Math.abs(realTarget - realMix) < 0.001) realMix = realTarget;

  let pos = positions();
  if (overview) {
    cam.tx = 0;
    cam.ty = 0;
    cam.tzoom = fitZoom();
  } else if (following && selected) {
    cam.tx = pos[selected.id].x;
    cam.ty = pos[selected.id].y;
  }
  const kc = REDUCED.matches ? 1 : 1 - Math.exp(-dt * 5);
  cam.x += (cam.tx - cam.x) * kc;
  cam.y += (cam.ty - cam.y) * kc;
  cam.zoom *= Math.exp((Math.log(cam.tzoom) - Math.log(cam.zoom)) * kc);
  cam.offX += (cam.toffX - cam.offX) * kc;
  cam.offY += (cam.toffY - cam.offY) * kc;
  pos = positions(); // a Lua depende do zoom atual

  ctx.fillStyle = "#04050b";
  ctx.fillRect(0, 0, W, H);
  drawStars(t);
  drawOrbits(pos);
  drawBelt();
  const sun = drawSun(t);

  screenCache = [{ b: byId.sol, x: sun.x, y: sun.y, R: sun.R }];
  for (const b of [...PLANETS, byId.lua]) {
    const s = toScreen(pos[b.id]);
    const R = screenRadius(b);
    screenCache.push({ b, x: s.x, y: s.y, R });
    if (s.x < -R * 3 || s.y < -R * 3 || s.x > W + R * 3 || s.y > H + R * 3) continue;
    drawPlanet(b, s, R, sun);
  }
  // Nomes: o selecionado e o apontado primeiro, depois de fora para dentro.
  const placed = [];
  const rank = (c) => (c.b === selected ? 0 : c.b === hovered ? 1 : c.b === byId.sol ? 2 : 3);
  const labels = [...screenCache].reverse().sort((a, b) => rank(a) - rank(b));
  for (const c of labels) {
    if (c.b === selected) drawSelection(c, c.R, t);
    if (c.b !== byId.lua || cam.zoom > 1.2 || c.b === selected) drawLabel(c.b, c, c.R, placed);
  }

  updateDate();
  requestAnimationFrame(frame);
}

/* ============================================================
   Interface
   ============================================================ */

const $ = (id) => document.getElementById(id);
const speedInput = $("speed");

/** Velocidade em dias simulados por segundo (escala logarítmica: 0,1 até 36.500). */
const speedDays = () => 0.1 * 365000 ** (Number(speedInput.value) / 100);

function speedText(d) {
  if (d < 1) return `${Math.round(d * 24)} horas/s`;
  if (d < 30) return `${d < 2 ? "1 dia" : `${Math.round(d)} dias`}/s`;
  if (d < 365) {
    const mo = Math.round(d / 30.44);
    return `${mo} ${mo === 1 ? "mês" : "meses"}/s`;
  }
  const y = d / 365.25;
  return `${y < 10 ? y.toFixed(1).replace(".", ",") : Math.round(y)} ${y < 1.05 ? "ano" : "anos"}/s`;
}

function updateSpeed() {
  $("speed-label").textContent = speedText(speedDays());
}

let lastDateText = "";
function updateDate() {
  const d = new Date(J2000 + simDays * DAY_MS);
  const text = d.getUTCFullYear() > 9999 || d.getUTCFullYear() < -9999
    ? `ano ${d.getUTCFullYear()}`
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
  if (text !== lastDateText) {
    $("date").textContent = text;
    lastDateText = text;
  }
}

function setPlaying(p) {
  playing = p;
  const btn = $("btn-play");
  btn.textContent = p ? "❚❚" : "▶";
  btn.setAttribute("aria-label", p ? "Pausar" : "Continuar");
}

function select(b) {
  selected = b;
  overview = false;
  following = true;
  // Zoom para o planeta ocupar uma boa parte da tela.
  const targetPx = Math.min(W, H) * (isMobile() ? 0.09 : 0.11);
  cam.tzoom = Math.max(fitZoom(), targetPx / b.r);
  updatePanelOffset();
  fillInfo(b);
  paintList();
  hideHint();
}

function showOverview() {
  selected = null;
  following = false;
  overview = true;
  $("info").hidden = true;
  updatePanelOffset();
  paintList();
}

function fillInfo(b) {
  $("info").hidden = false;
  $("info-name").textContent = b.name;
  $("info-kind").textContent = b.kind;
  $("info-summary").textContent = b.summary;
  $("info-swatch").style.background = b.id === "sol"
    ? "radial-gradient(circle at 40% 40%, #fffbe8, #ffd45c 55%, #ff9a1f)"
    : `radial-gradient(circle at 35% 35%, ${b.colors[0]}, ${b.colors[1]})`;
  $("info-facts").innerHTML = b.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  $("info-curios").innerHTML = b.curios.map((c) => `<li>${c}</li>`).join("");
  updateWeight();
  $("info").scrollTop = 0;
}

function updateWeight() {
  if (!selected) return;
  const kg = Math.max(0, Number($("weight").value) || 0);
  const value = kg * selected.gravity;
  const fmt = value >= 100 ? Math.round(value).toLocaleString("pt-BR") : value.toFixed(1).replace(".", ",");
  $("weight-out").textContent = `${fmt} kg`;
  $("weight-note").textContent = selected.weightNote || "";
}

function paintList() {
  document.querySelectorAll(".planet").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(selected?.id === btn.dataset.id));
  });
}

function buildList() {
  const list = $("planet-list");
  list.innerHTML = BODIES.map((b) => {
    const bg = b.id === "sol" ? "radial-gradient(circle at 35% 35%, #fffbe8, #ffb52e)" : `radial-gradient(circle at 35% 35%, ${b.colors[0]}, ${b.colors[1]})`;
    return `<button class="planet" type="button" data-id="${b.id}" aria-pressed="false"><span class="dot" style="background:${bg}"></span>${b.name}</button>`;
  }).join("");
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".planet");
    if (btn) select(byId[btn.dataset.id]);
  });
}

let hintTimer = setTimeout(hideHint, 9000);
function hideHint() {
  clearTimeout(hintTimer);
  $("hint").classList.add("gone");
}

/* ---------- Mouse, toque e roda ---------- */

const pointers = new Map();
let dragStart = null;
let pinchDist = 0;

function pick(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const c of screenCache) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < Math.max(c.R + 6, 14) && d < bestD) {
      best = c.b;
      bestD = d;
    }
  }
  return best;
}

function zoomAt(factor, sx, sy) {
  const newZoom = Math.min(60, Math.max(fitZoom() * 0.5, cam.zoom * factor));
  if (following && selected) {
    cam.tzoom = newZoom;
    cam.zoom = newZoom;
    return;
  }
  overview = false;
  const before = toWorld(sx, sy);
  cam.zoom = newZoom;
  cam.tzoom = newZoom;
  const after = toWorld(sx, sy);
  cam.x += before.x - after.x;
  cam.y += before.y - after.y;
  cam.tx = cam.x;
  cam.ty = cam.y;
}

canvas.addEventListener("pointerdown", (e) => {
  try { canvas.setPointerCapture(e.pointerId); } catch { /* ponteiro já solto: segue sem captura */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) dragStart = { x: e.clientX, y: e.clientY, moved: false };
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) {
    // Só passando o mouse por cima.
    hovered = pick(e.clientX, e.clientY);
    canvas.classList.toggle("hovering", !!hovered);
    return;
  }
  const prev = pointers.get(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist) zoomAt(d / pinchDist, (a.x + b.x) / 2, (a.y + b.y) / 2);
    pinchDist = d;
    if (dragStart) dragStart.moved = true;
    return;
  }
  if (!dragStart) return;
  if (!dragStart.moved && Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) < 5) return;
  dragStart.moved = true;
  canvas.classList.add("dragging");
  overview = false;
  following = false;
  cam.x -= (e.clientX - prev.x) / cam.zoom;
  cam.y -= (e.clientY - prev.y) / cam.zoom;
  cam.tx = cam.x;
  cam.ty = cam.y;
  hideHint();
});

function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchDist = 0;
  canvas.classList.remove("dragging");
  if (pointers.size === 0 && dragStart) {
    if (!dragStart.moved) {
      const b = pick(e.clientX, e.clientY);
      if (b) select(b);
    }
    dragStart = null;
  }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  hideHint();
}, { passive: false });

/* ---------- Botões ---------- */

$("btn-play").addEventListener("click", () => setPlaying(!playing));
$("btn-today").addEventListener("click", () => { simDays = todayDays(); });
$("btn-overview").addEventListener("click", showOverview);
$("info-close").addEventListener("click", showOverview);
speedInput.addEventListener("input", updateSpeed);
$("weight").addEventListener("input", updateWeight);
$("opt-orbits").addEventListener("change", (e) => { showOrbits = e.target.checked; });
$("opt-labels").addEventListener("change", (e) => { showLabels = e.target.checked; });
$("opt-real").addEventListener("change", (e) => { realTarget = e.target.checked ? 1 : 0; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    showOverview();
    return;
  }
  // Espaço pausa, a não ser que o foco esteja num botão ou campo (que já usam a tecla).
  if (e.key === " " && !e.target.matches?.("input, button")) {
    e.preventDefault();
    setPlaying(!playing);
  }
});

addEventListener("resize", () => {
  resize();
  if (selected) select(selected);
});

/* ---------- Início ---------- */

resize();
cam.zoom = cam.tzoom = fitZoom();
buildList();
updateSpeed();
requestAnimationFrame(frame);
