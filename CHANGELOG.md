# 📜 Histórico de Versões e Modificações (CHANGELOG)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [v1.0.1] - 2026-09-24
### 🔒 Segurança & Acesso Restrito
- **Ocultação de Senhas na Interface**: Removidas todas as senhas em texto puro visíveis no modal de login de "Acesso Restrito".
- **Padronização de Senhas de Acesso**:
  - Senha de **Edição (Admin)**: `5550333`
  - Senha de **Leitura (Viewer)**: `tcp@2025`
- **Interface e Usabilidade**: Adicionada descrição clara dos perfis (Edição vs Leitura) sem expor as credenciais na tela.
- **Badge de Versão no Dashboard**: Adicionado indicador visual de versão oficial no cabeçalho da aplicação.

### 🛡️ Governança & Arquitetura
- Configuração do **Agente de Governança de Versões (`.agents/rules/version_governance.md` e `AGENTS.md`)** para proteger fórmulas, cálculos e dados.
- Preservação da documentação viva no `RESUMO_PROJETO.txt`.

---

## [v1.0.0] - 2026-09-24
### 🚀 Lançamento Inicial (Baseline Oficial)
- **Frota Base de 41 RTGs**:
  - Konecranes: RTG-01 ao RTG-22 (22 unidades)
  - Kalmar: RTG-23 ao RTG-32 (10 unidades)
  - ZPMC: RTG-33 ao RTG-41 (9 unidades) + suporte a inclusão dinâmica de novos RTGs ZPMC.
- **Simulador Preditivo Sequencial (D+1 a D+10)**: Projeção de disponibilidade diária e acumulada até o fechamento mensal com meta semafórica (>= 93%).
- **Cálculo de Indicadores (KPIs)**: Disponibilidade Física Real vs Projetada, MTBF, MTTR, Horas de Parada (Preventiva, Corretiva, Inspeção, Melhoria).
- **Gráficos Dinâmicos (Chart.js)**: Curvas de evolução temporal de disponibilidade e distribuição de paradas.
- **Segurança com Duplo Perfil**: Sistema de autenticação com perfis Editor e Visualizador.
- **Sincronização & Persistência**: Suporte a nuvem (GitHub Raw/API) e armazenamento local via `localStorage`.
- **Exportação**: Geração de relatórios executivos em CSV e JSON.
