# Plano de ação — refatoração mobile

## Objetivo

Refatorar a experiência mobile do PortalAnimes sem perder nenhuma capacidade atual. A nova interface deve ficar mais clara, leve e consistente entre Início, Descobrir, Biblioteca e Perfil, mantendo desktop, temas, preferências, autenticação e dados existentes.

## Princípios obrigatórios

- A navegação mobile terá quatro destinos: **Início**, **Descobrir**, **Biblioteca** e **Perfil/Entrar**.
- O PortalAnimes é uma plataforma de catálogo e acompanhamento: a linguagem principal será **episódios, progresso, coleção e descoberta**, nunca reprodução ou minutos assistidos.
- Emojis visuais serão substituídos por ícones da biblioteca já adotada no projeto.
- A refatoração muda hierarquia e apresentação, não remove funções.
- Temas, preferências, dados do Firestore, URLs existentes e experiência desktop devem continuar funcionando.
- Conteúdo nunca poderá ficar encoberto pela barra inferior, teclado, notch ou safe area.
- Loading, vazio, erro, visitante e sucesso serão tratados de forma explícita em cada área.

## Mapa funcional e novo destino

| Área | O que será preservado | Nova organização mobile |
| --- | --- | --- |
| **Início** | Hero, lista, recomendações, progresso e retry | Hero compacto primeiro; Continue acompanhando; Para você; no máximo uma seção editorial de apoio |
| **Descobrir** | Busca, catálogo, temporada, populares, gêneros, calendário, personagens, pessoas e estúdios | Busca e atalhos; destaque da temporada; novos da temporada; 3 lançamentos de hoje + Ver semana; carrosséis editoriais; Além dos animes |
| **Biblioteca** | Resumo, status, busca, filtros, ordenação, grade/lista, progresso, sincronização, remoção e backup | Cabeçalho compacto; resumo; Continue acompanhando; busca e status visíveis; filtros avançados em sheet; coleção com ações rápidas |
| **Perfil** | Identidade, favoritos, estatísticas, conquistas, atividade, social, compartilhamento, edição e configurações | Cabeçalho hierarquizado; resumo 2×2; blocos de Favoritos, Jornada e Atividade; entradas claras para Editar e Configurações |

### Funções que saem do antigo menu mobile

- **Calendário:** acesso contextual em Descobrir, por “Ver semana”.
- **Personagens, Pessoas e Estúdios:** seção “Além dos animes” em Descobrir e busca global tipada.
- **Estatísticas:** acesso pelo Perfil.
- **Busca de usuários/Comunidade:** acesso por Descobrir e pelo fluxo social do Perfil.
- **Configurações:** acesso pelo Perfil.
- **Sair:** acesso em Perfil/Conta.
- As rotas antigas continuarão válidas; nenhuma função dependerá do antigo botão “Menu”.

## Prioridades

- **P0 — Base e segurança da refatoração:** paridade funcional, rotas, navegação, safe area, camadas de modal, acessibilidade e estados críticos.
- **P1 — Experiência principal:** Início, Descobrir, Biblioteca e Perfil na nova direção visual.
- **P2 — Refinamento:** desempenho, transições, analytics, limpeza de componentes legados e polimento visual.

## Etapas de execução

### 0. Baseline e contrato de preservação — P0

- Registrar testes e comportamento atual das quatro áreas.
- Mapear cada ação existente para o seu novo ponto de entrada.
- Unificar tokens mobile de espaçamento, raio, alvo de toque, safe area e camadas.
- Padronizar página, diálogo, bottom sheet, bloqueio de scroll, foco, Escape e botão Voltar.
- Unificar contratos de nome, bio, privacidade, gêneros e status da biblioteca.

**Aceite:** nenhuma função fica sem destino; nenhum modal aparece atrás da navegação; controles principais têm alvo mínimo de 44×44 px.

### 1. Shell e navegação mobile — P0

- Criar a barra inferior flutuante, oval e fixa com quatro itens.
- Implementar `/discover` e estado ativo também nas subrotas relacionadas.
- Ajustar padding inferior de todas as páginas e respeitar `env(safe-area-inset-bottom)`.
- Fazer overlays, busca, sheets e modais sempre ficarem acima da barra.
- Preservar redirecionamento de autenticação e retorno ao destino original.

**Aceite:** quatro destinos funcionais, sem item Menu; nenhuma página fica encoberta; rotas antigas não geram 404.

### 2. Início — P1

- Manter o Hero como primeira seção e compactá-lo apenas no mobile.
- Preservar rotação, pausa, movimento reduzido, arte ambiente, slides, CTA de detalhes e Minha lista.
- Levar “Continue acompanhando” para a Home usando a biblioteca real e `+1 episódio` por item.
- Exibir “Para você” apenas quando houver personalização real; usar uma seção editorial de fallback para visitantes.
- Ajustar carrossel mobile para mostrar três capas completas e uma parte clara da quarta.
- Retirar da Home o conjunto completo de carrosséis por gênero.

**Aceite:** hero legível e sem overflow entre 320 e 430 px; progresso nunca ultrapassa o total; temas, densidade, notas e desktop não regridem.

### 3. Descobrir — P1

- Criar a landing editorial `/discover`, mantendo `/catalog` como tela de resultados e filtros completos.
- Adicionar busca global e atalhos para Gêneros, Temporada, Populares e Formatos.
- Montar Destaque da temporada e “Novos nesta temporada” sem repetir títulos.
- Exibir exatamente três itens em “Lançamentos hoje” e levar “Ver semana” ao calendário.
- Migrar para cá os oito carrosséis editoriais hoje presentes na Home:
  - Ação e Adrenalina
  - Romance e Amor
  - Drama e Emoção
  - Terror e Suspense
  - Comédia e Diversão
  - Mundo da Fantasia
  - Ficção Científica
  - Esportes & Competição
- Adicionar “Além dos animes” com Personagens, Pessoas e Estúdios.
- Ampliar o catálogo para interpretar filtros de URL de temporada, formato, ordenação e gêneros.
- Carregar seções progressivamente para uma falha não derrubar a página inteira.

**Aceite:** todos os atalhos aplicam filtros reais; há no máximo três lançamentos; todos os conteúdos antigos continuam alcançáveis; quarta capa parcial indica rolagem.

### 4. Biblioteca — P1

- Compactar cabeçalho e resumo: total, assistindo, concluídos e episódios.
- Manter “Continue acompanhando” com progresso e ação `+1 episódio`.
- Deixar busca e status como controles primários.
- Mover gênero, ano, temporada, formato e ordenação para um bottom sheet acessível, sem busca duplicada.
- Preservar filtros combinados, semântica OR dos gêneros e persistência local.
- Manter grade/lista; ambas devem comunicar status, episódio atual/total e progresso.
- Preservar mudança de status, favoritos, sincronização, remoção com confirmação e detalhes.
- Separar vazio real, zero resultados e erro de carregamento com retry.
- Manter backup em Perfil → Configurações → Biblioteca: JSON/CSV e importação JSON/XML do MyAnimeList.

**Aceite:** filtros e ordenação combinam sem perda de estado; `+1` não duplica nem excede total; ações não ficam aninhadas dentro de links; sheet devolve foco ao fechar.

### 5. Perfil, jornada e social — P1

- Reorganizar banner, avatar, nome, bio, gêneros, conexões, seguidores e ações da primeira dobra.
- Manter editar como ação primária; compartilhar e configurações como ações secundárias.
- Exibir estatísticas principais em resumo 2×2, com episódios como métrica principal.
- Manter Favoritos de animes, personagens e estúdios, incluindo ordem, aba preferida e troca de capa.
- Manter Jornada com progresso, próxima conquista, vitrine de três destaques e catálogo completo.
- Garantir que conquistas completas e incompletas permaneçam dentro do container.
- Manter atividade recente e heatmap; priorizar seis meses em telas estreitas e permitir doze sob demanda.
- Preservar seguidores, seguindo, busca de usuários, perfil público, privacidade, seguir e compatibilidade.
- Oferecer alternativa acessível de mover seções para cima/baixo além do gesto de arrastar.

**Aceite:** perfil próprio e público compartilham estrutura sem vazar ações privadas; vitrine não tem overflow; social cobre loading, vazio e erro; não há rolagem horizontal da página.

### 6. Edição, configurações e conta — P1

- No mobile, tratar Editar perfil e Configurações como fluxos de tela cheia com índice e subseções; manter diálogo no desktop.
- Editar perfil: visual, identidade, gostos, conexões e visibilidade.
- Configurações: aparência, experiência, biblioteca/backup, notificações e conta.
- Preservar os oito temas e as preferências de autoplay, movimento reduzido, notas, densidade e notificações.
- Identificar claramente preferências salvas “neste dispositivo” e preferências sincronizadas.
- Preservar rascunho entre subseções e avisar antes de descartar alterações.
- Manter upload/crop, confirmação de exclusão e reautenticação.
- Tornar seleção de arquivo a ação principal de importação no touch.

**Aceite:** teclado e safe area não cobrem campos ou CTAs; salvar/voltar é previsível; exclusão mantém as proteções existentes.

### 7. Consistência, acessibilidade e desempenho — P0/P2

- Remover emojis de todas as superfícies e substituir por ícones adequados.
- Padronizar textos de status e remover linguagem que sugira streaming.
- Aplicar foco visível, nomes acessíveis, `aria-current`, estados de progresso e contraste adequado.
- Respeitar movimento reduzido, temas e preferência de densidade.
- Usar imagens grandes, fallback responsivo e lazy loading.
- Evitar requisições duplicadas e manter cache/query keys existentes.
- Instrumentar apenas eventos úteis: troca de aba, filtros, `+1 episódio`, abertura de detalhes e conclusão de fluxos.

**Aceite:** nenhum emoji permanece; nenhuma interação depende apenas de cor/hover; seções lentas carregam de forma independente.

### 8. Verificação e entrega incremental — P0

- Adicionar testes unitários e de integração junto de cada etapa.
- Validar visitante e autenticado, tema padrão e alternativo, conteúdo, vazio, loading, erro e retry.
- Verificar 320×568, 360×800, 390×844, 430×932, tablet e desktop.
- Conferir teclado, foco, botão Voltar, safe area, modais, rolagem e redução de movimento.
- Rodar lint, testes, regras do Firestore quando afetadas e build.
- Comparar visualmente a implementação com os mocks aprovados da Home e Descobrir.
- Entregar em blocos pequenos e revisar a paridade funcional ao final de cada bloco.

## Ordem prática de implementação

1. Fundação + navegação.
2. Início.
3. Descobrir.
4. Biblioteca.
5. Perfil + Jornada + Social.
6. Edição + Configurações + Conta.
7. Consistência global, testes e QA final.

## Definição de pronto

- As quatro áreas mobile seguem a mesma direção visual e funcionam de ponta a ponta.
- Toda função listada neste documento possui um ponto de entrada testado.
- Nenhuma página, modal, card ou conquista apresenta overflow inesperado.
- Nenhum conteúdo fica sob a barra inferior, teclado ou safe area.
- Desktop, temas, preferências, autenticação e modelos de dados permanecem compatíveis.
- Não há emojis nem linguagem de streaming nas superfícies revisadas.
- Lint, testes pertinentes e build passam; a comparação visual é aprovada nas larguras definidas.
