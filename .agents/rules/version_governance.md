# Regras e Restrições de Governança de Versões (Version & Release Governor)

## Objetivo
Garantir a integridade, rastreabilidade, estabilidade e conformidade de todas as alterações realizadas no projeto **Dashboard de Disponibilidade & Confiabilidade de RTG (TCP)**.

---

## 🛡️ RESTRIÇÕES CRÍTICAS E OBRIGATÓRIAS

### 1. Blindagem de Cálculos e Regras de Negócio Oficiais
- **Fórmulas Matemáticas Intocáveis**: É terminantemente proibido alterar as fórmulas de cálculo sem aprovação explícita do usuário:
  - **Disponibilidade Física Real (DF %)** = `((Horas Decorridas - Horas Paradas Reais) / Horas Decorridas) * 100`
  - **Disponibilidade Física Projetada (DF %)** = `((Horas do Mês - Total Paradas Reais e Previstas) / Horas do Mês) * 100`
  - **Simulador Preditivo Sequencial (D+1 a D+10)**: Projeção dia a dia acumulada.
  - **MTBF e MTTR**: Cálculos oficiais de confiabilidade e manutenibilidade.
- **Frota Oficial Base**: Preservar sempre a base inicial de 41 RTGs (RTG 01 a 22 Konecranes, RTG 23 a 32 Kalmar, RTG 33 a 41 ZPMC) e a flexibilidade de adicionar novos RTGs ZPMC.

### 2. Versionamento Semântico Rigoroso (SemVer)
- **MAJOR (X.0.0)**: Alterações de quebra de compatibilidade, reestruturação geral de banco de dados ou reformulação completa da arquitetura.
- **MINOR (x.Y.0)**: Adição de novas funcionalidades (novos gráficos, novos módulos, novos relatórios executivos).
- **PATCH (x.y.Z)**: Correções de bugs, ajustes de layout/CSS, refinamentos de texto, melhorias de segurança ou performance.

### 3. Registro Obrigatório no `CHANGELOG.md` e Atualização de Versão no Header
- Toda alteração realizada no código deve:
  1. Incrementar o número da versão semântica (`vX.Y.Z`).
  2. Atualizar a tag de versão visível no cabeçalho do `index.html` (`.badge-version`).
  3. Registrar a versão com data, autor e descrição detalhada das mudanças no arquivo `CHANGELOG.md`.

### 4. Segurança, Senhas e Proteção de Dados Sensíveis
- **Sigilo de Credenciais na Interface**: Senhas nunca devem ser exibidas em texto puro ou expostas visualmente nas telas e modais de login.
- **Controle de Acesso**:
  - **Perfil Edição (Admin)**: Senha `5550333` (permite editar paradas, simular, salvar na nuvem e resetar).
  - **Perfil Leitura (Viewer)**: Senha `tcp@2025` (somente visualização).
- **Proteção de Tokens**: Nunca commitar ou expor tokens de acesso em repositórios públicos desnecessariamente.

### 5. Apresentação Prévia de Planos de Alteração
- Sempre que uma modificação estrutural for solicitada, o agente deve apresentar um plano claro antes de executar, mantendo a capacidade de reversão (rollback).
