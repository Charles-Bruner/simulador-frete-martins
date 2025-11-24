import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { freteTabela } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

const result = await db.select().from(freteTabela)
  .where(and(
    eq(freteTabela.ufOrigem, 'MG'),
    eq(freteTabela.classificacaoOrigem, 'METROPOLITANA'),
    eq(freteTabela.ufDestino, 'SP'),
    eq(freteTabela.classificacaoDestino, 'CAPITAL')
  ))
  .limit(1);

if (result.length > 0) {
  const tabela = result[0];
  console.log('Dados da tabela:');
  console.log('Peso 51-70kg:', tabela.peso51a70, 'centavos');
  console.log('Peso Acima 200kg:', tabela.pesoAcima200, 'centavos/kg');
  console.log('Ad Valorem %:', tabela.adValoremPerc);
  console.log('Ad Valorem Min:', tabela.adValoremMin, 'centavos');
  console.log('Despacho:', tabela.despacho, 'centavos');
  console.log('Pedágio Acima 100kg:', tabela.prodQuimicoAcima100, 'centavos/kg');
  
  console.log('\nCálculo manual para 580kg e R$ 17.500:');
  const peso = 580;
  const valorMercadoria = 17500;
  const ICMS_DIVISOR = 0.88;
  
  // Frete Peso (580kg está na faixa acima de 200kg)
  const fretePesoBase = tabela.pesoAcima200 * peso;
  const fretePeso = fretePesoBase / ICMS_DIVISOR;
  console.log('Frete Peso Base:', fretePesoBase, 'centavos =', (fretePesoBase/100).toFixed(2));
  console.log('Frete Peso (com ICMS):', fretePeso, 'centavos =', (fretePeso/100).toFixed(2));
  
  // Ad Valorem
  const adValoremCalc = (valorMercadoria * 100 * tabela.adValoremPerc) / 10000;
  const adValoremBase = Math.max(adValoremCalc, tabela.adValoremMin);
  const adValorem = adValoremBase / ICMS_DIVISOR;
  console.log('Ad Valorem Calc:', adValoremCalc, 'centavos');
  console.log('Ad Valorem Base:', adValoremBase, 'centavos =', (adValoremBase/100).toFixed(2));
  console.log('Ad Valorem (com ICMS):', adValorem, 'centavos =', (adValorem/100).toFixed(2));
  
  // Despacho
  const despacho = tabela.despacho / ICMS_DIVISOR;
  console.log('Despacho (com ICMS):', despacho, 'centavos =', (despacho/100).toFixed(2));
  
  // Pedágio
  const pedagioBase = tabela.prodQuimicoAcima100 * peso;
  const pedagio = pedagioBase / ICMS_DIVISOR;
  console.log('Pedágio Base:', pedagioBase, 'centavos =', (pedagioBase/100).toFixed(2));
  console.log('Pedágio (com ICMS):', pedagio, 'centavos =', (pedagio/100).toFixed(2));
  
  // Total
  const total = fretePeso + adValorem + despacho + pedagio;
  console.log('\nTotal:', total, 'centavos =', (total/100).toFixed(2));
}

process.exit(0);
