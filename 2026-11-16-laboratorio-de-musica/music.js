"use strict";

/* ============================================================
   Teoria musical
   Notas como números MIDI (60 = Dó central, 69 = Lá 440 Hz).
   ============================================================ */

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const SOLFEGE = { C: "Dó", D: "Ré", E: "Mi", F: "Fá", G: "Sol", A: "Lá", B: "Si" };
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const ACC = { "-2": "𝄫", "-1": "♭", 0: "", 1: "♯", 2: "𝄪" };
// Nome "padrão" de cada uma das 12 notas (com sustenido), usado no piano e no violão.
const PC_NAMES = [["C", 0], ["C", 1], ["D", 0], ["D", 1], ["E", 0], ["F", 0], ["F", 1], ["G", 0], ["G", 1], ["A", 0], ["A", 1], ["B", 0]];

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);
const pcOf = (midi) => ((midi % 12) + 12) % 12;
const octaveOf = (midi) => Math.floor(midi / 12) - 1;

/** { letter: "E", acc: -1 } → "Mi♭" ou "E♭" */
function noteName(n, style = "solfege") {
  const base = style === "solfege" ? SOLFEGE[n.letter] : n.letter;
  return base + ACC[n.acc];
}
const pcName = (pc, style) => {
  const [letter, acc] = PC_NAMES[pc];
  return noteName({ letter, acc }, style);
};
const midiName = (midi, style) => `${pcName(pcOf(midi), style)}${octaveOf(midi)}`;

/** As 12 tônicas oferecidas, com a grafia mais usada. */
const ROOTS = [
  { letter: "C", acc: 0 }, { letter: "C", acc: 1 }, { letter: "D", acc: 0 }, { letter: "E", acc: -1 },
  { letter: "E", acc: 0 }, { letter: "F", acc: 0 }, { letter: "F", acc: 1 }, { letter: "G", acc: 0 },
  { letter: "A", acc: -1 }, { letter: "A", acc: 0 }, { letter: "B", acc: -1 }, { letter: "B", acc: 0 },
];
const rootPc = (r) => (LETTER_PC[LETTERS.indexOf(r.letter)] + r.acc + 12) % 12;

/**
 * Grafia correta de uma nota a partir da tônica: `semis` semitons acima,
 * usando a letra `steps` posições depois (ex.: terça = 2 letras depois).
 */
function spell(root, semis, steps) {
  const li = (LETTERS.indexOf(root.letter) + steps) % 7;
  const target = (rootPc(root) + semis) % 12;
  const acc = ((target - LETTER_PC[li] + 18) % 12) - 6;
  return { letter: LETTERS[li], acc, pc: target };
}

/* Cada item: [semitons a partir da tônica, quantas letras depois] */
const SCALES = {
  major: { name: "Maior", mood: "alegre, \"resolvida\"", steps: [[0, 0], [2, 1], [4, 2], [5, 3], [7, 4], [9, 5], [11, 6]] },
  minor: { name: "Menor natural", mood: "triste, introspectiva", steps: [[0, 0], [2, 1], [3, 2], [5, 3], [7, 4], [8, 5], [10, 6]] },
  pentMajor: { name: "Pentatônica maior", mood: "aberta, country e pop", steps: [[0, 0], [2, 1], [4, 2], [7, 4], [9, 5]] },
  pentMinor: { name: "Pentatônica menor", mood: "a base dos solos de rock", steps: [[0, 0], [3, 2], [5, 3], [7, 4], [10, 6]] },
  blues: { name: "Blues", mood: "pentatônica menor + a \"blue note\"", steps: [[0, 0], [3, 2], [5, 3], [6, 4], [7, 4], [10, 6]] },
};

const CHORDS = {
  maj: { name: "Maior", suffix: "", steps: [[0, 0], [4, 2], [7, 4]], feel: "alegre e estável" },
  min: { name: "Menor", suffix: "m", steps: [[0, 0], [3, 2], [7, 4]], feel: "triste, melancólico" },
  dom7: { name: "Sétima", suffix: "7", steps: [[0, 0], [4, 2], [7, 4], [10, 6]], feel: "tenso, pede para ir a outro acorde" },
  maj7: { name: "Sétima maior", suffix: "7M", steps: [[0, 0], [4, 2], [7, 4], [11, 6]], feel: "suave, cara de bossa nova" },
  min7: { name: "Menor com sétima", suffix: "m7", steps: [[0, 0], [3, 2], [7, 4], [10, 6]], feel: "macio, muito usado no jazz e no soul" },
  dim: { name: "Diminuto", suffix: "°", steps: [[0, 0], [3, 2], [6, 4]], feel: "instável, de suspense" },
  aug: { name: "Aumentado", suffix: "+", steps: [[0, 0], [4, 2], [8, 4]], feel: "misterioso, de sonho" },
  sus4: { name: "Suspenso (sus4)", suffix: "sus4", steps: [[0, 0], [5, 3], [7, 4]], feel: "\"em aberto\", nem maior nem menor" },
};

const INTERVAL_NAMES = {
  0: "tônica", 3: "terça menor", 4: "terça maior", 5: "quarta justa", 6: "quinta diminuta",
  7: "quinta justa", 8: "quinta aumentada", 10: "sétima menor", 11: "sétima maior", 2: "segunda maior", 9: "sexta maior",
};

const spellSet = (root, steps) => steps.map(([s, l]) => ({ ...spell(root, s, l), semis: s }));
const chordSymbol = (root, type, style = "letter") => noteName(root, style) + CHORDS[type].suffix;

/** Fórmula de tons e semitons (só para escalas de 7 notas). */
function formula(scale) {
  const s = SCALES[scale].steps.map((x) => x[0]).concat(12);
  return s.slice(1).map((v, i) => (v - s[i] === 2 ? "T" : v - s[i] === 1 ? "S" : "T½")).join(" ");
}

/* Campo harmônico maior: grau, tipo de acorde e numeral. */
const FIELD = [
  { deg: 0, type: "maj", roman: "I" }, { deg: 1, type: "min", roman: "ii" }, { deg: 2, type: "min", roman: "iii" },
  { deg: 3, type: "maj", roman: "IV" }, { deg: 4, type: "maj", roman: "V" }, { deg: 5, type: "min", roman: "vi" },
  { deg: 6, type: "dim", roman: "vii°" },
];
function harmonicField(root) {
  const scale = spellSet(root, SCALES.major.steps);
  return FIELD.map((f) => ({ ...f, root: scale[f.deg] }));
}

const PROGRESSIONS = [
  { name: "Pop", degrees: [0, 4, 5, 3], about: "I–V–vi–IV: a progressão de centenas de sucessos do pop." },
  { name: "Rock clássico", degrees: [0, 3, 4, 3], about: "I–IV–V: a base do rock, do blues e do forró." },
  { name: "Anos 50", degrees: [0, 5, 3, 4], about: "I–vi–IV–V: a cara das baladas antigas." },
  { name: "Jazz", degrees: [1, 4, 0, 0], about: "ii–V–I: o \"caminho de casa\" mais usado no jazz e na bossa nova." },
];

/** Notas MIDI de um acorde perto de uma oitava base (para tocar). */
function chordMidis(root, type, base = 60) {
  const r = base + rootPc(root);
  const start = r > base + 5 ? r - 12 : r;
  return CHORDS[type].steps.map(([s]) => start + s);
}

/* ============================================================
   Violão
   ============================================================ */

// Afinação padrão, da 1ª corda (Mi agudo) para a 6ª (Mi grave).
const STRINGS = [
  { name: "1ª · Mi", midi: 64 }, { name: "2ª · Si", midi: 59 }, { name: "3ª · Sol", midi: 55 },
  { name: "4ª · Ré", midi: 50 }, { name: "5ª · Lá", midi: 45 }, { name: "6ª · Mi", midi: 40 },
];

/* Acordes abertos: casa em cada corda, da 6ª para a 1ª (x = não tocar). */
const OPEN_CHORDS = [
  { sym: "C", root: { letter: "C", acc: 0 }, type: "maj", frets: "x32010" },
  { sym: "G", root: { letter: "G", acc: 0 }, type: "maj", frets: "320003" },
  { sym: "D", root: { letter: "D", acc: 0 }, type: "maj", frets: "xx0232" },
  { sym: "A", root: { letter: "A", acc: 0 }, type: "maj", frets: "x02220" },
  { sym: "E", root: { letter: "E", acc: 0 }, type: "maj", frets: "022100" },
  { sym: "Am", root: { letter: "A", acc: 0 }, type: "min", frets: "x02210" },
  { sym: "Em", root: { letter: "E", acc: 0 }, type: "min", frets: "022000" },
  { sym: "Dm", root: { letter: "D", acc: 0 }, type: "min", frets: "xx0231" },
  { sym: "F", root: { letter: "F", acc: 0 }, type: "maj", frets: "133211" },
];

/** Notas MIDI de um desenho de acorde (da 6ª corda para a 1ª), ignorando as cordas "x". */
function shapeMidis(frets) {
  return frets.split("").map((f, k) => (f === "x" ? null : STRINGS[5 - k].midi + Number(f))).filter((m) => m !== null);
}

/* ============================================================
   Som (Web Audio, sem arquivos)
   ============================================================ */

const Sound = (() => {
  let ctx = null;
  let master = null;
  let analyser = null;
  let muted = false;
  const guitarCache = new Map();

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createDynamicsCompressor();
      master.threshold.value = -12;
      master.ratio.value = 4;
      const out = ctx.createGain();
      out.gain.value = 0.9;
      master.connect(out).connect(ctx.destination);
      // Analisador: alimenta o equalizador animado do topo com o som de verdade.
      analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      out.connect(analyser);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* ---------- Piano: harmônicos que somem em tempos diferentes ---------- */
  function piano(midi, { when = 0, velocity = 0.8, duration = null } = {}) {
    const c = ac();
    if (!c || muted) return { stop() {} };
    const t = c.currentTime + when;
    const f = freq(midi);
    const out = c.createGain();
    const tone = c.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(Math.min(12000, f * 9), t);
    tone.frequency.exponentialRampToValueAtTime(Math.min(9000, f * 3), t + 1.2);
    tone.connect(out).connect(master);
    const length = 3.2 - Math.min(1.8, (midi - 48) * 0.035); // graves duram mais
    const parts = [[1, 1, 1], [2, 0.42, 0.55], [3, 0.2, 0.35], [4, 0.1, 0.25], [5, 0.05, 0.18]];
    const oscs = parts.map(([h, amp, life]) => {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f * h * (1 + (h - 1) * 0.0007); // leve "desafinação" natural das cordas
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp * velocity * 0.32, t + 0.006);
      g.gain.exponentialRampToValueAtTime(amp * velocity * 0.12, t + 0.25 * life);
      g.gain.exponentialRampToValueAtTime(0.0001, t + length * life);
      o.connect(g).connect(tone);
      o.start(t);
      o.stop(t + length + 0.1);
      return { o, g };
    });
    const stop = (at = c.currentTime) => {
      for (const { o, g } of oscs) {
        g.gain.cancelScheduledValues(at);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), at);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
        try { o.stop(at + 0.3); } catch { /* já parou */ }
      }
    };
    if (duration) stop(t + duration);
    return { stop: () => stop() };
  }

  /* ---------- Violão: síntese Karplus-Strong (corda que vibra de verdade) ---------- */
  function guitarBuffer(midi) {
    if (guitarCache.has(midi)) return guitarCache.get(midi);
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 3);
    const buf = ctx.createBuffer(1, len, sr);
    const y = buf.getChannelData(0);
    const period = Math.max(2, Math.round(sr / freq(midi) - 0.5)); // o filtro de média atrasa meia amostra
    const decay = 0.9965 + Math.min(0.0025, (64 - midi) * 0.00006);
    let prev = 0;
    for (let i = 0; i < period; i++) {
      // Ruído um pouco filtrado = palheta menos "metálica".
      const n = Math.random() * 2 - 1;
      prev = prev * 0.5 + n * 0.5;
      y[i] = prev;
    }
    for (let i = period; i < len; i++) y[i] = decay * 0.5 * (y[i - period] + y[i - period - 1 >= 0 ? i - period - 1 : i - period]);
    // Normaliza o volume.
    let peak = 0;
    for (let i = 0; i < period * 4; i++) peak = Math.max(peak, Math.abs(y[i]));
    const k = 0.6 / (peak || 1);
    for (let i = 0; i < len; i++) y[i] *= k;
    guitarCache.set(midi, buf);
    return buf;
  }

  function guitar(midi, { when = 0, velocity = 0.9 } = {}) {
    const c = ac();
    if (!c || muted) return;
    const t = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = guitarBuffer(midi);
    const body = c.createBiquadFilter(); // "corpo" do violão
    body.type = "peaking";
    body.frequency.value = 220;
    body.Q.value = 1.2;
    body.gain.value = 5;
    const g = c.createGain();
    g.gain.value = velocity;
    src.connect(body).connect(g).connect(master);
    src.start(t);
  }

  function strum(midis, { when = 0, down = true, gap = 0.022 } = {}) {
    const order = down ? midis : midis.slice().reverse();
    order.forEach((m, k) => guitar(m, { when: when + k * gap, velocity: 0.75 + Math.random() * 0.15 }));
  }

  /* ---------- Bateria ---------- */
  const noiseBuffer = () => {
    const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  };
  let noise = null;
  const noiseSrc = () => {
    if (!noise) noise = noiseBuffer();
    const s = ctx.createBufferSource();
    s.buffer = noise;
    return s;
  };
  const env = (g, t, peak, dur) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  };

  const DRUMS = {
    kick(t) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      const g = ctx.createGain();
      env(g, t, 1, 0.45);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.5);
    },
    snare(t) {
      const n = noiseSrc();
      const bp = ctx.createBiquadFilter();
      bp.type = "highpass";
      bp.frequency.value = 1200;
      const g = ctx.createGain();
      env(g, t, 0.55, 0.2);
      n.connect(bp).connect(g).connect(master);
      n.start(t);
      n.stop(t + 0.25);
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(190, t);
      const og = ctx.createGain();
      env(og, t, 0.4, 0.12);
      o.connect(og).connect(master);
      o.start(t);
      o.stop(t + 0.15);
    },
    hat(t, open = false) {
      const n = noiseSrc();
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7500;
      const g = ctx.createGain();
      env(g, t, open ? 0.3 : 0.25, open ? 0.32 : 0.05);
      n.connect(hp).connect(g).connect(master);
      n.start(t);
      n.stop(t + 0.4);
    },
    openhat(t) { DRUMS.hat(t, true); },
    clap(t) {
      [0, 0.011, 0.022].forEach((dt, k) => {
        const n = noiseSrc();
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1500;
        bp.Q.value = 0.9;
        const g = ctx.createGain();
        env(g, t + dt, 0.55, k === 2 ? 0.18 : 0.03);
        n.connect(bp).connect(g).connect(master);
        n.start(t + dt);
        n.stop(t + dt + 0.25);
      });
    },
  };

  function drum(name) {
    const c = ac();
    if (!c || muted) return;
    DRUMS[name](c.currentTime + 0.005);
  }

  return {
    ac,
    get time() { return ctx ? ctx.currentTime : 0; },
    get analyser() { return analyser; },
    get muted() { return muted; },
    setMuted(m) { muted = m; },
    piano,
    guitar,
    strum,
    drum,
    /** Toca no tempo absoluto do AudioContext (usado pelo sequenciador). */
    drumAt(name, t) { if (ctx && !muted) DRUMS[name](t); },
  };
})();
