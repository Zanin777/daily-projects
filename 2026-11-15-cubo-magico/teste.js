// Testes da lógica: node teste.js
const assert = require('node:assert/strict');
const C = require('./cubo.js');

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('  ok    ' + nome); }
  catch (e) { falhas++; console.log('  FALHA ' + nome + '\n        ' + e.message); }
}

const aplicar = (pecas, texto) => { for (const m of C.ler(texto)) C.girar(pecas, m); return pecas; };
const pecaEm = (pecas, casa) => pecas.find(p => p.casa.join() === casa.join());

teste('cubo novo está resolvido', () => assert.ok(C.resolvido(C.novoEstado())));

teste('um giro desarruma e quatro voltam', () => {
  for (const f of 'UDLRFB') {
    const p = aplicar(C.novoEstado(), f);
    assert.ok(!C.resolvido(p), f);
    assert.ok(C.resolvido(aplicar(p, f + f + f)), f + '4');
  }
});

teste("X seguido de X' volta, e X2 X2 também", () => {
  for (const f of 'UDLRFB') {
    assert.ok(C.resolvido(aplicar(C.novoEstado(), `${f} ${f}'`)));
    assert.ok(C.resolvido(aplicar(C.novoEstado(), `${f}2 ${f}2`)));
  }
});

teste("sexy move (R U R' U') seis vezes volta ao início", () => {
  const p = C.novoEstado();
  for (let i = 0; i < 5; i++) { aplicar(p, "R U R' U'"); assert.ok(!C.resolvido(p)); }
  assert.ok(C.resolvido(aplicar(p, "R U R' U'")));
});

teste('sentido dos giros segue a notação oficial', () => {
  // R leva a peça da frente-direita para cima
  assert.deepEqual(pecaEm(aplicar(C.novoEstado(), 'R'), [1, 0, 1]).pos, [1, -1, 0]);
  // U leva a peça da frente-de-cima para a esquerda
  assert.deepEqual(pecaEm(aplicar(C.novoEstado(), 'U'), [0, -1, 1]).pos, [-1, -1, 0]);
  // F leva a peça de cima-da-frente para a direita
  assert.deepEqual(pecaEm(aplicar(C.novoEstado(), 'F'), [0, -1, 1]).pos, [1, 0, 1]);
  // L leva a peça de cima-esquerda para a frente; D leva a frente-de-baixo para a direita; B leva cima-de-trás para a esquerda
  assert.deepEqual(pecaEm(aplicar(C.novoEstado(), 'L'), [-1, -1, 0]).pos, [-1, 0, 1]);
  assert.deepEqual(pecaEm(aplicar(C.novoEstado(), 'D'), [0, 1, 1]).pos, [1, 1, 0]);
  assert.deepEqual(pecaEm(aplicar(C.novoEstado(), 'B'), [0, -1, -1]).pos, [-1, 0, -1]);
});

teste('fatias M, E, S desarrumam e voltam', () => {
  for (const f of 'MES') {
    assert.ok(!C.resolvido(aplicar(C.novoEstado(), f)), f);
    assert.ok(C.resolvido(aplicar(C.novoEstado(), `${f} ${f}'`)), f + "'");
    assert.ok(C.resolvido(aplicar(C.novoEstado(), `${f}2 ${f}2`)), f + '2');
  }
});

teste('M segue o sentido do L, E do D e S do F', () => {
  // M leva o meio de cima-da-frente para baixo-da-frente (como o L)
  assert.deepEqual(pecaEm(aplicar(C.novoEstado(), 'M'), [0, -1, 1]).pos, [0, 1, 1]);
  // E leva o centro da frente para a direita (como o D); S leva o centro de cima para a direita (como o F)
  assert.deepEqual(pecaEm(aplicar(C.novoEstado(), 'E'), [0, 0, 1]).pos, [1, 0, 0]);
  assert.deepEqual(pecaEm(aplicar(C.novoEstado(), 'S'), [0, -1, 0]).pos, [1, 0, 0]);
});

teste('cubo inteiro virado (R M\' L\' = rotação x) conta como resolvido', () => {
  assert.ok(C.resolvido(aplicar(C.novoEstado(), "R M' L'")));
  assert.ok(C.resolvido(aplicar(C.novoEstado(), "U E' D'")));
  assert.ok(!C.resolvido(aplicar(C.novoEstado(), "R M' L")));
});

teste('embaralhar e desfazer ao contrário resolve', () => {
  for (let i = 0; i < 50; i++) {
    const movs = C.embaralhar();
    const p = C.novoEstado();
    movs.forEach(m => C.girar(p, m));
    movs.slice().reverse().forEach(m => C.girar(p, C.inverso(m)));
    assert.ok(C.resolvido(p));
  }
});

teste('embaralhamento tem 20 movimentos sem repetir face seguida', () => {
  const movs = C.embaralhar();
  assert.equal(movs.length, 20);
  movs.forEach((m, i) => i && assert.notEqual(m.face, movs[i - 1].face));
});

teste('lê notação com e sem espaço', () => {
  assert.equal(C.ler("R U R' U'").map(C.nome).join(' '), "R U R' U'");
  assert.equal(C.ler("RUR'U' F2").map(C.nome).join(' '), "R U R' U' F2");
  assert.equal(C.ler('R’').map(C.nome).join(), "R'");
  assert.deepEqual(C.ler('   '), []);
});

teste('recusa notação inválida', () => {
  assert.throws(() => C.ler('R X'), /X/);
  assert.throws(() => C.ler('r u'), /r/);
});

const R = require('./resolvedor.js');

teste('resolvedor monta 300 cubos embaralhados (alguns com M, E, S)', () => {
  for (let i = 0; i < 300; i++) {
    const p = C.novoEstado();
    C.embaralhar(25).forEach(m => C.girar(p, m));
    if (i % 3 === 0) aplicar(p, "M E' S2");
    R.resolver(p).forEach(m => C.girar(p, m));
    assert.ok(C.resolvido(p), `embaralhamento ${i}`);
  }
});

teste('resolvedor não mexe num cubo já montado', () => {
  assert.deepEqual(R.resolver(C.novoEstado()), []);
});

teste('as fases saem na ordem do método', () => {
  const p = C.novoEstado();
  C.embaralhar(25).forEach(m => C.girar(p, m));
  const ordem = ['centros', 'cruz amarela', 'cantos de baixo', 'camada do meio', 'cruz branca',
    'meios de cima', 'cantos de cima no lugar', 'girar cantos de cima'];
  const fases = R.resolver(p).map(m => ordem.indexOf(m.fase));
  assert.ok(fases.every(f => f >= 0));
  assert.ok(fases.every((f, i) => i === 0 || f >= fases[i - 1]));
});

teste('resolvedor junta giros seguidos (sem "U U" nem "R R\'")', () => {
  const p = C.novoEstado();
  C.embaralhar(25).forEach(m => C.girar(p, m));
  const sol = R.resolver(p);
  sol.forEach((m, i) => i && assert.notEqual(m.face, sol[i - 1].face));
});

console.log(falhas ? `\n${falhas} teste(s) falharam.` : '\nTodos os testes passaram.');
process.exit(falhas ? 1 : 0);
