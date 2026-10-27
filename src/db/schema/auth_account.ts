import { pgTable, text, timestamp, index, unique } from '../sqlite-core'
import { user } from './auth_user'

// Required by Better Auth's core schema, even with password/OAuth sign-in
// disabled. Adding the table does not enable any new sign-in method.
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, table => ({
  userIdx: index('account_user_id_idx').on(table.userId),
  identity: unique('account_provider_identity_unique').on(table.providerId, table.accountId),
}))
