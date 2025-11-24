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
  console.log('Valor no banco de dados:');
  console.log('pesoAcima200:', tabela.pesoAcima200, 'centavos/kg');
  console.log('');
  console.log('Cálculo com o valor do banco:');
  const peso = 580;
  const fretePesoBase = tabela.pesoAcima200 * peso;
  const fretePeso = fretePesoBase / 0.88;
  console.log('Frete Peso Base:', fretePesoBase, 'centavos = R$', (fretePesoBase/100).toFixed(2));
  console.log('Frete Peso (com ICMS):', fretePeso, 'centavos = R$', (fretePeso/100).toFixed(2));
  console.log('');
  console.log('Valor esperado: R$ 336,14');
  console.log('Diferença: R$', ((fretePeso/100) - 336.14).toFixed(2));
}

process.exit(0);
