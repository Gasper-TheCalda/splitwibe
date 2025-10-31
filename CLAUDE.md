# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Splitwibe is an expense splitting web application that allows users to create groups, invite others, and split expenses fairly. Users can add expenses and split them either equally among group members or using custom percentages.

## Development Commands

### Supabase Commands
```bash
# Start local Supabase instance (Docker required)
supabase start

# Stop local Supabase instance
supabase stop

# Reset database and apply all migrations
supabase db reset

# Create a new migration
supabase migration new <migration_name>

# Check migration status
supabase migration list

# Link to remote Supabase project
supabase link --project-ref <project-ref>

# Push local migrations to remote
supabase db push

# Pull remote schema changes
supabase db pull
```

### Application Commands
```bash
# Install dependencies (run from frontend/ directory)
cd frontend && npm install

# Start development server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Start production server
cd frontend && npm start

# Run tests
cd frontend && npm test

# Run specific test file
cd frontend && npm test -- path/to/test.spec.ts

# Lint code
cd frontend && npm run lint
```

## Architecture

### Technology Stack
- **Frontend Framework**: Next.js (React-based, with App Router)
- **Backend/Database**: Supabase (PostgreSQL database, Authentication, Real-time subscriptions, Storage)
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

### Project Structure
```
splitwibe/
├── frontend/                    # Next.js application
│   ├── app/                     # App Router directory
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page
│   │   └── globals.css          # Global styles (Tailwind)
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend dependencies
│   ├── tsconfig.json            # TypeScript config
│   ├── tailwind.config.ts       # Tailwind config
│   └── next.config.ts           # Next.js config
├── supabase/                    # Supabase configuration
│   ├── migrations/              # Database migrations
│   │   └── 20251031000001_initial_schema.sql
│   └── config.toml              # Supabase local config
└── CLAUDE.md                    # This file
```

**Key directories:**
- `frontend/app/` - Next.js App Router pages and layouts
- `frontend/app/api/` - API routes (to be added)
- `supabase/migrations/` - Database schema migrations

### Key Components
- **Authentication**: Managed by Supabase Auth (email/password only)
- **Group Management**: Users can create groups and generate shareable invite codes/links
- **Expense Tracking**: Add expenses with description, amount, and payer
- **Split Calculations**: Equal splits among all group members (MVP feature)
- **Settlement**: Calculate who owes whom, display balances, and mark debts as settled

### State Management
- React Context API for global state (user session, current group)
- Standard React state and props for component-level state
- Manual refetch pattern for data updates (no real-time subscriptions in MVP)

### API Design
- Supabase client for database operations (CRUD on groups, expenses, members)
- Row Level Security (RLS) policies to ensure users can only access their own groups/expenses
- Supabase Auth for user session management
- Server-side API routes for sensitive operations (e.g., joining groups via invite code)

### Database Schema

**Schema Location**: `/supabase/migrations/20251031000001_initial_schema.sql`

**Core Tables:**

1. **`profiles`**: User profiles extending auth.users
   - `id` (UUID, PK, references auth.users ON DELETE CASCADE)
   - `email` (TEXT)
   - `display_name` (TEXT)
   - `created_at`, `updated_at` (TIMESTAMP)
   - Auto-created via trigger when user signs up

2. **`groups`**: Expense groups
   - `id` (UUID, PK)
   - `name` (TEXT)
   - `description` (TEXT, nullable)
   - `invite_code` (TEXT, unique, 8-char alphanumeric)
   - `created_by` (UUID, references profiles)
   - `created_at`, `updated_at` (TIMESTAMP)

3. **`group_members`**: User-group relationships
   - `id` (UUID, PK)
   - `group_id` (UUID, references groups ON DELETE CASCADE)
   - `user_id` (UUID, references profiles ON DELETE CASCADE)
   - `joined_at` (TIMESTAMP)
   - Unique constraint on (group_id, user_id)

4. **`expenses`**: Individual expenses
   - `id` (UUID, PK)
   - `group_id` (UUID, references groups ON DELETE CASCADE)
   - `description` (TEXT)
   - `amount` (NUMERIC(10,2), must be > 0)
   - `paid_by` (UUID, references profiles, NO CASCADE)
   - `date` (DATE, defaults to current date)
   - `created_at`, `updated_at` (TIMESTAMP)

5. **`expense_splits`**: Split details for each expense
   - `id` (UUID, PK)
   - `expense_id` (UUID, references expenses ON DELETE CASCADE)
   - `user_id` (UUID, references profiles, NO CASCADE)
   - `amount_owed` (NUMERIC(10,2), >= 0)
   - `created_at` (TIMESTAMP)
   - Unique constraint on (expense_id, user_id)

6. **`settlements`**: Debt payment records
   - `id` (UUID, PK)
   - `from_user` (UUID, references profiles, NO CASCADE)
   - `to_user` (UUID, references profiles, NO CASCADE)
   - `group_id` (UUID, references groups ON DELETE CASCADE)
   - `amount` (NUMERIC(10,2), must be > 0)
   - `settled_at`, `created_at` (TIMESTAMP)
   - Check constraint: from_user != to_user

**Key Implementation Details:**
- All IDs are UUIDs (using uuid_generate_v4())
- Profiles CASCADE DELETE with auth.users (user deletion removes profile)
- Expenses and expense_splits do NOT cascade when users are deleted (preserve history)
- Groups and group_members DO cascade (deleting group removes all members)
- Indexes on foreign keys and frequently queried columns (invite_code, dates)
- Triggers auto-update `updated_at` timestamps
- Helper function `generate_invite_code()` creates random 8-character codes

### MVP Feature Scope
**Included:**
- Email/password authentication
- Create and join groups via shareable invite code
- Add expenses split equally among group members
- View group expenses and member balances
- Mark debts as settled between users

**Excluded from MVP (future enhancements):**
- Real-time synchronization
- Percentage-based or custom amount splits
- Social login providers
- Email invitations
- Expense categories or tags
- File attachments (receipts)
- Currency conversion

## Environment Setup

### Local Development
1. Start Supabase: `supabase start`
2. Note the API URL and anon key from the output
3. Create `frontend/.env.local` with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```
4. Start Next.js: `cd frontend && npm run dev`

### Installed Packages
- `@supabase/supabase-js` - Supabase client library
- `@supabase/ssr` - Server-side rendering helpers for Next.js

## Important Patterns

- **Invite Codes**: Groups have unique, randomly generated codes (e.g., 8-character alphanumeric) for joining
- **Balance Calculation**: Computed on-demand from expense_splits and settlements tables
- **Equal Split Logic**: When an expense is added, expense_splits records are created dividing the amount equally among all current group members
- **Security**: RLS policies ensure users can only see groups they're members of and related expenses
