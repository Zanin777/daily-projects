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

## Jogue contra o computador

No final da página há uma mesa de No-Limit Texas Hold'em: você contra 3 adversários do computador, com 1.000 fichas de mentira cada e blinds de 5/10.

- **3 níveis.** O **Fácil** lê mal a própria mão e paga quase tudo. O **Médio** calcula a chance de ganhar (simulando centenas de mãos) e respeita as pot odds. O **Difícil** faz mais simulações, aposta forte, faz semi-blefes e às vezes disfarça uma mão forte.
- **Regras completas:** blinds, aumento mínimo, all-in, potes paralelos (side pots), devolução de aposta que ninguém pagou e divisão do pote em empate.
- **Dica opcional** com a sua chance de ganhar comparada às pot odds, ligando com a lição de outs.

O motor do jogo (`game.js`) foi testado com milhares de mãos entre bots, conferindo que as fichas nunca somem nem aparecem.

## Por dentro

O avaliador de mãos (`cards.js`) escolhe a melhor mão de 5 cartas entre 7 e resolve todos os desempates. Ele foi testado contando as 2.598.960 mãos possíveis de 5 cartas, e o resultado bate exatamente com os números oficiais de cada categoria.

Os sons (cartas e fichas) são gerados na hora com a Web Audio API, sem arquivos.

## Como abrir

Abra o `index.html` no navegador. Não precisa instalar nada.

Feito com HTML, CSS e JavaScript puro, sem bibliotecas.
