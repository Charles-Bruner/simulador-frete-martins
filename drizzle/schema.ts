import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de frete da transportadora Martis
 * Armazena os preços de frete por origem/destino e faixa de peso
 */
export const freteTabela = mysqlTable("frete_tabela", {
  id: int("id").autoincrement().primaryKey(),
  ufOrigem: varchar("uf_origem", { length: 2 }).notNull(),
  classificacaoOrigem: varchar("classificacao_origem", { length: 50 }).notNull(),
  ufDestino: varchar("uf_destino", { length: 2 }).notNull(),
  classificacaoDestino: varchar("classificacao_destino", { length: 50 }).notNull(),
  
  // Preços por faixa de peso (em reais)
  peso0a10: int("peso_0_10").notNull(), // em centavos
  peso11a20: int("peso_11_20").notNull(),
  peso21a30: int("peso_21_30").notNull(),
  peso31a50: int("peso_31_50").notNull(),
  peso51a70: int("peso_51_70").notNull(),
  peso71a100: int("peso_71_100").notNull(),
  peso101a200: int("peso_101_200").notNull(), // em centavos por kg
  pesoAcima200: int("peso_acima_200").notNull(), // em centavos por kg
  
  // Taxas adicionais
  adValoremPerc: int("ad_valorem_perc").notNull(), // em décimos de milésimos (ex: 35 = 0.0035 = 0.35%)
  adValoremMin: int("ad_valorem_min").notNull(), // em centavos
  despacho: int("despacho").notNull(), // em centavos
  prodQuimicoPerc: int("prod_quimico_perc").notNull(), // em centésimos (ex: 25 = 0.25 = 25%)
  prodQuimicoAte100: int("prod_quimico_ate_100").notNull(), // em centavos
  prodQuimicoAcima100: int("prod_quimico_acima_100").notNull(), // em centavos
  
  // TDE 1
  tde1Perc: int("tde1_perc").notNull(), // em centésimos (ex: 40 = 0.40 = 40%)
  tde1Min: int("tde1_min").notNull(), // em centavos
  tde1Max: int("tde1_max").notNull(), // em centavos
  
  // TDE 2
  tde2Perc: int("tde2_perc").notNull(), // em centésimos (ex: 40 = 0.40 = 40%)
  tde2Min: int("tde2_min").notNull(), // em centavos
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FreteTabela = typeof freteTabela.$inferSelect;
export type InsertFreteTabela = typeof freteTabela.$inferInsert;
