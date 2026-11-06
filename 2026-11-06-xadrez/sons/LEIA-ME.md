# Sons próprios (opcional)

Por padrão o site gera os sons na hora, pelo navegador (Web Audio), sem nenhum arquivo.

Para usar seus próprios sons:

1. Coloque os arquivos nesta pasta (ex.: `lance.mp3`, `captura.mp3`, `xeque.mp3`, `promocao.mp3`).
2. No começo da seção "Sons" do `app.js`, preencha o `SOUND_FILES`:

```js
const SOUND_FILES = {
  move: "sons/lance.mp3",
  capture: "sons/captura.mp3",
  check: "sons/xeque.mp3",
  promote: "sons/promocao.mp3",
};
```

Os que ficarem vazios continuam usando o som gerado.

⚠️ Use só sons que você tem direito de usar: gravados por você ou com licença livre (por exemplo, CC0).
Os sons de sites como o chess.com pertencem a eles e não podem ser copiados para um projeto público.
