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

  it("calcula frete para peso até 10kg (ES CAPITAL -> ES CAPITAL)", async () => {
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
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.freteBase).toBeGreaterThan(0);
    expect(result.adValorem).toBeGreaterThan(0);
    expect(result.despacho).toBeGreaterThan(0);
    expect(result.tde1).toBeGreaterThan(0);
    expect(result.tde2).toBeGreaterThan(0);
    
    // Verificar se o total é a soma de todas as parcelas
    const somaEsperada = 
      result.freteBase + 
      result.adValorem + 
      result.despacho + 
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
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.freteBase).toBeGreaterThan(0);
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
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.freteBase).toBeGreaterThan(0);
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
    });

    const resultComQuimico = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "ES",
      classificacaoDestino: "CAPITAL",
      peso: 10,
      valorMercadoria: 1000,
      produtoQuimico: true,
    });

    expect(resultComQuimico.produtoQuimico).toBeGreaterThan(0);
    expect(resultSemQuimico.produtoQuimico).toBe(0);
    expect(resultComQuimico.total).toBeGreaterThan(resultSemQuimico.total);
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
      })
    ).rejects.toThrow("Rota de frete não encontrada");
  });

  it("calcula ad valorem baseado no valor da mercadoria", async () => {
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
    });

    const resultValorAlto = await caller.frete.calcular({
      ufOrigem: "ES",
      classificacaoOrigem: "CAPITAL",
      ufDestino: "ES",
      classificacaoDestino: "CAPITAL",
      peso: 10,
      valorMercadoria: 100000,
      produtoQuimico: false,
    });

    // Ad valorem deve ser maior para valor de mercadoria maior (quando acima do mínimo)
    expect(resultValorAlto.adValorem).toBeGreaterThan(resultValorBaixo.adValorem);
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
