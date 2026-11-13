# 🔢 Sudoku

Resolvedor e gerador de Sudoku no terminal, com **animação do backtracking**: dá para ver o algoritmo colocando números (verde), batendo num beco sem saída e apagando (vermelho) até achar a solução.

## Como rodar

Precisa de Java 22+ (roda direto do código, sem compilar antes).

```bash
java Main.java                          # resolve o exemplo difícil, animado
java Main.java resolver facil
java Main.java resolver dificil --rapido   # sem animação, mostra o tempo
java Main.java gerar medio              # cria um sudoku novo e resolve
java Main.java gerar dificil --semente 3
java Main.java resolver "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79"
```

Opções: `--atraso ms` muda a velocidade da animação (padrão 25), `--rapido` pula a animação e `--semente n` repete o mesmo sudoku gerado.

O sudoku pode ser passado com `0` ou `.` nas casas vazias. Espaços, quebras de linha e `|` são ignorados.

## Como funciona

**Resolver** (`Sudoku.resolver`): backtracking. Escolhe uma casa vazia, tenta um número válido e segue. Se mais à frente nenhuma casa aceitar número, volta e tenta o próximo. O truque que deixa rápido é sempre escolher **a casa com menos opções**: o exemplo difícil (17 pistas, o mínimo possível) sai em poucos milissegundos.

**Gerar** (`Sudoku.gerar`): preenche um tabuleiro vazio com números em ordem aleatória e depois vai apagando casas, uma por vez, **só se a solução continuar única**. Para quando chega no número de pistas do nível:

| Nível | Pistas |
|-------|--------|
| facil | 40 |
| medio | 32 |
| dificil | 26 (ou o mínimo que der com solução única) |

## Testes

```bash
java SudokuTest.java
```

Sem biblioteca de testes: confere a solução conhecida do exemplo fácil, valida a do difícil, detecta sudoku sem solução, recusa entradas inválidas e garante que os sudokus gerados têm solução única.

Feito com Java puro, sem dependências.
