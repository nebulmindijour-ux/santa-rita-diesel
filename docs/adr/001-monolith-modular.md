# ADR-001: Monólito modular ao invés de microserviços

**Status:** Aceito
**Data:** 2026-04-09

## Contexto

Projeto novo, equipe pequena, prioridade é velocidade com qualidade. O escopo do sistema é grande (24+ módulos de negócio), mas o time inicial é reduzido.

## Decisão

Adotar monólito modular com fronteiras claras por domínio de negócio. Cada módulo possui camadas separadas (domain, application, infrastructure, presentation) com interfaces explícitas.

## Consequências

**Positivas:**
- Deploy simples e único
- Debugging direto
- Refactoring facilitado (tudo no mesmo processo)
- Sem complexidade de rede entre serviços
- Transações ACID naturais entre módulos

**Negativas:**
- Escalabilidade horizontal limitada ao processo inteiro
- Disciplina necessária para manter fronteiras entre módulos

**Mitigação:**
- Workers separados para jobs pesados (fiscal, telemetria, IA)
- Estrutura preparada para extração futura de módulos críticos
