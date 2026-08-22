import { supabase } from './client';

/** PostgREST code for "column named in the payload does not exist". */
const UNKNOWN_COLUMN = 'PGRST204';

type Payload = Record<string, unknown>;
type Op = 'insert' | 'upsert' | 'update';

/**
 * supabase-js resolves with `{ error }` rather than throwing, so a bare
 * try/catch around a write silently swallows every failure. This wrapper
 * surfaces the error instead.
 *
 * It also tolerates the live schema lagging behind the app: if PostgREST
 * rejects a column that does not exist yet, the offending key is dropped and
 * the write is retried once. That keeps optional fields (a leave reason, an
 * attendance note) from taking the whole row down with them.
 * See db_schema/migrations/001_add_reason_and_notes.sql.
 */
export async function safeWrite(
  table: string,
  op: Op,
  payload: Payload,
  match?: { column: string; value: string }
): Promise<{ ok: boolean; droppedColumns: string[] }> {
  const dropped: string[] = [];
  let body = { ...payload };

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const query = supabase.from(table);
    const { error } =
      op === 'update' && match
        ? await query.update(body).eq(match.column, match.value)
        : op === 'upsert'
          ? await query.upsert(body)
          : await query.insert(body);

    if (!error) return { ok: true, droppedColumns: dropped };

    // Retry without the column PostgREST does not recognise.
    const missing = error.code === UNKNOWN_COLUMN
      ? Object.keys(body).find((key) => error.message.includes(`'${key}'`))
      : undefined;

    if (!missing) {
      console.error(`[supabase] ${op} on "${table}" failed:`, error.message);
      return { ok: false, droppedColumns: dropped };
    }

    console.warn(
      `[supabase] "${table}.${missing}" does not exist — dropping it and retrying. ` +
        `Run db_schema/migrations/001_add_reason_and_notes.sql to persist this field.`
    );
    dropped.push(missing);
    const { [missing]: _omit, ...rest } = body;
    void _omit;
    body = rest;
  }

  return { ok: false, droppedColumns: dropped };
}

/** True when Supabase credentials are configured for this environment. */
export function hasSupabaseCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
