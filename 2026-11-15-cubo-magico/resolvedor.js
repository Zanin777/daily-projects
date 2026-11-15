// Resolvedor pelo método de camadas (o "método para iniciantes").
// Começa pela face de baixo (amarela) e termina na de cima (branca).
//
// Por dentro, o cubo vira 54 adesivos. Cada giro é uma tabela "o adesivo da casa i vai para a casa j",
// e uma sequência inteira (um algoritmo) também vira uma tabela só. Assim dá para procurar
// combinações de giros muito rápido, olhando só os adesivos que importam em cada fase.

const Resolvedor = (() => {
  const C = typeof Cubo !== 'undefined' ? Cubo : require('./cubo.js');

  // ---------- adesivos e tabelas de giro ----------

  const adesivos = []; // cada um: posição e direção no cubo resolvido, e a cor (letra da face)
  for (const p of C.novoEstado()) {
    for (const f in C.NORMAL) if (C.temAdesivo(p, f)) adesivos.push({ pos: p.casa, dir: C.NORMAL[f], cor: f });
  }
  const chave = (pos, dir) => pos.join() + '|' + dir.join();
  const casaDe = new Map(adesivos.map((a, i) => [chave(a.pos, a.dir), i]));
  const N = adesivos.length; // 54

  const MOVIMENTOS = {};
  for (const face in C.GIRO) {
    const [eixo, camada, sentido] = C.GIRO[face];
    for (const vezes of [1, -1, 2]) {
      const R = C.rot(eixo, sentido * 90 * vezes);
      const destino = new Uint8Array(N);
      adesivos.forEach((a, i) => {
        destino[i] = a.pos[C.EIXO[eixo]] === camada
          ? casaDe.get(chave(C.vezesVetor(R, a.pos), C.vezesVetor(R, a.dir)))
          : i;
      });
      MOVIMENTOS[C.nome({ face, vezes })] = destino;
    }
  }

  /** Junta uma sequência numa tabela só. */
  function tabela(seq) {
    let d = Uint8Array.from({ length: N }, (_, i) => i);
    for (const m of C.ler(seq)) {
      const t = MOVIMENTOS[C.nome(m)];
      d = d.map(s => t[s]);
    }
    return d;
  }

  // Algoritmos escritos para a frente F e a direita R. "noQuadro" troca as letras
  // para usar o mesmo algoritmo olhando para outra face (R, B ou L como frente).
  const LADOS = ['F', 'R', 'B', 'L'];
  const noQuadro = (alg, k) => alg.replace(/[FRBL]/g, c => LADOS[(LADOS.indexOf(c) + k) % 4]);

  const ALG = {
    sexy: "R U R' U'",                    // gira o canto da frente-direita
    meioDireita: "U R U' R' U' F' U F",   // leva o meio de cima-frente para frente-direita
    meioEsquerda: "U' L' U L U F U' F'",  // leva o meio de cima-frente para frente-esquerda
    cruzDeCima: "F R U R' U' F'",         // orienta os meios de cima
    sune: "R U R' U R U2 R'",             // troca meios de cima de lugar
    niklas: "U R U' L' U R' U' L",        // troca 3 cantos de cima de lugar
    torcerCanto: "R' D' R D",             // gira o canto de cima-frente-direita
  };

  const macro = (seq, grupo = null) => ({ seq, destino: tabela(seq), grupo });
  const giros = faces => [...faces].flatMap(f => [f, f + "'", f + '2'].map(s => macro(s, f)));
  const emQuatroLados = (alg, grupo) => [0, 1, 2, 3].map(k => macro(noQuadro(alg, k), grupo));

  // ---------- peças ----------

  const idsDaPeca = casa => adesivos.flatMap((a, i) => (a.pos.join() === casa.join() ? [i] : []));
  const pecas = (filtro) => C.novoEstado().map(p => p.casa).filter(filtro);
  const qtd = c => c.filter(Boolean).length;

  const CENTROS = pecas(c => qtd(c) === 1);
  const CRUZ = [[0, 1, 1], [1, 1, 0], [0, 1, -1], [-1, 1, 0]];
  const CANTOS_BAIXO = pecas(c => qtd(c) === 3 && c[1] === 1);
  const MEIOS_MEIO = pecas(c => qtd(c) === 2 && c[1] === 0);
  const MEIOS_CIMA = pecas(c => qtd(c) === 2 && c[1] === -1);
  const CANTOS_CIMA = pecas(c => qtd(c) === 3 && c[1] === -1);

  // ---------- busca ----------

  /**
   * Busca em profundidade crescente a menor combinação de macros que cumpre o objetivo.
   * "ids" são os adesivos acompanhados; o objetivo recebe as casas atuais deles.
   */
  function buscar(estado, ids, macros, objetivo, maxProf) {
    const inicio = ids.map(i => estado[i]);
    const caminho = [];
    const dfs = (casas, prof, ultimo) => {
      if (objetivo(casas)) return true;
      if (prof === 0) return false;
      for (const m of macros) {
        if (m.grupo && m.grupo === ultimo) continue;
        caminho.push(m);
        if (dfs(casas.map(s => m.destino[s]), prof - 1, m.grupo)) return true;
        caminho.pop();
      }
      return false;
    };
    for (let d = 0; d <= maxProf; d++) if (dfs(inicio, d, null)) return caminho;
    throw new Error('o resolvedor não achou um caminho (isso não devia acontecer)');
  }

  const emCasa = ids => casas => casas.every((s, j) => s === ids[j]);

  // ---------- resolver ----------

  function resolver(pecasDoJogo) {
    // estado[i] = casa onde está agora o adesivo i
    const estado = new Uint8Array(N);
    for (const p of pecasDoJogo) {
      for (const f in C.NORMAL) {
        if (!C.temAdesivo(p, f)) continue;
        estado[casaDe.get(chave(p.casa, C.NORMAL[f]))] = casaDe.get(chave(p.pos, C.vezesVetor(p.M, C.NORMAL[f])));
      }
    }

    const passos = [];
    const faz = (seq, fase) => {
      for (const m of C.ler(seq)) {
        const t = MOVIMENTOS[C.nome(m)];
        for (let i = 0; i < N; i++) estado[i] = t[estado[i]];
        passos.push({ ...m, fase });
      }
    };
    const resolverFase = (fase, ids, macros, objetivo, maxProf) =>
      buscar(estado, ids, macros, objetivo, maxProf).forEach(m => faz(m.seq, fase));

    const ids = casas => casas.flatMap(idsDaPeca);
    const FACES = giros('UDLRFB');
    const U = giros('U');

    // 0. centros no lugar (só muda algo se alguém usou M, E ou S)
    const idsCentros = ids(CENTROS);
    resolverFase('centros', idsCentros, giros('MES'), emCasa(idsCentros), 3);

    // 1. cruz amarela, um meio de cada vez sem desmanchar os anteriores
    let feitos = [];
    for (const meio of CRUZ) {
      feitos = [...feitos, ...idsDaPeca(meio)];
      resolverFase('cruz amarela', feitos, FACES, emCasa(feitos), 8);
    }

    // 2. cantos de baixo: subir o canto, girar o U até ficar em cima do lugar e repetir R U R' U'
    const sexy = emQuatroLados(ALG.sexy);
    for (const canto of CANTOS_BAIXO) {
      feitos = [...feitos, ...idsDaPeca(canto)];
      resolverFase('cantos de baixo', feitos, [...U, ...sexy], emCasa(feitos), 8);
    }

    // 3. camada do meio
    const insercoes = [...emQuatroLados(ALG.meioDireita), ...emQuatroLados(ALG.meioEsquerda)];
    for (const meio of MEIOS_MEIO) {
      feitos = [...feitos, ...idsDaPeca(meio)];
      resolverFase('camada do meio', feitos, [...U, ...insercoes], emCasa(feitos), 4);
    }

    // 4. cruz branca em cima: só a orientação dos meios de cima (adesivo branco para cima)
    const idsMeiosCima = ids(MEIOS_CIMA);
    const brancosDosMeios = idsMeiosCima.filter(i => adesivos[i].cor === 'U');
    const acompanhar = [...feitos, ...brancosDosMeios];
    const f2l = feitos.length;
    resolverFase('cruz branca', acompanhar, [...U, macro(ALG.cruzDeCima)],
      casas => emCasa(feitos)(casas.slice(0, f2l)) && casas.slice(f2l).every(s => adesivos[s].dir[1] === -1), 6);

    // 5. meios de cima no lugar
    feitos = [...feitos, ...idsMeiosCima];
    resolverFase('meios de cima', feitos, [...U, macro(ALG.sune)], emCasa(feitos), 8);

    // 6. cantos de cima no lugar certo (ainda podem estar girados)
    const cantosCima = CANTOS_CIMA.map(idsDaPeca);
    const umAdesivo = cantosCima.map(c => c[0]);
    const casaDoCanto = s => adesivos[s].pos.join();
    const base = feitos.length;
    resolverFase('cantos de cima no lugar', [...feitos, ...umAdesivo], emQuatroLados(ALG.niklas),
      casas => emCasa(feitos)(casas.slice(0, base)) &&
        casas.slice(base).every((s, j) => casaDoCanto(s) === adesivos[umAdesivo[j]].pos.join()), 4);

    // 7. girar os cantos de cima: R' D' R D no canto da frente-direita até o branco ficar em cima, depois U
    const brancoEmCima = () => {
      const casaFrenteDireita = casaDe.get(chave([1, -1, 1], [0, -1, 0]));
      const i = estado.indexOf(casaFrenteDireita);
      return adesivos[i].cor === 'U';
    };
    for (let k = 0; k < 4; k++) {
      for (let tentativa = 0; tentativa < 6 && !brancoEmCima(); tentativa++) faz(ALG.torcerCanto, 'girar cantos de cima');
      faz('U', 'girar cantos de cima');
    }

    if (!estado.every((s, i) => s === i)) throw new Error('o resolvedor terminou com o cubo desmontado');
    return simplificar(passos);
  }

  /** Junta giros seguidos da mesma face: U U vira U2, R R' some. */
  function simplificar(passos) {
    const saida = [];
    for (const p of passos) {
      const ult = saida[saida.length - 1];
      if (ult && ult.face === p.face) {
        const q = (((ult.vezes + 4) % 4) + ((p.vezes + 4) % 4)) % 4;
        if (q === 0) saida.pop();
        else ult.vezes = q === 3 ? -1 : q;
      } else {
        saida.push({ ...p });
      }
    }
    return saida;
  }

  return { resolver };
})();

if (typeof module !== 'undefined') module.exports = Resolvedor;
