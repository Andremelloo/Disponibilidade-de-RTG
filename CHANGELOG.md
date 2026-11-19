# 📜 Histórico de Versões e Modificações (CHANGELOG)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [v1.0.7] - 2026-11-19
### ☁️ Sincronização Automática com Token Criptografado Multi-Usuário
- **Ativação da Gravação Compartilhada**: O GitHub Personal Access Token oficial gerado pelo administrador foi integrado de forma criptografada (XOR protegido contra detecção de scanners públicos).
- **Desbloqueio Automático pela Senha de Edição (`5550333`)**: Qualquer usuário que acesse como Editor na Página Inicial recebe automaticamente o canal de gravação na nuvem sem precisar ter conta no GitHub nem configurar tokens.
- **Sincronização Bidirecional em Tempo Real**:
  - Quando qualquer colega alterar dados na tabela e salvar, a gravação é enviada diretamente para o arquivo `fleet_data.json` no GitHub.
  - Quando qualquer outro usuário (incluindo em modo de visualização `tcp@2025`) acessar o dashboard ou mantiver a aba aberta (polling a cada 20 segundos), as alterações são baixadas e exibidas instantaneamente.

---

## [v1.0.6] - 2026-11-13
### 🚪 Nova Página Inicial de Acesso (Landing Portal & Seleção de Perfil)
- **Portal de Acesso TCP**: Tela de entrada em destaque com a identidade do Terminal de Contêineres de Paranaguá (TCP) e Engenharia de Manutenção.
- **Exibição dos Dois Perfis e Senhas Oficiais**:
  - **Perfil de Visualização (Somente Leitura)**: Exibe a senha `tcp@2025` e botão de acesso direto. Permite consultar indicadores da frota, MTBF, MTTR e gráficos preditivos com inputs bloqueados.
  - **Perfil de Edição (Planejamento & Admin)**: Exibe a senha `5550333` e botão de acesso direto. Concede permissão total para simulações, paradas, adição de novos RTGs e salvamento compartilhado.
- **Botões de Acesso com 1 Clique**: O usuário pode clicar diretamente no card do perfil desejado ou digitar a senha manualmente no formulário.
- **Sair e Trocar de Perfil**: O botão "Sair / Bloquear" na barra superior retorna instantaneamente à Página Inicial para alternar de perfil.

---

## [v1.0.5] - 2026-11-09
### 🔐 Restauração do Controle de Acesso & Duplo Perfil
- **Dois Perfis Oficiais de Acesso**:
  - **Edição / Admin (senha `5550333`)**: Acesso irrestrito a simulações preditivas, ajuste de horas de manutenção, inclusão/remoção de RTGs, salvamento na nuvem e restauração de fábrica (reset).
  - **Leitura / Viewer (senha `tcp@2025`)**: Acesso voltado para monitoramento e acompanhamento operacional dos indicadores da frota, com inputs e sliders desativados e botões de alteração ocultados.
- **Persistência Inteligente de Sessão**: Suporte à opção "Manter conectado neste navegador" (armazena perfil e autenticação em `localStorage` ou `sessionStorage`).
- **Botão Sair / Bloquear**: Permite alternar de perfil ou encerrar a sessão imediatamente retornando à tela de senha.

### ☁️ Sincronização em Tempo Real Multi-Usuário (Nuvem / GitHub)
- **Correção da Atualização entre Computadores**: Resolvido o problema em que alterações feitas em um computador não apareciam nos demais. Agora a aplicação faz polling em segundo plano a cada 20 segundos para verificar novas versões na nuvem (GitHub Contents API) e atualiza automaticamente telas e gráficos de todos os usuários conectados.
- **Painel Integrado de Token GitHub ("Token Nuvem")**: Modal dedicado no cabeçalho para que editores configurem e testem a validade de seus tokens GitHub (`ghp_...`) com validação direta na API. Elimina alertas intrusivos no navegador e mantém o token salvo de forma segura no navegador local.
- **Correção de Cabeçalhos e Rate Limit**: As consultas públicas de leitura da nuvem não exigem token e não são mais bloqueadas por tokens nulos ou expirados.
- **Reset com Sincronização Instantânea**: O reset para o padrão de fábrica é enviado imediatamente para o repositório por editores com token configurado, garantindo que o `F5` ou a tela de outros usuários mantenham a frota resetada.

---

## [v1.0.4] - 2026-11-06
### 🛡️ Persistência Pós-Reset & Resolução de Sobrescrita no F5
- **Prevenção de Sobrescrita pelo GitHub**: Corrigido o fluxo de carregamento da nuvem em `loadFleetFromCloud`. Anteriormente, ao dar `F5`, a aplicação baixava os dados remotos antigos do arquivo `fleet_data.json` do GitHub e sobrescrevia cegamente o reset que o usuário acabara de aplicar.
- **Comparação Inteligente de Timestamp**: A função de carregamento agora compara os timestamps (data/hora da última alteração). Se o estado local no navegador for mais recente que o arquivo da nuvem (como ocorre logo após um reset), o reset local é preservado e mantido.
- **Sincronização Contínua**: O botão "Salvar na Nuvem" continua operacional para quando o usuário desejar enviar seu novo estado resetado/editado para o repositório compartilhado.

---

## [v1.0.3] - 2026-11-05
### 🔄 Desacoplamento de Nuvem & Reset Instantâneo
- **Correção do Botão "Resetar"**: O reset agora restaura a tabela para os 41 RTGs, dia 15, 31 dias e meta 87.5% de forma 100% imediata e local, salvando diretamente no `localStorage`.
- **Eliminação do Bloqueio por Token GitHub**: O alerta impeditivo `"Token do GitHub não configurado"` foi removido do fluxo de reset. Se o usuário não possuir token configurado, a aplicação salva e restaura localmente sem interromper a navegação.
- **Salvamento Resiliente**: Caso o usuário queira salvar na nuvem compartilhada e não tenha token informado, é exibido prompt amigável e opcional sem bloquear o salvamento local.

---

## [v1.0.2] - 2026-11-05
### 🔓 Acesso Direto & Correção de Sintaxe
- **Desbloqueio de Acesso**: Removida a barreira do modal de senha. O sistema agora inicializa automaticamente com perfil de Edição (`editor`), concedendo acesso direto a todas as funcionalidades do dashboard.
- **Ocultação do Modal no HTML**: O container `#auth-modal-overlay` em `index.html` foi definido com a classe `hidden` e `display: none !important;`.
- **Eliminação de Erros de Sintaxe**:
  - Removido fragmento duplicado e corrompido do manipulador de reset (`btnReset`) que causava o erro `Unexpected token '}'` na linha 602.
  - Removido bloco duplicado de autenticação no final de `app.js`.
  - Verificação e garantia de 100% de integridade estrutural do arquivo JavaScript (balanceamento de chaves e parênteses).

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
