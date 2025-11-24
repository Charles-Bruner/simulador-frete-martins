/**
 * Script para importar os dados do arquivo Base.xlsx para o banco de dados
 * Execução: node --loader ts-node/esm scripts/import-frete-data.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import { freteTabela } from "../drizzle/schema";
import XLSX from "xlsx";
import * as path from "path";

async function importFreteData() {
  console.log("Iniciando importação dos dados de frete...");

  // Conectar ao banco de dados
  const db = drizzle(process.env.DATABASE_URL!);

  // Ler o arquivo Base.xlsx
  const filePath = path.join(process.cwd(), "data", "Base.xlsx");
  console.log(`Lendo arquivo: ${filePath}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  console.log(`Total de linhas: ${data.length}`);
  
  // Pular a primeira linha (cabeçalho)
  const rows = data.slice(1);
  
  const records = rows.map((row) => {
    // Converter valores monetários para centavos
    const toCents = (value: number) => Math.round(value * 100);
    
    // Converter percentuais para milésimos ou centésimos
    const toThousandths = (value: number) => Math.round(value * 1000);
    const toHundredths = (value: number) => Math.round(value * 100);
    
    return {
      ufOrigem: String(row[0] || "").trim(),
      classificacaoOrigem: String(row[1] || "").trim(),
      ufDestino: String(row[2] || "").trim(),
      classificacaoDestino: String(row[3] || "").trim(),
      peso0a10: toCents(Number(row[4] || 0)),
      peso11a20: toCents(Number(row[5] || 0)),
      peso21a30: toCents(Number(row[6] || 0)),
      peso31a50: toCents(Number(row[7] || 0)),
      peso51a70: toCents(Number(row[8] || 0)),
      peso71a100: toCents(Number(row[9] || 0)),
      peso101a200: toCents(Number(row[10] || 0)),
      pesoAcima200: toCents(Number(row[11] || 0)),
      adValoremPerc: toThousandths(Number(row[12] || 0)),
      adValoremMin: toCents(Number(row[13] || 0)),
      despacho: toCents(Number(row[14] || 0)),
      prodQuimicoPerc: toHundredths(Number(row[15] || 0)),
      prodQuimicoAte100: toCents(Number(row[16] || 0)),
      prodQuimicoAcima100: toCents(Number(row[17] || 0)),
      tde1Perc: toHundredths(Number(row[18] || 0)),
      tde1Min: toCents(Number(row[19] || 0)),
      tde1Max: toCents(Number(row[20] || 0)),
      tde2Perc: toHundredths(Number(row[21] || 0)),
      tde2Min: toCents(Number(row[22] || 0)),
    };
  });
  
  console.log(`Inserindo ${records.length} registros no banco de dados...`);
  
  // Inserir os registros no banco de dados
  await db.insert(freteTabela).values(records);
  
  console.log("Importação concluída com sucesso!");
}

importFreteData().catch((error) => {
  console.error("Erro ao importar dados:", error);
  process.exit(1);
});
