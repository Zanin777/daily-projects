"""Jogo da Vida de Conway no terminal. Só biblioteca padrão."""

import argparse
import os
import random
import shutil
import sys
import time

# Padrões clássicos como (linha, coluna) das células vivas.
PADROES = {
    "glider": [(0, 1), (1, 2), (2, 0), (2, 1), (2, 2)],
    "pulsar": [
        (r, c)
        for a in (0, 5, 7, 12)
        for b in (2, 3, 4, 8, 9, 10)
        for r, c in ((a, b), (b, a))
    ],
    "nave": [(0, 1), (0, 4), (1, 0), (2, 0), (2, 4), (3, 0), (3, 1), (3, 2), (3, 3)],
    "canhao": [  # canhão de gliders de Gosper: dispara um glider a cada 30 gerações
        (4, 0), (4, 1), (5, 0), (5, 1),
        (4, 10), (5, 10), (6, 10), (3, 11), (7, 11), (2, 12), (8, 12), (2, 13), (8, 13),
        (5, 14), (3, 15), (7, 15), (4, 16), (5, 16), (6, 16), (5, 17),
        (2, 20), (3, 20), (4, 20), (2, 21), (3, 21), (4, 21), (1, 22), (5, 22),
        (0, 24), (1, 24), (5, 24), (6, 24),
        (2, 34), (3, 34), (2, 35), (3, 35),
    ],
    "rpentomino": [(0, 1), (0, 2), (1, 0), (1, 1), (2, 1)],
}


def passo(vivas, linhas, colunas):
    """Calcula a próxima geração. O tabuleiro é toroidal (as bordas se conectam)."""
    vizinhos = {}
    for r, c in vivas:
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr or dc:
                    p = ((r + dr) % linhas, (c + dc) % colunas)
                    vizinhos[p] = vizinhos.get(p, 0) + 1
    # Nasce com 3 vizinhos; sobrevive com 2 ou 3.
    return {p for p, n in vizinhos.items() if n == 3 or (n == 2 and p in vivas)}


def colocar(padrao, linhas, colunas):
    """Centraliza um padrão no tabuleiro."""
    altura = max(r for r, _ in padrao) + 1
    largura = max(c for _, c in padrao) + 1
    r0, c0 = (linhas - altura) // 2, (colunas - largura) // 2
    return {((r + r0) % linhas, (c + c0) % colunas) for r, c in padrao}


def desenhar(vivas, linhas, colunas, geracao):
    # Duas linhas de célula por caractere (▀ ▄ █) deixam as células quase quadradas.
    saida = ["\x1b[H"]
    for r in range(0, linhas, 2):
        linha = []
        for c in range(colunas):
            cima, baixo = (r, c) in vivas, (r + 1, c) in vivas
            linha.append("█" if cima and baixo else "▀" if cima else "▄" if baixo else " ")
        saida.append("".join(linha) + "\n")
    saida.append(f"\x1b[7m geração {geracao:>5} │ vivas {len(vivas):>5} │ Ctrl+C para sair \x1b[0m")
    sys.stdout.write("".join(saida))
    sys.stdout.flush()


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # acentos e ▀▄█ no console do Windows
    parser = argparse.ArgumentParser(description="Jogo da Vida de Conway no terminal.")
    parser.add_argument("padrao", nargs="?", default="aleatorio",
                        choices=["aleatorio", *PADROES], help="padrão inicial (padrão: aleatorio)")
    parser.add_argument("--fps", type=float, default=12, help="gerações por segundo")
    parser.add_argument("--densidade", type=float, default=0.25, help="chance de célula viva no modo aleatório")
    parser.add_argument("--semente", type=int, help="semente do modo aleatório, para repetir um resultado")
    args = parser.parse_args()
    if args.fps <= 0 or not 0 < args.densidade < 1:
        parser.error("--fps deve ser > 0 e --densidade entre 0 e 1")

    tam = shutil.get_terminal_size(fallback=(80, 24))
    colunas, linhas = tam.columns, (tam.lines - 1) * 2

    if args.padrao == "aleatorio":
        rng = random.Random(args.semente)
        vivas = {(r, c) for r in range(linhas) for c in range(colunas) if rng.random() < args.densidade}
    else:
        vivas = colocar(PADROES[args.padrao], linhas, colunas)

    if os.name == "nt":
        os.system("")  # liga as sequências ANSI no console do Windows

    sys.stdout.write("\x1b[2J\x1b[?25l")  # limpa a tela e esconde o cursor
    geracao = 0
    try:
        while True:
            desenhar(vivas, linhas, colunas, geracao)
            vivas = passo(vivas, linhas, colunas)
            geracao += 1
            time.sleep(1 / args.fps)
    except KeyboardInterrupt:
        pass
    finally:
        sys.stdout.write("\x1b[?25h\n")  # devolve o cursor


if __name__ == "__main__":
    main()
