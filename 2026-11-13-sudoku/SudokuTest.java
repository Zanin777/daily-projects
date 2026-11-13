import java.util.Random;

/** Testes sem biblioteca: rode com  java SudokuTest.java  (sai com código 1 se algum falhar). */
public class SudokuTest {

    static int falhas = 0;

    public static void main(String[] args) {
        teste("resolve o exemplo fácil com a solução conhecida", () -> {
            Sudoku s = Sudoku.ler(Main.EXEMPLOS.get("facil"));
            return s.resolver(null) && s.linha().equals(
                    "534678912672195348198342567859761423426853791713924856961537284287419635345286179");
        });
        teste("resolve o exemplo difícil e a solução é válida", () -> {
            Sudoku s = Sudoku.ler(Main.EXEMPLOS.get("dificil"));
            Sudoku original = s.copia();
            return s.resolver(null) && valido(s) && mantemPistas(original, s);
        });
        teste("detecta sudoku sem solução", () -> {
            // a casa (1,9) não aceita nada: a linha tem 1 a 8 e a coluna tem o 9
            Sudoku s = Sudoku.ler("12345678." + ".".repeat(8) + "9" + ".".repeat(63));
            return !s.resolver(null);
        });
        teste("recusa número repetido na entrada", () -> erro("11" + ".".repeat(79)));
        teste("recusa entrada com tamanho errado", () -> erro("123"));
        for (String nivel : Main.PISTAS.keySet()) {
            teste("gera sudoku " + nivel + " com solução única", () -> {
                Sudoku s = Sudoku.gerar(Main.PISTAS.get(nivel), new Random(7));
                Sudoku original = s.copia();
                return s.pistas() >= Main.PISTAS.get(nivel) && s.copia().contarSolucoes(2) == 1
                        && s.resolver(null) && valido(s) && mantemPistas(original, s);
            });
        }

        System.out.println(falhas == 0 ? "\nTodos os testes passaram." : "\n" + falhas + " teste(s) falharam.");
        System.exit(falhas == 0 ? 0 : 1);
    }

    /** Toda linha, coluna e quadrado tem 1 a 9 sem repetir. */
    static boolean valido(Sudoku s) {
        for (int g = 0; g < 9; g++) {
            int lin = 0, col = 0, quad = 0;
            for (int k = 0; k < 9; k++) {
                lin |= 1 << s.c[g * 9 + k];
                col |= 1 << s.c[k * 9 + g];
                quad |= 1 << s.c[(g / 3 * 3 + k / 3) * 9 + g % 3 * 3 + k % 3];
            }
            if (lin != 0x3FE || col != 0x3FE || quad != 0x3FE) return false;
        }
        return true;
    }

    static boolean mantemPistas(Sudoku antes, Sudoku depois) {
        for (int i = 0; i < 81; i++) if (antes.c[i] != 0 && antes.c[i] != depois.c[i]) return false;
        return true;
    }

    static boolean erro(String entrada) {
        try {
            Sudoku.ler(entrada);
            return false;
        } catch (IllegalArgumentException e) {
            return true;
        }
    }

    static void teste(String nome, java.util.function.BooleanSupplier t) {
        boolean ok = t.getAsBoolean();
        if (!ok) falhas++;
        System.out.println((ok ? "  ok    " : "  FALHA ") + nome);
    }
}
