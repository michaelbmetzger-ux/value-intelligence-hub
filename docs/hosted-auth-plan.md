# Hosted Value Intelligence Hub plan

## Default production stack

- Hosting: Vercel
- Auth: Supabase Auth with email/password and invite links
- Database: Supabase Postgres
- File storage: Supabase Storage for QBO, CRM/Ops uploads, reports, and exports
- Roles: owner, advisor, client

## Portal behavior

### Owner

- Full workspace access
- Can create companies
- Can invite advisors and clients
- Can see every company
- Can manage account access

### Advisor

- Can see assigned companies
- Can create companies if granted by owner
- Can invite client users for assigned companies
- Can upload QBO and CRM/Ops files
- Can edit Value Engine answers and objectives
- Can generate advisor and client reports

### Client

- Can only see companies assigned through membership
- Cannot create companies
- Cannot invite users
- Cannot upload files
- Cannot edit Value Engine answers or advisor objectives
- Sees simplified client portal language and read-only progress

## Account creation flow

1. Owner or advisor creates an invitation with email, role, and company access.
2. Supabase sends invite email or the advisor copies the invite link.
3. User opens invite link, sets name and password, and lands in the correct portal.
4. Supabase profile and membership rows are created after invite acceptance.
5. Row-level security limits all data access by membership.

## Deployment steps

1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL editor.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel.
4. Import the GitHub repo into Vercel.
5. Confirm Vercel uses `npm run build` and `dist`.
6. Replace the local mock auth adapter with Supabase Auth calls.
7. Send invites to Mike and Troy as owner/advisor.

## Current local implementation

The current branch adds the UX and tested domain model for login, invitations, account creation, role-based client access, advisor mode, and client portal restrictions. It still uses localStorage as a mock auth store so the UI can be tested before Supabase credentials exist.
