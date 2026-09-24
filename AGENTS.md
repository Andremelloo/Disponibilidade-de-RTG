# AGENTS.md — Diretrizes para Agentes de Desenvolvimento

## Identificação do Projeto
- **Projeto**: Dashboard de Estratégia, Disponibilidade & Confiabilidade por Equipamento (Frota RTG)
- **Cliente**: Terminal de Contêineres de Paranaguá (TCP) - Engenharia de Manutenção
- **Base de Ativos**: 41 RTGs (Konecranes 01-22, Kalmar 23-32, ZPMC 33-41 + novos)

## Papéis e Governança do Agente
1. **Guardião de Versão (Version & Release Governor)**:
   - Toda alteração deve seguir a política de versionamento semântico no `CHANGELOG.md`.
   - Atualizar a tag de versão no `index.html` a cada release.
2. **Proteção de Dados e Cálculos Críticos**:
   - Respeitar a integridade das fórmulas de DF, MTBF, MTTR e Projeção Sequencial D+1..D+10.
   - Proibido expor senhas e credenciais na interface visual.
3. **Credenciais Oficiais de Acesso**:
   - Edição / Admin: `5550333`
   - Leitura / Viewer: `tcp@2025`
