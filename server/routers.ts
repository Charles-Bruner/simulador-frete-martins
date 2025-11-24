import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getFreteByOrigemDestino,
  getUFs,
  getClassificacoesByUF,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  frete: router({
    /**
     * Retorna todas as UFs disponíveis
     */
    getUFs: publicProcedure.query(async () => {
      return await getUFs();
    }),

    /**
     * Retorna todas as classificações disponíveis para uma UF
     */
    getClassificacoes: publicProcedure
      .input(z.object({ uf: z.string() }))
      .query(async ({ input }) => {
        return await getClassificacoesByUF(input.uf);
      }),

    /**
     * Calcula o frete com base nos parâmetros fornecidos
     */
    calcular: publicProcedure
      .input(
        z.object({
          ufOrigem: z.string(),
          classificacaoOrigem: z.string(),
          ufDestino: z.string(),
          classificacaoDestino: z.string(),
          peso: z.number().positive(),
          valorMercadoria: z.number().nonnegative(),
          produtoQuimico: z.boolean().default(false),
          aplicarTDE: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const {
          ufOrigem,
          classificacaoOrigem,
          ufDestino,
          classificacaoDestino,
          peso,
          valorMercadoria,
          produtoQuimico,
          aplicarTDE,
        } = input;

        // Buscar a tabela de frete
        const tabela = await getFreteByOrigemDestino(
          ufOrigem,
          classificacaoOrigem,
          ufDestino,
          classificacaoDestino
        );

        if (!tabela) {
          throw new Error("Rota de frete não encontrada");
        }

        // Divisor de ICMS (12% = 1 - 0.12 = 0.88)
        const ICMS_DIVISOR = 0.88;

        // Calcular o frete base por peso (em centavos)
        let fretePesoBase = 0;
        if (peso <= 10) {
          fretePesoBase = tabela.peso0a10;
        } else if (peso <= 20) {
          fretePesoBase = tabela.peso11a20;
        } else if (peso <= 30) {
          fretePesoBase = tabela.peso21a30;
        } else if (peso <= 50) {
          fretePesoBase = tabela.peso31a50;
        } else if (peso <= 70) {
          fretePesoBase = tabela.peso51a70;
        } else if (peso <= 100) {
          fretePesoBase = tabela.peso71a100;
        } else if (peso <= 200) {
          fretePesoBase = tabela.peso101a200 * peso;
        } else {
          fretePesoBase = tabela.pesoAcima200 * peso;
        }

        // Aplicar ICMS no Frete Peso
        const fretePeso = fretePesoBase / ICMS_DIVISOR;

        // Calcular Ad Valorem (Frete Valor)
        // adValoremPerc está em décimos de milésimos (ex: 35 = 0.0035 = 0.35%)
        const adValoremCalc = (valorMercadoria * 100 * tabela.adValoremPerc) / 10000; // valorMercadoria em centavos
        const adValoremBase = Math.max(adValoremCalc, tabela.adValoremMin);
        const adValorem = adValoremBase / ICMS_DIVISOR;

        // Calcular Despacho
        const despacho = tabela.despacho / ICMS_DIVISOR;

        // Calcular Pedágio (usando os campos de prodQuimico da tabela)
        // Até 100kg: valor fixo (não multiplica por peso)
        // Acima de 100kg: valor por kg (multiplica por peso)
        let pedagio = 0;
        if (peso <= 100) {
          pedagio = tabela.prodQuimicoAte100 / ICMS_DIVISOR;
        } else {
          pedagio = (tabela.prodQuimicoAcima100 * peso) / ICMS_DIVISOR;
        }

        // Calcular Produto Químico (se aplicável) - NÃO dividir por ICMS
        let produtoQuimicoValor = 0;
        if (produtoQuimico) {
          const pedagioBaseValue = peso <= 100 ? tabela.prodQuimicoAte100 : tabela.prodQuimicoAcima100;
          produtoQuimicoValor = Math.max(
            (fretePesoBase * tabela.prodQuimicoPerc) / 100,
            pedagioBaseValue
          );
        }

        // Calcular TDE (se aplicável) - NÃO dividir por ICMS
        let tde1 = 0;
        let tde2 = 0;
        if (aplicarTDE) {
          const tde1Calc = (fretePesoBase * tabela.tde1Perc) / 100;
          tde1 = Math.min(Math.max(tde1Calc, tabela.tde1Min), tabela.tde1Max);

          const tde2Calc = (fretePesoBase * tabela.tde2Perc) / 100;
          tde2 = Math.max(tde2Calc, tabela.tde2Min);
        }

        // Calcular total
        const total = fretePeso + adValorem + despacho + pedagio + produtoQuimicoValor + tde1 + tde2;

        return {
          fretePeso: fretePeso / 100,
          freteValor: adValorem / 100,
          despacho: despacho / 100,
          pedagio: pedagio / 100,
          produtoQuimico: produtoQuimicoValor / 100,
          tde1: tde1 / 100,
          tde2: tde2 / 100,
          total: total / 100,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
