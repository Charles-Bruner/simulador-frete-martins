# Project TODO

## Funcionalidades Principais
- [x] Configurar estrutura do banco de dados para tabela de frete
- [x] Importar dados do arquivo Base.xlsx para o banco de dados
- [x] Criar API tRPC para cálculo de frete
- [x] Desenvolver formulário de simulação (origem, destino, peso, valor da mercadoria)
- [x] Implementar lógica de cálculo de frete com todas as taxas
- [x] Criar interface para exibir resultado detalhado do cálculo
- [x] Adicionar validação de dados de entrada
- [x] Testar cálculo de frete com diferentes cenários
- [x] Criar checkpoint final do projeto

## Correções Necessárias
- [x] Aplicar divisor de ICMS (0,88) no cálculo de cada componente
- [x] Remover cobrança automática de TDE1 e TDE2
- [x] Adicionar campo opcional para TDE na interface
- [x] Renomear campos para usar a nomenclatura correta (Frete Peso, Frete Valor, Pedágio)
- [x] Atualizar testes para validar o cálculo com ICMS
- [x] Validar cálculo com o exemplo fornecido (R$ 440,01)

## Correção do Frete Peso
- [ ] Investigar o valor de "Peso Acima 200kg" na tabela para MG METROPOLITANA → SP CAPITAL
- [ ] Corrigir o valor ou a lógica de cálculo do Frete Peso
- [ ] Validar que o cálculo retorna R$ 336,14 para 580kg

## Correção do Cálculo de Pedágio
- [x] Corrigir lógica para usar valor fixo até 100kg (sem multiplicar por peso)
- [x] Corrigir lógica para usar valor por kg acima de 100kg (multiplicar por peso)
- [x] Atualizar testes para validar o cálculo de pedágio com 100kg e 580kg
- [x] Validar que o cálculo retorna R$ 2,49 para 100kg (exemplo fornecido)
