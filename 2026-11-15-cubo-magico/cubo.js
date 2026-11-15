// Lógica do cubo, sem DOM: roda no navegador e no Node (para os testes).
//
// Coordenadas iguais às do CSS: x para a direita, y para BAIXO, z na direção de quem olha.
// Cada peça guarda a posição atual (-1, 0 ou 1 em cada eixo) e a orientação (matriz 3x3 de inteiros).

const Cubo = (() => {
  // Para cada face: eixo, camada e sentido do giro horário olhando de frente para a face.
  // No CSS, ângulo positivo é horário olhando da ponta do eixo para a origem.
  const GIRO = {
    U: ['y', -1, -1], D: ['y', 1, 1],
    L: ['x', -1, -1], R: ['x', 1, 1],
    F: ['z', 1, 1],   B: ['z', -1, -1],
    // fatias do meio: M segue o L, E segue o D, S segue o F
    M: ['x', 0, -1],  E: ['y', 0, 1],   S: ['z', 0, 1],
  };
  const EIXO = { x: 0, y: 1, z: 2 };
  const IDENTIDADE = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  // para onde aponta cada face (y para baixo, então U é y = -1)
  const NORMAL = { U: [0, -1, 0], D: [0, 1, 0], L: [-1, 0, 0], R: [1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };

  /** A peça tem adesivo nessa face se, no cubo resolvido, a face aponta para fora. */
  const temAdesivo = (p, f) => NORMAL[f].every((n, i) => n === 0 || n === p.casa[i]);

  function rot(eixo, graus) {
    const c = Math.round(Math.cos(graus * Math.PI / 180));
    const s = Math.round(Math.sin(graus * Math.PI / 180));
    if (eixo === 'x') return [[1, 0, 0], [0, c, -s], [0, s, c]];
    if (eixo === 'y') return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
  }

  // "+ 0" troca -0 por 0 (o JS gera -0 em 0 * -1)
  const mul = (A, B) => A.map((linha, i) => [0, 1, 2].map(j => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j] + 0));
  const vezesVetor = (A, v) => A.map(l => l[0] * v[0] + l[1] * v[1] + l[2] * v[2] + 0);

  /** 26 peças (o miolo não aparece). */
  function novoEstado() {
    const pecas = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++)
          if (x || y || z) pecas.push({ casa: [x, y, z], pos: [x, y, z], M: IDENTIDADE });
    return pecas;
  }

  /** Separa o giro em duas partes para a interface animar antes de aplicar. */
  function prepararGiro(pecas, mov) {
    const [eixo, camada, sentido] = GIRO[mov.face];
    return {
      eixo,
      graus: sentido * 90 * mov.vezes,
      afetadas: pecas.filter(p => p.pos[EIXO[eixo]] === camada),
    };
  }

  function aplicarGiro({ eixo, graus, afetadas }) {
    const R = rot(eixo, graus);
    for (const p of afetadas) {
      p.pos = vezesVetor(R, p.pos);
      p.M = mul(R, p.M);
    }
  }

  const girar = (pecas, mov) => aplicarGiro(prepararGiro(pecas, mov));

  /** Resolvido = cada lado do cubo com uma cor só (vale mesmo se o cubo inteiro estiver virado). */
  function resolvido(pecas) {
    const corDoLado = {};
    for (const p of pecas) {
      for (const f in NORMAL) {
        if (!temAdesivo(p, f)) continue;
        const lado = vezesVetor(p.M, NORMAL[f]).join();
        if ((corDoLado[lado] ??= f) !== f) return false;
      }
    }
    return true;
  }

  /** Lê notação padrão: "R U R' U'", "F2 B", "RUR'U'", "M2 E S'". */
  function ler(texto) {
    const limpo = texto.replace(/\s+/g, '').replace(/[’´`]/g, "'");
    const movs = [...limpo.matchAll(/([UDLRFBMES])(2|')?/g)];
    const lido = movs.map(m => m[0]).join('');
    if (lido !== limpo) {
      const ruim = limpo.slice(lido.length).match(/^[^UDLRFBMES]*.?/)[0] || limpo.slice(lido.length);
      throw new Error(`não entendi "${ruim}". Use U D L R F B (ou M E S), com ' ou 2 (ex.: R U R' U')`);
    }
    return movs.map(m => ({ face: m[1], vezes: m[2] === '2' ? 2 : m[2] ? -1 : 1 }));
  }

  const nome = m => m.face + (m.vezes === 2 ? '2' : m.vezes === -1 ? "'" : '');
  const inverso = m => ({ face: m.face, vezes: m.vezes === 2 ? 2 : -m.vezes });

  /** Embaralhamento de 20 movimentos, sem repetir a face anterior nem girar a face oposta no meio (ex.: R L R). */
  function embaralhar(n = 20, aleatorio = Math.random) {
    const faces = Object.keys(NORMAL); // embaralhamento oficial só usa as 6 faces
    const movs = [];
    while (movs.length < n) {
      const face = faces[Math.floor(aleatorio() * 6)];
      const ult = movs[movs.length - 1], penult = movs[movs.length - 2];
      if (ult && ult.face === face) continue;
      if (ult && penult && penult.face === face && GIRO[ult.face][0] === GIRO[face][0]) continue;
      movs.push({ face, vezes: [1, -1, 2][Math.floor(aleatorio() * 3)] });
    }
    return movs;
  }

  return { GIRO, EIXO, NORMAL, rot, temAdesivo, vezesVetor, novoEstado, prepararGiro, aplicarGiro, girar, resolvido, ler, nome, inverso, embaralhar };
})();

if (typeof module !== 'undefined') module.exports = Cubo;
