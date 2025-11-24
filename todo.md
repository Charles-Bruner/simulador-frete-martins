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
