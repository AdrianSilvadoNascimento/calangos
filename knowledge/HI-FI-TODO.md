# HI-FI TODO — Calangos rumo à produção

> Backlog priorizado de melhorias visuais e de UX até o lançamento 1.0. Riscado o que está pronto no mock. Cada item referencia a seção do `DESIGN_SYSTEM.md` quando aplicável.
>
> **Fora de escopo**: redesenho dos calangos 3D (mantemos os existentes).

---

## 🚀 P0 — Bloqueia o lançamento

### Sistema visual
- [ ] **Migrar tokens** para `tailwind.config.js` espelhando `DESIGN_SYSTEM.md` §2.
- [ ] **Substituir** todas as cores hex inline por classes Tailwind dos tokens.
- [ ] **Carregar Geist + Fraunces** via Expo Font (não usar fallback de sistema).
- [ ] **Configurar wrapper de Lucide** duotone (`<Icon name strokeWidth={1.6} />` + variant fill 0.18) e remover todos os emojis usados como ícones funcionais.

### Onboarding
- [ ] **Splash**: substituir branding atual pelo layout novo (logo + loader sutil, sem "Bundling 33%").
- [ ] **Welcome**: 3 botões (Criar / Convite / Entrar) com hierarquia certa — primary, ghost com ícone, link textual.
- [ ] **Criar conta**: form com label-eyebrow, ícone à esquerda, ícone toggle senha. Microcopy "Vamos começar a montar essa casinha 🌿".
- [ ] **Login**: header "Bom te ver de novo 🦎" + "Esqueci a senha".
- [ ] **Convite**: card explicativo coral abaixo do input, copy "Te chamaram pra cá ♥".

### Home / Cômodos
- [ ] **Bottom-nav** de 4 abas: Início · Cômodos · Casal · Perfil (hoje são 3).
- [ ] **Novo tab "Início" (Dashboard)** com:
  - Hero card de progresso (ring + faltam X dias)
  - Quick actions (Colar link, Novo item)
  - Mini feed de atividade do casal
  - Carrossel de próximas conquistas
- [ ] **Tiles de cômodo** com chip de ícone tonalizado (12% opacity) + barra de progresso 3px na cor do cômodo.
- [ ] **Tile "+ Novo cômodo"** ocupa toda largura, dashed border.

### Cômodo detalhe
- [ ] **Header** com ícone tonalizado 50×50 + título + "X itens · R$ Y total" + menu kebab.
- [ ] **Chips de filtro** com count: "Todos · 8", "Desejados · 4", etc.
- [ ] **FAB** verde flutuando bottom-right (acima do nav).
- [ ] **Empty state**: ilustração 3D pequena + "ainda nada por aqui — cole um link?".

### Sheets
- [ ] **Editar cômodo**: ícone selector em grid 5-col + color accent picker.
- [ ] **Ações de item**: header com thumb do produto, agrupamentos com divider (status / utilidades / destrutivas).
- [ ] **Adicionar ação "Comparar preços"** e **"Compartilhar com convidados"** (link com lista pública).
- [ ] **Toast de link detectado**: variante compacta acima do bottom-nav (não banner gigante topo).

### Perfil (a tela mais carente)
- [ ] **Substituir** o avatar único por header de **casal** (avatares sobrepostos + coração no meio).
- [ ] **Stats trio**: itens · planejado · % completo.
- [ ] **Agrupamentos** em cards: Meu perfil / Parceira / Preferências / Seus dados.
- [ ] **Toggle rows** (notificações, detectar links).
- [ ] **Botão sair** em ghost-danger no final, não destacado.

---

## 🌱 P1 — Lançamento melhor

### Atividade do casal (nova tab)
- [ ] Feed cronológico de ações da dupla (adicionou / comprou / recebeu / curtiu / comentou).
- [ ] Banner de conquista no topo quando houver uma recente.
- [ ] Progresso visual por cômodo (mini barras horizontais).
- [ ] Carrossel de próximas conquistas com %.

### Conquistas / milestones
- [ ] Definir set inicial de conquistas: primeiros 10/25/50/100 itens, cada cômodo 50%/100%, primeiro recebido, casamento em X dias.
- [ ] Toast/modal celebratório quando desbloquear (com calanguinho 3D).
- [ ] Histórico de conquistas no perfil.

### Notificações
- [ ] Tela dedicada (`/notifications`) com tipos: add · like · receive · milestone · price · comment.
- [ ] Badge no sino do header com contagem não lida.
- [ ] Preferências granulares no perfil (qual evento dispara push).
- [ ] Pull-to-refresh.

### Orçamento
- [ ] Card hero com total planejado + barra segmentada (recebido/comprado/restante).
- [ ] Lista por cômodo com mini-barras.
- [ ] Carrossel "Lojas favoritas" com contagem de itens.
- [ ] Editar preço inline no item.
- [ ] Alerta "Você passou do orçamento da cozinha" (opt-in).

### Lista de presentes compartilhável
- [ ] URL pública `calangos.app/<slug-do-casal>`.
- [ ] Botão Compartilhar + QR Code.
- [ ] Stats: visualizações, reservados, comprados.
- [ ] Marcação "reservado" pelo convidado (sem login).
- [ ] Toggle por item: "incluir na lista pública".

---

## 💎 P2 — Polimento e novidade

### Comparativo de preços entre lojas
- [ ] Ao adicionar item, sugerir 2–3 alternativas de outras lojas via scraping.
- [ ] Histórico de preço por item (gráfico simples).
- [ ] Notificação "Preço caiu" quando o item desejado baixar X%.

### Adicionar item
- [ ] Preview do link com favicon da loja + thumb + título scraped.
- [ ] Auto-classificação de cômodo via IA (`window.claude.complete` ou backend).
- [ ] Múltiplos cômodos por item (ex: utensílio que serve cozinha e área de serviço).
- [ ] Anotações com prioridade (alta/média/baixa) → influencia ordem na lista.

### Microinterações
- [ ] Splash com transição fluida pro Welcome (não corte brusco).
- [ ] Item marcado como "recebido" → confete + calanguinho.
- [ ] Pull-to-refresh em todas as listas.
- [ ] Skeleton loading com pulse sutil, sem spinners.
- [ ] Empty states animados (mascote balança).

### Acessibilidade
- [ ] Auditoria de contraste em todas as combinações de texto/fundo.
- [ ] Suporte a Dynamic Type (tamanhos de fonte do SO).
- [ ] Reduced motion → desliga animações.
- [ ] VoiceOver/TalkBack: labels em todos os ícones-botão.
- [ ] Modo claro? (decidir se entra na 1.0 ou fica pra 1.1).

### Performance & UX
- [ ] Cache local do scraping (se o mesmo link cair de novo).
- [ ] Offline-first: enxoval acessível sem rede; sync ao voltar.
- [ ] Compressão de imagens de produto.
- [ ] Otimizar bundle splash (hoje aparece "Bundling 33%" — esconder em release).

---

## 🪴 P3 — Pós-1.0

- [ ] Calendário do casamento integrado (com countdown ao vivo, datas-chave: cha de panela, mudança, lua de mel).
- [ ] Lista de tarefas paralela ao enxoval (não-itens: contratar fotógrafo, etc).
- [ ] Modo "celebração": tela cheia ao bater 100% do enxoval.
- [ ] Convidados podem deixar mensagem ao reservar presente.
- [ ] Export do enxoval como PDF bonito (lembrancinha).
- [ ] Dark/light theme switcher.
- [ ] Múltiplas casas (caso o casal tenha apto + casa de campo).
- [ ] Integrações: Pinterest (importar pin como item), Google Sheets (export).
- [ ] App widget iOS/Android com progresso.

---

## 🐞 Bugs visuais conhecidos (do app atual)

- [ ] Tela de splash mostra "Bundling 33%" — esconder em produção.
- [ ] Avatar genérico de perfil (silhueta azul) — substituir por iniciais coloridas.
- [ ] Campo "Enxoval = aaaa" no perfil — renomear pra "Nome do enxoval" e tratar valor padrão.
- [ ] Banner de link copiado tem dois estados sobrepostos (topo grande + bottom toast) — manter apenas o toast.
- [ ] "Editar cômodo" sheet hoje sem cor de acento — adicionar swatch picker.
- [ ] Status "Desejado" laranja não conversa com a paleta — migrar pra `--coral`.

---

## 📋 Checklist pré-release

Antes de cada release de UI:

- [ ] Todas as cores são tokens (grep de hex inline).
- [ ] Nenhum emoji em botão/ícone funcional.
- [ ] Microcopy revisado por humano (sem "Continue", "Erro", etc).
- [ ] Mascote 3D em todos os onboarding e empty states.
- [ ] Smoke test: cadastrar, convidar, colar link, adicionar item, marcar recebido, ver perfil.
- [ ] VoiceOver lê todos os botões corretamente.
- [ ] Funciona em iPhone SE e Pixel 6 sem clip de texto.

---

_atualize esta lista a cada PR · feito com ♥ pelos calangos 🦎_
