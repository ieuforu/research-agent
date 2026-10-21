import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const researchStatus = pgEnum('research_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
])

export const researchTasks = pgTable(
  'research_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    question: text('question').notNull(),
    status: researchStatus('status').default('pending').notNull(),
    report: text('report'),
    sources: jsonb('sources').$type<{ title: string; url: string; snippet?: string }[]>(),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('research_tasks_created_at_idx').on(table.createdAt)],
)
