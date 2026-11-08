import unittest

from vida import PADROES, colocar, passo


class TestVida(unittest.TestCase):
    def test_bloco_fica_parado(self):
        bloco = {(1, 1), (1, 2), (2, 1), (2, 2)}
        self.assertEqual(passo(bloco, 10, 10), bloco)

    def test_pisca_pisca_alterna(self):
        horizontal = {(2, 1), (2, 2), (2, 3)}
        vertical = {(1, 2), (2, 2), (3, 2)}
        self.assertEqual(passo(horizontal, 10, 10), vertical)
        self.assertEqual(passo(vertical, 10, 10), horizontal)

    def test_glider_anda_na_diagonal(self):
        g = colocar(PADROES["glider"], 20, 20)
        for _ in range(4):
            g = passo(g, 20, 20)
        self.assertEqual(g, {((r + 1) % 20, (c + 1) % 20) for r, c in colocar(PADROES["glider"], 20, 20)})

    def test_bordas_se_conectam(self):
        # pisca-pisca cortado pela borda continua oscilando
        horizontal = {(0, 9), (0, 0), (0, 1)}
        self.assertEqual(passo(passo(horizontal, 10, 10), 10, 10), horizontal)

    def test_pulsar_periodo_3(self):
        p = colocar(PADROES["pulsar"], 30, 30)
        self.assertEqual(len(p), 48)
        self.assertEqual(passo(passo(passo(p, 30, 30), 30, 30), 30, 30), p)

    def test_canhao_dispara_gliders(self):
        c = colocar(PADROES["canhao"], 60, 80)
        self.assertEqual(len(c), 36)
        for _ in range(30):
            c = passo(c, 60, 80)
        self.assertEqual(len(c), 36 + 5)  # mesmo canhão + 1 glider novo


if __name__ == "__main__":
    unittest.main()
