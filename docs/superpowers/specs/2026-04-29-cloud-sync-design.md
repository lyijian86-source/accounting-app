# Cloud Sync Design

Date: 2026-04-29

## Background

The app currently stores accounting data only in local browser storage. Local backup and restore are now available, but there is still no cloud persistence or multi-device recovery path.

## Goal

Add a first cloud-sync iteration for a single private user:

1. Frontend can push the full local snapshot to the cloud.
2. Frontend can pull the full cloud snapshot back to local storage.
3. Frontend can read cloud sync status and revision metadata.
4. Sync access is protected by a user-provided sync password.

## Scope

This iteration includes:

1. A Cloudflare Worker API.
2. A D1-backed snapshot table.
3. Manual sync actions: status, push, pull.
4. Local sync settings storage.
5. Revision-based conflict prompts.

This iteration does not include:

1. Multi-user accounts.
2. Automatic background sync.
3. Record-level merge.
4. Email login.
5. Encryption-at-rest beyond Cloudflare defaults.

## Backend Model

The cloud stores one logical snapshot row:

- `id`
- `data_json`
- `revision`
- `updated_at`

The row id is fixed to `primary`.

## API

### `GET /api/sync/status`

Returns whether cloud data exists, plus:

- `revision`
- `updatedAt`

### `GET /api/sync/pull`

Returns the current cloud snapshot:

- `revision`
- `updatedAt`
- `payload`

### `POST /api/sync/push`

Accepts:

- `baseRevision`
- `payload`
- `force`

If the cloud revision differs from `baseRevision` and `force !== true`, return a conflict response.

## Auth Model

Every request must send a sync password in an HTTP header. The Worker compares it with a secret configured in Cloudflare Worker secrets.

This is intentionally private-user scope, not a full account system.

## Frontend Sync Settings

Local settings include:

- `syncEnabled`
- `syncEndpoint`
- `syncPassword`
- `lastSyncAt`
- `lastKnownRevision`

## Conflict Rules

1. Same revision: already in sync.
2. Cloud newer than local known revision: warn before push.
3. Push with `force = true`: overwrite cloud snapshot.
4. Pull always replaces local data after confirmation in the UI.

## UI

Add a sync section inside the existing data-management modal:

1. Sync endpoint input.
2. Sync password input.
3. Cloud status display.
4. Actions:
   - Check sync status
   - Push to cloud
   - Pull from cloud

Conflict responses must surface explicit next actions instead of silently retrying.
