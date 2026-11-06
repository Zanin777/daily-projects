# ♞ Aprenda Xadrez

Site interativo para quem nunca jogou xadrez. Tudo é ensinado num tabuleiro de verdade, e no final dá para jogar uma partida completa.

## Lições (`index.html`)

1. **Antes de começar**: o tabuleiro, as peças no lugar e as regras gerais, com um treino de coordenadas.
2. **Como cada peça se move**: clique e mova as peças. O site mostra onde cada uma pode ir e capturar, e a promoção abre um menu de escolha.
3. **Jogadas especiais**: roque, en passant e promoção.
4. **Valor das peças**.
5. **Xeque, xeque-mate e afogamento**: Mate do Louco, Mate do Pastor e Mate do corredor.
6. **Como a partida termina**: vitória e todos os tipos de empate.
7. **Táticas básicas**: garfo, cravada, espeto e ataque descoberto.
8. **Aberturas**: Italiana, Gambito da Dama, Siciliana e Caro-Kann.
9. **Dicas de ouro** e **Você sabia?**

## Jogar (`jogar.html`)

- Contra o computador (fácil, médio e difícil) ou 2 jogadores no mesmo aparelho.
- Todas as regras: xeque, mate, roque, en passant, promoção, afogamento, repetição tripla, regra dos 50 lances e material insuficiente.
- Arrastar ou clicar, desfazer, virar o tabuleiro, dica, desistir e 3 temas de tabuleiro.

O motor de xadrez (`engine.js`) foi validado com testes perft oficiais.

## Como abrir

Abra o `index.html` no navegador. Não precisa instalar nada.

As peças deslizam e cada lance tem som. Os sons são gerados com a Web Audio API, sem arquivos de áudio (veja `sons/LEIA-ME.md` para usar os seus).

Feito com HTML, CSS e JavaScript puro, sem bibliotecas.
