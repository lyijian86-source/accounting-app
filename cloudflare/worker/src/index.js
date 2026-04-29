const PRIMARY_ROW_ID = 'primary';

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Password',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      ...(init.headers || {}),
    },
  });
}

function corsResponse(status = 204) {
  return new Response(null, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Password',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}

function unauthorized() {
  return json({ error: '同步密码错误。', code: 'UNAUTHORIZED' }, { status: 401 });
}

async function requireAuth(request, env) {
  const password = request.headers.get('X-Sync-Password') || '';
  return password && env.SYNC_PASSWORD && password === env.SYNC_PASSWORD;
}

async function getSnapshot(env) {
  return env.SYNC_DB
    .prepare('SELECT id, data_json, revision, updated_at FROM sync_snapshots WHERE id = ?')
    .bind(PRIMARY_ROW_ID)
    .first();
}

function isValidPayload(payload) {
  return payload
    && payload.version === 1
    && Array.isArray(payload.records)
    && Array.isArray(payload.categories)
    && Array.isArray(payload.tags);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    if (!(await requireAuth(request, env))) {
      return unauthorized();
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/sync/status') {
      const snapshot = await getSnapshot(env);
      return json({
        exists: !!snapshot,
        revision: snapshot?.revision || '',
        updatedAt: snapshot?.updated_at || '',
      });
    }

    if (request.method === 'GET' && url.pathname === '/api/sync/pull') {
      const snapshot = await getSnapshot(env);
      if (!snapshot) {
        return json({ error: '云端还没有可恢复的数据。', code: 'NOT_FOUND' }, { status: 404 });
      }

      return json({
        revision: snapshot.revision,
        updatedAt: snapshot.updated_at,
        payload: JSON.parse(snapshot.data_json),
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/sync/push') {
      const body = await request.json().catch(() => null);
      if (!body || !isValidPayload(body.payload)) {
        return json({ error: '上传数据格式不正确。', code: 'INVALID_PAYLOAD' }, { status: 400 });
      }

      const existing = await getSnapshot(env);
      const baseRevision = body.baseRevision || '';
      const force = body.force === true;

      if (existing && existing.revision !== baseRevision && !force) {
        return json({
          error: '云端数据已经更新，请先确认是否覆盖。',
          code: 'REVISION_CONFLICT',
          revision: existing.revision,
          updatedAt: existing.updated_at,
        }, { status: 409 });
      }

      const revision = crypto.randomUUID();
      const updatedAt = new Date().toISOString();

      await env.SYNC_DB
        .prepare(
          `INSERT INTO sync_snapshots (id, data_json, revision, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             data_json = excluded.data_json,
             revision = excluded.revision,
             updated_at = excluded.updated_at`
        )
        .bind(
          PRIMARY_ROW_ID,
          JSON.stringify(body.payload),
          revision,
          updatedAt
        )
        .run();

      return json({
        ok: true,
        revision,
        updatedAt,
      });
    }

    return json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  },
};
