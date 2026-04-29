# Cloud Sync Worker

This folder contains the first private-user cloud sync backend for the accounting app.

## What it does

- `GET /api/sync/status`
- `GET /api/sync/pull`
- `POST /api/sync/push`

It stores a single full snapshot in D1 and protects requests with a sync password.

## Setup

1. Create a D1 database:

```bash
wrangler d1 create accounting-sync
```

2. Copy `wrangler.jsonc.example` to `wrangler.jsonc` and fill in the real `database_id`.

3. Apply the schema:

```bash
wrangler d1 execute accounting-sync --file=./schema.sql --remote
```

4. Set your sync password secret:

```bash
wrangler secret put SYNC_PASSWORD
```

5. Deploy the Worker:

```bash
wrangler deploy
```

6. In the PWA data-management modal, fill:

- Sync endpoint: your deployed Worker URL
- Sync password: the same value you put into `SYNC_PASSWORD`

## Notes

- This is private-user scope, not a full account system.
- `pull` replaces local data in the app.
- `push` can return a revision conflict if cloud data changed since the app last synced.
