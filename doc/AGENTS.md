# Agents Notes

## Guidelines de Desenvolvimento

- Projetar o sistema seguindo **Domain-Driven Design (DDD)**, mantendo regras de negócio encapsuladas no domínio e garantindo linguagem ubíqua alinhada aos bounded contexts descritos na SPEC-1.
- Aplicar os princípios **SOLID** em serviços, entidades, casos de uso e adapters para preservar baixo acoplamento e alta coesão.
- Estruturar as camadas conforme a **Clean Architecture**, com dependências fluindo das camadas externas para as internas apenas via interfaces e contratos explícitos.
- Priorizar testes automatizados para o domínio e casos de uso, utilizando stubs/mocks para portar comportamentos das camadas externas.
- Registrar decisões arquiteturais relevantes em ADRs quando aplicável e manter documentação atualizada no repositório.

## Fluxo de Trabalho

- Ao final de cada tarefa, executar o script `pnpm precommit:check`.
- Caso o script reporte erros, corrigir antes de prosseguir.
- Após corrigir, sugerir a mensagem de commit apropriada e aguardar a confirmação do usuário antes de executar o commit.
