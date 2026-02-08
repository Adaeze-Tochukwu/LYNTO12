# Supabase Setup Guide for LYNTO

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Enter project details:
   - Name: `lynto`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

## 2. Run the Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `schema.sql`
4. Paste and click "Run"
5. Verify no errors in the output

## 3. Configure Authentication

### Enable Email Auth
1. Go to **Authentication** > **Providers**
2. Ensure "Email" is enabled
3. Configure settings:
   - Enable "Confirm email" for production
   - Disable for development/testing

### Email Templates (optional)
1. Go to **Authentication** > **Email Templates**
2. Customize confirmation, invite, and reset emails with LYNTO branding

## 4. Get API Keys

1. Go to **Settings** > **API**
2. Copy these values:
   - `Project URL` (e.g., https://xxxxx.supabase.co)
   - `anon public` key (safe for frontend)
3. **Never expose the `service_role` key in frontend code**

## 5. Install Supabase Client

```bash
cd Desktop/lynto
npm install @supabase/supabase-js
```

## 6. Create Environment File

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Add to `.gitignore`:
```
.env.local
```

## 7. Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

## 8. Generate TypeScript Types

Install Supabase CLI:
```bash
npm install -D supabase
```

Generate types:
```bash
npx supabase gen types typescript --project-id your-project-id > src/lib/database.types.ts
```

## 9. Test Connection

Add this to any component temporarily:

```typescript
import { supabase } from '@/lib/supabase'

// Test query
const { data, error } = await supabase.from('agencies').select('*')
console.log(data, error)
```

## Database Schema Overview

```
agencies
  └── users (managers & carers)
        └── carer_client_assignments
  └── clients
        └── visit_entries
              └── correction_notes
              └── alerts

platform_admins (separate table)
activity_log (audit trail)
```

## Row-Level Security (RLS)

The schema includes RLS policies that:
- Isolate each agency's data automatically
- Managers can see/manage their agency's carers and clients
- Carers can only see assigned clients
- Platform admins can see everything

## Key Features

| Feature | Implementation |
|---------|---------------|
| Multi-tenancy | RLS policies isolate agencies |
| Auto alerts | Trigger creates alert on amber/red visits |
| Timestamps | Auto-updated via triggers |
| Audit trail | activity_log table |
| Stats | agency_stats view for dashboards |

## Next Steps

1. Update `AuthContext.tsx` to use Supabase auth
2. Update `AppContext.tsx` to fetch/mutate via Supabase
3. Remove mock data imports
4. Test all user flows
