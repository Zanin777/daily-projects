# 🎹 Laboratório de Música

Aprenda teoria musical tocando: um piano, um violão e uma bateria no navegador. Todos os sons são gerados na hora com a Web Audio API, sem nenhum arquivo de áudio.

## Lições

1. **As notas e o piano**: piano de 3 oitavas para tocar com o mouse, o toque ou o teclado do computador (`A S D F G H J K` = teclas brancas, `W E T Y U` = pretas, `Z`/`X` = oitava). Os nomes aparecem em Dó-Ré-Mi ou em cifra.
2. **Escalas**: maior, menor natural, pentatônicas e blues em qualquer tônica, com os graus, a fórmula de tons e semitons e a escala tocando.
3. **Acordes**: 8 tipos (maior, menor, sétima, sétima maior, menor com sétima, diminuto, aumentado, sus4) no piano e no braço do violão. Também tem o campo harmônico do tom escolhido e progressões famosas (pop, rock, anos 50, jazz) tocando em loop.
4. **Violão**: braço de 12 casas clicável com som de corda dedilhada (síntese Karplus-Strong) e os 9 acordes abertos mais usados.
5. **Ritmo**: bateria de 16 passos (bumbo, caixa, chimbal, chimbal aberto e palmas), com controle de BPM e ritmos prontos (rock, dance, hip-hop e reggae).
6. **Treino de ouvido**: "Sobe ou desce?", "Maior ou menor?" e "Que nota é essa?", com placar e recorde.

O equalizador do topo reage ao som de verdade, por meio de um analisador de frequências.

## Por dentro

- `music.js`: a teoria (grafia correta das notas em cada tom, escalas, acordes e campo harmônico) e o motor de som (piano por harmônicos, violão por Karplus-Strong e bateria sintetizada).
- A teoria foi testada nas 24 escalas maiores e menores (cada uma usa as 7 letras uma vez só, então Fá maior tem Si♭), em acordes como F♯7, B° e C+, e nos 9 desenhos de acordes do violão, que têm exatamente as notas do acorde.

## Como abrir

Abra o `index.html` no navegador e ligue o som. Não precisa instalar nada.

Feito com HTML, CSS e JavaScript puro, sem bibliotecas.
