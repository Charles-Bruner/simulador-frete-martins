import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { drizzle } from "drizzle-orm/mysql2";
import { freteTabela } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("frete.calcular", () => {
  beforeAll(async () => {
    // Verificar se há dados na tabela de frete
    const db = drizzle(process.env.DATABASE_URL!);
    const result = await db.select().from(freteTabela).limit(1);
    
    if (result.length === 0) {
      throw new Error("Tabela de frete está vazia. Execute o script de importação primeiro.");
    }
  });

  it("valida pedágio fixo até 100kg: MG METROPOLITANA -> SP METROPOLITANA, 100kg = R$ 2,49", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.frete.calcular({
      ufOrigem: "MG",
      classificacaoOrigem: "METROPOLITANA",
      ufDestino: "SP",
      classificacaoDestino: "METROPOLITANA",
      peso: 100,
      valorMercadoria: 2500,
      produtoQuimico: false,
      aplicarTDE: false,
    });

    // Pedágio até 100kg deve ser valor fixo (R$ 2,19 / 0,88 = R$ 2,49)
    expect(result.pedagio).toBeCloseTo(2.49, 1);
  });

  it("valida o exemplo fornecido: MG METROPOLITANA -> SP CAPITAL, 580kg, R$ 17.500,00 = R$ 440,01", async () => {
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

    expect(result).toBeDefined();
    
    // Validar componentes individuais (valores aproximados devido a arredondamentos)
    expect(result.fretePeso).toBeCloseTo(336.14, 1); // 580kg × R$ 0,51 / 0,88
    expect(result.freteValor).toBeCloseTo(69.60, 1); // 0,35% × R$ 17.500 / 0,88
    expect(result.despacho).toBeCloseTo(21.09, 1); // R$ 18,56 / 0,88
    expect(result.pedagio).toBeCloseTo(13.18, 1); // 580kg × R$ 0,02 / 0,88
    
    // Validar total
    expect(result.total).toBeCloseTo(440.01, 1);
  });

  it("calcula frete para peso até 10kg com ICMS aplicado", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "ES",
      classificacaoDestino: "CAPITAL",
      peso: 5,
      valorMercadoria: 1000,
      produtoQuimico: false,
      aplicarTDE: false,
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.fretePeso).toBeGreaterThan(0);
    expect(result.freteValor).toBeGreaterThan(0);
    expect(result.despacho).toBeGreaterThan(0);
    expect(result.pedagio).toBeGreaterThan(0);
    
    // TDE não deve ser cobrado quando aplicarTDE = false
    expect(result.tde1).toBe(0);
    expect(result.tde2).toBe(0);
    
    // Verificar se o total é a soma de todas as parcelas
    const somaEsperada = 
      result.fretePeso + 
      result.freteValor + 
      result.despacho + 
      result.pedagio + 
      result.produtoQuimico + 
      result.tde1 + 
      result.tde2;
    
    expect(result.total).toBeCloseTo(somaEsperada, 2);
  });

  it("calcula frete para peso entre 11-20kg (ES CAPITAL -> MG CAPITAL)", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "MG",
      classificacaoDestino: "CAPITAL",
      peso: 15,
      valorMercadoria: 2000,
      produtoQuimico: false,
      aplicarTDE: false,
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.fretePeso).toBeGreaterThan(0);
  });

  it("calcula frete para peso acima de 100kg (ES CAPITAL -> SP CAPITAL)", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "SP",
      classificacaoDestino: "CAPITAL",
      peso: 150,
      valorMercadoria: 5000,
      produtoQuimico: false,
      aplicarTDE: false,
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.fretePeso).toBeGreaterThan(0);
  });

  it("calcula frete com produto químico", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const resultSemQuimico = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "ES",
      classificacaoDestino: "CAPITAL",
      peso: 10,
      valorMercadoria: 1000,
      produtoQuimico: false,
      aplicarTDE: false,
    });

    const resultComQuimico = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "ES",
      classificacaoDestino: "CAPITAL",
      peso: 10,
      valorMercadoria: 1000,
      produtoQuimico: true,
      aplicarTDE: false,
    });

    expect(resultComQuimico.produtoQuimico).toBeGreaterThan(0);
    expect(resultSemQuimico.produtoQuimico).toBe(0);
    expect(resultComQuimico.total).toBeGreaterThan(resultSemQuimico.total);
  });

  it("calcula frete com TDE quando aplicarTDE = true", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const resultSemTDE = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "ES",
      classificacaoDestino: "CAPITAL",
      peso: 10,
      valorMercadoria: 1000,
      produtoQuimico: false,
      aplicarTDE: false,
    });

    const resultComTDE = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "ES",
      classificacaoDestino: "CAPITAL",
      peso: 10,
      valorMercadoria: 1000,
      produtoQuimico: false,
      aplicarTDE: true,
    });

    expect(resultSemTDE.tde1).toBe(0);
    expect(resultSemTDE.tde2).toBe(0);
    expect(resultComTDE.tde1).toBeGreaterThan(0);
    expect(resultComTDE.tde2).toBeGreaterThan(0);
    expect(resultComTDE.total).toBeGreaterThan(resultSemTDE.total);
  });

  it("lança erro para rota não encontrada", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.frete.calcular({
        ufOrigem: "XX",
        classificacaoOrigem: "INEXISTENTE",
        ufDestino: "YY",
        classificacaoDestino: "INEXISTENTE",
        peso: 10,
        valorMercadoria: 1000,
        produtoQuimico: false,
        aplicarTDE: false,
      })
    ).rejects.toThrow("Rota de frete não encontrada");
  });

  it("calcula frete valor (ad valorem) baseado no valor da mercadoria", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const resultValorBaixo = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "ES",
      classificacaoDestino: "CAPITAL",
      peso: 10,
      valorMercadoria: 100,
      produtoQuimico: false,
      aplicarTDE: false,
    });

    const resultValorAlto = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "ES",
      classificacaoDestino: "CAPITAL",
      peso: 10,
      valorMercadoria: 100000,
      produtoQuimico: false,
      aplicarTDE: false,
    });

    // Frete valor deve ser maior para valor de mercadoria maior (quando acima do mínimo)
    expect(resultValorAlto.freteValor).toBeGreaterThan(resultValorBaixo.freteValor);
  });
});

describe("frete.getUFs", () => {
  it("retorna lista de UFs disponíveis", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.frete.getUFs();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("ES");
    expect(result).toContain("MG");
    expect(result).toContain("RJ");
    expect(result).toContain("SP");
  });
});

describe("frete.getClassificacoes", () => {
  it("retorna classificações para UF ES", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.frete.getClassificacoes({ uf: "ES" });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("CAPITAL");
  });

  it("retorna array vazio para UF inexistente", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.frete.getClassificacoes({ uf: "XX" });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});
