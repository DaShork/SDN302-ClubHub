# ClubHub - Supabase Setup Guide

This folder contains SQL migrations for setting up the ClubHub database on Supabase.

## Folder Structure

```
supabase/
├── migrations/
│   ├── 001_schema.sql           # Tables, indexes
│   ├── 002_rls_policies.sql     # Row Level Security policies
│   ├── 003_triggers.sql         # Auto-create profile, update timestamps
│   ├── 004_seed_data.sql        # Default roles & categories
│   └── 005_storage.sql          # Storage buckets & policies
├── seeds/
│   └── sample_data.sql          # Demo data for 9 public tables (DEV only)
└── README.md
```

## Setup Steps

### Option 1: Run via Supabase Dashboard (Easiest)

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor** in the left sidebar.
3. Run the migration files in this order:
   1. `001_schema.sql` - Creates all tables and indexes
   2. `002_rls_policies.sql` - Sets up Row Level Security
   3. `003_triggers.sql` - Creates triggers (auto profile creation)
   4. `004_seed_data.sql` - Inserts default roles and categories
   5. `005_storage.sql` - Creates storage buckets

### Option 2: Run via Supabase CLI (Recommended for team)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Run all migrations
supabase db push
```

### Option 3: Manual copy-paste

1. Open Supabase Dashboard > SQL Editor.
2. Copy the content of each `.sql` file (in numbered order) and execute them one by one.

## Authentication Setup

In **Supabase Dashboard > Authentication > Providers**, enable:

- Email (default, password-based)
- Google OAuth (optional, for `docs/REQUIREMENTS.md` FR-01)

### Recommended Settings

- **Confirm email**: ON (for FPTU email validation)
- **Auto-confirm**: OFF
- **Minimum password length**: 8

## Storage Buckets

The migration `005_storage.sql` will create these buckets:

| Bucket | Access | Used for |
|--------|--------|----------|
| `avatars` | public | User profile pictures |
| `club-images` | public | Club logos, banners |
| `gallery` | public | Club albums |
| `documents` | private | Club documents (PDF, DOCX, ...) |
| `knowledge` | private | Knowledge base attachments |
| `workshop-materials` | private | Workshop resources |

## Sample Credentials for Testing

After seed data is loaded, the default role for new signups is `Student`. To promote a test user to `Administrator`:

```sql
UPDATE public.profiles p
SET role_id = (SELECT id FROM public.roles WHERE name = 'Administrator')
WHERE p.email = 'your-admin@example.com';
```

For a partially populated demo database (9 public tables - clubs, club_terms, events, workshops, knowledge_articles, meeting_minutes, documents, announcements, galleries; 8 clubs across 8 categories, 11 terms, 9 events, etc.), run the seed file after the migrations:

1. Go to **Supabase Dashboard -> SQL Editor -> New Query**.
2. Copy & paste the content of `seeds/sample_data.sql` and execute.
3. The script is **idempotent** thanks to `ON CONFLICT DO NOTHING` everywhere.
4. Demo user accounts (auth.users / profiles / memberships / attendance / event_registrations / payments / alumni / notifications / chat_history) are intentionally NOT seeded here - create them by signing up through the running app's SignUp page, or via **Supabase Dashboard -> Authentication -> Users -> Add user**. The `handle_new_user()` trigger will auto-create the corresponding `profiles` row.

> **Why no auth.users seeding?**
> `auth.users` is owned by `supabase_auth_admin` on Supabase Cloud, so the SQL Editor (which runs as `postgres`) cannot disable / drop its triggers. Trying to do so produces `ERROR: 42501: must be owner of table users`. We avoid touching `auth.*` entirely and rely on Supabase Auth + the trigger to manage users.
>
> **Reminder (per `AGENT.md`):** do NOT run this SQL from inside the migration folder automatically - it is meant to be executed manually from the SQL Editor so the dev team can decide when their database is reset.

## Tables Created

### Core Tables (19)

| Table | Purpose |
|-------|---------|
| `profiles` | Extended user info (one-to-one with `auth.users`) |
| `roles` | System roles (RBAC) |
| `categories` | Club categories |
| `clubs` | Club information |
| `club_terms` | Executive board periods |
| `memberships` | Profile <-> Club link |
| `events` | Club events |
| `event_registrations` | User event signups |
| `attendance` | Event check-in records |
| `workshops` | Workshop info + materials |
| `knowledge_articles` | Knowledge base |
| `meeting_minutes` | Meeting notes |
| `documents` | Club documents |
| `announcements` | Public/Club announcements |
| `galleries` | Club images |
| `payments` | Sandbox payment records |
| `alumni` | Former members |
| `notifications` | System notifications |
| `chat_history` | AI conversation log |

## Environment Variables

After setup, get these from **Supabase Dashboard > Project Settings > API** and add to `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Next Steps

1. Update `frontend/.env` with your Supabase credentials.
2. Test signup: a new user should be auto-assigned the `Student` role.
3. Promote your first user to `Administrator` using the SQL above.
4. Start building services in `frontend/src/services/`.

## Notes

- All migrations are **idempotent** (safe to re-run).
- RLS is enabled on all tables — no bypass for unauthenticated users.
- Storage policies are also configured for proper access control.
- Triggers automatically create profiles on signup with the default `Student` role.
