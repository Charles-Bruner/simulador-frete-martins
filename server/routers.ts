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

        // Calcular o frete base por peso
        let freteBase = 0;
        if (peso <= 10) {
          freteBase = tabela.peso0a10;
        } else if (peso <= 20) {
          freteBase = tabela.peso11a20;
        } else if (peso <= 30) {
          freteBase = tabela.peso21a30;
        } else if (peso <= 50) {
          freteBase = tabela.peso31a50;
        } else if (peso <= 70) {
          freteBase = tabela.peso51a70;
        } else if (peso <= 100) {
          freteBase = tabela.peso71a100;
        } else if (peso <= 200) {
          freteBase = tabela.peso101a200 * peso;
        } else {
          freteBase = tabela.pesoAcima200 * peso;
        }

        // Calcular Ad Valorem
        const adValoremCalc = (valorMercadoria * tabela.adValoremPerc) / 1000;
        const adValorem = Math.max(adValoremCalc, tabela.adValoremMin);

        // Calcular Despacho
        const despacho = tabela.despacho;

        // Calcular Produto Químico (se aplicável)
        let produtoQuimicoValor = 0;
        if (produtoQuimico) {
          const prodQuimicoBase = peso <= 100 ? tabela.prodQuimicoAte100 : tabela.prodQuimicoAcima100;
          produtoQuimicoValor = Math.max(
            (freteBase * tabela.prodQuimicoPerc) / 100,
            prodQuimicoBase
          );
        }

        // Calcular TDE 1
        const tde1Calc = (freteBase * tabela.tde1Perc) / 100;
        const tde1 = Math.min(Math.max(tde1Calc, tabela.tde1Min), tabela.tde1Max);

        // Calcular TDE 2
        const tde2Calc = (freteBase * tabela.tde2Perc) / 100;
        const tde2 = Math.max(tde2Calc, tabela.tde2Min);

        // Calcular total
        const total = freteBase + adValorem + despacho + produtoQuimicoValor + tde1 + tde2;

        return {
          freteBase: freteBase / 100,
          adValorem: adValorem / 100,
          despacho: despacho / 100,
          produtoQuimico: produtoQuimicoValor / 100,
          tde1: tde1 / 100,
          tde2: tde2 / 100,
          total: total / 100,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
