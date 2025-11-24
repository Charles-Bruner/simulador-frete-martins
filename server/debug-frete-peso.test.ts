import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Debug Frete Peso", () => {
  it("calcula frete peso para MG METROPOLITANA -> SP CAPITAL, 580kg", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.frete.calcular({
      ufOrigem: "MG",
      classificacaoOrigem: "METROPOLITANA",
      ufDestino: "SP",
      classificacaoDestino: "CAPITAL",
      peso: 580,
      valorMercadoria: 17500,
      produtoQuimico: false,
      aplicarTDE: false,
    });

    console.log("Resultado do cálculo:");
    console.log("Frete Peso:", result.fretePeso);
    console.log("Frete Valor:", result.freteValor);
    console.log("Despacho:", result.despacho);
    console.log("Pedágio:", result.pedagio);
    console.log("Total:", result.total);

    // Valores esperados
    expect(result.fretePeso).toBeCloseTo(336.14, 1);
    expect(result.freteValor).toBeCloseTo(69.60, 1);
    expect(result.despacho).toBeCloseTo(21.09, 1);
    expect(result.pedagio).toBeCloseTo(13.18, 1);
    expect(result.total).toBeCloseTo(440.01, 1);
  });
});
