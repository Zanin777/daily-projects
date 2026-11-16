"use strict";

const $ = (id) => document.getElementById(id);
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const BLACK = new Set([1, 3, 6, 8, 10]);
const state = { labels: "solfege" };
const label = (pc) => (state.labels === "none" ? "" : pcName(pc, state.labels));
const both = (n) => `${noteName(n, "solfege")} (${noteName(n, "letter")})`;
const renders = []; // funções que redesenham tudo quando o estilo dos nomes muda

/* ============================================================
   Componente: piano
   ============================================================ */

function createPiano(el, { start, end, onDown, onUp }) {
  el.innerHTML = "";
  const keys = new Map();
  const whites = [];
  for (let m = start; m <= end; m++) if (!BLACK.has(pcOf(m))) whites.push(m);
  const w = 100 / whites.length;

  for (let m = start; m <= end; m++) {
    const black = BLACK.has(pcOf(m));
    const k = document.createElement("button");
    k.type = "button";
    k.className = `key ${black ? "black" : "white"}`;
    k.dataset.midi = m;
    k.setAttribute("aria-label", midiName(m, "solfege"));
    if (black) {
      const idx = whites.filter((x) => x < m).length;
      k.style.left = `calc(${idx * w}% - ${w * 0.31}%)`;
      k.style.width = `${w * 0.62}%`;
    }
    k.innerHTML = '<span class="kb"></span><span class="lbl"></span>';
    el.appendChild(k);
    keys.set(m, k);
  }

  let current = null;
  let down = false;
  const press = (k) => {
    if (!k || k === current) return;
    release();
    current = k;
    k.classList.add("on");
    onDown?.(Number(k.dataset.midi), k);
  };
  const release = () => {
    if (!current) return;
    current.classList.remove("on");
    onUp?.(Number(current.dataset.midi));
    current = null;
  };
  el.addEventListener("pointerdown", (e) => {
    const k = e.target.closest(".key");
    if (!k) return;
    e.preventDefault();
    down = true;
    press(k);
  });
  // Arrastar o dedo/mouse pelas teclas faz glissando.
  el.addEventListener("pointermove", (e) => {
    if (!down) return;
    const k = document.elementFromPoint(e.clientX, e.clientY)?.closest(".key");
    if (k && el.contains(k)) press(k);
  });
  window.addEventListener("pointerup", () => { down = false; release(); });
  window.addEventListener("pointercancel", () => { down = false; release(); });
  // Teclado: Enter/Espaço numa tecla focada também toca.
  el.addEventListener("keydown", (e) => {
    const k = e.target.closest(".key");
    if (k && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onDown?.(Number(k.dataset.midi), k);
      k.classList.add("on");
      setTimeout(() => { k.classList.remove("on"); onUp?.(Number(k.dataset.midi)); }, 250);
    }
  });

  return {
    keys,
    /** marks: Map(midi → { cls: "hl" | "root", deg }) */
    paint(marks = new Map()) {
      for (const [m, k] of keys) {
        const mk = marks.get(m);
        k.classList.toggle("hl", mk?.cls === "hl");
        k.classList.toggle("root", mk?.cls === "root");
        k.querySelector(".lbl").textContent = label(pcOf(m));
        let deg = k.querySelector(".deg");
        if (mk?.deg) {
          if (!deg) { deg = document.createElement("span"); deg.className = "deg"; k.appendChild(deg); }
          deg.textContent = mk.deg;
        } else deg?.remove();
      }
    },
    flash(m, ms = 300) {
      const k = keys.get(m);
      if (!k) return;
      k.classList.add("on");
      setTimeout(() => k.classList.remove("on"), ms);
    },
    kbLabels(map) {
      for (const [m, k] of keys) k.querySelector(".kb").textContent = map.get(m) || "";
    },
  };
}

function flyNote(target) {
  if (REDUCED.matches) return;
  const r = target.getBoundingClientRect();
  const n = document.createElement("span");
  n.className = "note-fly";
  n.textContent = ["♪", "♫", "♩", "♬"][Math.floor(Math.random() * 4)];
  n.style.left = `${r.left + r.width / 2 - 8}px`;
  n.style.top = `${r.top + 10}px`;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 1000);
}

/* ============================================================
   Componente: braço do violão
   ============================================================ */

function createFretboard(el, { onPress }) {
  el.innerHTML = "";
  const cells = [];
  STRINGS.forEach((s, si) => {
    const head = document.createElement("div");
    head.className = "fb-head";
    head.textContent = s.name;
    head.style.gridRow = si + 1;
    el.appendChild(head);
    cells.push([]);
    for (let f = 0; f <= 12; f++) {
      const c = document.createElement("button");
      c.type = "button";
      c.className = `fb-cell${f === 0 ? " open" : ""}`;
      c.style.gridRow = si + 1;
      c.style.gridColumn = f + 2;
      c.style.setProperty("--sw", `${1.1 + si * 0.45}px`);
      c.dataset.s = si;
      c.dataset.f = f;
      c.setAttribute("aria-label", `${s.name}, ${f === 0 ? "solta" : `casa ${f}`}: ${midiName(s.midi + f, "solfege")}`);
      el.appendChild(c);
      cells[si].push(c);
    }
  });
  const spacer = document.createElement("div");
  spacer.className = "fb-num";
  spacer.style.gridColumn = 1;
  el.appendChild(spacer);
  for (let f = 0; f <= 12; f++) {
    const n = document.createElement("div");
    n.className = `fb-num${[3, 5, 7, 9, 12].includes(f) ? " inlay" : ""}`;
    n.style.gridColumn = f + 2;
    n.textContent = f === 0 ? "solta" : [3, 5, 7, 9].includes(f) ? `${f} •` : f === 12 ? "12 ••" : f;
    el.appendChild(n);
  }
  el.addEventListener("click", (e) => {
    const c = e.target.closest(".fb-cell");
    if (!c) return;
    onPress?.(Number(c.dataset.s), Number(c.dataset.f), c);
  });

  return {
    cells,
    /** list: [{ s, f, cls, text }] */
    mark(list) {
      el.querySelectorAll(".fb-dot").forEach((d) => d.remove());
      for (const { s, f, cls = "", text = "" } of list) {
        const d = document.createElement("span");
        d.className = `fb-dot ${cls}`;
        d.textContent = text;
        cells[s][f].appendChild(d);
      }
    },
    hit(s, f) {
      const c = cells[s][f];
      c.classList.remove("vib");
      void c.offsetWidth;
      c.classList.add("vib");
      const d = document.createElement("span");
      d.className = "fb-dot hit";
      d.textContent = label(pcOf(STRINGS[s].midi + f));
      c.appendChild(d);
      setTimeout(() => d.remove(), 650);
    },
  };
}

/* ============================================================
   Lição 1: piano livre
   ============================================================ */

const KEYMAP = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16 };
const KEY_LETTER = { KeyA: "A", KeyW: "W", KeyS: "S", KeyE: "E", KeyD: "D", KeyF: "F", KeyT: "T", KeyG: "G", KeyY: "Y", KeyH: "H", KeyU: "U", KeyJ: "J", KeyK: "K", KeyO: "O", KeyL: "L", KeyP: "P", Semicolon: "Ç" };
let octave = 4;
const held = new Map();

function showNow(midi) {
  const pc = pcOf(midi);
  const [letter, acc] = PC_NAMES[pc];
  const el = $("np-name");
  el.textContent = `${noteName({ letter, acc }, "solfege")}${octaveOf(midi)}`;
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
  // Tecla preta tem dois nomes: Dó♯ = Ré♭.
  const alt = acc ? ` = ${noteName({ letter: PC_NAMES[(pc + 1) % 12][0], acc: -1 }, "solfege")}` : "";
  $("np-sub").textContent = `${noteName({ letter, acc }, "letter")}${octaveOf(midi)}${alt} · ${freq(midi).toFixed(1).replace(".", ",")} Hz`;
}

let mainPiano;
function initNotes() {
  mainPiano = createPiano($("piano-main"), {
    start: 48,
    end: 83,
    onDown: (m, k) => {
      held.get(m)?.stop();
      held.set(m, Sound.piano(m));
      showNow(m);
      flyNote(k);
    },
    onUp: (m) => { held.get(m)?.stop(); held.delete(m); },
  });
  const paintKb = () => {
    const base = 12 * (octave + 1);
    const map = new Map(Object.entries(KEYMAP).map(([code, off]) => [base + off, KEY_LETTER[code]]));
    mainPiano.kbLabels(map);
    $("octave-label").textContent = octave;
  };
  renders.push(() => mainPiano.paint());
  paintKb();

  const typing = (e) => e.target.closest?.("input, textarea, select") || e.ctrlKey || e.metaKey || e.altKey;
  document.addEventListener("keydown", (e) => {
    if (typing(e) || e.repeat) return;
    if (e.code === "KeyZ" || e.code === "KeyX") {
      octave = Math.max(3, Math.min(5, octave + (e.code === "KeyX" ? 1 : -1)));
      paintKb();
      return;
    }
    if (!(e.code in KEYMAP)) return;
    const m = 12 * (octave + 1) + KEYMAP[e.code];
    held.get(m)?.stop();
    held.set(m, Sound.piano(m));
    const k = mainPiano.keys.get(m);
    k?.classList.add("on");
    showNow(m);
    if (k) flyNote(k);
  });
  document.addEventListener("keyup", (e) => {
    if (!(e.code in KEYMAP)) return;
    const m = 12 * (octave + 1) + KEYMAP[e.code];
    held.get(m)?.stop();
    held.delete(m);
    mainPiano.keys.get(m)?.classList.remove("on");
  });

  document.querySelectorAll("#label-style button").forEach((b) => b.addEventListener("click", () => {
    state.labels = b.dataset.style;
    document.querySelectorAll("#label-style button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    renders.forEach((r) => r());
  }));
}

/* ============================================================
   Seletores de tônica / tipo
   ============================================================ */

function chips(el, items, selected, onPick) {
  el.innerHTML = items.map((it, i) => `<button type="button" data-i="${i}" aria-pressed="${i === selected}">${it}</button>`).join("");
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    el.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    onPick(Number(b.dataset.i));
  });
  return (labels) => el.querySelectorAll("button").forEach((b, i) => { b.textContent = labels[i]; });
}
const rootLabels = () => ROOTS.map((r) => (state.labels === "letter" ? noteName(r, "letter") : noteName(r, "solfege")));

/* ============================================================
   Lição 2: escalas
   ============================================================ */

const scaleState = { root: 0, type: "major", token: 0 };
let scalePiano;

function renderScale() {
  const root = ROOTS[scaleState.root];
  const sc = SCALES[scaleState.type];
  const notes = spellSet(root, sc.steps);
  const base = 60 + rootPc(root);
  $("scale-title").textContent = `${noteName(root, "solfege")} ${sc.name.toLowerCase()} (${noteName(root, "letter")})`;
  $("scale-mood").textContent = `Som: ${sc.mood}.`;
  $("scale-notes").innerHTML = notes.map((n, i) =>
    `<div class="degree${i === 0 ? " root" : ""}" data-i="${i}"><b>${state.labels === "letter" ? noteName(n, "letter") : noteName(n, "solfege")}</b><small>${i + 1}º grau${state.labels !== "letter" ? ` · ${noteName(n, "letter")}` : ""}</small></div>`).join("");
  $("scale-formula").innerHTML = sc.steps.length === 7
    ? `Fórmula: <b>${formula(scaleState.type)}</b> (T = tom, S = semitom)`
    : `Tem ${sc.steps.length} notas. ${scaleState.type === "blues" ? "A nota extra é a \"blue note\", que dá o sabor do blues." : "É uma escala de 5 notas: quase não tem como errar num solo!"}`;
  const marks = new Map();
  const pcs = new Set(notes.map((n) => n.pc));
  for (let m = 60; m <= 83; m++) if (pcs.has(pcOf(m))) marks.set(m, { cls: pcOf(m) === rootPc(root) ? "root" : "hl" });
  sc.steps.forEach(([s], i) => { if (marks.has(base + s)) marks.get(base + s).deg = i + 1; });
  scalePiano.paint(marks);
}

function playScale() {
  const token = ++scaleState.token;
  const root = ROOTS[scaleState.root];
  const sc = SCALES[scaleState.type];
  const base = 60 + rootPc(root);
  const up = sc.steps.map(([s]) => base + s).concat(base + 12);
  const seq = up.concat(up.slice(0, -1).reverse());
  const btn = $("scale-play");
  btn.classList.add("playing");
  seq.forEach((m, k) => {
    setTimeout(() => {
      if (token !== scaleState.token) return;
      Sound.piano(m, { duration: 0.5, velocity: 0.75 });
      scalePiano.flash(m, 260);
      const idx = up.indexOf(m) === up.length - 1 ? 0 : up.indexOf(m);
      document.querySelectorAll("#scale-notes .degree").forEach((d, i) => d.classList.toggle("lit", i === idx));
      if (k === seq.length - 1) {
        setTimeout(() => {
          document.querySelectorAll("#scale-notes .degree").forEach((d) => d.classList.remove("lit"));
          btn.classList.remove("playing");
        }, 400);
      }
    }, k * 290);
  });
}

function initScales() {
  scalePiano = createPiano($("piano-scale"), {
    start: 60, end: 83,
    onDown: (m, k) => { Sound.piano(m, { duration: 0.6 }); flyNote(k); },
  });
  const setRoots = chips($("scale-root"), rootLabels(), 0, (i) => { scaleState.root = i; scaleState.token++; renderScale(); });
  chips($("scale-type"), Object.values(SCALES).map((s) => s.name), 0, (i) => { scaleState.type = Object.keys(SCALES)[i]; scaleState.token++; renderScale(); });
  $("scale-play").addEventListener("click", playScale);
  renders.push(() => { setRoots(rootLabels()); renderScale(); });
  renderScale();
}

/* ============================================================
   Lição 3: acordes, campo harmônico e progressões
   ============================================================ */

const chordState = { root: 0, type: "maj" };
let chordPiano;
let chordBoard;
const SHORT_INTERVAL = { 0: "1", 3: "3m", 4: "3", 5: "4", 6: "5dim", 7: "5", 8: "5aum", 10: "7", 11: "7M" };

function renderChord() {
  const root = ROOTS[chordState.root];
  const ch = CHORDS[chordState.type];
  const notes = spellSet(root, ch.steps);
  $("chord-symbol").textContent = chordSymbol(root, chordState.type, "letter");
  $("chord-name").textContent = `· ${noteName(root, "solfege")} ${ch.name.toLowerCase()}`;
  $("chord-feel").textContent = `Som: ${ch.feel}.`;
  $("chord-notes").innerHTML = notes.map((n, i) =>
    `<div class="degree${i === 0 ? " root" : ""}"><b>${state.labels === "letter" ? noteName(n, "letter") : noteName(n, "solfege")}</b><small>${INTERVAL_NAMES[n.semis]}</small></div>`).join("");

  const midis = chordMidis(root, chordState.type, 60);
  const marks = new Map();
  midis.forEach((m, i) => marks.set(m, { cls: i === 0 ? "root" : "hl", deg: SHORT_INTERVAL[ch.steps[i][0]] }));
  chordPiano.paint(marks);

  const pcs = new Map(notes.map((n) => [n.pc, n]));
  const list = [];
  STRINGS.forEach((s, si) => {
    for (let f = 0; f <= 12; f++) {
      const n = pcs.get(pcOf(s.midi + f));
      if (n) list.push({ s: si, f, cls: n.pc === rootPc(root) ? "root" : "", text: state.labels === "none" ? "" : noteName(n, state.labels) });
    }
  });
  chordBoard.mark(list);
  renderField();
}

function playChordPiano(root, type, when = 0, dur = 1.6) {
  const midis = chordMidis(root, type, 60);
  Sound.piano(midis[0] - 12, { when, duration: dur, velocity: 0.7 });
  midis.forEach((m, i) => Sound.piano(m, { when: when + i * 0.03, duration: dur, velocity: 0.6 }));
  return midis;
}

/** Notas para tocar um acorde no violão: usa o desenho aberto se existir. */
function guitarVoicing(root, type) {
  const open = OPEN_CHORDS.find((c) => c.type === type && rootPc(c.root) === rootPc(root));
  if (open) return shapeMidis(open.frets);
  const m = chordMidis(root, type, 48);
  return [m[0] - 12, ...m, m[0] + 12].filter((x) => x >= 40);
}

/* ----- Campo harmônico ----- */
const prog = { playing: null, timer: null };

function renderField() {
  const root = ROOTS[chordState.root];
  const field = harmonicField(root);
  $("field-key").textContent = `${noteName(root, "solfege")} maior`;
  $("field").innerHTML = field.map((f, i) =>
    `<button type="button" data-i="${i}"><b>${chordSymbol(f.root, f.type, "letter")}</b><small>${f.roman} · ${state.labels === "letter" ? noteName(f.root, "letter") : noteName(f.root, "solfege")} ${CHORDS[f.type].name.toLowerCase()}</small></button>`).join("");
}

function lightField(i) {
  document.querySelectorAll("#field button").forEach((b, k) => b.classList.toggle("lit", k === i));
}

function stopProgression() {
  clearInterval(prog.timer);
  prog.timer = null;
  prog.playing = null;
  document.querySelectorAll("#prog-list button").forEach((b) => b.setAttribute("aria-pressed", "false"));
  lightField(-1);
}

function startProgression(p) {
  stopProgression();
  prog.playing = p;
  document.querySelectorAll("#prog-list button").forEach((b) => b.setAttribute("aria-pressed", String(PROGRESSIONS[Number(b.dataset.i)] === p)));
  $("prog-about").textContent = p.about;
  let k = 0;
  const step = () => {
    const field = harmonicField(ROOTS[chordState.root]);
    const deg = p.degrees[k % p.degrees.length];
    const f = field[deg];
    playChordPiano(f.root, f.type, 0, 1.5);
    // Um "pulso" de bateria leve para dar ritmo.
    const t = Sound.time;
    [0, 0.4, 0.8, 1.2].forEach((dt, j) => {
      Sound.drumAt(j % 2 ? "snare" : "kick", t + dt);
      Sound.drumAt("hat", t + dt + 0.2);
    });
    lightField(deg);
    k++;
  };
  step();
  prog.timer = setInterval(step, 1600);
}

function initChords() {
  chordPiano = createPiano($("piano-chord"), {
    start: 48, end: 83,
    onDown: (m, k) => { Sound.piano(m, { duration: 0.8 }); flyNote(k); },
  });
  chordBoard = createFretboard($("fret-chord"), {
    onPress: (s, f) => { Sound.guitar(STRINGS[s].midi + f); chordBoard.hit(s, f); },
  });
  const setRoots = chips($("chord-root"), rootLabels(), 0, (i) => { chordState.root = i; renderChord(); });
  chips($("chord-type"), Object.values(CHORDS).map((c) => c.name), 0, (i) => { chordState.type = Object.keys(CHORDS)[i]; renderChord(); });
  $("chord-play").addEventListener("click", () => {
    const midis = playChordPiano(ROOTS[chordState.root], chordState.type);
    midis.forEach((m) => chordPiano.flash(m, 700));
  });
  $("chord-strum").addEventListener("click", () => Sound.strum(guitarVoicing(ROOTS[chordState.root], chordState.type)));
  $("field").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const f = harmonicField(ROOTS[chordState.root])[Number(b.dataset.i)];
    playChordPiano(f.root, f.type);
    if (!prog.playing) {
      lightField(Number(b.dataset.i));
      setTimeout(() => { if (!prog.playing) lightField(-1); }, 700);
    }
  });
  $("prog-list").innerHTML = PROGRESSIONS.map((p, i) => `<button type="button" data-i="${i}" aria-pressed="false">▶ ${p.name}</button>`).join("");
  $("prog-list").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const p = PROGRESSIONS[Number(b.dataset.i)];
    if (prog.playing === p) {
      stopProgression();
      $("prog-about").textContent = "Escolha uma progressão famosa para ouvir em loop.";
    } else startProgression(p);
  });
  renders.push(() => { setRoots(rootLabels()); renderChord(); });
  renderChord();
}

/* ============================================================
   Lição 4: violão
   ============================================================ */

let mainBoard;
let openChord = null;

function renderGuitar() {
  if (!openChord) {
    mainBoard.mark([]);
    return;
  }
  const rootPcV = rootPc(openChord.root);
  const list = [];
  openChord.frets.split("").forEach((f, k) => {
    const s = 5 - k; // o desenho vem da 6ª para a 1ª corda
    if (f === "x") list.push({ s, f: 0, cls: "mark", text: "✕" });
    else {
      const midi = STRINGS[s].midi + Number(f);
      const name = label(pcOf(midi));
      list.push({ s, f: Number(f), cls: pcOf(midi) === rootPcV ? "root" : "", text: Number(f) === 0 ? `○${name ? " " + name : ""}` : name });
    }
  });
  mainBoard.mark(list);
}

function initGuitar() {
  mainBoard = createFretboard($("fret-main"), {
    onPress: (s, f) => {
      const midi = STRINGS[s].midi + f;
      Sound.guitar(midi);
      mainBoard.hit(s, f);
      $("gt-name").textContent = `${midiName(midi, "solfege")} · ${STRINGS[s].name} corda, ${f === 0 ? "solta" : `casa ${f}`}`;
      $("gt-sub").textContent = `${midiName(midi, "letter")} · ${freq(midi).toFixed(1).replace(".", ",")} Hz`;
    },
  });
  $("open-chords").innerHTML = OPEN_CHORDS.map((c, i) => `<button type="button" data-i="${i}" aria-pressed="false">${c.sym}</button>`).join("");
  $("open-chords").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    openChord = OPEN_CHORDS[Number(b.dataset.i)];
    document.querySelectorAll("#open-chords button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderGuitar();
    Sound.strum(shapeMidis(openChord.frets));
    const notes = spellSet(openChord.root, CHORDS[openChord.type].steps).map((n) => noteName(n, "solfege")).join(", ");
    $("gt-name").textContent = `${openChord.sym} · ${noteName(openChord.root, "solfege")} ${CHORDS[openChord.type].name.toLowerCase()}`;
    $("gt-sub").textContent = `Notas: ${notes}. Desenho (da 6ª para a 1ª corda): ${openChord.frets.toUpperCase().split("").join(" ")}`;
    // As cordas tocadas vibram em sequência, como uma batida de verdade.
    openChord.frets.split("").forEach((f, k) => {
      if (f !== "x") setTimeout(() => mainBoard.hit(5 - k, Number(f)), k * 22);
    });
    setTimeout(renderGuitar, 700);
  });
  renders.push(renderGuitar);
}

/* ============================================================
   Lição 5: bateria (sequenciador de 16 passos)
   ============================================================ */

const ROWS = [
  { id: "kick", name: "Bumbo", color: "#ff4fa3" },
  { id: "snare", name: "Caixa", color: "#8b5cff" },
  { id: "hat", name: "Chimbal", color: "#39d0ff" },
  { id: "openhat", name: "Chimbal aberto", color: "#2ee6c5" },
  { id: "clap", name: "Palmas", color: "#ffd166" },
];
const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14];
const PRESETS = [
  { name: "Rock", bpm: 100, about: "Rock: bumbo no 1 e no 3, caixa no 2 e no 4, chimbal em colcheias. A base de milhares de músicas.",
    p: { kick: [0, 8, 10], snare: [4, 12], hat: EIGHTHS } },
  { name: "Dance (4 no chão)", bpm: 124, about: "Dance/house: o bumbo bate nos 4 tempos (\"four on the floor\") e o chimbal aberto fica no contratempo.",
    p: { kick: [0, 4, 8, 12], clap: [4, 12], openhat: [2, 6, 10, 14] } },
  { name: "Hip-hop", bpm: 90, about: "Hip-hop (boom bap): mais lento, com o bumbo \"quebrado\" fora do tempo e a caixa marcando o 2 e o 4.",
    p: { kick: [0, 7, 10], snare: [4, 12], hat: EIGHTHS } },
  { name: "Reggae", bpm: 76, about: "Reggae \"one drop\": o bumbo e a caixa caem juntos só no 3º tempo, deixando o 1 vazio.",
    p: { kick: [8], snare: [8], hat: EIGHTHS } },
];

const seq = { grid: ROWS.map(() => Array(16).fill(false)), bpm: 100, playing: false, step: 0, next: 0, timer: null, queue: [], shown: -1 };

function renderSeq() {
  const el = $("sequencer");
  let html = '<span></span>';
  for (let s = 0; s < 16; s++) html += `<span class="seq-count${s % 4 === 0 ? " beat" : ""}">${s % 4 === 0 ? s / 4 + 1 : "·"}</span>`;
  ROWS.forEach((r, ri) => {
    html += `<button class="seq-label" type="button" data-row="${ri}" style="--c:${r.color}"><i></i>${r.name}</button>`;
    for (let s = 0; s < 16; s++) {
      html += `<button class="step${s % 4 === 0 ? " beat" : ""}" type="button" style="--c:${r.color}" data-row="${ri}" data-step="${s}" aria-pressed="${seq.grid[ri][s]}" aria-label="${r.name}, passo ${s + 1}"></button>`;
    }
  });
  el.innerHTML = html;
}

function schedule() {
  const c = Sound.ac();
  const stepDur = 60 / seq.bpm / 4;
  while (seq.next < c.currentTime + 0.12) {
    ROWS.forEach((r, ri) => { if (seq.grid[ri][seq.step]) Sound.drumAt(r.id, seq.next); });
    seq.queue.push({ step: seq.step, time: seq.next });
    seq.next += stepDur;
    seq.step = (seq.step + 1) % 16;
  }
}

function drawSeq() {
  if (!seq.playing) return;
  const now = Sound.time;
  while (seq.queue.length && seq.queue[0].time <= now) seq.shown = seq.queue.shift().step;
  document.querySelectorAll("#sequencer .step").forEach((b) => b.classList.toggle("now", Number(b.dataset.step) === seq.shown));
  requestAnimationFrame(drawSeq);
}

function setSeqPlaying(on) {
  const btn = $("seq-play");
  if (on) {
    const c = Sound.ac();
    if (!c) return;
    seq.playing = true;
    seq.step = 0;
    seq.queue = [];
    seq.next = c.currentTime + 0.06;
    seq.timer = setInterval(schedule, 25);
    schedule();
    requestAnimationFrame(drawSeq);
    btn.textContent = "■ Parar";
    btn.classList.add("playing");
  } else {
    seq.playing = false;
    clearInterval(seq.timer);
    document.querySelectorAll("#sequencer .step.now").forEach((b) => b.classList.remove("now"));
    btn.textContent = "▶ Tocar";
    btn.classList.remove("playing");
  }
}

function initSeq() {
  renderSeq();
  $("sequencer").addEventListener("click", (e) => {
    const lbl = e.target.closest(".seq-label");
    if (lbl) { Sound.drum(ROWS[Number(lbl.dataset.row)].id); return; }
    const b = e.target.closest(".step");
    if (!b) return;
    const r = Number(b.dataset.row);
    const s = Number(b.dataset.step);
    seq.grid[r][s] = !seq.grid[r][s];
    b.setAttribute("aria-pressed", String(seq.grid[r][s]));
    if (seq.grid[r][s] && !seq.playing) Sound.drum(ROWS[r].id);
  });
  $("seq-play").addEventListener("click", () => setSeqPlaying(!seq.playing));
  $("seq-clear").addEventListener("click", () => {
    seq.grid = ROWS.map(() => Array(16).fill(false));
    renderSeq();
    $("preset-about").textContent = "Grade limpa. Clique nos quadradinhos para criar o seu ritmo.";
  });
  $("bpm").addEventListener("input", (e) => { seq.bpm = Number(e.target.value); $("bpm-out").textContent = seq.bpm; });
  $("presets").innerHTML = PRESETS.map((p, i) => `<button type="button" data-i="${i}">${p.name}</button>`).join("");
  $("presets").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    loadPreset(PRESETS[Number(b.dataset.i)]);
    if (!seq.playing) setSeqPlaying(true);
  });
  loadPreset(PRESETS[0]);
}

function loadPreset(p) {
  seq.grid = ROWS.map((r) => Array.from({ length: 16 }, (_, s) => (p.p[r.id] || []).includes(s)));
  seq.bpm = p.bpm;
  $("bpm").value = p.bpm;
  $("bpm-out").textContent = p.bpm;
  $("preset-about").textContent = p.about;
  renderSeq();
}

/* ============================================================
   Lição 6: treino de ouvido
   ============================================================ */

const quiz = { mode: "interval", q: null, answered: false, hits: 0, total: 0, streak: 0, best: 0 };
try { quiz.best = Number(localStorage.getItem("musica-recorde")) || 0; } catch { /* ignora */ }
const NATURALS = [60, 62, 64, 65, 67, 69, 71];
const rand = (n) => Math.floor(Math.random() * n);

function makeQuestion() {
  if (quiz.mode === "interval") {
    const a = 55 + rand(18);
    const same = Math.random() < 0.15;
    let d = 0;
    while (!same && d === 0) d = rand(15) - 7;
    return { a, b: a + d, answer: d > 0 ? "up" : d < 0 ? "down" : "same" };
  }
  if (quiz.mode === "chord") {
    const root = ROOTS[rand(12)];
    return { root, type: Math.random() < 0.5 ? "maj" : "min", answer: null };
  }
  const m = NATURALS[rand(7)];
  return { m, answer: m };
}

function playQuestion() {
  const q = quiz.q;
  const btn = $("q-listen");
  btn.classList.remove("playing");
  void btn.offsetWidth;
  btn.classList.add("playing");
  if (quiz.mode === "interval") {
    Sound.piano(q.a, { duration: 0.55 });
    Sound.piano(q.b, { when: 0.7, duration: 0.8 });
  } else if (quiz.mode === "chord") {
    const midis = chordMidis(q.root, q.type, 57);
    midis.forEach((m, i) => Sound.piano(m, { when: i * 0.28, duration: 0.6 }));
    midis.forEach((m) => Sound.piano(m, { when: 1, duration: 1.4, velocity: 0.6 }));
  } else {
    Sound.piano(q.m, { duration: 1.2 });
  }
}

function newQuestion(autoplay) {
  quiz.q = makeQuestion();
  quiz.q.answer ??= quiz.q.type;
  quiz.answered = false;
  $("q-feedback").hidden = true;
  $("q-next").hidden = true;
  $("q-ref").hidden = quiz.mode !== "note";
  const opts = quiz.mode === "interval"
    ? [["up", "⬆ Sobe"], ["down", "⬇ Desce"], ["same", "= Igual"]]
    : quiz.mode === "chord"
      ? [["maj", "😊 Maior"], ["min", "😢 Menor"]]
      : NATURALS.map((m) => [m, `${pcName(pcOf(m), "solfege")} (${pcName(pcOf(m), "letter")})`]);
  $("q-title").textContent = {
    interval: "A segunda nota sobe, desce ou é igual à primeira?",
    chord: "Esse acorde é maior (alegre) ou menor (triste)?",
    note: "Que nota é essa? (Dica: compare com o Dó de referência)",
  }[quiz.mode];
  $("q-options").innerHTML = opts.map(([v, t]) => `<button type="button" data-v="${v}">${t}</button>`).join("");
  if (autoplay) playQuestion();
}

function answerQuiz(v) {
  if (quiz.answered) return;
  quiz.answered = true;
  quiz.total++;
  const q = quiz.q;
  const ok = String(v) === String(q.answer);
  if (ok) {
    quiz.hits++;
    quiz.streak++;
    if (quiz.streak > quiz.best) {
      quiz.best = quiz.streak;
      try { localStorage.setItem("musica-recorde", String(quiz.best)); } catch { /* ignora */ }
    }
  } else quiz.streak = 0;
  document.querySelectorAll("#q-options button").forEach((b) => {
    b.disabled = true;
    if (b.dataset.v === String(q.answer)) b.classList.add("right");
    else if (b.dataset.v === String(v)) b.classList.add("wrong");
  });

  let text;
  if (quiz.mode === "interval") {
    const d = q.b - q.a;
    text = d === 0
      ? `As duas notas eram ${midiName(q.a, "solfege")}.`
      : `Foi de ${midiName(q.a, "solfege")} para ${midiName(q.b, "solfege")}: ${d > 0 ? "subiu" : "desceu"} ${Math.abs(d)} semitom${Math.abs(d) > 1 ? "s" : ""}.`;
  } else if (quiz.mode === "chord") {
    const notes = spellSet(q.root, CHORDS[q.type].steps).map((n) => noteName(n, "solfege")).join(", ");
    text = `Era ${noteName(q.root, "solfege")} ${q.type === "maj" ? "maior" : "menor"} (${chordSymbol(q.root, q.type, "letter")}): ${notes}. ${q.type === "maj" ? "A terça maior deixa o som alegre." : "A terça menor deixa o som mais triste."}`;
  } else {
    text = `Era ${midiName(q.m, "solfege")} (${midiName(q.m, "letter")}). ${ok ? "Ouvido afiado!" : "Toque o Dó de referência e compare: quanto mais longe, mais aguda."}`;
  }
  const fb = $("q-feedback");
  fb.className = `feedback ${ok ? "ok" : "no"}`;
  fb.innerHTML = `<b>${ok ? (quiz.streak >= 5 && quiz.streak % 5 === 0 ? `🔥 ${quiz.streak} seguidas!` : "Acertou!") : "Não foi dessa vez."}</b><p>${text}</p>`;
  fb.hidden = false;
  $("q-next").hidden = false;
  paintScore();
}

function paintScore() {
  $("q-hits").textContent = quiz.hits;
  $("q-total").textContent = quiz.total;
  $("q-streak").textContent = quiz.streak;
  $("q-best").textContent = quiz.best;
}

function initQuiz() {
  document.querySelectorAll("#ouvido .tabs button").forEach((t) => t.addEventListener("click", () => {
    quiz.mode = t.dataset.quiz;
    document.querySelectorAll("#ouvido .tabs button").forEach((x) => x.setAttribute("aria-selected", String(x === t)));
    newQuestion(true);
  }));
  $("q-listen").addEventListener("click", playQuestion);
  $("q-ref").addEventListener("click", () => Sound.piano(60, { duration: 1 }));
  $("q-options").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) answerQuiz(b.dataset.v);
  });
  $("q-next").addEventListener("click", () => newQuestion(true));
  paintScore();
  newQuestion(false);
}

/* ============================================================
   Topo: exemplo musical e equalizador
   ============================================================ */

function initHero() {
  const eq = $("eq");
  const N = 22;
  eq.innerHTML = Array.from({ length: N }, (_, i) =>
    `<span style="--s:${(0.35 + Math.abs(Math.sin(i * 1.7)) * 0.6).toFixed(2)};--t:${(0.6 + (i % 5) * 0.12).toFixed(2)}s;--d:${(-i * 0.13).toFixed(2)}s"></span>`).join("");
  const bars = [...eq.children];
  const data = new Uint8Array(32);
  let liveUntil = 0;
  const loop = () => {
    const a = Sound.analyser;
    if (a && !REDUCED.matches) {
      a.getByteFrequencyData(data);
      const energy = data.reduce((s, v) => s + v, 0);
      if (energy > 400) {
        liveUntil = performance.now() + 300;
        eq.classList.add("live");
        bars.forEach((b, i) => {
          const v = data[Math.min(31, Math.floor((i / N) * 24) + 1)] / 255;
          b.style.transform = `scaleY(${Math.max(0.06, v).toFixed(3)})`;
        });
      } else if (performance.now() > liveUntil && eq.classList.contains("live")) {
        eq.classList.remove("live");
        bars.forEach((b) => { b.style.transform = ""; });
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // Exemplo: I–V–vi–IV em Dó, com baixo, arpejo e bateria (4 compassos a 100 BPM).
  let busy = false;
  $("hero-play").addEventListener("click", () => {
    if (busy) return;
    const c = Sound.ac();
    if (!c) return;
    busy = true;
    const btn = $("hero-play");
    btn.classList.add("playing");
    btn.textContent = "♫ Tocando...";
    const beat = 0.6;
    const t0 = c.currentTime + 0.1;
    const field = harmonicField(ROOTS[0]);
    [0, 4, 5, 3].forEach((deg, bar) => {
      const f = field[deg];
      const tones = chordMidis(f.root, f.type, 60);
      const start = bar * 4 * beat;
      Sound.piano(tones[0] - 24, { when: start + 0.1, duration: beat * 2, velocity: 0.8 });
      Sound.piano(tones[0] - 24, { when: start + 0.1 + beat * 2, duration: beat * 2, velocity: 0.7 });
      const pattern = [0, 1, 2, 1, 0, 1, 2, 1];
      pattern.forEach((p, k) => Sound.piano(tones[p] + (k === 2 || k === 6 ? 12 : 0), { when: start + 0.1 + k * beat / 2, duration: 0.45, velocity: 0.55 }));
      for (let s = 0; s < 16; s++) {
        const t = t0 + start + s * beat / 4;
        if ([0, 8, 10].includes(s)) Sound.drumAt("kick", t);
        if ([4, 12].includes(s)) Sound.drumAt("snare", t);
        if (s % 2 === 0) Sound.drumAt("hat", t);
      }
    });
    setTimeout(() => {
      busy = false;
      btn.classList.remove("playing");
      btn.textContent = "▶ Ouça de novo";
    }, 16 * beat * 1000 + 400);
  });
}

/* ============================================================
   Gerais: som, rolagem, aparecer ao rolar
   ============================================================ */

function initMute() {
  const b = $("mute");
  b.addEventListener("click", () => {
    Sound.setMuted(!Sound.muted);
    b.setAttribute("aria-pressed", String(Sound.muted));
    b.innerHTML = `<span aria-hidden="true">${Sound.muted ? "🔇" : "🔊"}</span> Som`;
  });
}

function initScroll() {
  const bar = $("progress");
  const links = [...document.querySelectorAll('.topbar nav a[href^="#"]')];
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    });
  }, { passive: true });
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main > section[id]").forEach((s) => spy.observe(s));
  }
  if (REDUCED.matches || !("IntersectionObserver" in window)) return;
  const items = [...document.querySelectorAll(".section-head, .instrument-box, .picker, .field, .progressions, .tabs, .quiz, .sub-title, .sub-text")];
  document.querySelectorAll(".cards-3").forEach((p) => [...p.children].forEach((c, k) => { c.style.setProperty("--delay", `${k * 80}ms`); items.push(c); }));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
  items.forEach((e) => { e.classList.add("reveal"); io.observe(e); });
}

/* ============================================================
   Início
   ============================================================ */

initMute();
initHero();
initNotes();
initScales();
initChords();
initGuitar();
initSeq();
initQuiz();
initScroll();
renders.forEach((r) => r());
