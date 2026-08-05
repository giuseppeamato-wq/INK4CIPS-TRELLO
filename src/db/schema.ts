import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core"

// --- better-auth core tables ---------------------------------------------
// Column names/shapes follow better-auth's documented Drizzle/SQLite schema
// for the base email+password setup (no extra plugins). If plugins are
// added later, regenerate/extend via `npx @better-auth/cli generate`.

export const user = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  // Profile extras (mobile profile screen) — registered as better-auth
  // additionalFields in src/lib/auth/index.ts so updateUser() can set them.
  jobTitle: text("job_title"),
  bio: text("bio"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const session = sqliteTable("session", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
})

export const account = sqliteTable("account", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// --- app tables ------------------------------------------------------------

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  driveUrl: text("drive_url"),
  // R2 key under the ATTACHMENTS bucket (workspace-covers/{id}/{uuid}-{filename}),
  // never a public URL — served through /api/workspaces/[workspaceId]/cover.
  coverPath: text("cover_path"),
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

export const workspaceRoleValues = ["owner", "admin", "editor", "member"] as const
export type WorkspaceRole = (typeof workspaceRoleValues)[number]

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: workspaceRoleValues }).notNull().default("member"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })]
)

export const inviteRoleValues = ["admin", "editor", "member"] as const
export const inviteStatusValues = ["pending", "accepted", "revoked"] as const

export const workspaceInvites = sqliteTable(
  "workspace_invites",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role", { enum: inviteRoleValues }).notNull().default("member"),
    invitedBy: text("invited_by").notNull().references(() => user.id),
    status: text("status", { enum: inviteStatusValues }).notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("workspace_invites_email_status_idx").on(t.email, t.status)]
)

export const boards = sqliteTable(
  "boards",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    background: text("background"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdBy: text("created_by").notNull().references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("boards_workspace_id_idx").on(t.workspaceId)]
)

export const lists = sqliteTable(
  "lists",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortKey: text("sort_key").notNull(),
    // Set only on the 3 fixed lists auto-created with every board (todo /
    // in_progress / done) — null for regular user-created lists. Tracked by
    // this stable kind rather than by name so renaming a fixed list doesn't
    // lose its "can't be deleted" protection or its color.
    kind: text("kind"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("lists_board_id_sort_key_idx").on(t.boardId, t.sortKey)]
)

export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    // Denormalized so board-scoped guards/queries don't need to join through
    // lists on every card read; kept in sync by the app (set on insert, and
    // whenever a card moves to a list on a different board — not allowed in
    // v1, cards only move between lists on the same board).
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: integer("due_date", { mode: "timestamp" }),
    sortKey: text("sort_key").notNull(),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdBy: text("created_by").notNull().references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [
    index("cards_list_id_sort_key_idx").on(t.listId, t.sortKey),
    index("cards_board_id_idx").on(t.boardId),
  ]
)

export const cardMembers = sqliteTable(
  "card_members",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.userId] })]
)

export const labels = sqliteTable(
  "labels",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    name: text("name").notNull().default(""),
    color: text("color").notNull(),
  },
  (t) => [index("labels_board_id_idx").on(t.boardId)]
)

export const cardLabels = sqliteTable(
  "card_labels",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.labelId] })]
)

export const checklists = sqliteTable(
  "checklists",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Checklist"),
    sortKey: text("sort_key").notNull(),
  },
  (t) => [index("checklists_card_id_idx").on(t.cardId)]
)

export const checklistItems = sqliteTable(
  "checklist_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    checklistId: text("checklist_id")
      .notNull()
      .references(() => checklists.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isComplete: integer("is_complete", { mode: "boolean" }).notNull().default(false),
    sortKey: text("sort_key").notNull(),
  },
  (t) => [index("checklist_items_checklist_id_idx").on(t.checklistId)]
)

export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull().references(() => user.id),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (t) => [index("comments_card_id_created_at_idx").on(t.cardId, t.createdAt)]
)

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    uploadedBy: text("uploaded_by").notNull().references(() => user.id),
    // {workspaceId}/{boardId}/{cardId}/{uuid}-{filename} — the workspace/board
    // prefix isn't used for lookups (we always go through the DB row), it's
    // there purely so the R2 key itself carries enough context for auditing.
    storagePath: text("storage_path").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type"),
    sizeBytes: integer("size_bytes"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("attachments_card_id_idx").on(t.cardId)]
)

export const notificationTypeValues = ["card_assigned", "workspace_invite", "card_comment"] as const
export type NotificationType = (typeof notificationTypeValues)[number]

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: notificationTypeValues }).notNull(),
    message: text("message").notNull(),
    // Relative in-app path to open when tapped, e.g. /w/acme/b/123?card=456.
    url: text("url"),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("notifications_user_id_created_at_idx").on(t.userId, t.createdAt)]
)

// One shared freeform canvas per workspace (shapes + arrows), not realtime —
// members autosave their edits and others pick them up on next load. Stored
// as a single JSON blob (not normalized node/edge tables) since node shape
// determines which fields matter (rect/pill/circle/text/sticky) and the
// whole canvas is always read/written together.
export const workspaceWhiteboards = sqliteTable("workspace_whiteboards", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  data: text("data").notNull().default('{"nodes":[],"edges":[]}'),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})
