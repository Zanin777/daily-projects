"use strict";

/* ============================================================
   Regras de movimento
   ============================================================ */

const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];

/** Lances possíveis da peça em `s`, sem checar se deixam o rei em xeque. */
function pseudoMoves(pos, s) {
  const piece = pos[s];
  const color = piece[0];
  const type = piece[1];
  const [f, r] = fr(s);
  const moves = [];
  const caps = [];

  // Tenta ir para (tf, tr). Retorna true se a casa estava vazia (o raio pode continuar).
  const tryAdd = (tf, tr) => {
    if (!inBoard(tf, tr)) return false;
    const t = sq(tf, tr);
    const other = pos[t];
    if (!other) {
      moves.push(t);
      return true;
    }
    if (other[0] !== color) caps.push(t);
    return false;
  };
  const rays = (dirs) => dirs.forEach(([df, dr]) => {
    let tf = f + df;
    let tr = r + dr;
    while (tryAdd(tf, tr)) {
      tf += df;
      tr += dr;
    }
  });
  const steps = (dirs) => dirs.forEach(([df, dr]) => tryAdd(f + df, r + dr));

  switch (type) {
    case "K": steps([...ORTH, ...DIAG]); break;
    case "Q": rays([...ORTH, ...DIAG]); break;
    case "R": rays(ORTH); break;
    case "B": rays(DIAG); break;
    case "N": steps(KNIGHT); break;
    case "P": {
      const dir = color === "w" ? 1 : -1;
      const startRank = color === "w" ? 1 : 6;
      if (inBoard(f, r + dir) && !pos[sq(f, r + dir)]) {
        moves.push(sq(f, r + dir));
        if (r === startRank && !pos[sq(f, r + 2 * dir)]) moves.push(sq(f, r + 2 * dir));
      }
      for (const t of pawnAttacks(s, color)) {
        if (pos[t] && pos[t][0] !== color) caps.push(t);
      }
      break;
    }
  }
  return { moves, caps };
}

function pawnAttacks(s, color) {
  const [f, r] = fr(s);
  const dir = color === "w" ? 1 : -1;
  return [[f - 1, r + dir], [f + 1, r + dir]]
    .filter(([a, b]) => inBoard(a, b))
    .map(([a, b]) => sq(a, b));
}

function isAttacked(pos, target, byColor) {
  for (const [s, p] of Object.entries(pos)) {
    if (p[0] !== byColor) continue;
    const attacked = p[1] === "P" ? pawnAttacks(s, byColor) : (() => {
      const { moves, caps } = pseudoMoves(pos, s);
      return [...moves, ...caps];
    })();
    if (attacked.includes(target)) return true;
  }
  return false;
}

/** Lances do explorador. Para o rei, separa as casas atacadas como "danger". */
function explorerMoves(pos, s) {
  const piece = pos[s];
  const { moves, caps } = pseudoMoves(pos, s);
  if (piece[1] !== "K") return { moves, caps, danger: [] };

  const enemy = piece[0] === "w" ? "b" : "w";
  const safe = (t) => {
    const test = { ...pos };
    delete test[s];
    test[t] = piece;
    return !isAttacked(test, t, enemy);
  };
  return {
    moves: moves.filter(safe),
    caps: caps.filter(safe),
    danger: [...moves, ...caps].filter((t) => !safe(t)),
  };
}

/* ============================================================
   Lição 2: explorador de peças
   ============================================================ */

const EXPLORER = {
  K: {
    main: "d4",
    setup: { d4: "wK", h5: "bR", e4: "bP" },
    value: "Valor: infinito (perder o rei é perder o jogo)",
    move: "Anda uma casa em qualquer direção: para frente, para trás, para os lados e na diagonal.",
    capture: "Captura do mesmo jeito que se move. Mas o rei nunca pode ir para uma casa atacada por uma peça inimiga.",
    tip: "Repare nos ✕: a torre preta controla toda a 5ª fileira e o peão preto ataca d3. Mesmo assim, o rei pode capturar o peão em e4.",
  },
  Q: {
    main: "d4",
    setup: { d4: "wQ", f4: "wP", d7: "bP", a7: "bB", g7: "bN" },
    value: "Valor: 9 pontos (a peça mais forte)",
    move: "Anda quantas casas quiser em linha reta: na horizontal, na vertical e na diagonal. É a torre e o bispo juntos.",
    capture: "Captura a primeira peça inimiga que encontrar no caminho. Não pode pular peças.",
    tip: "O peão branco em f4 bloqueia o caminho da dama para a direita.",
  },
  R: {
    main: "d4",
    setup: { d4: "wR", b4: "wP", d7: "bP", g4: "bN" },
    value: "Valor: 5 pontos",
    move: "Anda quantas casas quiser na horizontal ou na vertical (em cruz).",
    capture: "Captura a primeira peça inimiga na linha ou coluna. Não pode pular peças.",
    tip: "Torres são muito fortes em colunas abertas, sem peões no caminho.",
  },
  B: {
    main: "d4",
    setup: { d4: "wB", b2: "wP", g7: "bN", f2: "bR" },
    value: "Valor: 3 pontos",
    move: "Anda quantas casas quiser na diagonal. Por isso cada bispo passa o jogo todo na mesma cor de casa.",
    capture: "Captura a primeira peça inimiga na diagonal. Não pode pular peças.",
    tip: "Este bispo está numa casa escura e nunca vai pisar numa casa clara.",
  },
  N: {
    main: "d4",
    setup: { d4: "wN", c4: "wP", d5: "wP", e4: "wP", d3: "wP", f3: "wP", e6: "bP", b3: "bB" },
    value: "Valor: 3 pontos",
    move: "Anda em \"L\": duas casas numa direção e mais uma para o lado. É a única peça que pula por cima das outras.",
    capture: "Captura na casa onde cai, não importa o que tem no caminho.",
    tip: "Mesmo cercado de peões, o cavalo pula por cima deles. Ele só não pode cair numa casa com peça da mesma cor (como f3).",
  },
  P: {
    main: "e2",
    setup: { e2: "wP", d3: "bN", b4: "wP", b5: "bP", c5: "bR" },
    value: "Valor: 1 ponto",
    move: "Anda só para frente, uma casa por vez. No primeiro lance de cada peão, ele pode andar duas casas.",
    capture: "Captura diferente de como anda: uma casa na diagonal, para frente. Se tiver uma peça bem na frente dele, ele fica travado.",
    tip: "Clique no peão de b4: ele não pode andar (o peão preto está na frente), mas pode capturar a torre em c5. E leve o peão de e2 até a última fileira para ver a promoção!",
  },
};
const PIECE_ORDER = ["K", "Q", "R", "B", "N", "P"];

function initExplorer() {
  const $ = (id) => document.getElementById(id);
  const tabs = $("piece-tabs");
  let key = "K";
  let pos = {};
  let selected = null;

  const board = createBoard($("explorer-board"), { onClick });

  PIECE_ORDER.forEach((k) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab";
    b.setAttribute("role", "tab");
    b.dataset.key = k;
    b.innerHTML = `<span class="tg" aria-hidden="true">${glyph(k)}</span> ${NOME[k]}`;
    b.addEventListener("click", () => load(k));
    tabs.appendChild(b);
  });

  $("ex-reset").addEventListener("click", () => load(key));

  function load(k) {
    key = k;
    board.cancelMenu();
    const data = EXPLORER[k];
    pos = { ...data.setup };
    selected = data.main;
    tabs.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.key === k)));
    $("ex-glyph").textContent = glyph(k);
    $("ex-name").textContent = NOME[k];
    $("ex-value").textContent = data.value;
    $("ex-move").textContent = data.move;
    $("ex-capture").textContent = data.capture;
    $("ex-tip").textContent = data.tip;
    draw();
  }

  function draw(anims = []) {
    const marks = {};
    let counter = "Clique em uma peça branca.";
    if (selected && pos[selected]) {
      mark(marks, selected, "selected");
      const { moves, caps, danger } = explorerMoves(pos, selected);
      moves.forEach((t) => mark(marks, t, "move"));
      caps.forEach((t) => mark(marks, t, "capture"));
      danger.forEach((t) => mark(marks, t, "danger"));
      const name = NOME[pos[selected][1]];
      counter = moves.length + caps.length === 0
        ? `O ${name} em ${selected} não tem lances agora.`
        : `${capitalize(name)} em ${selected}: ${plural(moves.length, "casa livre", "casas livres")} e ${plural(caps.length, "captura", "capturas")}.`;
    }
    $("ex-counter").textContent = counter;
    board.render(pos, marks, anims);
  }

  function onClick(s) {
    if (selected) {
      const { moves, caps } = explorerMoves(pos, selected);
      if (moves.includes(s) || caps.includes(s)) {
        const from = selected;
        const before = { ...pos };
        pos[s] = pos[from];
        delete pos[from];
        selected = s;
        draw([{ from, to: s }]);
        playOnLanding(caps.includes(s) ? "capture" : "move");

        // Promoção: peão que chega na 8ª fileira abre o menu de escolha.
        if (pos[s] === "wP" && s[1] === "8") promote(s, from, before);
        return;
      }
    }
    if (pos[s] && pos[s][0] === "w") {
      selected = s;
      draw();
    }
  }

  async function promote(s, from, before) {
    const snapshot = pos;
    $("ex-counter").textContent = "Promoção! Escolha em qual peça o peão vai se transformar.";
    const type = await board.choosePromotion(s, "w");
    if (pos !== snapshot) return; // a lição foi trocada ou recomeçada

    if (!type) {
      // Cancelou: o lance é desfeito e o peão volta para a casa de antes.
      pos = before;
      selected = from;
      draw([{ from: s, to: from }]);
      playOnLanding("move");
      $("ex-counter").textContent = "Promoção cancelada: o peão voltou para " + from + ".";
      return;
    }
    pos[s] = "w" + type;
    draw();
    board.pop(s);
    Sound.play("promote");
    const artigo = "QR".includes(type) ? "uma" : "um";
    $("ex-counter").textContent = `Promoção! O peão virou ${artigo} ${NOME[type]}.`;
  }

  load("K");
}


/* ============================================================
   Lição 4: valores
   ============================================================ */

function initValues() {
  const values = [["P", "1"], ["N", "3"], ["B", "3"], ["R", "5"], ["Q", "9"], ["K", "∞"]];
  document.getElementById("values").innerHTML = values.map(([k, v]) => `
    <div class="value-card">
      <div class="vg" aria-hidden="true">${glyph(k)}</div>
      <div class="vn">${NOME[k]}</div>
      <div class="vp">${v}</div>
      <div class="vl">${k === "K" ? "não tem preço" : v === "1" ? "ponto" : "pontos"}</div>
    </div>`).join("");
}

/* ============================================================
   Player de lances (xeque-mate e aberturas)
   ============================================================ */

// Atalho para escrever lances: m("e2e4", "e4", "explicação", { extras })
const m = (uci, san, note, extra = {}) => ({ from: uci.slice(0, 2), to: uci.slice(2, 4), san, note, ...extra });
const CASTLE_W = (note) => m("e1g1", "O-O", note, { rook: ["h1", "f1"] });
const CASTLE_B = (note) => m("e8g8", "O-O", note, { rook: ["h8", "f8"] });

const SPECIALS = [
  {
    tab: "Roque",
    side: ["n", "Regra especial"],
    title: "Roque pequeno e roque grande",
    start: {
      e1: "wK", a1: "wR", h1: "wR", a2: "wP", b2: "wP", c2: "wP", f2: "wP", g2: "wP", h2: "wP",
      e8: "bK", a8: "bR", h8: "bR", a7: "bP", b7: "bP", c7: "bP", f7: "bP", g7: "bP", h7: "bP",
    },
    intro: "Os dois reis ainda estão no meio, com as torres nos cantos e o caminho livre. Os dois lados podem rocar.",
    moves: [
      CASTLE_W("<strong>Roque pequeno (O-O):</strong> o rei vai de e1 para g1 e a torre de h1 pula para f1. O rei fica escondido atrás dos peões."),
      m("e8c8", "O-O-O", "<strong>Roque grande (O-O-O):</strong> do lado da dama. O rei vai de e8 para c8 e a torre de a8 pula para d8, já pronta para atacar no centro.", { rook: ["a8", "d8"] }),
    ],
  },
  {
    tab: "En passant",
    side: ["n", "Regra especial"],
    title: "En passant (\"de passagem\")",
    start: {
      g1: "wK", e5: "wP", a2: "wP", b2: "wP", f2: "wP", g2: "wP", h2: "wP",
      g8: "bK", d7: "bP", a7: "bP", b7: "bP", f7: "bP", g7: "bP", h7: "bP",
    },
    intro: "O peão branco já chegou em e5. Repare no peão preto de d7, logo ao lado da coluna dele.",
    moves: [
      m("d7d5", "d5", "O peão preto anda <strong>duas casas</strong> e para em d5, bem ao lado do peão branco. Parece que escapou da captura..."),
      m("e5d6", "exd6 e.p.", "<strong>En passant!</strong> O peão branco captura como se o preto tivesse andado só uma casa: vai para d6 e o peão de d5 sai do tabuleiro. Só dava para fazer isso agora, neste lance.", { remove: "d5" }),
    ],
    numberFrom: "b",
  },
  {
    tab: "Promoção",
    side: ["n", "Regra especial"],
    title: "Promoção do peão",
    start: { c1: "wK", b6: "wP", g8: "bK", h7: "bP" },
    intro: "O peão branco está a duas casas do fim do tabuleiro. Se chegar lá, vira uma peça nova.",
    moves: [
      m("b6b7", "b7", "Falta só uma casa."),
      m("g8f7", "Rf7", "O rei preto está longe demais para impedir."),
      m("b7b8", "b8=D", "<strong>Promoção!</strong> O peão chegou na última fileira e virou uma <strong>dama</strong>. Poderia ter virado torre, bispo ou cavalo, mas a dama é a mais forte. Quer escolher você mesmo? Leve o peão até o fim na Lição 2.", { promote: "Q" }),
    ],
  },
];

const MATES = [
  {
    tab: "Xeque",
    side: ["n", "Exemplo"],
    title: "Xeque e como escapar",
    start: { e8: "bK", a1: "wR", g1: "wK", f2: "wP", g2: "wP", h2: "wP" },
    intro: "A torre branca vai atacar o rei preto. Avance os lances com ▶.",
    moves: [
      m("a1e1", "Te1+", "<strong>Xeque!</strong> A torre ataca o rei pela coluna e. As pretas são obrigadas a resolver isso agora.", { check: "e8" }),
      m("e8d7", "Rd7", "O rei <strong>fugiu</strong> para d7, uma casa que a torre não ataca. Saiu do xeque."),
    ],
  },
  {
    tab: "Mate do Louco",
    side: ["n", "O mais rápido"],
    title: "Mate do Louco",
    start: "start",
    intro: "A partida mais curta possível: xeque-mate no 2º lance! Só acontece se as brancas cometerem dois erros seguidos.",
    moves: [
      m("f2f3", "f3", "Lance fraco: abre a diagonal que protege o rei branco."),
      m("e7e5", "e5", "As pretas abrem caminho para a dama."),
      m("g2g4", "g4??", "<strong>Erro grave!</strong> Agora a diagonal entre h4 e e1 está toda aberta."),
      m("d8h4", "Dh4#", "<strong>Xeque-mate!</strong> A dama ataca o rei pela diagonal e nada pode bloquear em g3 ou f2. Fim de jogo em 2 lances.", { check: "e1" }),
    ],
  },
  {
    tab: "Mate do Pastor",
    side: ["n", "Mate rápido"],
    title: "Mate do Pastor",
    start: "start",
    intro: "O mate mais famoso dos iniciantes: a dama e o bispo atacam juntos a casa f7. Aprenda para não cair nele!",
    moves: [
      m("e2e4", "e4", "Abre caminho para a dama e o bispo."),
      m("e7e5", "e5", "As pretas respondem no centro."),
      m("f1c4", "Bc4", "O bispo mira a casa f7, que só o rei defende."),
      m("b8c6", "Cc6", "Um lance normal de desenvolvimento."),
      m("d1h5", "Dh5", "A dama também mira f7. Agora são dois atacantes contra um defensor."),
      m("g8f6", "Cf6??", "<strong>Erro grave!</strong> O cavalo ataca a dama, mas esquece de f7. O certo era g6 ou De7."),
      m("h5f7", "Dxf7#", "<strong>Xeque-mate!</strong> A dama ataca o rei e está protegida pelo bispo, então o rei não pode capturá-la. Não há para onde fugir.", { check: "e8" }),
    ],
  },
  {
    tab: "Mate do corredor",
    side: ["n", "Padrão de mate"],
    title: "Mate do corredor",
    start: { g8: "bK", f7: "bP", g7: "bP", h7: "bP", a8: "bR", e1: "wR", g1: "wK", f2: "wP", g2: "wP", h2: "wP", a2: "wP" },
    intro: "O rei preto está escondido atrás dos próprios peões. Parece seguro... mas não tem casa para fugir.",
    moves: [
      m("a8a7", "Ta7", "As pretas não percebem o perigo e mexem a torre."),
      m("e1e8", "Te8#", "<strong>Xeque-mate!</strong> A torre ataca pela 8ª fileira e os peões pretos prendem o próprio rei. Dica: no seu jogo, abrir uma \"janela\" com h6 evita esse mate.", { check: "g8" }),
    ],
    numberFrom: "b",
  },
  {
    tab: "Afogamento",
    side: ["n", "Empate"],
    title: "Cuidado com o afogamento",
    start: { h8: "bK", f7: "wK", d3: "wQ" },
    intro: "As brancas têm dama e rei contra rei sozinho. Vitória fácil? Só se não cometerem este erro...",
    moves: [
      m("d3g6", "Dg6??", "<strong>Afogamento!</strong> O rei preto não está em xeque, mas todas as casas ao redor (g8, g7 e h7) estão atacadas e as pretas não têm outra peça. Não há lance permitido: <strong>empate</strong>."),
    ],
  },
];

const OPENINGS = [
  {
    tab: "Italiana",
    side: ["w", "Brancas"],
    title: "Abertura Italiana",
    start: "start",
    intro: "Uma das aberturas mais antigas e clássicas. As brancas desenvolvem rápido e miram a casa f7.",
    moves: [
      m("e2e4", "e4", "As brancas ocupam o centro e liberam a dama e o bispo."),
      m("e7e5", "e5", "As pretas também tomam o seu pedaço do centro."),
      m("g1f3", "Cf3", "O cavalo entra no jogo e já ataca o peão de e5."),
      m("b8c6", "Cc6", "As pretas defendem o peão com o cavalo."),
      m("f1c4", "Bc4", "O bispo mira f7, o ponto mais fraco das pretas no começo (só o rei o defende)."),
      m("f8c5", "Bc5", "As pretas copiam a ideia e miram f2."),
      m("c2c3", "c3", "Prepara o avanço d4 para conquistar o centro."),
      m("g8f6", "Cf6", "Desenvolve mais uma peça e ataca o peão de e4."),
      m("d2d3", "d3", "Protege e4 com calma. Esta linha tranquila se chama Giuoco Pianissimo."),
      m("d7d6", "d6", "Sólido: reforça e5 e abre o caminho do bispo de c8."),
      CASTLE_W("As brancas fazem o roque: o rei fica protegido e a torre entra no jogo."),
      CASTLE_B("As pretas também rocam. Posição equilibrada, com os dois lados bem desenvolvidos."),
    ],
  },
  {
    tab: "Gambito da Dama",
    side: ["w", "Brancas"],
    title: "Gambito da Dama",
    start: "start",
    intro: "A abertura favorita de muitos campeões mundiais. As brancas oferecem um peão para dominar o centro.",
    moves: [
      m("d2d4", "d4", "Abertura pelo peão da dama."),
      m("d7d5", "d5", "As pretas param o avanço."),
      m("c2c4", "c4", "O gambito: as brancas oferecem o peão de c4 para tirar o peão preto do centro."),
      m("e7e6", "e6", "As pretas recusam a oferta e reforçam d5. Isto é o Gambito da Dama Recusado."),
      m("b1c3", "Cc3", "Mais uma peça pressionando d5."),
      m("g8f6", "Cf6", "As pretas defendem d5 de novo."),
      m("c1g5", "Bg5", "Cravada: o cavalo de f6 não pode sair sem expor a dama. E ele é quem defende d5."),
      m("f8e7", "Be7", "O bispo desfaz a cravada e prepara o roque."),
      m("e2e3", "e3", "Abre caminho para o bispo de f1."),
      CASTLE_B("As pretas colocam o rei em segurança."),
      m("g1f3", "Cf3", "Desenvolvimento completo no lado do rei. O plano agora é rocar e seguir pressionando o centro."),
    ],
  },
  {
    tab: "Siciliana",
    side: ["b", "Pretas"],
    title: "Defesa Siciliana",
    start: "start",
    flip: true,
    intro: "A defesa mais popular contra 1.e4. As pretas não copiam as brancas: lutam pelo centro pelo lado e buscam um jogo desequilibrado.",
    moves: [
      m("e2e4", "e4", "As brancas começam pelo peão do rei."),
      m("c7c5", "c5", "A Siciliana: em vez de e5, as pretas atacam a casa d4 pela lateral."),
      m("g1f3", "Cf3", "As brancas preparam d4."),
      m("d7d6", "d6", "Controla e5 e abre o bispo de c8."),
      m("d2d4", "d4", "As brancas abrem o centro."),
      m("c5d4", "cxd4", "Troca um peão lateral (c) por um peão central (d). Ótimo negócio para as pretas!"),
      m("f3d4", "Cxd4", "O cavalo recaptura e fica bem centralizado."),
      m("g8f6", "Cf6", "Desenvolve e ataca o peão de e4."),
      m("b1c3", "Cc3", "As brancas defendem e4."),
      m("a7a6", "a6", "Variante Najdorf: impede peças brancas em b5 e prepara b5. Uma das linhas mais jogadas por grandes mestres."),
    ],
  },
  {
    tab: "Caro-Kann",
    side: ["b", "Pretas"],
    title: "Defesa Caro-Kann",
    start: "start",
    flip: true,
    intro: "Uma defesa sólida e segura contra 1.e4. Ideal para quem gosta de posições firmes, sem muitos riscos.",
    moves: [
      m("e2e4", "e4", "As brancas começam pelo peão do rei."),
      m("c7c6", "c6", "A Caro-Kann: o peão de c6 vai apoiar o avanço d5."),
      m("d2d4", "d4", "As brancas montam o centro ideal com dois peões."),
      m("d7d5", "d5", "As pretas desafiam o peão de e4."),
      m("b1c3", "Cc3", "O cavalo defende e4."),
      m("d5e4", "dxe4", "As pretas trocam no centro."),
      m("c3e4", "Cxe4", "O cavalo recaptura."),
      m("c8f5", "Bf5", "A grande vantagem da Caro-Kann: o bispo de c8 sai <em>antes</em> de o peão ir para e6 e fechar o caminho dele."),
      m("e4g3", "Cg3", "O cavalo ataca o bispo."),
      m("f5g6", "Bg6", "O bispo recua e continua ativo. O plano das pretas: e6, Cf6 e roque, com uma posição muito sólida."),
    ],
  },
];

const TACTICS = [
  {
    tab: "Garfo",
    side: ["n", "Tática"],
    title: "Garfo: duas peças atacadas de uma vez",
    start: { g1: "wK", b5: "wN", f2: "wP", g2: "wP", h2: "wP", e8: "bK", a8: "bR", f7: "bP", g7: "bP", h7: "bP" },
    intro: "O cavalo branco prepara um golpe. Repare no rei em e8 e na torre em a8: um cavalo em c7 atacaria os dois.",
    moves: [
      m("b5c7", "Cc7+", "<strong>Garfo!</strong> O cavalo dá xeque no rei e, ao mesmo tempo, ataca a torre de a8. As pretas só conseguem salvar um: o rei.", { check: "e8" }),
      m("e8e7", "Re7", "O rei sai do xeque..."),
      m("c7a8", "Cxa8", "...e o cavalo captura a torre. As brancas ganharam 5 pontos de graça."),
    ],
  },
  {
    tab: "Cravada",
    side: ["n", "Tática"],
    title: "Cravada: a peça que não pode sair",
    start: { g1: "wK", f1: "wB", d4: "wP", f2: "wP", g2: "wP", h2: "wP", e8: "bK", c6: "bN", a7: "bP", g7: "bP", h7: "bP" },
    intro: "O cavalo preto em c6 está na mesma diagonal que o rei em e8. O bispo branco vai aproveitar isso.",
    moves: [
      m("f1b5", "Bb5", "<strong>Cravada!</strong> O bispo ataca o cavalo, e atrás dele está o rei. O cavalo não pode sair: deixaria o rei em xeque, e isso é proibido."),
      m("h7h6", "h6", "As pretas não percebem o perigo."),
      m("d4d5", "d5", "Agora o peão ataca o cavalo cravado. Ele não tem como fugir!"),
      m("g7g5", "g5", "Não existe jeito de salvar o cavalo."),
      m("d5c6", "dxc6", "O peão captura o cavalo. A cravada ganhou uma peça inteira."),
    ],
  },
  {
    tab: "Espeto",
    side: ["n", "Tática"],
    title: "Espeto: ataque em fila",
    start: { g1: "wK", a1: "wR", f2: "wP", g2: "wP", h2: "wP", c7: "bK", h7: "bQ", f5: "bP", g6: "bP" },
    intro: "O rei e a dama pretos estão na mesma fileira (a 7ª). A torre branca vai atacar os dois em fila.",
    moves: [
      m("a1a7", "Ta7+", "<strong>Espeto!</strong> A torre dá xeque no rei pela 7ª fileira. Atrás dele, na mesma linha, está a dama.", { check: "c7" }),
      m("c7d6", "Rd6", "O rei é obrigado a sair da linha..."),
      m("a7h7", "Txh7", "...e a torre captura a dama que estava atrás. É como um garfo em fila: ataca a peça da frente para pegar a de trás."),
    ],
  },
  {
    tab: "Ataque descoberto",
    side: ["n", "Tática"],
    title: "Ataque (xeque) descoberto",
    start: {
      g1: "wK", e1: "wR", e5: "wN", f2: "wP", g2: "wP", h2: "wP",
      e8: "bK", d8: "bQ", a7: "bP", b7: "bP", f7: "bP", g7: "bP", h7: "bP",
    },
    intro: "A torre branca em e1 mira o rei preto, mas o cavalo em e5 está no caminho. E se o cavalo sair... atacando alguém?",
    moves: [
      m("e5c6", "Cc6+", "<strong>Xeque descoberto!</strong> O cavalo sai da frente e a torre de e1 agora dá xeque no rei. Ao mesmo tempo, o cavalo ataca a dama em d8.", { check: "e8" }),
      m("e8f8", "Rf8", "As pretas precisam cuidar do xeque primeiro..."),
      m("c6d8", "Cxd8", "...e o cavalo captura a dama. Um lance só, dois ataques!"),
    ],
  },
];

/** Peças que se mexem num lance (no roque, o rei e a torre; no en passant, o peão que some). */
function moveAnims(mv) {
  const anims = [{ from: mv.from, to: mv.to }];
  if (mv.rook) anims.push({ from: mv.rook[0], to: mv.rook[1] });
  if (mv.remove) anims.push({ fade: mv.remove });
  return anims;
}

function applyMove(pos, mv) {
  const next = { ...pos };
  next[mv.to] = next[mv.from];
  delete next[mv.from];
  if (mv.rook) {
    const [rf, rt] = mv.rook;
    next[rt] = next[rf];
    delete next[rf];
  }
  if (mv.remove) delete next[mv.remove];
  if (mv.promote) next[mv.to] = next[mv.to][0] + mv.promote;
  return next;
}

function createPlayer(root, lines) {
  root.innerHTML = `
    <div class="tabs" role="tablist"></div>
    <div class="player-body">
      <div class="board-wrap"><div class="board"></div></div>
      <article class="panel">
        <span class="side-tag"></span>
        <h3></h3>
        <ol class="movelist" aria-label="Lances"></ol>
        <p class="note" aria-live="polite"></p>
        <div class="controls">
          <button type="button" class="ctrl" data-act="first" aria-label="Início">⏮</button>
          <button type="button" class="ctrl" data-act="prev" aria-label="Lance anterior">◀</button>
          <button type="button" class="ctrl play" data-act="play">▶ Assistir</button>
          <button type="button" class="ctrl" data-act="next" aria-label="Próximo lance">▶</button>
          <button type="button" class="ctrl" data-act="last" aria-label="Fim">⏭</button>
        </div>
      </article>
    </div>`;

  const tabs = root.querySelector(".tabs");
  const boardEl = root.querySelector(".board");
  const tag = root.querySelector(".side-tag");
  const title = root.querySelector("h3");
  const list = root.querySelector(".movelist");
  const note = root.querySelector(".note");
  const btn = (act) => root.querySelector(`[data-act="${act}"]`);

  let line;
  let board;
  let positions = [];
  let i = 0;
  let timer = null;
  let renderToken = 0;

  lines.forEach((l, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab";
    b.setAttribute("role", "tab");
    b.innerHTML = `${l.tab} <small>${l.side[1]}</small>`;
    b.addEventListener("click", () => load(idx));
    tabs.appendChild(b);
  });

  function load(idx) {
    stop();
    line = lines[idx];
    tabs.querySelectorAll(".tab").forEach((t, k) => t.setAttribute("aria-selected", String(k === idx)));
    board = createBoard(boardEl, { flip: !!line.flip });
    boardEl.setAttribute("aria-label", `Tabuleiro: ${line.title}`);

    positions = [line.start === "start" ? startPosition() : { ...line.start }];
    line.moves.forEach((mv) => positions.push(applyMove(positions[positions.length - 1], mv)));

    tag.className = `side-tag ${line.side[0]}`;
    tag.textContent = line.side[1];
    title.textContent = line.title;
    buildList();
    i = 0;
    go(0);
  }

  function buildList() {
    list.innerHTML = "";
    const blackFirst = line.numberFrom === "b";
    line.moves.forEach((mv, k) => {
      const ply = k + (blackFirst ? 1 : 0);
      const li = document.createElement("li");
      if (ply % 2 === 0) li.innerHTML = `<span class="num">${ply / 2 + 1}.</span>`;
      else if (k === 0) li.innerHTML = `<span class="num">${(ply + 1) / 2}...</span>`;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mv";
      b.textContent = mv.san;
      b.addEventListener("click", () => { stop(); go(k + 1); });
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  function go(n) {
    const prev = i;
    i = Math.max(0, Math.min(n, line.moves.length));
    const marks = {};
    const mv = line.moves[i - 1];
    if (mv) {
      mark(marks, mv.from, "last");
      mark(marks, mv.to, "last");
      if (mv.check) mark(marks, mv.check, "check");
    }

    // Só anima quando anda exatamente um lance (para frente ou para trás).
    const token = ++renderToken;
    let anims = [];
    if (i === prev + 1) {
      anims = moveAnims(mv);
      const captured = Boolean(positions[prev][mv.to] || mv.remove);
      playOnLanding(captured ? "capture" : "move", { check: Boolean(mv.check) });
    } else if (i === prev - 1) {
      const undone = line.moves[prev - 1];
      anims = moveAnims(undone)
        .filter((a) => a.from)
        .map(({ from, to }) => ({ from: to, to: from }));
      playOnLanding("move");
    }

    if (anims.length && mv?.promote && i === prev + 1) {
      // Promoção: primeiro o peão chega na última fileira, depois vira a peça nova.
      const arriving = { ...positions[i], [mv.to]: positions[prev][mv.from] };
      board.render(arriving, marks, anims);
      setTimeout(() => {
        if (token !== renderToken) return;
        board.render(positions[i], marks);
        board.pop(mv.to);
      }, REDUCED_MOTION.matches ? 0 : MOVE_MS + 150);
    } else {
      board.render(positions[i], marks, anims);
    }
    note.innerHTML = mv ? mv.note : line.intro;
    list.querySelectorAll(".mv").forEach((b, k) => b.classList.toggle("active", k === i - 1));
    const atEnd = i === line.moves.length;
    btn("first").disabled = btn("prev").disabled = i === 0;
    btn("next").disabled = btn("last").disabled = atEnd;
    if (atEnd) stop();
  }

  function play() {
    if (i === line.moves.length) go(0);
    btn("play").textContent = "❚❚ Pausar";
    timer = setInterval(() => go(i + 1), 1800);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    btn("play").textContent = "▶ Assistir";
  }

  root.querySelector(".controls").addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "play") return timer ? stop() : play();
    stop();
    if (act === "first") go(0);
    if (act === "prev") go(i - 1);
    if (act === "next") go(i + 1);
    if (act === "last") go(line.moves.length);
  });

  load(0);
}

/* ============================================================
   Topo: a Abertura Italiana se jogando sozinha, sem som
   ============================================================ */

function initHero() {
  const el = document.getElementById("hero-board");
  const label = document.getElementById("hero-move");
  const board = createBoard(el);
  const line = OPENINGS[0];
  const positions = [startPosition()];
  line.moves.forEach((mv) => positions.push(applyMove(positions[positions.length - 1], mv)));

  let i = 0;
  let visible = true;
  const show = (anims = []) => {
    const mv = line.moves[i - 1];
    const marks = {};
    if (mv) {
      mark(marks, mv.from, "last");
      mark(marks, mv.to, "last");
      const num = Math.floor((i - 1) / 2) + 1;
      label.textContent = (i - 1) % 2 === 0 ? `${num}. ${mv.san}` : `${num}... ${mv.san}`;
    } else {
      label.textContent = "posição inicial";
    }
    board.render(positions[i], marks, anims);
  };
  show();
  if (REDUCED_MOTION.matches) return;

  // Só anima quando o topo está visível e a aba está aberta.
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(el);
  const tick = () => {
    if (visible && !document.hidden) {
      if (i < line.moves.length) {
        i++;
        show(moveAnims(line.moves[i - 1]));
      } else {
        i = 0;
        el.classList.add("fading");
        setTimeout(() => { show(); el.classList.remove("fading"); }, 350);
      }
    }
    setTimeout(tick, i === line.moves.length ? 3200 : 1500);
  };
  setTimeout(tick, 1400);
}

/* ============================================================
   Lição 1: treino de coordenadas
   ============================================================ */

function initCoordTrainer() {
  const el = document.getElementById("coord-board");
  const $ = (id) => document.getElementById(id);
  let hits = 0;
  let streak = 0;
  let best = 0;
  try { best = Number(localStorage.getItem("xadrez-coord-recorde")) || 0; } catch { /* ignora */ }
  let target = "";

  const board = createBoard(el, { onClick });
  board.render(startPosition());

  const flash = (s, cls) => {
    const cell = el.querySelector(`[data-sq="${s}"]`);
    cell.classList.remove("good", "bad");
    void cell.offsetWidth; // reinicia a animação
    cell.classList.add(cls);
    setTimeout(() => cell.classList.remove(cls), 700);
  };

  function next() {
    let s;
    do s = sq(Math.floor(Math.random() * 8), Math.floor(Math.random() * 8)); while (s === target);
    target = s;
    const t = $("coord-target");
    t.textContent = s;
    t.classList.remove("pop");
    void t.offsetWidth;
    t.classList.add("pop");
  }

  function paint() {
    $("coord-hits").textContent = hits;
    $("coord-streak").textContent = streak;
    $("coord-best").textContent = best;
  }

  function onClick(s) {
    const fb = $("coord-feedback");
    if (s === target) {
      hits++;
      streak++;
      if (streak > best) {
        best = streak;
        try { localStorage.setItem("xadrez-coord-recorde", String(best)); } catch { /* ignora */ }
      }
      flash(s, "good");
      Sound.play("move");
      fb.textContent = streak >= 5 && streak % 5 === 0 ? `🔥 ${streak} seguidas!` : "✓ Isso mesmo!";
      fb.className = "coord-feedback ok";
      next();
    } else {
      streak = 0;
      flash(s, "bad");
      fb.textContent = `Essa é a casa ${s}. Procure a ${target}!`;
      fb.className = "coord-feedback no";
    }
    paint();
  }

  $("coord-labels").addEventListener("change", (e) => el.classList.toggle("no-coords", !e.target.checked));
  next();
  paint();
}

/* ============================================================
   Efeitos ao rolar a página
   ============================================================ */

/** Os blocos aparecem suavemente quando entram na tela. */
function initReveal() {
  if (REDUCED_MOTION.matches || !("IntersectionObserver" in window)) return;
  const groups = [".section-head", ".lesson", ".player", ".escape", ".notation", ".note-box", ".tips", ".facts-title", ".cta-inner"];
  const staggered = [".rules", ".values", ".end-grid", ".facts"];
  const items = [];
  document.querySelectorAll(groups.join(",")).forEach((e) => items.push(e));
  document.querySelectorAll(staggered.join(",")).forEach((parent) => {
    [...parent.children].forEach((child, k) => {
      child.style.setProperty("--delay", `${k * 90}ms`);
      items.push(child);
    });
  });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });
  items.forEach((e) => {
    e.classList.add("reveal");
    io.observe(e);
  });
}

/** Barra de progresso, menu marcando a seção atual e botão de voltar ao topo. */
function initScrollEffects() {
  const bar = document.getElementById("progress-bar");
  const toTop = document.getElementById("to-top");
  const links = [...document.querySelectorAll('.topbar nav a[href^="#"]')];

  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    toTop.hidden = scrollY < 900;
  };
  addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();

  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: REDUCED_MOTION.matches ? "auto" : "smooth" }));

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main > section[id]").forEach((s) => spy.observe(s));
  }
}

/* ============================================================
   Início
   ============================================================ */


initSoundToggle();
initHero();
initCoordTrainer();
initExplorer();
initValues();
createPlayer(document.getElementById("special-player"), SPECIALS);
createPlayer(document.getElementById("mate-player"), MATES);
createPlayer(document.getElementById("tactic-player"), TACTICS);
createPlayer(document.getElementById("opening-player"), OPENINGS);
initReveal();
initScrollEffects();
