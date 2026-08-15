# Design QA — refatoração mobile

## Escopo e referências

- Superfícies principais: Início, Descobrir, Biblioteca, Perfil, Estatísticas e navegação inferior.
- Fluxos auxiliares: busca mobile, filtros da Biblioteca, edição de perfil, Configurações, compartilhamento, seguidores, compatibilidade e conquistas.
- Referência de Início: `C:/Users/Administrador/.codex/generated_images/019fe45a-e5dd-7cf3-861c-0373b3cdad9a/exec-d04b1702-4239-43a2-90a5-137e7a53bc1c.png`.
- Referência de Descobrir: `C:/Users/Administrador/.codex/generated_images/019fe45a-e5dd-7cf3-861c-0373b3cdad9a/exec-f6a372c2-1fda-45fe-a672-25f78d5259fe.png`.

## Contrato de captura

- Referências: 853 × 1844 px, normalizadas com reamostragem bicúbica para 390 × 844 px.
- Implementação principal: viewport 390 × 844 CSS px, DPR 1.
- Estado: usuário autenticado `games`, tema escuro e dados reais da AniList/Firebase.
- Resiliência adicional: 320 × 568, 430 × 932 e 1280 × 800.
- O conteúdo editorial real pode diferir do mock; hierarquia, densidade, tokens, proporções e comportamento foram comparados.

## Evidências lado a lado

| Superfície | Visão completa | Região de foco |
| --- | --- | --- |
| Início | `artifacts/design-qa/home-comparison-final.png` | `artifacts/design-qa/home-focus-final.png` |
| Descobrir | `artifacts/design-qa/discover-comparison-final.png` | `artifacts/design-qa/discover-focus-final.png` |

Evidências adicionais:

- `artifacts/design-qa/discover-320x568-final.png`
- `artifacts/design-qa/discover-430x932-final2.png`
- `artifacts/design-qa/library-390x844-pass2.png`
- `artifacts/design-qa/library-filters-390x844.png`
- `artifacts/design-qa/profile-390x844.png`
- `artifacts/design-qa/profile-achievements-390x844.png`
- `artifacts/design-qa/stats-390x844.png`
- `artifacts/design-qa/home-search-dialog-390x844.png`
- `artifacts/design-qa/profile-edit-390x844-final.png`
- `artifacts/design-qa/profile-settings-390x844-final.png`
- `artifacts/design-qa/profile-edit-1280x800.png`

## Achados resolvidos

- **P1 — hierarquia da Home:** marca mobile, hero compacto, continuidade e recomendações voltaram a aparecer no primeiro recorte útil.
- **P1 — Descobrir:** cabeçalho duplicado removido no mobile; quatro atalhos cabem sem truncamento; quarta capa parcial comunica rolagem.
- **P1 — camadas de modal:** edição e Configurações cobrem sidebar e barra inferior; backdrop e blur permanecem acima do shell.
- **P1 — acessibilidade:** busca e modais têm semântica de diálogo, foco inicial, trap de Tab, Escape, scroll lock e restauração de foco.
- **P1 — qualidade das capas:** `srcset` passou a declarar larguras coerentes; o hero escolhe a capa grande em vez da miniatura de 100 px.
- **P1 — overflow:** documento permanece com `scrollWidth === clientWidth` em 320, 390 e 430 px; conquistas concluídas ficam contidas.
- **P2 — acabamento:** scrollbars visuais dos painéis mobile foram ocultadas sem remover rolagem; fallbacks de estúdio, login e compartilhamento ficaram locais e consistentes com a marca.
- **P2 — linguagem:** progresso é expresso por episódios; emojis visíveis foram substituídos por ícones Lucide.

## Interações verificadas

- As quatro abas inferiores navegam e sinalizam o estado ativo.
- Busca mobile abre em tela cheia, recebe foco e devolve o foco ao gatilho ao fechar.
- Sheet de filtros da Biblioteca fecha com Escape e restaura foco.
- Configurações e Editar perfil ocupam 390 × 844 px no mobile e continuam centralizados no desktop.
- Trilhos horizontais preservam rolagem por toque/teclado sem causar overflow da página.
- Reload limpo de Início, Descobrir e Perfil não gerou erros nem warnings no console.

## Diferenças intencionais

- Títulos e artes refletem os dados reais carregados, não os nomes fictícios do mock.
- Tipografia e alvos interativos mantêm legibilidade e áreas de toque de pelo menos 44 px, mesmo quando o mock gerado usa elementos menores.
- No viewport curto de 320 × 568, a barra fixa pode sobrepor apenas conteúdo ainda rolável; CTAs principais permanecem alcançáveis.

## Iteração — alinhamento do Header e densidade da Início

- **Header:** a regra global de `button` adicionava padding ao conteúdo dos botões fixos de 44 × 44 px. Busca e notificações agora anulam esse padding e normalizam o SVG; a medição após HMR ficou em `0 px / 0 px` nos eixos X/Y em 390 × 844 e para notificações em 1280 × 800.
- **Início autenticada:** preserva Hero, continuidade e recomendações e acrescenta, conforme os dados disponíveis, `Sua próxima escolha`, `Sua jornada`, `Aclamados pela comunidade` e `Destaques da temporada`.
- **Início visitante:** mantém o Hero e recebe os dois trilhos editoriais, sem expor seções pessoais vazias.
- **Separação de papéis:** os trilhos de gênero continuam exclusivos de Descobrir; a Início prioriza continuidade, decisões pessoais e uma amostra editorial.
- **Eficiência:** as novas seções reutilizam biblioteca, populares e temporada já carregados. Não foi adicionada nenhuma consulta de rede.
- **Variedade:** Hero, recomendações, biblioteca e trilhos editoriais são deduplicados por ID antes da renderização.

Evidência anterior ao aumento de densidade: `artifacts/design-audit/home-expansion-before-390x844.png`. A recaptura incremental pelo navegador in-app foi recusada pela política automática da ferramenta nesta execução; a composição nova reutiliza o `AnimeCarousel` já validado nos três viewports e um grid responsivo novo coberto por teste focado.

## Validação técnica

- ESLint: aprovado.
- Vitest serial: 65 arquivos, 196 testes aprovados.
- Firestore emulator: 21 testes de regras aprovados.
- Build de produção: aprovado, 3022 módulos transformados.
- `git diff --check`, varredura de emojis, placeholders externos e marcadores de conflito: aprovados.
- Iteração atual: ESLint global e `git diff --check` aprovados; teste focado do Header 1/1 e do resumo de jornada 2/2 aprovados.
- Os dois arquivos de integração da Home foram adicionados, mas o runner incremental não iniciou por `spawn EPERM`; a tentativa autorizada foi recusada por limite de uso da ferramenta, não por falha de asserção.

final result: passed
