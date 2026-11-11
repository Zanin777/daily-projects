# ♠️ Escola de Poker

Site interativo que ensina Texas Hold'em do zero. Só fichas de mentira: é para aprender, não para apostar.

## Lições

1. **O baralho e o objetivo**: naipes, valores, 2 cartas suas + 5 da mesa e o Ás alto ou baixo.
2. **Ranking das mãos**: as 10 mãos com cartas de exemplo, a chance de cada uma com 7 cartas e como funciona o desempate pelo kicker.
3. **Uma mão do começo ao fim**: uma mesa com 4 jogadores, passo a passo (blinds, pré-flop, flop, turn, river e showdown), e um modo de mãos aleatórias.
4. **Ações**: passar, apostar, pagar, aumentar, desistir e all-in.
5. **Posições**: uma mesa de 6 lugares clicável, com o botão girando e a ordem de quem fala antes e depois do flop.
6. **Treino**: "Quem ganha?" e "Qual é essa mão?", com placar, sequência e recorde.
7. **Outs**: calculadora com a chance exata e a regra do 4 e do 2.

Além disso, há um glossário com busca, dicas para iniciantes e um aviso de jogo responsável.

## Por dentro

O avaliador de mãos (`cards.js`) escolhe a melhor mão de 5 cartas entre 7 e resolve todos os desempates. Ele foi testado contando as 2.598.960 mãos possíveis de 5 cartas, e o resultado bate exatamente com os números oficiais de cada categoria.

Os sons (cartas e fichas) são gerados na hora com a Web Audio API, sem arquivos.

## Como abrir

Abra o `index.html` no navegador. Não precisa instalar nada.

Feito com HTML, CSS e JavaScript puro, sem bibliotecas.
