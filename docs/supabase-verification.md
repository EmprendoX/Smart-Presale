# Supabase verification status

## Environment constraints

- Attempting to run `supabase --version` fails because the Supabase CLI is not installed in the container image.
- Installing or executing the CLI via `npx supabase --version` returns an HTTP 403 error from the npm registry, so database migrations cannot be executed from this environment.

## Manual verification guidance

Because the CLI cannot be used here, run the following commands from a workstation that has network access and is authenticated against the target Supabase project (see the [Supabase setup runbook](./runbooks/supabase-setup.md) for a complete checklist):

```bash
supabase db push
# or, to apply the SQL files directly
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
psql "$SUPABASE_DB_URL" -f supabase/storage-setup.sql
```

After applying the schema, confirm that the `app_users`, `kyc_profiles`, and other related tables exist and that storage buckets match what is defined in `supabase/storage-setup.sql`.

If the project uses migrations, ensure that everything in `supabase/migrations/` has been applied. (This repository currently does not contain a `supabase/migrations` directory, so no additional migrations are pending.)

## Schema notes

The bundled schema already defines the indexes and Row Level Security (RLS) policies required for the backend to insert and update rows with the service role:

- `create index if not exists idx_app_users_tenant_id on app_users(tenant_id);`
- `create policy "app_users_modify_service" on app_users for all using (auth.role() = 'service_role');`
- `create policy "app_users_self_select" on app_users for select using (auth.uid()::text = id or auth.role() = 'service_role' or auth.role() = 'anon');`

Review these definitions after the schema is applied to confirm that inserts and upserts from trusted backends continue to function without weakening security.
