import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/** Tabuleiro 9x9 guardado num array de 81 casas (0 = vazia). */
public final class Sudoku {

    /** Recebe cada passo do resolvedor: um número colocado ou apagado (voltou = true). */
    public interface Observador {
        void passo(Sudoku s, int casa, boolean voltou);
    }

    final int[] c = new int[81];
    final boolean[] fixa = new boolean[81];
    long tentativas, voltas;

    /** Lê 81 dígitos; 0 ou . é casa vazia, o resto (espaços, quebras, |) é ignorado. */
    public static Sudoku ler(String texto) {
        String d = texto.replaceAll("[^0-9.]", "");
        if (d.length() != 81) {
            throw new IllegalArgumentException("o sudoku precisa de 81 dígitos (0 ou . para vazio), veio " + d.length());
        }
        Sudoku s = new Sudoku();
        for (int i = 0; i < 81; i++) {
            char ch = d.charAt(i);
            s.c[i] = ch == '.' ? 0 : ch - '0';
            s.fixa[i] = s.c[i] != 0;
        }
        for (int i = 0; i < 81; i++) {
            int v = s.c[i];
            if (v == 0) continue;
            s.c[i] = 0;
            boolean ok = s.pode(i, v);
            s.c[i] = v;
            if (!ok) {
                throw new IllegalArgumentException("o " + v + " da linha " + (i / 9 + 1) + ", coluna " + (i % 9 + 1) + " está repetido");
            }
        }
        return s;
    }

    /** O número v pode ir na casa i sem repetir na linha, coluna ou quadrado? */
    boolean pode(int i, int v) {
        int lin = i / 9, col = i % 9, ql = lin / 3 * 3, qc = col / 3 * 3;
        for (int k = 0; k < 9; k++) {
            if (c[lin * 9 + k] == v || c[k * 9 + col] == v || c[(ql + k / 3) * 9 + qc + k % 3] == v) {
                return false;
            }
        }
        return true;
    }

    /** Casa vazia com menos opções (-1 se o tabuleiro está cheio). Começar pela mais apertada poda muito a busca. */
    private int escolherCasa() {
        int melhor = -1, menor = 10;
        for (int i = 0; i < 81; i++) {
            if (c[i] != 0) continue;
            int n = 0;
            for (int v = 1; v <= 9; v++) if (pode(i, v)) n++;
            if (n < menor) {
                menor = n;
                melhor = i;
                if (n <= 1) break;
            }
        }
        return melhor;
    }

    /** Backtracking: tenta um número, segue em frente e, se travar, apaga e tenta o próximo. */
    public boolean resolver(Observador obs) {
        return resolver(obs, null);
    }

    private boolean resolver(Observador obs, Random rnd) {
        int i = escolherCasa();
        if (i < 0) return true;
        for (int v : ordem(rnd)) {
            if (!pode(i, v)) continue;
            c[i] = v;
            tentativas++;
            if (obs != null) obs.passo(this, i, false);
            if (resolver(obs, rnd)) return true;
            c[i] = 0;
            voltas++;
            if (obs != null) obs.passo(this, i, true);
        }
        return false;
    }

    private static List<Integer> ordem(Random rnd) {
        List<Integer> l = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6, 7, 8, 9));
        if (rnd != null) Collections.shuffle(l, rnd);
        return l;
    }

    /** Conta soluções até o limite (para checar se a solução é única). */
    int contarSolucoes(int limite) {
        int i = escolherCasa();
        if (i < 0) return 1;
        int total = 0;
        for (int v = 1; v <= 9 && total < limite; v++) {
            if (!pode(i, v)) continue;
            c[i] = v;
            total += contarSolucoes(limite - total);
            c[i] = 0;
        }
        return total;
    }

    /** Gera um sudoku com solução única: preenche um tabuleiro aleatório e vai tirando números enquanto a solução continuar única. */
    public static Sudoku gerar(int pistas, Random rnd) {
        Sudoku s = new Sudoku();
        s.resolver(null, rnd);
        List<Integer> casas = new ArrayList<>();
        for (int i = 0; i < 81; i++) casas.add(i);
        Collections.shuffle(casas, rnd);
        int restantes = 81;
        for (int i : casas) {
            if (restantes <= pistas) break;
            int v = s.c[i];
            s.c[i] = 0;
            if (s.contarSolucoes(2) == 1) restantes--;
            else s.c[i] = v;
        }
        for (int i = 0; i < 81; i++) s.fixa[i] = s.c[i] != 0;
        s.tentativas = s.voltas = 0;
        return s;
    }

    public int pistas() {
        int n = 0;
        for (int v : c) if (v != 0) n++;
        return n;
    }

    /** 81 caracteres, com . nas casas vazias: dá para colar de volta no "resolver". */
    public String linha() {
        StringBuilder sb = new StringBuilder();
        for (int v : c) sb.append(v == 0 ? '.' : (char) ('0' + v));
        return sb.toString();
    }

    private static final String NEGRITO = "\u001b[1m", CIANO = "\u001b[36m", VERDE = "\u001b[30;42m",
            VERMELHO = "\u001b[30;41m", CINZA = "\u001b[90m", FIM = "\u001b[0m";

    /** Desenha o tabuleiro. Pistas em negrito, números do resolvedor em ciano e a casa do passo atual destacada. */
    public String desenhar(int destaque, boolean voltou, boolean cores) {
        StringBuilder sb = new StringBuilder();
        String borda = "+-------+-------+-------+\n";
        for (int lin = 0; lin < 9; lin++) {
            if (lin % 3 == 0) sb.append(borda);
            for (int col = 0; col < 9; col++) {
                if (col % 3 == 0) sb.append("| ");
                int i = lin * 9 + col, v = c[i];
                String txt = v == 0 ? "." : String.valueOf(v);
                if (!cores) sb.append(txt);
                else if (i == destaque) sb.append(voltou ? VERMELHO + "x" : VERDE + txt).append(FIM);
                else if (v == 0) sb.append(CINZA).append(txt).append(FIM);
                else sb.append(fixa[i] ? NEGRITO : CIANO).append(txt).append(FIM);
                sb.append(' ');
            }
            sb.append("|\n");
        }
        return sb.append(borda).toString();
    }

    public Sudoku copia() {
        Sudoku s = new Sudoku();
        System.arraycopy(c, 0, s.c, 0, 81);
        System.arraycopy(fixa, 0, s.fixa, 0, 81);
        return s;
    }
}
