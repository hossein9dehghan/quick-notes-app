/**
 * MDB10 — the query-string form of a 'platform.db' query: the one encoding
 * the Own-backend REST contract uses for 'GET /v1/:collection' and
 * 'GET /v1/:collection/count'.
 *
 * This file is shared VERBATIM: the generated server carries a copy at
 * 'server/src/lib/rest-query.ts' (the generator emits this exact text, and
 * 'test/backend-template.test.mjs' fails if the two drift), and the MDB13
 * client adapter encodes with it. So it has no imports and only erasable
 * TypeScript (it must run under Node's type stripping).
 *
 *   where.<field>.<op>=<JSON value>       op: eq neq lt lte gt gte in contains
 *   orderBy=<field>[.asc|.desc][,<field>[.asc|.desc]]…   (at most 4)
 *   limit=<whole number>   offset=<whole number>
 *
 * Example — '{ where: { done: false, title: { contains: 'milk' } }, orderBy: { field: 'due', dir: 'desc' }, limit: 20 }':
 *   where.done.eq=false&where.title.contains=%22milk%22&orderBy=due.desc&limit=20
 *
 * Values are JSON, so '"5"' (text) and '5' (number) stay apart; 'in' takes a
 * JSON list. A value that is not valid JSON is read as text, so a hand-typed
 * 'where.title.eq=milk' works too. Field names are '[A-Za-z][A-Za-z0-9_]*', so
 * the '.' separators are never ambiguous. Anything else in the query string
 * is refused (a typo should fail loudly, not silently return everything).
 */

export type RestScalar = string | number | boolean | null;

export interface RestCondition {
  eq?: RestScalar;
  neq?: RestScalar;
  lt?: string | number;
  lte?: string | number;
  gt?: string | number;
  gte?: string | number;
  in?: RestScalar[];
  contains?: string;
}

export type RestWhere = Record<string, RestScalar | RestCondition>;

export interface RestOrder {
  field: string;
  dir?: 'asc' | 'desc';
}

export interface RestQuery {
  where?: RestWhere;
  orderBy?: RestOrder | RestOrder[];
  limit?: number;
  offset?: number;
}

export class RestQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RestQueryError';
  }
}

export const REST_OPS: readonly string[] = ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in', 'contains'];
const FIELD = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const WHOLE = /^(0|[1-9][0-9]{0,8})$/;

const isCondition = (v: unknown): v is RestCondition => typeof v === 'object' && v !== null && !Array.isArray(v);

function enc(s: string): string {
  return encodeURIComponent(s);
}

/** 'where' alone, as 'where.<field>.<op>=<JSON>' pairs joined by '&' ('' when empty). */
export function encodeRestWhere(where: RestWhere | undefined): string {
  const out: string[] = [];
  for (const [field, raw] of Object.entries(where ?? {})) {
    if (!FIELD.test(field)) throw new RestQueryError('"' + field + '" is not a field name.');
    const cond: Record<string, unknown> = isCondition(raw) ? (raw as Record<string, unknown>) : { eq: raw };
    for (const [op, value] of Object.entries(cond)) {
      if (value === undefined) continue;
      if (!REST_OPS.includes(op)) throw new RestQueryError('"' + op + '" is not a filter operator.');
      out.push(enc('where.' + field + '.' + op) + '=' + enc(JSON.stringify(value)));
    }
  }
  return out.join('&');
}

/** The whole query as a query string without the leading '?' ('' when there is nothing to send). */
export function encodeRestQuery(query: RestQuery | undefined): string {
  const q = query ?? {};
  const out: string[] = [];
  const where = encodeRestWhere(q.where);
  if (where) out.push(where);
  const order = q.orderBy === undefined ? [] : Array.isArray(q.orderBy) ? q.orderBy : [q.orderBy];
  if (order.length) {
    out.push(
      'orderBy=' +
        enc(
          order
            .map((o) => {
              if (!FIELD.test(o.field)) throw new RestQueryError('"' + o.field + '" is not a field name.');
              return o.field + '.' + (o.dir ?? 'asc');
            })
            .join(','),
        ),
    );
  }
  if (q.limit !== undefined) out.push('limit=' + String(q.limit));
  if (q.offset !== undefined) out.push('offset=' + String(q.offset));
  return out.join('&');
}

function parseValue(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function whole(name: string, text: string): number {
  if (!WHOLE.test(text)) throw new RestQueryError(name + ' must be a whole number of 0 or more.');
  return Number(text);
}

/**
 * Reads a query string (with or without '?') or 'URLSearchParams' back into a
 * query. Conditions always come back in object form ('{ eq: v }') and
 * 'orderBy' as a list; values keep their JSON types. Shape only — the server
 * still checks fields, types and limits against the data model.
 */
export function decodeRestQuery(input: string | URLSearchParams): RestQuery {
  const params = typeof input === 'string' ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input) : input;
  const where: Record<string, Record<string, unknown>> = {};
  const query: RestQuery = {};
  const seen = new Set<string>();
  for (const [key, value] of params) {
    if (seen.has(key)) throw new RestQueryError('"' + key + '" is given more than once.');
    seen.add(key);
    if (key.startsWith('where.')) {
      const parts = key.split('.');
      if (parts.length !== 3 || !FIELD.test(parts[1])) throw new RestQueryError('"' + key + '" should look like where.<field>.<op>.');
      const op = parts[2];
      if (!REST_OPS.includes(op)) throw new RestQueryError('"' + op + '" is not a filter operator. Use ' + REST_OPS.join(', ') + '.');
      const field = parts[1];
      if (!Object.prototype.hasOwnProperty.call(where, field)) where[field] = {};
      where[field][op] = parseValue(value);
    } else if (key === 'orderBy') {
      const list = value.split(',').filter((s) => s !== '');
      if (list.length === 0 || list.length > 4) throw new RestQueryError('orderBy takes 1 to 4 fields.');
      query.orderBy = list.map((item) => {
        const [field, dir, extra] = item.split('.');
        if (extra !== undefined || !FIELD.test(field)) throw new RestQueryError('"' + item + '" should look like <field>.asc or <field>.desc.');
        if (dir !== undefined && dir !== 'asc' && dir !== 'desc') throw new RestQueryError('"' + item + '": the direction must be asc or desc.');
        return { field, dir: dir === 'desc' ? 'desc' : 'asc' };
      });
    } else if (key === 'limit') {
      query.limit = whole('limit', value);
    } else if (key === 'offset') {
      query.offset = whole('offset', value);
    } else {
      throw new RestQueryError('"' + key + '" is not understood. Use where.<field>.<op>, orderBy, limit and offset.');
    }
  }
  if (Object.keys(where).length) query.where = where as RestWhere;
  return query;
}
