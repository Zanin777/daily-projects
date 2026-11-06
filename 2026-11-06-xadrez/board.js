"use strict";

/* Código compartilhado entre o site (index.html) e a página de jogo (jogar.html):
   tabuleiro, animações, sons e utilidades. */

/* ============================================================
   Base: casas, peças e tabuleiro
   ============================================================ */

const FILES = "abcdefgh";
const GLYPH = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" };
const NOME = { K: "rei", Q: "dama", R: "torre", B: "bispo", N: "cavalo", P: "peão" };
const COR = { w: "branco", b: "preto" };
const TEXT_STYLE = "︎"; // força o símbolo em modo texto (sem emoji)

const sq = (f, r) => FILES[f] + (r + 1);
const fr = (s) => [FILES.indexOf(s[0]), Number(s[1]) - 1];
const inBoard = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;
const glyph = (type) => GLYPH[type] + TEXT_STYLE;

function startPosition() {
  const pos = {};
  const back = "RNBQKBNR";
  for (let f = 0; f < 8; f++) {
    pos[sq(f, 0)] = "w" + back[f];
    pos[sq(f, 1)] = "wP";
    pos[sq(f, 6)] = "bP";
    pos[sq(f, 7)] = "b" + back[f];
  }
  return pos;
}

function createBoard(el, { flip = false, onClick } = {}) {
  el.innerHTML = "";
  el.classList.add("board");
  if (onClick) el.setAttribute("role", "grid");
  const cells = {};
  let closeMenu = null;
  const ranks = flip ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const files = flip ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  ranks.forEach((r, ri) => {
    files.forEach((f, fi) => {
      const s = sq(f, r);
      const cell = document.createElement(onClick ? "button" : "div");
      if (onClick) {
        cell.type = "button";
        cell.addEventListener("click", () => onClick(s));
      }
      cell.className = `sq ${(f + r) % 2 ? "light" : "dark"}`;
      cell.dataset.sq = s;
      if (fi === 0) addCoord(cell, "rank", r + 1);
      if (ri === 7) addCoord(cell, "file", FILES[f]);
      el.appendChild(cell);
      cells[s] = cell;
    });
  });

  return {
    /**
     * Desenha a posição. `anims` aceita dois tipos de item:
     *  - { from, to }: a peça que termina em `to` desliza a partir de `from`
     *    (e uma peça que estava em `to` some aos poucos);
     *  - { fade }: a peça dessa casa some aos poucos (ex.: en passant).
     */
    render(pos, marks = {}, anims = []) {
      const animate = anims.length > 0 && !REDUCED_MOTION.matches;
      const slides = anims.filter((a) => a.from);
      const fromRects = animate ? slides.map((a) => cells[a.from].getBoundingClientRect()) : [];
      if (animate) anims.forEach((a) => fadeOutCaptured(cells[a.fade || a.to]));

      for (const [s, cell] of Object.entries(cells)) {
        cell.classList.remove("move", "capture", "danger", "last", "check", "selected", "hint");
        (marks[s] || []).forEach((c) => cell.classList.add(c));

        const p = pos[s];
        let pc = cell.querySelector(".pc:not(.ghost)");
        if (!p) {
          pc?.remove();
          cell.setAttribute("aria-label", s);
          continue;
        }
        if (!pc) {
          pc = document.createElement("span");
          cell.appendChild(pc);
        }
        pc.className = `pc ${p[0]}`;
        pc.textContent = glyph(p[1]);
        const cor = "QR".includes(p[1]) ? COR[p[0]].slice(0, -1) + "a" : COR[p[0]];
        cell.setAttribute("aria-label", `${NOME[p[1]]} ${cor} em ${s}`);
      }

      if (animate) {
        slides.forEach((a, k) => slideIn(cells[a.to], fromRects[k]));
      }
    },

    /**
     * Abre o menu de promoção sobre a casa `s` (como nos sites de xadrez:
     * uma coluna com dama, cavalo, torre e bispo). Resolve com o tipo escolhido
     * ("Q", "N", "R", "B") ou null se a pessoa cancelar.
     */
    choosePromotion(s, color) {
      this.cancelMenu();
      return new Promise((resolve) => {
        const cell = cells[s];
        const pct = (v, total) => `${(v / total) * 100}%`;
        const growsDown = cell.offsetTop < el.clientHeight / 2;

        const backdrop = document.createElement("div");
        backdrop.className = "promo-backdrop";

        const menu = document.createElement("div");
        menu.className = `promo-menu ${growsDown ? "down" : "up"}`;
        menu.setAttribute("role", "dialog");
        menu.setAttribute("aria-label", "Escolha a peça da promoção");
        menu.style.left = pct(cell.offsetLeft, el.clientWidth);
        if (growsDown) menu.style.top = pct(cell.offsetTop, el.clientHeight);
        else menu.style.bottom = pct(el.clientHeight - cell.offsetTop - cell.offsetHeight, el.clientHeight);

        const options = ["Q", "N", "R", "B"].map((type) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "promo-opt";
          b.title = capitalize(NOME[type]);
          b.setAttribute("aria-label", `Promover para ${NOME[type]}`);
          b.innerHTML = `<span class="pc ${color}">${glyph(type)}</span>`;
          b.addEventListener("click", () => finish(type));
          return b;
        });
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "promo-cancel";
        cancel.setAttribute("aria-label", "Cancelar promoção");
        cancel.textContent = "✕";
        cancel.addEventListener("click", () => finish(null));
        if (growsDown) menu.append(...options, cancel);
        else menu.append(cancel, ...options.reverse());

        const onKey = (e) => {
          if (e.key === "Escape") finish(null);
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            const items = [...menu.querySelectorAll("button")];
            const k = items.indexOf(document.activeElement);
            items[(k + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
            e.preventDefault();
          }
        };
        backdrop.addEventListener("click", () => finish(null));
        document.addEventListener("keydown", onKey);

        function finish(type) {
          backdrop.remove();
          menu.remove();
          document.removeEventListener("keydown", onKey);
          closeMenu = null;
          resolve(type);
        }
        closeMenu = () => finish(null);

        el.append(backdrop, menu);
        options[0].focus({ preventScroll: true });
      });
    },

    /** Fecha o menu de promoção, se estiver aberto (conta como cancelar). */
    cancelMenu() {
      closeMenu?.();
    },

    /** Efeito de "transformação" na peça da casa (promoção). */
    pop(s) {
      const pc = cells[s].querySelector(".pc:not(.ghost)");
      if (!pc || REDUCED_MOTION.matches) return;
      pc.animate(
        [
          { transform: "scale(.6)", filter: "drop-shadow(0 0 0 gold)" },
          { transform: "scale(1.25)", filter: "drop-shadow(0 0 1.5cqw gold)", offset: 0.6 },
          { transform: "scale(1)", filter: "drop-shadow(0 0 0 gold)" },
        ],
        { duration: 420, easing: "ease-out" },
      );
    },
  };
}

const MOVE_MS = 220;
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Faz a peça da casa `cell` deslizar a partir do retângulo `fromRect`. */
function slideIn(cell, fromRect) {
  const pc = cell.querySelector(".pc:not(.ghost)");
  if (!pc) return;
  const to = cell.getBoundingClientRect();
  const dx = fromRect.left - to.left;
  const dy = fromRect.top - to.top;
  pc.classList.add("moving");
  const anim = pc.animate(
    [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
    { duration: MOVE_MS, easing: "cubic-bezier(.25, .8, .3, 1)" },
  );
  const done = () => pc.classList.remove("moving");
  anim.onfinish = done;
  anim.oncancel = done;
}

/** Se houver uma peça na casa, deixa uma cópia dela sumindo (peça capturada). */
function fadeOutCaptured(cell) {
  const old = cell.querySelector(".pc:not(.ghost)");
  if (!old) return;
  const ghost = old.cloneNode(true);
  ghost.classList.add("ghost");
  cell.appendChild(ghost);
  const anim = ghost.animate(
    [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.85)" }],
    { duration: MOVE_MS, easing: "ease-in" },
  );
  anim.onfinish = () => ghost.remove();
  anim.oncancel = () => ghost.remove();
}

/* ============================================================
   Sons
   ============================================================ */

/**
 * Quer usar seus próprios arquivos de som? Coloque-os na pasta "sons/"
 * e escreva o caminho aqui (ex.: move: "sons/lance.mp3").
 * Deixe vazio ("") para usar o som gerado pelo navegador.
 * Atenção: use só sons que você tem direito de usar (seus ou de licença livre).
 */
const SOUND_FILES = {
  move: "",
  capture: "",
  check: "",
  promote: "",
  end: "",
};

const Sound = (() => {
  let ctx = null;
  let enabled = true;
  try {
    enabled = localStorage.getItem("xadrez-som") !== "off";
  } catch { /* sem localStorage: som fica ligado */ }

  const files = {};
  for (const [kind, src] of Object.entries(SOUND_FILES)) {
    if (src) {
      files[kind] = new Audio(src);
      files[kind].preload = "auto";
    }
  }

  const audio = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  /**
   * "Toc" de peça de madeira no tabuleiro (síntese modal):
   * um estalo curtíssimo de ruído (o contato) + algumas ressonâncias senoidais
   * que morrem rápido (o corpo oco da peça e do tabuleiro).
   */
  function tock(c, t, { pitch = 1, gain = 0.5, bright = 1 } = {}) {
    const out = c.createGain();
    out.gain.value = gain;
    const tone = c.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 4200 * bright;
    tone.connect(out).connect(c.destination);

    // Contato: 4 ms de ruído agudo.
    const len = Math.floor(c.sampleRate * 0.004);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let n = 0; n < len; n++) data[n] = (Math.random() * 2 - 1) * (1 - n / len) ** 2;
    const click = c.createBufferSource();
    click.buffer = buf;
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1800;
    const cg = c.createGain();
    cg.gain.value = 0.35 * bright;
    click.connect(hp).connect(cg).connect(tone);
    click.start(t);

    // Corpo: modos de vibração de um bloco de madeira [frequência, volume, duração].
    const modes = [[380, 1, 0.07], [960, 0.55, 0.045], [1870, 0.3, 0.03], [3150, 0.14, 0.018]];
    for (const [f, amp, dur] of modes) {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f * pitch * 1.02, t);
      o.frequency.exponentialRampToValueAtTime(f * pitch, t + 0.015);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.0015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 2.2);
      o.connect(g).connect(tone);
      o.start(t);
      o.stop(t + dur * 2.4);
    }
  }

  // Aviso de xeque: duas notas curtas.
  function ping(c, t) {
    [[880, 0], [1320, 0.09]].forEach(([f, dt]) => {
      const o = c.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.exponentialRampToValueAtTime(0.14, t + dt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.22);
      o.connect(g).connect(c.destination);
      o.start(t + dt);
      o.stop(t + dt + 0.25);
    });
  }

  // Promoção (notas subindo) e fim de partida (acorde mais grave).
  function chime(c, t, notes = [[660, 0], [880, 0.07], [1320, 0.14]]) {
    notes.forEach(([f, dt]) => {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.exponentialRampToValueAtTime(0.28, t + dt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.3);
      o.connect(g).connect(c.destination);
      o.start(t + dt);
      o.stop(t + dt + 0.32);
    });
  }

  function synth(kind, check) {
    const c = audio();
    if (!c) return;
    const t = c.currentTime + 0.005;
    if (kind === "capture") {
      // Peça batendo em peça: mais agudo e seco, com um segundo toque bem colado.
      tock(c, t, { pitch: 1.45, gain: 0.5, bright: 1.6 });
      tock(c, t + 0.018, { pitch: 1.05, gain: 0.36, bright: 1.2 });
    } else if (kind === "promote") {
      chime(c, t);
    } else if (kind === "end") {
      tock(c, t);
      chime(c, t + 0.12, [[392, 0], [523, 0.12], [659, 0.24], [784, 0.36]]);
    } else {
      tock(c, t);
    }
    if (check) ping(c, t + 0.06);
  }

  function playFile(kind) {
    const a = files[kind];
    if (!a) return false;
    const copy = a.cloneNode();
    copy.play().catch(() => {});
    return true;
  }

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem("xadrez-som", enabled ? "on" : "off"); } catch { /* ignora */ }
      return enabled;
    },
    /** kind: "move" | "capture" | "promote" | "end"; check: toca o aviso de xeque junto. */
    play(kind, { check = false } = {}) {
      if (!enabled) return;
      if (check && playFile("check")) return;
      if (playFile(kind)) return;
      synth(kind, check);
    },
  };
})();

/** Toca o som quando a peça "chega" na casa (fim do deslize). */
function playOnLanding(kind, opts) {
  const delay = REDUCED_MOTION.matches ? 0 : MOVE_MS - 40;
  setTimeout(() => Sound.play(kind, opts), delay);
}

function addCoord(cell, kind, text) {
  const span = document.createElement("span");
  span.className = `coord ${kind}`;
  span.textContent = text;
  span.setAttribute("aria-hidden", "true");
  cell.appendChild(span);
}

function mark(marks, s, cls) {
  (marks[s] ||= []).push(cls);
}


const capitalize = (t) => t[0].toUpperCase() + t.slice(1);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Botão de ligar/desligar o som no topo da página. */
function initSoundToggle() {
  const btn = document.getElementById("sound-toggle");
  const paint = () => {
    btn.setAttribute("aria-pressed", String(Sound.enabled));
    btn.innerHTML = `<span aria-hidden="true">${Sound.enabled ? "🔊" : "🔇"}</span> Som`;
    btn.title = Sound.enabled ? "Desligar o som" : "Ligar o som";
  };
  btn.addEventListener("click", () => {
    Sound.toggle();
    paint();
    Sound.play("move");
  });
  paint();
}
