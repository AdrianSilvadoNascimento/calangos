import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────

export const productStatusEnum = pgEnum('product_status', [
  'wishlist',
  'purchased',
  'received',
  'cancelled',
]);

// ─── Couples ─────────────────────────────────────────────

export const couples = pgTable('couples', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  inviteCode: text('invite_code').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Profiles ────────────────────────────────────────────
// Links a Better Auth user to a couple

export const profiles = pgTable('profiles', {
  userId: text('user_id').primaryKey(),
  coupleId: uuid('couple_id').references(() => couples.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  pushToken: text('push_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Rooms ───────────────────────────────────────────────

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coupleId: uuid('couple_id')
      .notNull()
      .references(() => couples.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon'),
    orderIndex: integer('order_index').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    coupleIdx: index('rooms_couple_idx').on(t.coupleId),
  }),
);

// ─── Products ────────────────────────────────────────────

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    addedBy: text('added_by').notNull(),
    url: text('url').notNull(),
    title: text('title'),
    description: text('description'),
    imageUrl: text('image_url'),
    priceCents: integer('price_cents'),
    currency: text('currency').default('BRL').notNull(),
    storeName: text('store_name'),
    status: productStatusEnum('status').default('wishlist').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    roomIdx: index('products_room_idx').on(t.roomId),
    addedByIdx: index('products_added_by_idx').on(t.addedBy),
  }),
);

// ─── Invites ─────────────────────────────────────────────

export const invites = pgTable(
  'invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coupleId: uuid('couple_id')
      .notNull()
      .references(() => couples.id, { onDelete: 'cascade' }),
    email: text('email'),
    token: text('token').notNull().unique(),
    createdBy: text('created_by').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    coupleIdx: index('invites_couple_idx').on(t.coupleId),
  }),
);

// ─── Link Cache ──────────────────────────────────────────

export const linkCache = pgTable('link_cache', {
  urlHash: text('url_hash').primaryKey(),
  url: text('url').notNull(),
  payload: text('payload').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Type Exports ────────────────────────────────────────

export type Couple = typeof couples.$inferSelect;
export type NewCouple = typeof couples.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;
