// Interface: desenha o cubo com CSS 3D, anima os giros e cuida do cronômetro.

const CORES = { U: '#f5f5f5', D: '#ffd500', F: '#009b48', B: '#0046ad', R: '#d0102b', L: '#ff6a00' };
const NORMAL = Cubo.NORMAL;
const DURACAO = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240;
const DURACAO_RAPIDA = DURACAO ? 70 : 0;
const DURACAO_MONTAR = DURACAO ? 110 : 0;

const $ = id => document.getElementById(id);
const cuboEl = $('cubo');

let pecas = [];
let historico = [];       // movimentos aplicados, para o "Desfazer"
let fila = [];            // movimentos esperando a animação
let animando = false;
let automatico = false;   // embaralhando ou resolvendo: ignora o jogador
let estado = 'livre';     // livre | inspecao | cronometrando
let inicio = 0, contador = 0;
let faseAtual = null, mensagemFinal = '';

// ---------- desenho ----------

function transformBase(p) {
  const [x, y, z] = p.pos, M = p.M;
  // matrix3d é coluna por coluna
  const m = [M[0][0], M[1][0], M[2][0], 0, M[0][1], M[1][1], M[2][1], 0, M[0][2], M[1][2], M[2][2], 0, 0, 0, 0, 1];
  return `translate3d(calc(${x} * var(--s)), calc(${y} * var(--s)), calc(${z} * var(--s))) matrix3d(${m})`;
}

function montar() {
  pecas = Cubo.novoEstado();
  cuboEl.replaceChildren();
  for (const p of pecas) {
    p.el = document.createElement('div');
    p.el.className = 'peca';
    p.el.peca = p; // para achar a peça a partir do clique
    for (const f of Object.keys(NORMAL)) {
      const face = document.createElement('div');
      face.className = 'face ' + f;
      face.dataset.face = f;
      if (Cubo.temAdesivo(p, f)) face.style.setProperty('--cor', CORES[f]);
      p.el.append(face);
    }
    p.el.style.transform = transformBase(p);
    cuboEl.append(p.el);
  }
}

// ---------- giros ----------

function enfileirar(movs, origem) {
  fila.push(...movs.map(m => ({ ...m, origem })));
  if (!animando) proximo();
}

function proximo() {
  const mov = fila.shift();
  if (!mov) {
    animando = false;
    if (automatico) fimAutomatico();
    return;
  }
  animando = true;
  const giro = Cubo.prepararGiro(pecas, mov);
  const fn = 'rotate' + giro.eixo.toUpperCase();
  const dur = mov.origem === 'jogador' ? DURACAO : mov.origem === 'montar' ? DURACAO_MONTAR : DURACAO_RAPIDA;
  if (mov.origem === 'montar' && mov.fase !== faseAtual) {
    faseAtual = mov.fase;
    status(`Montando sozinho — fase: ${mov.fase}`);
  }
  apagarDica();

  // Mesma lista de funções no início e no fim para o navegador interpolar só o ângulo.
  for (const p of giro.afetadas) {
    p.el.style.transition = 'none';
    p.el.style.transform = `${fn}(0deg) ${transformBase(p)}`;
  }
  cuboEl.offsetWidth; // força o navegador a aplicar o estado inicial
  for (const p of giro.afetadas) {
    p.el.style.transition = `transform ${dur}ms ease-in-out`;
    p.el.style.transform = `${fn}(${giro.graus}deg) ${transformBase(p)}`;
  }

  setTimeout(() => {
    Cubo.aplicarGiro(giro);
    for (const p of giro.afetadas) {
      p.el.style.transition = 'none';
      p.el.style.transform = transformBase(p);
    }
    if (mov.origem === 'desfazer') historico.pop();
    else historico.push(mov);
    depoisDoGiro(mov);
    proximo();
  }, dur);
}

function depoisDoGiro(mov) {
  if (mov.origem === 'jogador' && estado === 'cronometrando') $('contador').textContent = ++contador;
  if (!automatico && Cubo.resolvido(pecas) && historico.length) {
    if (estado === 'cronometrando') {
      const t = (performance.now() - inicio) / 1000;
      estado = 'livre';
      $('tempo').textContent = t.toFixed(2);
      const recorde = salvarMelhor(t);
      status(`Resolvido em ${t.toFixed(2)} s e ${contador} ${contador === 1 ? 'movimento' : 'movimentos'}!${recorde ? ' Novo recorde! 🏆' : ''}`, 'sucesso');
    } else {
      status('Resolvido!', 'sucesso');
    }
    historico = [];
  }
  mostrarHistorico();
}

function tique() {
  if (estado !== 'cronometrando') return;
  $('tempo').textContent = ((performance.now() - inicio) / 1000).toFixed(2);
  requestAnimationFrame(tique);
}

// ---------- ações ----------

function jogar(movs) {
  if (automatico || !movs.length) return;
  if (estado === 'inspecao') { // o tempo começa no clique, não no fim da animação
    estado = 'cronometrando';
    inicio = performance.now();
    requestAnimationFrame(tique);
    status('Valendo!');
  }
  enfileirar(movs, 'jogador');
}

function rodarAutomatico(movs, origem, msg, final = '') {
  if (automatico || animando || !movs.length) return;
  automatico = true;
  estado = 'livre';
  faseAtual = null;
  mensagemFinal = final;
  bloquear(true);
  status(msg);
  enfileirar(movs, origem);
}

function fimAutomatico() {
  automatico = false;
  bloquear(false);
  if (Cubo.resolvido(pecas)) {
    historico = [];
    status(mensagemFinal || 'Montado!', 'sucesso');
  } else {
    estado = 'inspecao';
    contador = 0;
    $('contador').textContent = 0;
    $('tempo').textContent = '0.00';
    status('Pronto! O tempo começa no seu primeiro movimento.');
  }
  mostrarHistorico();
}

$('embaralhar').onclick = () => {
  const movs = Cubo.embaralhar();
  historico = [];
  rodarAutomatico(movs, 'embaralhar', 'Embaralhando: ' + movs.map(Cubo.nome).join(' '));
};

$('montar').onclick = () => {
  if (automatico || animando) return;
  if (Cubo.resolvido(pecas)) return status('O cubo já está montado. Embaralhe primeiro!');
  const movs = Resolvedor.resolver(pecas);
  rodarAutomatico(movs, 'montar', 'Montando sozinho…',
    `Montado em ${movs.length} movimentos pelo método de camadas!`);
};

$('dica').onclick = () => {
  if (automatico || animando) return;
  if (Cubo.resolvido(pecas)) return status('O cubo já está montado. Embaralhe primeiro!');
  const [passo] = Resolvedor.resolver(pecas);
  const nome = Cubo.nome(passo);
  status(`💡 Fase "${passo.fase}": faça ${nome}`);
  apagarDica();
  [...$('teclas').children].find(b => b.textContent === nome)?.classList.add('dica');
};

function apagarDica() {
  $('teclas').querySelector('.dica')?.classList.remove('dica');
}

$('desfazer').onclick = () => {
  if (automatico || animando || !historico.length) return;
  enfileirar([Cubo.inverso(historico[historico.length - 1])], 'desfazer');
};

$('resetar').onclick = () => {
  if (automatico || animando) return;
  estado = 'livre';
  historico = [];
  contador = 0;
  $('contador').textContent = 0;
  $('tempo').textContent = '0.00';
  montar();
  mostrarHistorico();
  status('Embaralhe para começar a cronometrar.');
};

$('formSeq').onsubmit = e => {
  e.preventDefault();
  try {
    jogar(Cubo.ler($('seq').value));
  } catch (erro) {
    status(erro.message, 'erro');
  }
};

// 18 botões: U U' U2, D D' D2...
for (const f of 'UDLRFB') {
  for (const vezes of [1, -1, 2]) {
    const b = document.createElement('button');
    const mov = { face: f, vezes };
    b.textContent = Cubo.nome(mov);
    b.style.setProperty('--cor', CORES[f]);
    b.onclick = () => jogar([mov]);
    $('teclas').append(b);
  }
}

addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
  const face = e.key.toUpperCase();
  if (!Cubo.GIRO[face]) return;
  e.preventDefault();
  jogar([{ face, vezes: e.shiftKey ? -1 : 1 }]);
});

// ---------- mouse e toque ----------
// Botão esquerdo no cubo: clicar gira a face, arrastar gira a camada na direção do arrasto.
// Fora do cubo, ou com o botão direito: gira a vista.

// A vista é uma matriz acumulada: cada arrasto gira em torno dos eixos da TELA, então dá a volta completa em qualquer direção.
let vista = new DOMMatrix('rotateX(-28deg) rotateY(-38deg)');
let toque = null;
const cena = $('cena');
const ARRASTO_MINIMO = 12; // px até um clique virar arrasto

cena.addEventListener('contextmenu', e => e.preventDefault());

cena.addEventListener('pointerdown', e => {
  e.preventDefault(); // não selecionar texto da página ao arrastar
  const face = e.button === 0 ? e.target.closest('.face') : null;
  toque = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, face, shift: e.shiftKey };
  cena.setPointerCapture(e.pointerId);
});

cena.addEventListener('pointermove', e => {
  if (!toque) return;
  if (toque.face) {
    const dx = e.clientX - toque.x0, dy = e.clientY - toque.y0;
    if (Math.hypot(dx, dy) < ARRASTO_MINIMO) return;
    jogar([movimentoDoArrasto(toque.face, dx, dy)]);
    toque = null; // um giro por arrasto
    return;
  }
  const giro = new DOMMatrix().rotate(-(e.clientY - toque.y) * 0.5, (e.clientX - toque.x) * 0.5, 0);
  vista = giro.multiply(vista);
  toque.x = e.clientX;
  toque.y = e.clientY;
  cuboEl.style.transform = vista.toString();
});

cena.addEventListener('pointerup', () => {
  if (toque?.face) { // clique sem arrastar: gira a face onde está o adesivo
    const { normal } = ladoDaFace(toque.face);
    const face = Object.keys(NORMAL).find(f => NORMAL[f].join() === normal.join());
    jogar([{ face, vezes: toque.shift ? -1 : 1 }]);
  }
  toque = null;
});
cena.addEventListener('pointercancel', () => (toque = null));

/** Peça e para onde a face clicada aponta agora (nas coordenadas do cubo). */
function ladoDaFace(faceEl) {
  const p = faceEl.parentElement.peca;
  return { p, normal: Cubo.vezesVetor(p.M, NORMAL[faceEl.dataset.face]) };
}

/**
 * Escolhe o giro que mais combina com o arrasto: para cada eixo perpendicular à face clicada,
 * gira a peça 5° de teste, mede para onde o adesivo andou na tela (já com perspectiva) e desfaz.
 * Fica o eixo cujo movimento é mais alinhado com o arrasto; o sinal diz o sentido.
 */
function movimentoDoArrasto(faceEl, dx, dy) {
  const { p, normal } = ladoDaFace(faceEl);
  const centro = () => { const r = faceEl.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const [x0, y0] = centro();
  let melhor = null;
  for (let k = 0; k < 3; k++) {
    if (normal[k] !== 0) continue;
    p.el.style.transition = 'none';
    p.el.style.transform = `rotate${'XYZ'[k]}(5deg) ${transformBase(p)}`;
    const [x1, y1] = centro();
    p.el.style.transform = transformBase(p);
    const tamanho = Math.hypot(x1 - x0, y1 - y0);
    if (tamanho < 1e-6) continue;
    const alinhamento = ((x1 - x0) * dx + (y1 - y0) * dy) / (tamanho * Math.hypot(dx, dy));
    if (!melhor || Math.abs(alinhamento) > Math.abs(melhor.alinhamento)) melhor = { k, alinhamento };
  }
  const eixo = 'xyz'[melhor.k], camada = p.pos[melhor.k];
  const face = Object.keys(Cubo.GIRO).find(f => Cubo.GIRO[f][0] === eixo && Cubo.GIRO[f][1] === camada);
  return { face, vezes: Math.sign(melhor.alinhamento) * Cubo.GIRO[face][2] };
}

// ---------- utilidades ----------

function status(texto, tipo = '') {
  $('status').textContent = texto;
  $('status').className = 'status ' + tipo;
}

function bloquear(sim) {
  document.querySelectorAll('button').forEach(b => (b.disabled = sim));
}

function mostrarHistorico() {
  $('historico').textContent = historico.length ? historico.map(Cubo.nome).join(' ') : '';
}

function salvarMelhor(t) {
  let melhor = Infinity;
  try { melhor = parseFloat(localStorage.getItem('cubo-melhor')) || Infinity; } catch {}
  const recorde = t < melhor;
  if (recorde) {
    melhor = t;
    try { localStorage.setItem('cubo-melhor', t); } catch {}
  }
  $('melhor').textContent = melhor.toFixed(2);
  return recorde;
}

try {
  const m = parseFloat(localStorage.getItem('cubo-melhor'));
  if (m) $('melhor').textContent = m.toFixed(2);
} catch {}

montar();
