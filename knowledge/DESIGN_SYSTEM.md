# Calangos — Design System

> Fonte da verdade visual do app Calangos. Todo novo componente, tela ou ajuste deve referenciar este documento. Quando algo aqui não cobrir um caso, **adicione ao documento antes de implementar**.

---

## 1. Princípios

1. **Fofo nos momentos certos, utilitário no resto.** Microcopy carinhoso (calanguinhos, ♥), mascote 3D em onboarding/empty/milestone. Listas e formulários ficam neutros e legíveis.
2. **Verde-musgo arejado.** O fundo escuro existe pra dar contraste; nunca usar verde saturado por longas áreas. Acentos quentes (coral, âmbar) carregam emoção.
3. **Densidade respirável.** Cards com padding generoso, hierarquia clara, gap em vez de margins. Nunca empilhar mais que ~3 níveis de info num mesmo card.
4. **Casal em primeiro plano.** Sempre que possível, mostrar os dois (avatares lado a lado, atividade compartilhada, copy no plural "calanguinhos").
5. **Sem slop.** Nada de ícones gratuitos, stats inventadas, sombras chamativas, gradientes barulhentos.

---

## 2. Tokens — Cores

Todos definidos como CSS vars / NativeWind theme. Usar **sempre** os tokens, nunca hex inline.

### Fundos (forest)
| Token       | Hex       | Uso                                       |
| ----------- | --------- | ----------------------------------------- |
| `--bg-0`    | `#07120D` | Base mais profunda (splash, fora do app)  |
| `--bg-1`    | `#0C1B14` | Background principal das telas            |
| `--bg-2`    | `#122820` | Cards padrão                              |
| `--bg-3`    | `#18372C` | Cards elevados, sheets, inputs em foco    |
| `--bg-4`    | `#1F4A3A` | Hover/pressed em superfícies              |

### Linhas / Bordas
| Token       | Hex       | Uso                                       |
| ----------- | --------- | ----------------------------------------- |
| `--line-1`  | `#1B3326` | Bordas sutis em cards (inset 0 0 0 1px)   |
| `--line-2`  | `#294A39` | Bordas em sheets, inputs e divisores      |
| `--line-3`  | `#3A6A53` | Foco visível, separadores fortes          |

### Texto (ink)
| Token       | Hex       | Uso                                       |
| ----------- | --------- | ----------------------------------------- |
| `--ink-1`   | `#F2F6EF` | Texto primário, títulos                   |
| `--ink-2`   | `#C2D0C5` | Corpo, descrições                         |
| `--ink-3`   | `#8AA194` | Hint, metadata, labels secundárias        |
| `--ink-4`   | `#5F786A` | Placeholders, texto desabilitado          |

### Verde de marca
| Token         | Hex       | Uso                                       |
| ------------- | --------- | ----------------------------------------- |
| `--brand-900` | `#0A2A1A` | Fundo de chips/CTA secundário             |
| `--brand-700` | `#155434` | Hover de elementos verdes profundos       |
| `--brand-500` | `#34B26C` | **Primary** · CTA, toggle, progresso      |
| `--brand-400` | `#5FCB8B` | Links, ícones ativos, badges "recebido"   |
| `--brand-300` | `#9AE3B6` | Ilustração, highlight                     |
| `--brand-100` | `#DDF5E4` | Texto sobre brand-500                     |

### Acentos
| Token         | Hex       | Uso                                       |
| ------------- | --------- | ----------------------------------------- |
| `--coral`     | `#E89784` | Love, "desejado", parceira (Maria), ♥     |
| `--amber`     | `#D9B370` | Conquistas, milestones, "ouro"            |
| `--rose`      | `#D98A99` | Variação para cômodos (lavanderia)        |
| `--sky`       | `#7FB6D9` | Status "comprado", banheiro, lojas        |
| `--danger`    | `#E0746A` | Excluir, alertas                          |

### Regra de aplicação
- **Brand verde** só em CTA primário, navegação ativa, "recebido" e progresso.
- **Coral** sempre que houver afeto: avatar da parceira, status "desejado", coração, novo item dela.
- **Âmbar** exclusivo para conquistas/milestones (trophy, badges). Não usar como CTA.
- **Sky/rose** apenas para diferenciar categorias (status de item, ícones de cômodos).

---

## 3. Tokens — Tipografia

### Famílias
- **Geist** (sans) — interface, body, números. Pesos 400/500/600/700.
- **Geist Mono** — URLs, datas técnicas, dados crus. Apenas em 11–12px.
- **Fraunces italic** (serif) — momentos emocionais. Apenas em headers grandes (≥28px) e marcos. **Nunca** em UI corriqueira.

### Escala
| Nome      | Tamanho | Peso | Letter-spacing | Uso                          |
| --------- | ------- | ---- | -------------- | ---------------------------- |
| Display   | 28–44px | 500  | −0.025em       | Fraunces italic; onboarding  |
| H1        | 26px    | 600  | −0.02em        | Title de tela                |
| H2        | 20px    | 600  | −0.015em       | Title em sheet               |
| H3        | 15–16px | 600  | −0.01em        | Card title                   |
| Body      | 14px    | 400  | 0              | Texto padrão                 |
| Small     | 12.5px  | 400  | 0              | Subtitle, hint               |
| Caption   | 11.5px  | 500  | 0              | Metadata                     |
| Eyebrow   | 11px    | 600  | 0.1em UPPER    | Section headers              |
| Mono      | 11px    | 400  | −0.01em        | URL, ID                      |

### Regras
- Nunca menor que **11px** em mobile.
- Number-tabular em valores monetários e estatísticas.
- `text-wrap: pretty` em qualquer parágrafo > 1 linha.

---

## 4. Tokens — Espaçamento, raios e elevação

### Espaçamento (4px base)
`gap-2: 8px · gap-3: 12px · gap-4: 16px · gap-5: 20px · gap-6: 24px`

Padding padrão de tela: **18px horizontal** (com bottom-nav reservando 100px).

### Raios
| Token         | Valor    | Uso                                       |
| ------------- | -------- | ----------------------------------------- |
| `--radius-sm` | 10px     | Inputs pequenos, chips de status          |
| `--radius`    | 16px     | Cards, inputs                             |
| `--radius-lg` | 22px     | Sheets, modais                            |
| `--radius-xl` | 28px     | Top de bottom-sheet, hero cards           |

### Sombra
- **Inset apenas**: `inset 0 0 0 1px var(--line-1)` em cards.
- **Drop shadow** só em FAB e sheet aberto: `0 6px 24px rgba(95,203,139,.30)` (FAB), `0 -30px 40px rgba(0,0,0,.4)` (sheet).
- Evitar mais de uma sombra na mesma tela.

---

## 5. Ícones

- **Estilo**: Lucide duotone customizado — outline 1.6px + fill suave a 18–22% do `currentColor`.
- **Tamanho padrão**: 22px (inline), 26–28px (chip de cômodo), 18px (action row em sheet).
- **Cor**: sempre `currentColor`; o pai define o tom.
- **Biblioteca**: ver `src/icons.jsx`. Para novos ícones, manter mesmo viewBox 24×24, stroke 1.6px e fill semi-transparente.
- **Emoji**: em UI hardcoded (botões, labels, action rows) usar **apenas Lucide** — nunca emoji como ícone funcional. Em microcopy livre (💍 🌿 ♥ 🦎 🎉). Em **conteúdo escolhido pelo usuário** (ex.: ícone do cômodo), o emoji é o próprio valor — renderizar como texto no lugar do Lucide.

---

## 6. Componentes

### Buttons
- **Primary**: `--brand-500` bg, `#04140A` text, height 52px, radius 999px.
- **Ghost**: bg transparente com `inset 0 0 0 1px --line-2`, texto `--ink-1`.
- **Secondary**: `--bg-3` bg + inset border, texto `--ink-1`.
- **Danger ghost**: bg `rgba(224,116,106,.10)`, texto `--danger`.
- Tamanhos: `sm` (38px) · `md` (52px, padrão) · `xs` (30px, em sheets/toasts).

### Cards
- Base: `--bg-2` + `inset 0 0 0 1px --line-1` + radius 16px + padding 16px.
- Elevado: `--bg-3` + `inset 0 0 0 1px --line-2`.
- Cards com gradiente de "calor" (hero progress, conquista) usam radial-gradients sutis de brand + coral.

### Inputs
- Height 54px, radius 16px, bg `--bg-2`, ícone à esquerda em `--ink-3`.
- Focused: bg vai pra `--bg-1`, inset border vira `1.5px --brand-500`.
- Label = eyebrow 11px UPPER acima do input.

### Chips
- Default: bg `rgba(255,255,255,.05)` + inset border, texto `--ink-2`, 28px.
- Active: `--brand-500` bg, texto `#04140A`.
- Status (`desejado/comprado/recebido/cancelado`): bg tonalizado a 16–18% da cor de status, texto na cor.

### Tiles de cômodo
- Card 2-col, padding 14, min-height 110.
- Topo: chip de ícone 40×40 com bg `<color>1F` (12% opacity).
- Chip renderiza **emoji escolhido pelo usuário** (Text 22px). Default `📦` quando nenhum emoji foi definido. Fallback Lucide `package` para registros legados sem emoji.
- Barra de progresso 3px na cor do cômodo.

### Bottom Nav
- 4 tabs: **Início / Cômodos / Casal / Perfil**.
- Active: `--brand-400` + fill duotone 32%; inactive: `--ink-4` + fill 12%.

### Bottom Sheet
- Radius 28px top, padding 14px 18px 22px.
- Handle: 38×4px, `--line-2`, centralizado.
- Backdrop: `radial-gradient(rgba(0,0,0,.5), rgba(0,0,0,.7))`.

### Avatares
- Adrian (eu) → bg `--brand-600`, texto `#04140A`.
- Parceira → bg `--coral`, texto `#3D1F18`.
- Sempre exibir os dois juntos sobrepostos (offset −10px) em headers do casal.

### Sistema de Status (item)
| Status      | Cor               | Quando aplicar                          |
| ----------- | ----------------- | --------------------------------------- |
| Desejado    | `--coral`         | Default ao adicionar item               |
| Comprado    | `--sky`           | Pedido feito, aguardando entrega        |
| Recebido    | `--brand-400`     | Item em casa — celebrar 🦎              |
| Cancelado   | `--danger`        | Desistido / fora de estoque             |

---

## 7. Microcopy — Tom de voz

- **Falar com**, não pra. Inclusivo: "vocês", "calanguinhos", "nosso enxoval".
- **Quente, mas curto.** Frases ≤ 12 palavras em UI.
- **Celebrar pequenas vitórias**: "parabéns! 🦎", "vocês estão indo muito bem", "faltam X dias 💍".
- **Empty states** sempre com um calanguinho 3D + frase carinhosa, nunca seca.
- **Erros** suaves: "ops, não rolou" antes do detalhe técnico.

### Exemplos canônicos
| Contexto                     | Use isto                                          |
| ---------------------------- | ------------------------------------------------- |
| Boas-vindas                  | "Organizem o enxoval juntinhos."                  |
| Sem parceira ainda           | "Convide o seu calanguinho →"                     |
| Lista vazia                  | "Ainda nada por aqui. Cole um link?"              |
| Sucesso ao adicionar         | "Item salvo. Maria foi notificada ♥"              |
| Conquista                    | "Conquista nova: primeiros 25 itens 🎉"           |
| Botão de salvar              | "Salvar item" (não "Confirmar", não "OK")         |

---

## 8. Layout & Navegação

- **4 tabs base** no bottom-nav: Início, Cômodos, Casal, Perfil.
- **Header de tela**: H1 + subtitle muted. Back button é texto `← Voltar` em `--brand-400`.
- **Floating Action Button (FAB)**: apenas em Cômodo detalhe (+ item). Bottom: 100px (acima do nav).
- **Toast de link detectado**: flutuante acima do bottom-nav, com bg blurred. Sempre 2 ações: Ignorar (ghost) + Adicionar (primary).

---

## 9. Mascote (Calangos 3D)

> Manter as ilustrações 3D existentes — não recriar em SVG.

- **Onboarding** (splash, welcome, signup, login, invite): hero 3D em destaque.
- **Empty states**: versão menor do casal 3D + frase carinhosa.
- **Milestones/conquistas**: pode aparecer em modais celebratórios.
- **Não usar** o mascote como ícone funcional (use ícones duotone).

Tamanhos sugeridos:
- Splash/Welcome: 170–180px
- Login/Signup/Invite: 120–140px
- Empty states inline: 80–100px

---

## 10. Acessibilidade

- Hit target mínimo: **44×44px**.
- Contraste: corpo (`--ink-2 #C2D0C5` em `--bg-1 #0C1B14`) ≥ 9:1. Hint (`--ink-3`) usado só em texto secundário ≥ 12px.
- Toggles têm estado visível (background + posição do knob).
- Status nunca codificado **só** por cor — incluir label ("Desejado", "Recebido").
- Toda interação tem feedback de press (`transform: translateY(1px)` ou opacity).

---

## 11. Stack & convenções

- **React Native + NativeWind + Lucide React Native**.
- Para Lucide: importar e re-exportar como `<Icon name="..." />` com a mesma API do mock; aplicar fill via `strokeWidth=1.6` + variant duotone customizado quando preciso.
- Tokens via `tailwind.config.js` (`theme.extend.colors`) — espelhar a tabela acima.
- Componentes em `src/components/ui/` (Button, Card, Input, Chip, Sheet, Tile, ItemCard, ProfileRow, ActivityRow, etc).
- Telas em `src/screens/` com sufixo `Screen` (`DashboardScreen.tsx`).

---

## 12. Não faça

❌ Usar verde brilhante (`#22c55e`, `#16a34a`) — fica genérico, foge da marca.
❌ Gradiente como fundo de tela.
❌ Ícones de Material/Heroicons misturados com Lucide.
❌ Sombras grandes em cards (`box-shadow: 0 20px ...`).
❌ Mais de 1 acento (coral OU âmbar) na mesma tela em destaque.
❌ Emojis como ícones de UI.
❌ Microcopy genérico ("OK", "Erro", "Continuar" sem contexto).
❌ Mascote SVG recriado — usar 3D original.

---

_Versão 1.0 · jan 2026 · mantido pelos calangos 🦎_
