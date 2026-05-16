# CLAUDE.md — Calangos

## Sobre o projeto

**Calangos** é um app React Native (Expo) + NestJS para casais organizarem o enxoval do casamento. Faz scraping de produtos ao colar links, sincroniza entre os dois parceiros e celebra os marcos juntos.

- **Frontend**: React Native + NativeWind (Tailwind) + Lucide React Native
- **Backend**: NestJS
- **Banco**: Neon (Postgres serverless)
- **Auth**: BetterAuth

---

## ⚠️ Regras inegociáveis de UI

> **Antes de criar, alterar ou propor qualquer tela, componente ou estilo, leia `DESIGN_SYSTEM.md`.**
> Ele é a fonte da verdade. Se algo não estiver coberto lá, primeiro **adicione ao documento**, depois implemente.

### Tokens

- **Nunca** use cores hex inline. Sempre tokens (`--brand-500`, `--coral`, `--ink-2`, etc).
- **Nunca** invente um tom novo de verde — escolha um dos `brand-*` existentes.
- Para um acento que ainda não exista no sistema: pare, abra issue/discussão antes de adicionar.

### Tipografia

- Famílias permitidas: **Geist** (UI), **Geist Mono** (URLs/dados), **Fraunces italic** (display ≥28px, momentos emocionais).
- Nunca menor que **11px**.
- Fraunces nunca em UI corriqueira (botões, labels, body).

### Ícones

- **Apenas Lucide** (lucide-react-native) em UI hardcoded, em estilo duotone do sistema (`stroke 1.6`, fill semi-transparente).
- Emojis em **microcopy** (💍 ♥ 🦎 🎉) e em **conteúdo escolhido pelo usuário** (ex.: ícone do cômodo, onde o emoji é o próprio valor salvo). Nunca como ícone funcional hardcoded.
- Sem mistura com Heroicons, Material, Feather, etc.

### Mascote

- **Manter as artes 3D existentes** dos calangos — onboarding, empty states, milestones.
- **Não** gerar SVG/ilustração nova do mascote. Se precisar de uma nova pose, peça ao designer.

### Microcopy

- Tom carinhoso, no plural ("vocês", "calanguinhos", "nosso enxoval").
- Frases curtas (≤12 palavras em UI).
- Sempre celebrar marcos: "parabéns! 🦎", "vocês estão indo bem 💍".
- Nunca usar copy genérico ("OK", "Continuar" sem contexto, "Erro").

### Componentes

- Use os componentes existentes em `src/components/ui/` (`Button`, `Card`, `Input`, `Chip`, `Sheet`, `Tile`, `ItemCard`, `ProfileRow`, `ActivityRow`).
- Se for criar um componente novo: padronize com os existentes (raio, padding, inset border, tokens).

### Acessibilidade

- Hit target ≥ **44×44px**.
- Status nunca só por cor — sempre com label.
- Toggles e selecionados sempre com feedback visual claro (não só ARIA).

---

## Estrutura

```
app/
  src/
    components/
      ui/           # Button, Card, Input, Chip, Sheet, Tile, etc.
      icons/        # Wrappers duotone de Lucide
      layout/       # AppBar, BottomNav, Phone (storybook)
    screens/        # *Screen.tsx — uma tela por arquivo
    hooks/
    services/       # API client, link scraper bridge
    store/          # estado global (Zustand)
    theme/          # tokens em formato JS — espelham DESIGN_SYSTEM.md
api/
  src/
    modules/        # auth, items, rooms, couple, notifications, scraper
```

---

## Como propor mudanças visuais

1. Releia `DESIGN_SYSTEM.md` na seção relevante.
2. Se a mudança contraria o sistema → discuta antes; ele é mais velho que sua opinião sobre essa tela.
3. Se a mudança **estende** o sistema → atualize `DESIGN_SYSTEM.md` no mesmo PR.
4. Toda PR de UI deve linkar à seção do design system que justifica o trecho.

---

## Listas vivas

- `HI-FI-TODO.md` — backlog priorizado de melhorias de UI/UX até a release 1.0.
- `DESIGN_SYSTEM.md` — fonte da verdade visual.

---

_feito com ♥ pelos calangos 🦎_
