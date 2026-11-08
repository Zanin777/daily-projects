# 🧬 Jogo da Vida

O [Jogo da Vida de Conway](https://pt.wikipedia.org/wiki/Jogo_da_vida) animado direto no terminal.

Cada célula do tabuleiro está viva ou morta. A cada geração:

- uma célula morta com **3** vizinhas vivas **nasce**;
- uma célula viva com **2 ou 3** vizinhas **sobrevive**;
- todas as outras morrem ou continuam mortas.

São só essas regras, e mesmo assim aparecem padrões que andam, piscam e até "atiram" outros padrões.

## Como rodar

Precisa de Python 3.9+, sem instalar nada.

```bash
python vida.py              # começa aleatório
python vida.py canhao       # canhão de gliders de Gosper
python vida.py pulsar --fps 5
python vida.py --semente 42 --densidade 0.35
```

No Windows, use `py` no lugar de `python` se for o caso. Para sair, aperte `Ctrl+C`.

## Padrões

| Nome | O que faz |
|------|-----------|
| `aleatorio` | Tabuleiro sorteado (`--densidade`, `--semente`) |
| `glider` | Anda na diagonal para sempre |
| `nave` | Nave leve: anda na horizontal |
| `pulsar` | Oscila com período 3 |
| `canhao` | Canhão de Gosper: cria um glider novo a cada 30 gerações |
| `rpentomino` | Só 5 células, mas viram caos por mais de 1000 gerações num tabuleiro infinito |

## Detalhes

- O tabuleiro ocupa o terminal inteiro e é **toroidal**: o que sai por uma borda volta pela outra.
- Cada caractere desenha **duas** células (`▀ ▄ █`), assim elas ficam quase quadradas.
- Só as células vivas ficam guardadas (num `set`), então o custo depende de quantas existem, não do tamanho do tabuleiro.

## Testes

```bash
python -m unittest
```

Os testes conferem padrões conhecidos: o bloco fica parado, o pisca-pisca alterna, o glider anda 1 casa na diagonal a cada 4 gerações, o pulsar volta ao início em 3 gerações e o canhão solta um glider em 30.

Feito com Python puro, só biblioteca padrão.
