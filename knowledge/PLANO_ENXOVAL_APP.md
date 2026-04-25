# Enxoval App — Plano de Desenvolvimento (versão final)

Aplicativo mobile para organizar links de produtos do enxoval de casamento por cômodo, com compartilhamento entre o casal, preview dos produtos e notificações em tempo real.

**Arquitetura:** Monorepo Turborepo (pnpm) · Expo (mobile) · Nest.js (API) · Better Auth self-hosted · Neon Postgres · Drizzle · Pusher Channels.

---

## 1. Visão Geral

**Problema:** Organizar links de produtos no WhatsApp é caótico. Itens se perdem no histórico, não há categorização, preview inconsistente e ausência de controle do que já foi comprado.

**Solução:** App mobile privado para o casal que captura links de qualquer e-commerce, organiza por cômodo, exibe preview rico, sincroniza em tempo real entre os dois celulares via Pusher e notifica quando o parceiro adiciona um item.

**Escopo:** 2 usuários (casal). Sem abertura pública, sem marketplace.

**Critérios de sucesso do MVP:**
- [ ] Ambos conseguem cadastrar link via "Compartilhar" de qualquer loja
- [ ] App detecta link copiado ao abrir e pergunta se quer cadastrar
- [ ] Produtos aparecem com imagem, título e preço quando disponível
- [ ] Sincronização entre os dois dispositivos via Pusher Channels
- [ ] Push notification quando um adiciona produto chega no outro

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Notas |
|---|---|---|
| Monorepo | **Turborepo + pnpm** | pnpm workspaces, cache do Turbo |
| Mobile | **Expo SDK 52+ com Expo Router** | Roteamento por arquivos, build nativo via EAS |
| Linguagem | TypeScript em tudo | Type-safety ponta a ponta |
| API | **Nest.js** (Express adapter) | Modular, DI, testável |
| Hospedagem API | **Render** | Free com hibernação, ou Starter US$7/mês |
| ORM | **Drizzle** | Schema + migrations versionadas |
| Banco | **Neon Postgres** (serverless) | Free tier generoso, branching nativo |
| Driver Neon | `postgres` (postgres.js) | Pool de conexões para Nest tradicional |
| Auth | **Better Auth self-hosted** | Rodando dentro do Nest via `@thallesp/nestjs-better-auth` |
| Plugin mobile auth | **`@better-auth/expo`** | Cookie session via SecureStore, deep linking |
| Sync tempo real | **Pusher Channels** (Sandbox free) | SDK nativo no mobile, servidor Nest só publica via HTTP |
| Scraping | Módulo Nest com **cheerio** + **undici** | Executa no backend próprio |
| Estado mobile | **TanStack Query** + **Zustand** | Cache, fetch e estado local |
| UI | **NativeWind** + **Reanimated** | Tailwind no RN |
| Push | **Expo Notifications + FCM** | Nest dispara via Expo Push Service |
| Validação | **Zod** compartilhado | Mesmos schemas em mobile e API |
| Build mobile | **EAS Build + EAS Submit** | Obrigatório para Share Intent |

### Por que não Neon Auth managed

Neon Auth (versão Better Auth, em Beta) está focado em web: os SDKs oficiais só cobrem Next.js, React Router e React SPAs. Não há plugin Expo/React Native oficial — o único demo RN existente usa a versão legada (Stack Auth). Como queremos mobile-first e já temos Nest, Better Auth self-hosted ganha em: um sistema só (auth + API), plugin Expo oficial maduro e controle total sobre plugins, hooks e customização.

### Por que Neon (e não Supabase)

Serverless Postgres real (escala e pausa sozinho), branching nativo (cada branch git com seu banco isolado), connection pooling gerenciado (pgbouncer) e free tier generoso (0.5 GB, compute pausa quando ocioso). Neon não faz auth/realtime/storage como Supabase, mas cobrimos auth no Nest (Better Auth), realtime com Pusher e storage não é necessário (imagens são URLs externas das lojas).

### Por que Pusher para Realtime

A conexão persistente fica entre o mobile e o Pusher (WebSocket nativo), não com nossa API. Se o Render hiberna, o realtime dos clientes não cai. O SDK nativo (`@pusher/pusher-websocket-react-native`) lida com reconexão, mudança de rede e background/foreground automaticamente. Canais privados (`private-couple-{uuid}`) exigem auth do backend antes do Pusher aceitar a subscrição — isolamento entre casais por design. Free tier: 100 conexões, 200k mensagens/dia (absurdamente mais que suficiente para 2 usuários).

---

## 3. Estrutura do Monorepo

```
enxoval/
├── apps/
│   ├── mobile/                    # App Expo
│   └── api/                       # API Nest.js (inclui Better Auth)
├── packages/
│   ├── db/                        # Schema Drizzle + migrations + tipos
│   ├── contracts/                 # Schemas Zod dos endpoints (DTOs, responses)
│   ├── config-ts/                 # tsconfig base
│   ├── config-eslint/             # ESLint base
│   └── utils/                     # Helpers puros (URL normalization, formatação BRL, etc.)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .npmrc
```

### Por que cada package existe

**`packages/db`** — Fonte única do schema Drizzle. Contém também o schema gerado pelo Better Auth CLI (tabelas `user`, `session`, `account`, `verification`). Migrations rodam daqui. Só API usa funções Drizzle; mobile importa apenas tipos.

**`packages/contracts`** — Schemas Zod dos DTOs de request/response da API. Mobile usa para validar form input e tipar chamadas HTTP; Nest usa em `ZodValidationPipe`. Como é a mesma fonte, mudanças no backend quebram o build do mobile na hora.

**`packages/config-ts`**, **`packages/config-eslint`** — Configs compartilhadas. tsconfig.base.json com strict e paths comuns; ESLint base + extensões por app.

**`packages/utils`** — `normalizeUrl()`, `extractDomain()`, `formatBRL()`, `isValidUrl()`, etc. Funções puras, sem dependências pesadas, consumidas por ambos os apps.

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### .npmrc (root)

```
node-linker=hoisted
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":      { "dependsOn": ["^build"], "outputs": ["dist/**", ".expo/**"] },
    "dev":        { "cache": false, "persistent": true },
    "lint":       { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] },
    "test":       { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "db:migrate": { "cache": false },
    "db:generate":{ "cache": false }
  }
}
```

O `^build` garante que packages compartilhados sejam compilados antes dos apps que os consomem.

---

## 4. Shared Packages — contrato de API type-safe

O maior valor do monorepo: **um único schema Zod para request/response, consumido por mobile e API**.

### packages/contracts/src/product.ts

```ts
import { z } from 'zod';

export const createProductSchema = z.object({
  url: z.string().url(),
  roomId: z.string().uuid(),
  title: z.string().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateProductSchema = z.object({
  title: z.string().optional(),
  roomId: z.string().uuid().optional(),
  status: z.enum(['wishlist','purchased','received','cancelled']).optional(),
  notes: z.string().max(1000).optional(),
});

export const productResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  priceCents: z.number().int().nullable(),
  currency: z.string(),
  storeName: z.string().nullable(),
  status: z.enum(['wishlist','purchased','received','cancelled']),
  roomId: z.string().uuid(),
  addedBy: z.string(),
  createdAt: z.string().datetime(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
```

### packages/contracts/src/room.ts

```ts
import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(10).optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const roomResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string().nullable(),
  orderIndex: z.number(),
  productCount: z.number().optional(),
  createdAt: z.string().datetime(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type RoomResponse = z.infer<typeof roomResponseSchema>;
```

### packages/contracts/src/couple.ts

```ts
import { z } from 'zod';

export const createCoupleSchema = z.object({
  name: z.string().min(1).max(100),
});

export const joinCoupleSchema = z.object({
  inviteCode: z.string().length(8),
});

export type CreateCoupleInput = z.infer<typeof createCoupleSchema>;
export type JoinCoupleInput = z.infer<typeof joinCoupleSchema>;
```

### Uso na API (Nest) — ZodValidationPipe

```ts
import { createProductSchema, type CreateProductInput } from '@enxoval/contracts';

@Post()
@UsePipes(new ZodValidationPipe(createProductSchema))
create(@Body() dto: CreateProductInput, @CurrentUserSession('user') user) {
  return this.productsService.create(dto, user);
}
```

### Uso no mobile

```ts
import { createProductSchema, type CreateProductInput, type ProductResponse } from '@enxoval/contracts';

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const parsed = createProductSchema.parse(input);
      const res = await api.post<ProductResponse>('/products', parsed);
      return res.data;
    },
  });
}
```

Campo novo no backend → TS do mobile quebra no build. **Impossível ficar desatualizado.**

---

## 5. Arquitetura

```
┌──────────────────────────┐
│      Expo App (RN)       │
│   Expo Router            │
│   React Query + Zustand  │
│   @better-auth/expo      │◄── SecureStore + deep linking
│   Pusher RN SDK          │◄── WebSocket nativo, reconexão auto
│   @enxoval/contracts     │◄── Schemas Zod
└────────────┬─────────────┘
             │
             │ HTTPS (cookie httpOnly do Better Auth)
             │   ├─► POST /pusher/auth (assina canais privados)
             │   └─► demais rotas REST
             ▼
┌──────────────────────────┐      ┌─────────────────────────┐
│      Nest.js API         │      │   Pusher Channels       │
│      (Render)            │─────►│   (managed)             │
│                          │ HTTP │                         │
│  AuthModule              │      │   private-couple-{id}   │
│   └─► BetterAuth        │      │     ◄── Mobile assina   │
│       └─► Drizzle adapter│      │         via WebSocket   │
│                          │      │         direto (não     │
│  BetterAuthGuard (global)│      │         passa pela API) │
│  @CurrentUserSession()   │      └─────────────────────────┘
│                          │
│  CouplesModule           │
│  ProfilesModule          │
│  RoomsModule             │
│  ProductsModule          │
│  ScrapingModule          │
│  RealtimeModule ─► Pusher│
│  NotificationsModule     │
│                          │
│  Drizzle ◄── @enxoval/db │
└────────────┬─────────────┘
             │ postgres.js pool
             ▼
┌──────────────────────────┐
│      Neon Postgres       │
│                          │
│  schema public:          │
│    couples, profiles,    │
│    rooms, products,      │
│    link_cache            │
│                          │
│  schema auth (Better Auth):│
│    user, session,        │
│    account, verification │
└──────────────────────────┘

Realtime:
  Device A cria produto ──► Nest salva ──► pusher.trigger()
    ──► Pusher entrega via WS para Device B
    ──► React Query invalida queries ──► UI atualiza

Push:
  Nest ──► Expo Push Service ──► FCM/APNs ──► Device
```

### Decisão: Auth

Better Auth rodando no próprio Nest, via módulo `@thallesp/nestjs-better-auth`. Mobile usa `@better-auth/expo` que gerencia cookie de sessão no SecureStore. Todas as rotas passam pelo `BetterAuthGuard` global, exceto as marcadas com `@Public()`.

### Decisão: Realtime via Pusher Channels

A conexão persistente fica entre mobile e Pusher (WebSocket nativo), não com nossa API. Se o Render hiberna, a conexão realtime dos clientes não cai. Canais privados exigem assinatura HMAC do backend antes do Pusher aceitar — isolamento entre casais garantido.

Fluxo:
1. Mobile conecta ao Pusher após login, tenta subscrever `private-couple-{coupleId}`
2. SDK chama `POST /pusher/auth` (envia socket_id + channel; cookie no header)
3. Nest valida ownership e devolve assinatura HMAC
4. Pusher aceita; mobile fica ouvindo eventos `product.created`, `room.updated`, etc.
5. Quando Nest cria/atualiza/deleta algo, chama `pusherService.trigger()`
6. Pusher entrega para todos os subscribers; React Query invalida e UI atualiza

### Decisão: Scraping

Módulo `ScrapingModule` no Nest expõe `POST /scrape` (autenticada). Normaliza URL, consulta cache em `link_cache`, se necessário faz fetch com `undici` (UA de browser, timeout 8s), parseia com `cheerio` (OG tags → JSON-LD → fallback), persiste no cache e retorna metadados.

---

## 6. Modelo de Dados (Drizzle)

### Estrutura de schemas no `packages/db`

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── auth.ts         # gerado pelo Better Auth CLI
│   │   ├── app.ts          # domínio: couples, profiles, rooms, products, link_cache
│   │   └── index.ts        # re-exporta tudo
│   ├── client.ts           # cria instância drizzle (postgres.js)
│   └── seed.ts             # seed de cômodos padrão
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

### schema/auth.ts (gerado pelo Better Auth CLI)

Tabelas geradas automaticamente via `npx @better-auth/cli generate`:
- `user` (id, email, name, emailVerified, image, createdAt, updatedAt)
- `session` (id, userId, expiresAt, token, ipAddress, userAgent)
- `account` (provider credentials, oauth tokens)
- `verification` (email verification codes)

### schema/app.ts (domínio)

```ts
import { pgTable, uuid, text, timestamp, integer, index, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const productStatusEnum = pgEnum('product_status', 
  ['wishlist', 'purchased', 'received', 'cancelled']);

export const couples = pgTable('couples', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').unique(),     // 8 chars, gerado no create
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  coupleId: uuid('couple_id').references(() => couples.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  pushToken: text('push_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  coupleId: uuid('couple_id').notNull().references(() => couples.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon'),                           // emoji: 🛋️ 🍳 🛏️ 🚿 etc.
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  coupleIdx: index('rooms_couple_idx').on(t.coupleId),
}));

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  addedBy: text('added_by').notNull().references(() => user.id),
  url: text('url').notNull(),
  title: text('title'),
  description: text('description'),
  imageUrl: text('image_url'),
  priceCents: integer('price_cents'),           // em centavos para evitar float
  currency: text('currency').default('BRL').notNull(),
  storeName: text('store_name'),                // derivado do host
  status: productStatusEnum('status').default('wishlist').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  roomIdx: index('products_room_idx').on(t.roomId),
  addedByIdx: index('products_added_by_idx').on(t.addedBy),
}));

export const linkCache = pgTable('link_cache', {
  urlHash: text('url_hash').primaryKey(),       // sha256 da URL normalizada
  url: text('url').notNull(),
  payload: text('payload').notNull(),           // JSON: { title, image, description, price, store }
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tipos exportados
export type Couple = typeof couples.$inferSelect;
export type NewCouple = typeof couples.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

### seed.ts — cômodos padrão

Ao criar um casal, criamos cômodos pré-definidos para dar um ponto de partida:

```ts
export const DEFAULT_ROOMS = [
  { name: 'Sala de estar',   icon: '🛋️', orderIndex: 0 },
  { name: 'Cozinha',         icon: '🍳', orderIndex: 1 },
  { name: 'Quarto',          icon: '🛏️', orderIndex: 2 },
  { name: 'Banheiro',        icon: '🚿', orderIndex: 3 },
  { name: 'Lavanderia',      icon: '🧺', orderIndex: 4 },
  { name: 'Escritório',      icon: '💻', orderIndex: 5 },
  { name: 'Varanda',         icon: '🌿', orderIndex: 6 },
  { name: 'Área de serviço', icon: '🧹', orderIndex: 7 },
];
```

### client.ts (conexão Drizzle + Neon)

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!, {
  max: 10,            // pool size — Neon recomenda ≤ 10 no free tier
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
```

**Importante:** use a connection string `-pooler` do Neon (ex: `...neon.tech:5432/neondb?sslmode=require`), não a direta. Isso ativa o pgbouncer gerenciado.

### Ownership sem RLS

Sem Supabase, não há RLS pronto. Validação de ownership vira responsabilidade do **service layer**. Cada service valida que o recurso pertence ao `coupleId` do usuário autenticado. Exemplo em `ProductsService`:

```ts
private async assertCoupleOwnership(roomId: string, userId: string) {
  const room = await this.db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
  if (!room) throw new NotFoundException('Room not found');
  const profile = await this.db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
  if (!profile?.coupleId || room.coupleId !== profile.coupleId) {
    throw new ForbiddenException('Not your room');
  }
}
```

---

## 7. Mapa de Endpoints da API

### Auth (gerenciados pelo Better Auth — não criar controllers)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Criar conta |
| POST | `/api/auth/sign-in/email` | Login |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/auth/get-session` | Sessão atual |

### Couples

| Método | Rota | Descrição |
|---|---|---|
| POST | `/couples` | Criar casal (gera inviteCode, cria rooms padrão) |
| POST | `/couples/join` | Entrar em casal via inviteCode |
| GET | `/couples/me` | Dados do casal do usuário autenticado |

### Profiles

| Método | Rota | Descrição |
|---|---|---|
| GET | `/profiles/me` | Perfil do usuário autenticado |
| PATCH | `/profiles/me` | Atualizar nome, avatar, pushToken |

### Rooms

| Método | Rota | Descrição |
|---|---|---|
| GET | `/rooms` | Listar cômodos do casal (com contagem de produtos) |
| POST | `/rooms` | Criar cômodo |
| PATCH | `/rooms/:id` | Editar nome, ícone, ordem |
| DELETE | `/rooms/:id` | Excluir (e seus produtos) |
| PUT | `/rooms/reorder` | Reordenar todos de uma vez |

### Products

| Método | Rota | Descrição |
|---|---|---|
| GET | `/rooms/:roomId/products` | Listar produtos do cômodo |
| GET | `/products` | Listar todos do casal (com filtro `?status=`, `?search=`) |
| POST | `/products` | Criar (aceita URL crua, chama scraping internamente) |
| PATCH | `/products/:id` | Editar status, notas, mover de cômodo |
| DELETE | `/products/:id` | Excluir produto |

### Scraping

| Método | Rota | Descrição |
|---|---|---|
| POST | `/scrape` | Recebe `{ url }`, retorna metadados (título, imagem, preço, loja) |

### Pusher Auth

| Método | Rota | Descrição |
|---|---|---|
| POST | `/pusher/auth` | Autoriza subscrição em canal privado |

### Utilitários

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check (público) |
| GET | `/export` | Exporta todos os dados do casal em JSON (backup) |

---

## 8. Estrutura da API Nest.js

```
apps/api/src/
├── main.ts                              # Bootstrap (bodyParser: false)
├── app.module.ts                        # Root module
├── lib/
│   ├── auth.ts                          # Config Better Auth + Drizzle adapter
│   └── zod-validation.pipe.ts           # Pipe global Zod
├── database/
│   └── database.module.ts               # Provider global do Drizzle (DB_TOKEN)
├── couples/
│   ├── couples.module.ts
│   ├── couples.controller.ts
│   └── couples.service.ts               # Cria couple + seed rooms padrão
├── profiles/
│   ├── profiles.module.ts
│   ├── profiles.controller.ts
│   └── profiles.service.ts
├── rooms/
│   ├── rooms.module.ts
│   ├── rooms.controller.ts
│   └── rooms.service.ts                 # CRUD + reorder + ownership check
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   └── products.service.ts              # CRUD + chama scraping + emite Pusher + push
├── scraping/
│   ├── scraping.module.ts
│   └── scraping.service.ts              # cheerio + undici + link_cache
├── realtime/
│   ├── realtime.module.ts
│   ├── realtime.controller.ts           # POST /pusher/auth
│   └── pusher.service.ts                # Wrapper do SDK Pusher (trigger + authorizeChannel)
├── notifications/
│   ├── notifications.module.ts
│   └── notifications.service.ts         # Expo Push Service
└── common/
    ├── guards/                          # CoupleOwnership guard (se quiser reutilizar)
    ├── decorators/                      # @Public(), @GetCoupleId()
    └── filters/                         # Exception filter global
```

---

## 9. Roadmap de Desenvolvimento

### Fase 0 — Setup do Monorepo (2–3 dias)
- [ ] Criar repo, `pnpm init`, `pnpm-workspace.yaml`, `.npmrc`
- [ ] Configurar Turborepo (`turbo.json`)
- [ ] `packages/config-ts` com tsconfig.base.json
- [ ] `packages/config-eslint` com preset base
- [ ] `packages/db` com Drizzle + conexão Neon
- [ ] `packages/contracts` com Zod (schemas iniciais de couple, room, product)
- [ ] `packages/utils` com `normalizeUrl`, `isValidUrl`, `formatBRL`
- [ ] `apps/api` via `nest new` (Express adapter)
- [ ] `apps/mobile` via `create expo-app`
- [ ] Metro config para monorepo (seção 12.5)
- [ ] Husky + lint-staged + conventional commits
- [ ] README com comandos `pnpm dev`, `pnpm build`, `pnpm db:migrate`

### Fase 1 — Banco e Auth (3–4 dias)
- [ ] Criar projeto Neon, pegar connection string `-pooler`
- [ ] `packages/db`: rodar `npx @better-auth/cli generate` → schema auth no Drizzle
- [ ] Consolidar schema (auth + app) e rodar primeira migration
- [ ] Instalar `@thallesp/nestjs-better-auth` no Nest
- [ ] `apps/api/src/lib/auth.ts` com Drizzle adapter + plugin `expo()`
- [ ] `AuthModule.forRoot({ auth })` no `app.module.ts`
- [ ] `BetterAuthGuard` global + `@Public()` decorator
- [ ] `DatabaseModule` global injetando Drizzle
- [ ] Health check `/health` (público)
- [ ] Testar sign-up / sign-in via curl

### Fase 2 — Domínio Base (3–4 dias)
- [ ] `CouplesModule` — criar casal (gera `inviteCode` 8 chars), seed rooms padrão, endpoint `join`
- [ ] `ProfilesModule` — criar profile vinculado ao `user.id` do Better Auth
- [ ] `RoomsModule` — CRUD com validação de ownership
- [ ] `ProductsModule` — CRUD validando que room pertence ao couple
- [ ] `ZodValidationPipe` global
- [ ] Testes e2e com Supertest nos happy paths (mínimo: criar couple → criar room → criar product)

### Fase 3 — Mobile: Auth + Estrutura (3 dias)
- [ ] Configurar `@better-auth/expo` client com baseURL da API
- [ ] Scheme `enxoval` no `app.json`
- [ ] Tela de sign-up / sign-in (`authClient.signUp.email`, `signIn.email`)
- [ ] `useSession()` para controle de estado
- [ ] Expo Router com groups `(auth)` e `(app)`
- [ ] TanStack Query configurado (QueryClientProvider)
- [ ] Axios wrapper com interceptor de cookie via `authClient.getCookie()`
- [ ] Onboarding: criar casal (com nome) ou entrar com código de convite

### Fase 4 — Mobile: Cômodos + Produtos (3–4 dias)
- [ ] Tela Home com lista de cômodos (ícone, nome, contagem de produtos)
- [ ] CRUD de cômodos (criar, editar, reordenar drag-and-drop, excluir com confirmação)
- [ ] Tela de cômodo com lista de produtos
- [ ] CRUD de produtos manual (sem scraping ainda — URL, título, status)
- [ ] Filtro por status (wishlist / comprado / recebido)
- [ ] Empty states, loading skeletons

### Fase 5 — Realtime via Pusher (1–2 dias)
- [ ] Criar conta Pusher, app no cluster `sa1` (São Paulo)
- [ ] Adicionar `pusher` no backend e `@pusher/pusher-websocket-react-native` no mobile
- [ ] `RealtimeModule` no Nest com `PusherService` (trigger + authorizeChannel)
- [ ] Endpoint `POST /pusher/auth` validando ownership do canal
- [ ] Publicar eventos em `ProductsService` e `RoomsService` (create/update/delete)
- [ ] No mobile, inicializar Pusher após login com authorizer apontando pra `/pusher/auth`
- [ ] Hook `useRealtimeSync()` subscribing `private-couple-{id}`, invalidando React Query
- [ ] Testar com dois dispositivos simultâneos

### Fase 6 — Scraping (3–4 dias)
- [ ] `ScrapingModule` com cheerio + undici
- [ ] Endpoint `POST /scrape` (autenticado)
- [ ] Cache via `link_cache` (sha256 da URL normalizada)
- [ ] Extração em camadas: OG tags → JSON-LD `Product` → fallback `<title>` + primeira `<img>`
- [ ] `POST /products` passa a aceitar URL crua e chamar scraping internamente
- [ ] Testar com top lojas: Shopee, Amazon BR, Magazine Luiza, Mercado Livre, Madeira Madeira, Tok&Stok, Camicado
- [ ] Tela mobile "Novo produto" com preview automático ao colar URL

### Fase 7 — Share Intent + Clipboard (2–3 dias)
- [ ] `expo-share-intent` configurado (requer Dev Build via `eas build --profile development`)
- [ ] Intent filters Android no `app.json`:
  ```json
  "android": {
    "intentFilters": [{
      "action": "SEND",
      "category": ["DEFAULT"],
      "data": [{ "mimeType": "text/plain" }]
    }]
  }
  ```
- [ ] Share Extension iOS via config plugin do `expo-share-intent`
- [ ] Extrair URL do texto compartilhado (lojas enviam título + URL juntos)
- [ ] `expo-clipboard` + botão "Colar link" na Home (ou listener em `AppState`)
- [ ] Regex para validar URL antes de promptar
- [ ] Armazenar hashes de URLs já ignoradas no Zustand (para não reprompt)

### Fase 8 — Push Notifications (2–3 dias)
- [ ] Criar projeto Firebase, adicionar Android + iOS
- [ ] `google-services.json` e `GoogleService-Info.plist` via EAS
- [ ] Mobile pede permissão, salva push token via `PATCH /profiles/me`
- [ ] `NotificationsModule` no Nest — ao criar produto, envia via Expo Push Service para o parceiro
- [ ] Deep link da notificação abrindo produto específico (`enxoval://product/{id}`)
- [ ] Testar em dispositivo físico (simulador iOS não recebe push)

### Fase 9 — Deploy no Render (1 dia)
- [ ] `render.yaml` (seção 13)
- [ ] Env vars: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, TRUSTED_ORIGINS, PUSHER_*, EXPO_ACCESS_TOKEN
- [ ] Build: `pnpm install --frozen-lockfile && pnpm turbo build --filter=api...`
- [ ] Migrations como job manual: `pnpm --filter @enxoval/db migrate`
- [ ] cron-job.org pingando `/health` a cada 10min (se free tier)
- [ ] Testar endpoints em produção com Postman

### Fase 10 — Polimento (3–5 dias)
- [ ] Error states, pull to refresh, skeleton loaders em todas as telas
- [ ] Home com resumo: total de itens, valor estimado, progresso por cômodo
- [ ] Busca global por título/descrição
- [ ] Animações de entrada (Reanimated FadeIn, SlideIn)
- [ ] Ícone e splash screen definitivos
- [ ] Dark mode (NativeWind: `dark:bg-gray-900`)

### Fase 11 — Build e Distribuição (1–2 dias)
- [ ] `eas build --platform all --profile production`
- [ ] TestFlight (iOS) + APK direto ou Internal App Sharing (Android)
- [ ] Instalar nos dois dispositivos do casal

---

## 10. Setup Inicial — Comandos

```bash
# ─── Monorepo ───
mkdir enxoval && cd enxoval
pnpm init
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF
echo "node-linker=hoisted" > .npmrc
pnpm add -D turbo typescript @types/node

# ─── Packages compartilhados ───
mkdir -p packages/{db,contracts,utils,config-ts,config-eslint}

# packages/db
cd packages/db && pnpm init
pnpm add drizzle-orm postgres better-auth
pnpm add -D drizzle-kit tsx @types/pg
# Depois do auth config: npx @better-auth/cli generate

# packages/contracts
cd ../contracts && pnpm init
pnpm add zod

# packages/utils
cd ../utils && pnpm init
# Sem deps externas — funções puras

cd ../..

# ─── API Nest.js ───
mkdir -p apps && cd apps
pnpm dlx @nestjs/cli new api --skip-git --package-manager pnpm
cd api
pnpm add better-auth @better-auth/expo @thallesp/nestjs-better-auth
pnpm add drizzle-orm postgres zod
pnpm add cheerio undici                # scraping
pnpm add expo-server-sdk              # push
pnpm add pusher                       # realtime
pnpm add @nestjs/throttler            # rate limiting
pnpm add @enxoval/db @enxoval/contracts @enxoval/utils --workspace

# ─── Mobile Expo ───
cd ..
pnpm create expo-app mobile --template
cd mobile
npx expo install expo-router expo-linking expo-constants expo-status-bar \
  expo-secure-store expo-clipboard expo-notifications expo-device \
  react-native-reanimated react-native-gesture-handler \
  react-native-safe-area-context react-native-screens
pnpm add @tanstack/react-query zustand zod axios
pnpm add better-auth @better-auth/expo
pnpm add @pusher/pusher-websocket-react-native
pnpm add nativewind
pnpm add -D tailwindcss
npx expo install expo-share-intent
pnpm add @enxoval/contracts @enxoval/utils --workspace
```

### Variáveis de ambiente

**apps/api/.env**
```
DATABASE_URL="postgres://neondb_owner:...@ep-xxx.sa-east-1.aws.neon.tech:5432/neondb?sslmode=require"
BETTER_AUTH_SECRET="..."               # openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
TRUSTED_ORIGINS="enxoval://,http://localhost:8081"
EXPO_ACCESS_TOKEN="..."                # para push (get em expo.dev)
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="sa1"
PORT=3000
```

**apps/mobile/.env**
```
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_PUSHER_KEY="..."           # mesmo PUSHER_KEY — só a key, NUNCA o secret
EXPO_PUBLIC_PUSHER_CLUSTER="sa1"
```

---

## 11. Implementação — Pontos Críticos

### 11.1 Better Auth no Nest

**`apps/api/src/lib/auth.ts`**
```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { expo } from '@better-auth/expo';
import { db } from '@enxoval/db';
import * as schema from '@enxoval/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? '').split(','),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [expo()],
});
```

**`apps/api/src/main.ts`**
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,   // @thallesp/nestjs-better-auth re-adiciona automaticamente
  });
  app.enableCors({
    origin: (process.env.TRUSTED_ORIGINS ?? '').split(','),
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

**`apps/api/src/app.module.ts`**
```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { auth } from './lib/auth';
import { DatabaseModule } from './database/database.module';
import { CouplesModule } from './couples/couples.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RoomsModule } from './rooms/rooms.module';
import { ProductsModule } from './products/products.module';
import { ScrapingModule } from './scraping/scraping.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule,
    CouplesModule,
    ProfilesModule,
    RoomsModule,
    ProductsModule,
    ScrapingModule,
    RealtimeModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

### 11.2 Better Auth no Expo (mobile)

**`apps/mobile/lib/auth-client.ts`**
```ts
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL!,
  plugins: [
    expoClient({
      scheme: 'enxoval',
      storagePrefix: 'enxoval',
      storage: SecureStore,
    }),
  ],
});
```

**`app.json`** precisa declarar o scheme:
```json
{ "expo": { "scheme": "enxoval" } }
```

**Axios wrapper com cookie do Better Auth:**
```ts
import axios from 'axios';
import { authClient } from './auth-client';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const cookie = authClient.getCookie();
  if (cookie) config.headers.Cookie = cookie;
  config.credentials = 'omit'; // evita conflito com cookie manual
  return config;
});
```

### 11.3 Pusher — Realtime

**`apps/api/src/realtime/pusher.service.ts`**
```ts
import { Injectable } from '@nestjs/common';
import Pusher from 'pusher';

export interface AppEvent { type: string; payload: unknown }

@Injectable()
export class PusherService {
  private pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });

  authorizeChannel(socketId: string, channel: string, userId: string, coupleId: string) {
    if (!channel.startsWith('private-couple-')) {
      throw new Error('Unsupported channel type');
    }
    const channelCoupleId = channel.replace('private-couple-', '');
    if (channelCoupleId !== coupleId) {
      throw new Error('Forbidden');
    }
    return this.pusher.authorizeChannel(socketId, channel, { user_id: userId });
  }

  async broadcast(coupleId: string, event: AppEvent) {
    await this.pusher.trigger(`private-couple-${coupleId}`, event.type, event.payload);
  }
}
```

**`apps/api/src/realtime/realtime.controller.ts`**
```ts
import { Controller, Post, Body, ForbiddenException } from '@nestjs/common';
import { CurrentUserSession, BetterAuthUserSession } from '@thallesp/nestjs-better-auth';
import { PusherService } from './pusher.service';
import { ProfilesService } from '../profiles/profiles.service';

@Controller('pusher')
export class RealtimeController {
  constructor(private pusher: PusherService, private profiles: ProfilesService) {}

  @Post('auth')
  async auth(
    @Body() body: { socket_id: string; channel_name: string },
    @CurrentUserSession('user') user: BetterAuthUserSession['user'],
  ) {
    const profile = await this.profiles.getByUserId(user.id);
    if (!profile?.coupleId) throw new ForbiddenException('No couple linked');
    return this.pusher.authorizeChannel(body.socket_id, body.channel_name, user.id, profile.coupleId);
  }
}
```

**Mobile — inicialização:**
```ts
// lib/pusher.ts
import { Pusher } from '@pusher/pusher-websocket-react-native';
import { authClient } from './auth-client';

export const pusher = Pusher.getInstance();

export async function initPusher(apiUrl: string) {
  await pusher.init({
    apiKey: process.env.EXPO_PUBLIC_PUSHER_KEY!,
    cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER!,
    onAuthorizer: async (channelName, socketId) => {
      const cookie = authClient.getCookie();
      const res = await fetch(`${apiUrl}/pusher/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
      });
      if (!res.ok) throw new Error('Pusher auth failed');
      return await res.json();
    },
  });
  await pusher.connect();
}
```

**Mobile — hook de sincronização:**
```ts
// hooks/useRealtimeSync.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pusher } from '@/lib/pusher';
import { useMyCouple } from './useMyCouple';

export function useRealtimeSync() {
  const qc = useQueryClient();
  const { data: couple } = useMyCouple();

  useEffect(() => {
    if (!couple?.id) return;
    const channelName = `private-couple-${couple.id}`;
    let cancelled = false;

    (async () => {
      await pusher.subscribe({
        channelName,
        onEvent: (event) => {
          if (cancelled) return;
          if (event.eventName?.startsWith('product.'))
            qc.invalidateQueries({ queryKey: ['products'] });
          if (event.eventName?.startsWith('room.'))
            qc.invalidateQueries({ queryKey: ['rooms'] });
        },
      });
    })();

    return () => {
      cancelled = true;
      pusher.unsubscribe({ channelName });
    };
  }, [couple?.id, qc]);
}
```

Usar em `app/(app)/_layout.tsx` para ficar ativo durante toda a navegação autenticada.

### 11.4 Drizzle + Nest DI

```ts
// apps/api/src/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { db } from '@enxoval/db';

export const DB_TOKEN = Symbol('DB');

@Global()
@Module({
  providers: [{ provide: DB_TOKEN, useValue: db }],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}
```

**Injetar em services:**
```ts
@Injectable()
export class ProductsService {
  constructor(@Inject(DB_TOKEN) private db: DB) {}
}
```

### 11.5 Metro config para monorepo

Com Expo SDK 53+ o package exports funciona direto. Para resolver `node_modules` do root:

**`apps/mobile/metro.config.js`**
```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// NÃO desabilitar package exports — Better Auth depende disso
module.exports = config;
```

### 11.6 Scraping Service

```ts
// apps/api/src/scraping/scraping.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { load } from 'cheerio';
import { request } from 'undici';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { linkCache } from '@enxoval/db/schema';
import { DB_TOKEN, type DB } from '../database/database.module';
import { normalizeUrl } from '@enxoval/utils';

export interface ScrapedMetadata {
  title: string | null;
  image: string | null;
  description: string | null;
  priceCents: number | null;
  storeName: string;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0';

@Injectable()
export class ScrapingService {
  constructor(@Inject(DB_TOKEN) private db: DB) {}

  async scrape(rawUrl: string): Promise<ScrapedMetadata> {
    const url = normalizeUrl(rawUrl);
    const hash = createHash('sha256').update(url).digest('hex');

    // 1. Cache
    const cached = await this.db.query.linkCache.findFirst({ where: eq(linkCache.urlHash, hash) });
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
      return JSON.parse(cached.payload);
    }

    // 2. Fetch
    let html: string;
    try {
      const { body } = await request(url, {
        headers: { 'user-agent': USER_AGENT, 'accept-language': 'pt-BR,pt;q=0.9' },
        headersTimeout: 8000,
        bodyTimeout: 8000,
        maxRedirections: 5,
      });
      html = await body.text();
    } catch {
      return { title: null, image: null, description: null, priceCents: null, storeName: this.extractStore(url) };
    }

    const $ = load(html);

    // 3. Extrair metadados (OG → JSON-LD → fallback)
    const metadata: ScrapedMetadata = {
      title:
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text().trim() ||
        null,
      image:
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        null,
      description:
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        null,
      priceCents: this.extractPrice($),
      storeName: this.extractStore(url),
    };

    // 4. Salvar/atualizar cache
    await this.db.insert(linkCache).values({
      urlHash: hash, url, payload: JSON.stringify(metadata),
    }).onConflictDoUpdate({
      target: linkCache.urlHash,
      set: { payload: JSON.stringify(metadata), fetchedAt: new Date() },
    });

    return metadata;
  }

  private extractPrice($: ReturnType<typeof load>): number | null {
    // OG price
    const og = $('meta[property="product:price:amount"]').attr('content');
    if (og) return Math.round(parseFloat(og) * 100);
    // JSON-LD Product
    const jsonLd = $('script[type="application/ld+json"]').toArray()
      .map(el => { try { return JSON.parse($(el).html() ?? ''); } catch { return null; } })
      .find(j => j?.['@type'] === 'Product' || j?.['@type'] === 'ProductGroup');
    const price = jsonLd?.offers?.price ?? jsonLd?.offers?.lowPrice;
    if (price) return Math.round(parseFloat(price) * 100);
    return null;
  }

  private extractStore(url: string): string {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return 'desconhecido'; }
  }
}
```

### 11.7 Push Notifications via Expo Push Service

```ts
import { Injectable, Inject } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { eq, ne, and } from 'drizzle-orm';
import { profiles } from '@enxoval/db/schema';
import { DB_TOKEN, type DB } from '../database/database.module';

@Injectable()
export class NotificationsService {
  private expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

  constructor(@Inject(DB_TOKEN) private db: DB) {}

  async notifyPartner(coupleId: string, exceptUserId: string, title: string, body: string, data?: object) {
    const partner = await this.db.query.profiles.findFirst({
      where: and(eq(profiles.coupleId, coupleId), ne(profiles.userId, exceptUserId)),
    });
    if (!partner?.pushToken || !Expo.isExpoPushToken(partner.pushToken)) return;

    const message: ExpoPushMessage = { to: partner.pushToken, sound: 'default', title, body, data };
    const chunks = this.expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      await this.expo.sendPushNotificationsAsync(chunk);
    }
  }
}
```

### 11.8 Share Intent e Clipboard

- **Share Intent:** `expo-share-intent` + Dev Build obrigatório (não funciona no Expo Go). Lojas compartilham texto com formato variado (ex: "Cafeteira Nespresso - R$ 299 https://..."). Extrair URL via regex: `/https?:\/\/\S+/`.
- **Clipboard iOS 14+:** cada leitura mostra banner "Enxoval colou do Safari". Sugestão: **botão explícito "Colar link"** na Home em vez de listener automático. Se for automático, guardar hash de URLs já prompted (Zustand/MMKV) para não reprompt.

---

## 12. Fluxo de Onboarding (detalhado)

### Primeiro usuário (cria o casal)
1. Abre app → tela de sign-up → cria conta com email + senha
2. Após login, detecta que não tem profile com `coupleId` → redireciona para onboarding
3. Tela "Criar enxoval": insere nome do casal (ex: "João & Maria")
4. Backend cria `couple` + seed de rooms padrão + `profile` vinculando user ao couple
5. Exibe **código de convite** (8 chars, ex: `A3K9M2P5`) para compartilhar com parceiro(a)

### Segundo usuário (entra no casal)
1. Abre app → sign-up → cria conta
2. Onboarding: tela "Entrar no enxoval" → digita código de convite
3. Backend valida código, cria `profile` vinculando ao couple existente
4. Ambos agora veem os mesmos rooms e produtos

### Edge cases
- Código inválido → erro claro: "Código não encontrado. Confira com seu parceiro(a)."
- Couple já tem 2 membros → erro: "Este enxoval já está completo."
- Usuário já vinculado a um couple → pula onboarding, vai direto pra Home

---

## 13. Deploy no Render

### render.yaml

```yaml
services:
  - type: web
    name: enxoval-api
    env: node
    region: oregon
    plan: free
    buildCommand: pnpm install --frozen-lockfile && pnpm turbo build --filter=api...
    startCommand: node apps/api/dist/main.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: BETTER_AUTH_SECRET
        sync: false
      - key: BETTER_AUTH_URL
        sync: false
      - key: TRUSTED_ORIGINS
        value: "enxoval://"
      - key: EXPO_ACCESS_TOKEN
        sync: false
      - key: PUSHER_APP_ID
        sync: false
      - key: PUSHER_KEY
        sync: false
      - key: PUSHER_SECRET
        sync: false
      - key: PUSHER_CLUSTER
        value: "sa1"
      - key: PORT
        value: 10000
```

### Pontos de atenção

**Hibernação do free tier:** cold start de 30–50s após 15min ociosos. Opções: aceitar, pingar `/health` com cron-job.org a cada 10min (grátis), ou upgrade para Starter US$7/mês.

**Migrations:** rodar como Render Job manual após cada deploy. Comando: `pnpm --filter @enxoval/db migrate`.

**Pusher e Render:** a conexão persistente não passa pelo Render — Pusher blinda o realtime do cold start. Se o serviço hiberna, os clientes continuam recebendo eventos se houver outra origem publicando. Só haverá delay quando o próprio mobile criar algo (cold start da API afeta a publicação, não a entrega).

**Neon + Render:** usar a connection string `-pooler` do Neon. Configurar `max: 10` no `postgres.js`.

---

## 14. Estratégia de Testes

### API (Nest)

**E2E (Supertest):** testar os happy paths completos com banco real (branch do Neon ou container Docker com Postgres).

Cenários mínimos:
- [ ] Sign-up → criar couple → listar rooms padrão
- [ ] Criar produto com URL → scraping retorna metadados → Pusher é chamado
- [ ] Parceiro entra via invite code → vê os mesmos rooms/produtos
- [ ] Atualizar status de produto para "purchased"
- [ ] `/pusher/auth` rejeita se user não pertence ao couple
- [ ] `/export` retorna JSON completo

**Unit:** serviços com lógica de negócio (ScrapingService.extractPrice, normalizeUrl, etc.)

### Mobile (Expo)

- Testes manuais inicialmente (2 usuários, escopo pequeno)
- Se quiser automatizar: `jest` + `@testing-library/react-native` para hooks e componentes
- Testar Share Intent requer dispositivo físico com Dev Build

---

## 15. Custos

| Item | Custo | Notas |
|---|---|---|
| Neon Free | R$ 0 | 0.5 GB storage, 191.9 compute-hours/mês, branching |
| Render Free | R$ 0 | Hiberna após 15min |
| Render Starter | US$ 7/mês (~R$ 40) | Sem hibernação (opcional) |
| Pusher Sandbox | R$ 0 | 100 conexões, 200k msgs/dia |
| Firebase FCM | R$ 0 | Push gratuito |
| EAS Build Free | R$ 0 | 30 builds/mês |
| Apple Developer | US$ 99/ano (~R$ 560) | Só se precisar TestFlight/iOS |
| Google Play Dev | US$ 25 (uma vez) | Só se publicar na Play Store |

**Realista:** R$ 0/mês se ambos usarem Android via APK e aceitarem cold start. Com Render Starter: ~R$ 40/mês. Com Apple: + R$ 47/mês rateado.

---

## 16. Checklist de Lançamento

### Antes do primeiro uso real
- [ ] Testar em dispositivos reais de ambos
- [ ] Testar Share Intent com as 5 lojas mais usadas
- [ ] Validar push com app fechado, background e aberto
- [ ] Testar Pusher reconectando ao voltar do background
- [ ] Simular offline: app entra em erro gracioso ao adicionar sem rede
- [ ] Endpoint `/export` devolve JSON completo (backup)
- [ ] Rate limiting ativo (`@nestjs/throttler`)
- [ ] CORS só permite origin do mobile
- [ ] `BETTER_AUTH_SECRET` é forte (32+ chars)
- [ ] `PUSHER_SECRET` nunca aparece no bundle do mobile (só `PUSHER_KEY`)

### Monitoramento
- [ ] Sentry no mobile e na API (free tier)
- [ ] Logs estruturados (pino ou winston)
- [ ] uptimerobot.com grátis para alerta se API cair

### Pós-lançamento
- [ ] Usar por 1 semana antes de novas features
- [ ] Backlog de bugs e melhorias no GitHub Issues
- [ ] Revisar custos mensais

---

## 17. Funcionalidades Bônus (pós-MVP)

- Exportar lista em PDF para pais/padrinhos
- Link público somente-leitura de desejos (Better Auth Organization plugin para convidar viewers)
- Histórico de preços (cron Nest re-scrape semanal)
- Subcategorias por cômodo (Cozinha → Eletrodomésticos, Utensílios)
- Orçamento por cômodo com barra de progresso
- Marcar quem deu cada presente (chá de casa nova)
- Import de links em lote via CSV
- OAuth Google para login mais rápido (Better Auth suporta nativamente)
- Presence channels do Pusher para indicador "parceiro online"
- Web app view-only com Expo Router web

---

## 18. Próximos Passos Concretos

1. **Criar contas:** Neon, Pusher, Firebase (FCM), Expo (EAS)
2. **Criar repo GitHub** e rodar Fase 0 (setup do monorepo)
3. Após Fase 1 (auth funcionando), testar sign-up/sign-in via curl
4. Após Fase 2 (domínio base), validar com Postman/Insomnia
5. Após Fase 5 (Pusher integrado), testar sync com dois dispositivos
6. Após Fase 7 (Share Intent), começar a usar de verdade para o enxoval

---

## 19. Referências

- **Turborepo:** https://turbo.build/repo/docs
- **pnpm workspaces:** https://pnpm.io/workspaces
- **Expo monorepo:** https://docs.expo.dev/guides/monorepos/
- **Expo auth guide:** https://docs.expo.dev/develop/authentication/
- **Nest.js:** https://docs.nestjs.com
- **Drizzle ORM:** https://orm.drizzle.team
- **Drizzle + Neon:** https://orm.drizzle.team/docs/connect-neon
- **Zod:** https://zod.dev
- **Better Auth:** https://better-auth.com/docs
- **Better Auth + Nest:** https://better-auth.com/docs/integrations/nestjs
- **Better Auth + Expo:** https://better-auth.com/docs/integrations/expo
- **`@thallesp/nestjs-better-auth`:** https://github.com/ThallesP/nestjs-better-auth
- **Neon:** https://neon.tech/docs
- **Pusher Channels:** https://pusher.com/docs/channels/
- **Pusher React Native SDK:** https://github.com/pusher/pusher-websocket-react-native
- **Pusher Node.js SDK:** https://github.com/pusher/pusher-http-node
- **Render Blueprints:** https://render.com/docs/blueprint-spec
- **Expo Notifications:** https://docs.expo.dev/push-notifications/sending-notifications/
- **Expo Share Intent:** https://github.com/achorein/expo-share-intent
- **NativeWind:** https://www.nativewind.dev
- **TanStack Query RN:** https://tanstack.com/query/latest/docs/framework/react/react-native
