import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const researchStatus = pgEnum('research_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const researchTasks = pgTable(
  'research_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    status: researchStatus('status').default('pending').notNull(),
    report: text('report'),
    sources: jsonb('sources').$type<{ title: string; url: string; snippet?: string }[]>(),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // The workbench lists one user's tasks newest-first, so the composite index
    // must lead with user_id — a plain created_at index would not serve it.
    index('research_tasks_user_created_at_idx').on(table.userId, table.createdAt),
  ],
)
