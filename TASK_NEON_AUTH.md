# Add Neon Auth to the Next.js + Neon + Drizzle App

## What Neon Auth gives us
- Auth (sign up / sign in / account management) backed by Better Auth
- User table lives in `neon_auth` schema in the same Neon DB
- Pre-built React UI components (no custom auth forms needed)
- `neonAuth()` server-side helper to get current user in Server Actions/API routes
- `saved_searches` table can FK to `neon_auth.user.id`

## Install
```bash
cd ~/Repos/land-scout-app
npm install @neondatabase/neon-js@latest
```

## .env.local — add NEON_AUTH_BASE_URL
```
DATABASE_URL=postgresql://...
NEON_AUTH_BASE_URL=https://ep-xxx.neon.tech/neondb/auth
```
(user fills both in from Neon console — just add the placeholder to .env.local.example)

## drizzle.config.ts — add schemaFilter
```typescript
export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public', 'neon_auth'],   // ADD THIS
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
```

## lib/auth/client.ts (NEW)
```typescript
'use client';
import { createAuthClient } from '@neondatabase/neon-js/auth/next';
export const authClient = createAuthClient();
```

## app/api/auth/[...path]/route.ts (NEW)
```typescript
import { authApiHandler } from '@neondatabase/neon-js/auth/next/server';
export const { GET, POST } = authApiHandler();
```

## app/layout.tsx — wrap with NeonAuthUIProvider
```tsx
import { authClient } from '@/lib/auth/client';
import { NeonAuthUIProvider, UserButton } from '@neondatabase/neon-js/auth/react/ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NeonAuthUIProvider authClient={authClient} emailOTP social={{ providers: ['google'] }}>
          {children}
        </NeonAuthUIProvider>
      </body>
    </html>
  )
}
```

## Add UserButton to TopBar.tsx
In the top bar, add the UserButton from Neon Auth so users can sign in/out:
```tsx
import { UserButton } from '@neondatabase/neon-js/auth/react/ui';
// ... inside TopBar render:
<UserButton size="icon" />
```

## app/auth/[path]/page.tsx (NEW — sign in/up page)
```tsx
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';
export const dynamicParams = false;
export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  return (
    <main style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <AuthView path={path} />
    </main>
  );
}
```

## app/account/[path]/page.tsx (NEW — account management)
```tsx
import { AccountView } from '@neondatabase/neon-js/auth/react/ui';
import { accountViewPaths } from '@neondatabase/neon-js/auth/react/ui/server';
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.values(accountViewPaths).map(path => ({ path }));
}
export default async function AccountPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  return <main style={{ padding: 24 }}><AccountView path={path} /></main>;
}
```

## lib/db/schema.ts — add saved_searches table
After the listings table definition, add:
```typescript
import { pgSchema } from 'drizzle-orm/pg-core'

// Reference to Neon Auth user table (exists in neon_auth schema)
export const neonAuth = pgSchema('neon_auth')
export const neonAuthUsers = neonAuth.table('users_sync', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }),
})

// Saved searches / alerts (per user)
export const savedSearches = pgTable('saved_searches', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:    text('user_id').notNull(),   // references neon_auth user id
  name:      text('name').notNull(),
  filters:   jsonb('filters').notNull(), // {minScore, maxPrice, states, ownerFinance, etc}
  notify:    boolean('notify').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type SavedSearch = typeof savedSearches.$inferSelect
```

## app/api/saved-searches/route.ts (NEW)
```typescript
import { db, schema } from '@/lib/db'
import { neonAuth } from '@neondatabase/neon-js/auth/next/server'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const { user } = await neonAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const searches = await db.select().from(schema.savedSearches).where(eq(schema.savedSearches.userId, user.id))
  return NextResponse.json(searches)
}

export async function POST(req: NextRequest) {
  const { user } = await neonAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const [saved] = await db.insert(schema.savedSearches).values({
    userId: user.id,
    name: body.name,
    filters: body.filters,
    notify: body.notify ?? false,
  }).returning()
  return NextResponse.json(saved)
}

export async function DELETE(req: NextRequest) {
  const { user } = await neonAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await db.delete(schema.savedSearches).where(eq(schema.savedSearches.id, id))
  return NextResponse.json({ ok: true })
}
```

## Add "Save Search" button to Sidebar.tsx
When user is logged in, show a "💾 Save Search" button that POSTs current filters to /api/saved-searches.
When user is NOT logged in, show "Sign in to save searches" link to /auth/sign-in.

Use the authClient to check auth state:
```tsx
import { authClient } from '@/lib/auth/client'
// in component:
const { data: session } = authClient.useSession()
// session?.user exists if logged in
```

## globals.css — add Neon Auth styles
```css
@import '@neondatabase/neon-js/ui/tailwind';
```

## Final check
`npm run build` must pass with no errors.
git commit: "feat: Neon Auth integration — sign in/up, UserButton, saved searches"
