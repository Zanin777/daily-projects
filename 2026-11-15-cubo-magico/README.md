# 🧊 Cubo Mágico

Um cubo mágico 3D no navegador, com giros animados, embaralhamento oficial de 20 movimentos e cronômetro de speedcubing.

## Como abrir

Abra o `index.html` no navegador. Não precisa instalar nada.

## Como jogar

- **Girar com o mouse:** **arraste** uma fileira ou coluna do cubo e ela gira na direção do arrasto (inclusive as do meio). **Clique** num adesivo para girar aquela face no sentido horário, ou `Shift` + clique para anti-horário. No celular funciona com o dedo.
- **Girar a vista:** arraste fora do cubo, ou com o botão direito em qualquer lugar. Gira livre em 360°, de cabeça para baixo inclusive.
- **Botões e teclado:** os 18 botões (`U`, `U'`, `U2`…) ou as teclas `U D L R F B M E S`, com `Shift` para anti-horário.
- **Sequência:** digite uma sequência em notação padrão, por exemplo `R U R' U'`, e clique em **Aplicar**.
- **Embaralhar:** aplica 20 movimentos aleatórios. O cronômetro começa no seu primeiro movimento e para quando o cubo fica resolvido. O melhor tempo fica salvo no navegador.
- **💡 Dica:** mostra o próximo movimento, diz em que fase do método você está e acende o botão do movimento.
- **Montar sozinho:** o cubo se monta animado pelo método de camadas, mostrando cada fase. Funciona a partir de qualquer estado, até de um cubo bagunçado à mão.
- **Desfazer** volta o último movimento e **Resetar** volta ao cubo novo.

## Notação

| Letra | Face | | Sufixo | Giro |
|-------|------|-|--------|------|
| `U` | cima (branca) | | nada | horário, olhando para a face |
| `D` | baixo (amarela) | | `'` | anti-horário |
| `F` | frente (verde) | | `2` | meia volta |
| `B` | trás (azul) | | | |
| `R` | direita (vermelha) | | | |
| `L` | esquerda (laranja) | | | |
| `M` | fatia do meio entre L e R (gira como o L) | | | |
| `E` | fatia do meio entre U e D (gira como o D) | | | |
| `S` | fatia do meio entre F e B (gira como o F) | | | |

## Como funciona

- **`cubo.js`: a lógica, sem nada de tela.** Cada uma das 26 peças guarda a posição (`x`, `y`, `z` entre -1 e 1) e a orientação (uma matriz 3x3 de inteiros). Girar uma face é multiplicar posição e orientação das 9 peças daquela camada por uma matriz de rotação de 90°. O cubo está resolvido quando cada lado tem uma cor só, mesmo que o cubo inteiro tenha virado com as fatias.
- **`app.js`: a tela.** Cada peça é uma `div` com 6 faces em CSS 3D (`transform-style: preserve-3d`). A posição vira um `translate3d` e a orientação vira um `matrix3d`. Para animar, o giro entra como `rotateX/Y/Z(0deg)` → `rotateX/Y/Z(90deg)` na frente do transform, e no fim a rotação é incorporada à matriz.
- **`resolvedor.js`: o método de camadas,** o mesmo que se ensina para iniciantes, começando pela face amarela (embaixo):
  1. cruz amarela, 2. cantos de baixo, 3. camada do meio, 4. cruz branca em cima, 5. meios de cima no lugar, 6. cantos de cima no lugar, 7. girar os cantos de cima.

  Por dentro, o cubo vira 54 adesivos, e cada giro (ou algoritmo inteiro, como `R U R' U'`) vira uma tabela "o adesivo da casa *i* vai para a casa *j*". Em cada fase, uma busca testa combinações de giros e algoritmos, olhando só os adesivos que importam naquela fase, até achar a mais curta que encaixa a peça sem desmanchar as anteriores. Resolve em poucos milissegundos, com uns 140 movimentos em média (o método de iniciante não é o mais curto, mas é o que dá para acompanhar).
- **Vista em 360°:** a vista é uma `DOMMatrix` acumulada. Cada arrasto gira em torno dos eixos da tela, então não existe limite nem "trava" de cabeça para baixo.
- **Arrastar uma camada:** para cada eixo possível, a peça clicada gira 5° de teste e o código mede para onde o adesivo andou na tela, já com a perspectiva. Vence o eixo cujo movimento combina mais com o arrasto, e o sinal diz o sentido.

## Testes

```bash
node teste.js
```

Os testes conferem a lógica: o sentido de cada giro bate com a notação oficial, cada face volta depois de 4 giros, o "sexy move" (`R U R' U'`) volta ao início depois de 6 repetições e qualquer embaralhamento seguido do inverso resolve o cubo. O resolvedor é testado em 300 embaralhamentos aleatórios, alguns com as fatias do meio fora do lugar.

Feito com HTML, CSS e JavaScript puro, sem bibliotecas.
