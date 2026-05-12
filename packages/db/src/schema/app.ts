import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────

export const productStatusEnum = pgEnum('product_status', [
  'wishlist',
  'purchased',
  'received',
  'cancelled',
]);

export const activityTypeEnum = pgEnum('activity_type', [
  'product.added',
  'product.purchased',
  'product.received',
  'product.cancelled',
  'product.wishlisted',
  'room.created',
  'milestone.unlocked',
  'partner.joined',
]);

export const activityTargetEnum = pgEnum('activity_target', [
  'product',
  'room',
  'milestone',
  'couple',
]);

export const milestoneTypeEnum = pgEnum('milestone_type', [
  'items_10',
  'items_25',
  'items_50',
  'items_100',
  'first_purchased',
  'first_received',
  'room_50_percent',
  'room_100_percent',
  'partner_joined',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'product.added',
  'product.purchased',
  'product.received',
  'milestone.unlocked',
  'partner.joined',
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

// ─── Activity Events ─────────────────────────────────────
// Feed do casal — uma row por ação relevante.

export const activityEvents = pgTable(
  'activity_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coupleId: uuid('couple_id')
      .notNull()
      .references(() => couples.id, { onDelete: 'cascade' }),
    actorUserId: text('actor_user_id').notNull(),
    type: activityTypeEnum('type').notNull(),
    targetType: activityTargetEnum('target_type').notNull(),
    targetId: text('target_id'),
    /** Snapshot at the moment of the event (title, status, room name, etc). */
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    coupleCreatedIdx: index('activity_couple_created_idx').on(t.coupleId, t.createdAt),
  }),
);

// ─── Milestones ──────────────────────────────────────────
// Conquistas desbloqueadas pelo casal. Para tipos que se repetem por escopo
// (ex: room_100_percent por cômodo), `scopeId` carrega o id do escopo.

export const milestones = pgTable(
  'milestones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coupleId: uuid('couple_id')
      .notNull()
      .references(() => couples.id, { onDelete: 'cascade' }),
    type: milestoneTypeEnum('type').notNull(),
    /** Empty string when the milestone is global; room id when per-room. */
    scopeId: text('scope_id').default('').notNull(),
    metadata: jsonb('metadata'),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    coupleTypeScopeIdx: uniqueIndex('milestones_couple_type_scope_idx').on(
      t.coupleId,
      t.type,
      t.scopeId,
    ),
    coupleUnlockedIdx: index('milestones_couple_unlocked_idx').on(t.coupleId, t.unlockedAt),
  }),
);

// ─── Couple Preferences ──────────────────────────────────
// Toggles por usuário (cada parceiro escolhe os seus).

export const couplePreferences = pgTable(
  'couple_preferences',
  {
    userId: text('user_id').notNull(),
    coupleId: uuid('couple_id')
      .notNull()
      .references(() => couples.id, { onDelete: 'cascade' }),
    notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
    notifyOnPartnerAdd: boolean('notify_on_partner_add').default(true).notNull(),
    notifyOnStatusChange: boolean('notify_on_status_change').default(true).notNull(),
    notifyOnMilestone: boolean('notify_on_milestone').default(true).notNull(),
    detectLinksEnabled: boolean('detect_links_enabled').default(true).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.coupleId] }),
  }),
);

// ─── Notifications ───────────────────────────────────────
// In-app notifications per recipient user.

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    coupleId: uuid('couple_id')
      .notNull()
      .references(() => couples.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userCreatedIdx: index('notifications_user_created_idx').on(t.userId, t.createdAt),
    userUnreadIdx: index('notifications_user_unread_idx').on(t.userId, t.readAt),
  }),
);

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
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type NewActivityEvent = typeof activityEvents.$inferInsert;
export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
export type CouplePreferences = typeof couplePreferences.$inferSelect;
export type NewCouplePreferences = typeof couplePreferences.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
