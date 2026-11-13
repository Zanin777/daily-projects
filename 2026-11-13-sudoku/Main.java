import java.util.Map;
import java.util.Random;

public class Main {

    static final Map<String, String> EXEMPLOS = Map.of(
            "facil", "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
            "dificil", "4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......");

    static final Map<String, Integer> PISTAS = Map.of("facil", 40, "medio", 32, "dificil", 26);

    public static void main(String[] args) throws Exception {
        boolean rapido = false;
        int atraso = 25;
        Long semente = null;
        java.util.List<String> pos = new java.util.ArrayList<>();
        try {
            for (int k = 0; k < args.length; k++) {
                switch (args[k]) {
                    case "--rapido" -> rapido = true;
                    case "--atraso" -> atraso = Integer.parseInt(proximo(args, ++k));
                    case "--semente" -> semente = Long.parseLong(proximo(args, ++k));
                    default -> pos.add(args[k]);
                }
            }
            String cmd = pos.isEmpty() ? "resolver" : pos.get(0);
            String alvo = pos.size() > 1 ? pos.get(1) : "dificil"; // o fácil se resolve sem voltar, então não mostra o backtracking

            switch (cmd) {
                case "resolver" -> resolver(Sudoku.ler(EXEMPLOS.getOrDefault(alvo, alvo)), rapido, atraso);
                case "gerar" -> gerar(alvo, semente == null ? new Random() : new Random(semente), rapido, atraso);
                default -> ajuda();
            }
        } catch (NumberFormatException e) {
            System.err.println("Erro: --atraso e --semente esperam um número");
            System.exit(1);
        } catch (IllegalArgumentException e) {
            System.err.println("Erro: " + e.getMessage());
            System.exit(1);
        }
    }

    static String proximo(String[] args, int k) {
        if (k >= args.length) throw new IllegalArgumentException("faltou o valor de " + args[k - 1]);
        return args[k];
    }

    static void resolver(Sudoku s, boolean rapido, int atraso) throws InterruptedException {
        System.out.println("Sudoku com " + s.pistas() + " pistas:\n" + s.desenhar(-1, false, true));
        if (rapido) {
            long t0 = System.nanoTime();
            boolean ok = s.resolver(null);
            System.out.printf("%s em %.1f ms%n", ok ? "Resolvido" : "Sem solução", (System.nanoTime() - t0) / 1e6);
        } else {
            Thread.sleep(800);
            System.out.print("\u001b[2J\u001b[?25l"); // limpa a tela e esconde o cursor
            Runtime.getRuntime().addShutdownHook(new Thread(() -> System.out.print("\u001b[0m\u001b[?25h")));
            boolean ok = s.resolver((t, casa, voltou) -> {
                System.out.print("\u001b[H" + t.desenhar(casa, voltou, true)
                        + "tentativas " + t.tentativas + "  |  voltas " + t.voltas + "      \n");
                dormir(atraso);
            });
            System.out.print("\u001b[H" + s.desenhar(-1, false, true));
            System.out.println(ok ? "Resolvido!" : "Sem solução.");
        }
        System.out.println("tentativas " + s.tentativas + "  |  voltas " + s.voltas);
    }

    static void gerar(String nivel, Random rnd, boolean rapido, int atraso) throws InterruptedException {
        Integer pistas = PISTAS.get(nivel);
        if (pistas == null) throw new IllegalArgumentException("nível deve ser facil, medio ou dificil");
        Sudoku s = Sudoku.gerar(pistas, rnd);
        System.out.println("Novo sudoku (" + nivel + "), para jogar no papel ou resolver depois:");
        System.out.println(s.linha() + "\n");
        resolver(s, rapido, atraso);
    }

    static void dormir(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    static void ajuda() {
        System.out.println("""
                Uso:
                  java Main.java resolver [facil|dificil|<81 dígitos>]  [--rapido] [--atraso ms]
                  java Main.java gerar    [facil|medio|dificil]          [--rapido] [--atraso ms] [--semente n]
                """);
    }
}
