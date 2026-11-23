
# Saku

**Track Every Won & Ringgit.**

## Architecture

This is an Expo Router application. The `app/` directory is only the navigation
surface: route files should stay small and delegate screen behavior to
`src/features/`.

```text
app/                         Expo Router routes and layouts
src/
  features/                  Feature modules (screen UI and feature workflows)
  components/                Reusable UI shared by multiple features
    ui/                      Low-level Ledger controls and primitives
  context/                   Application-wide state and command-oriented actions
  data/                      Persistence adapters and storage keys
  utils/                     Import/export and other infrastructure helpers
  types.ts                   Shared domain contracts
  theme.ts                   Design tokens and formatting helpers
```

The Goals/Debts route is the first feature migrated to this boundary:
`app/(tabs)/goals-debts.tsx` is now a route adapter and the implementation lives
in `src/features/goals-debts/GoalsDebtsScreen.tsx`.

Local persistence is accessed through `src/data/storage.ts`, rather than
scattering AsyncStorage keys throughout the provider. This keeps the UI and
domain commands independent from the current storage technology.

## Deployment and database recommendation

For a real deployment, keep Expo/EAS for the mobile builds and deploy a small
server-side API alongside a managed PostgreSQL database. Supabase is a good
default for this project because it provides managed Postgres, authentication,
row-level security, migrations, backups, and a TypeScript client without
requiring a separate backend deployment on day one. A custom API on
Cloud Run/Fly.io with Neon or RDS is the better choice if complex server-side
business rules or strict infrastructure control become important.

Do not connect a production app directly to a database with privileged
credentials. The recommended boundary is:

```text
Expo app -> typed API/repository -> PostgreSQL
                    |
                    +-> authentication and authorization
```

Suggested production tables are `profiles`, `accounts`, `transactions`,
`categories`, `budgets`, `goals`, `debts`, `debt_payments`, and `schedules`.
Every user-owned table should include `user_id`, timestamps, and indexes for
the common account/date queries. Money should be stored as integer minor units
(for example, sen or won) with an explicit currency column; do not use
floating-point values for persisted financial amounts.

A safe migration path is:

1. Keep the current local adapter as an offline cache.
2. Introduce repository interfaces under `src/data/` (`accounts`,
   `transactions`, and so on).
3. Implement a remote repository and sync queue behind those interfaces.
4. Add authentication before syncing data.
5. Migrate existing AsyncStorage data on first sign-in, then make the server
   the source of truth with optimistic local updates and retryable sync.

For a first release, Supabase + Postgres + EAS is the lowest-operations choice.
Use server-side migrations, daily backups, environment-specific projects, and
never commit production keys to the repository.

### Deploying the web app to Vercel

The web build is configured in `vercel.json`. From the repository root, deploy
the current branch as a production deployment with:

```powershell
npx vercel --prod
```

Alternatively, push the branch configured as the Vercel production branch
(normally `main`). Vercel will run `npm run build:web` and publish `dist/`.

### Excel online (Google Sheets) sync

More → Tools → **Save to Excel online** writes the app's data to a Google Sheet through
a Google Apps Script Web app (`apps-script/Code.gs`): a Summary tab, one Cash Book tab per
account (Date / Remark / Category / Subcategory / Account / Cash In / Cash Out), plus Goals,
Debts, Budgets, Scheduled and Categories. A hidden `_data` tab holds a lossless copy used by
**Load from Excel online**. Edits typed into the sheet are overwritten on the next save and are
not read back. Paste the Web app URL and the script's `SECRET` into **Excel online setup**.
