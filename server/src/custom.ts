// Your own endpoints. Maker writes this file once and never overwrites it.
// Put them under /v1/fn/... so they never collide with a collection. ctx.orm gives typed Drizzle queries
// over the tables in db/schema.ts. This app has no sign-in: never use ctx.requireUser here.
import type { Hono } from 'hono';
import type { AppEnv } from './app-env.ts';
import type { CustomContext } from './app.ts';
import { and, eq } from 'drizzle-orm';
import { notesTable, tagsTable, searchHistoryTable } from '../db/schema.ts';

// Every endpoint the app calls, as plain data: Maker turns this list into the app's typed client
// (src/data/backend-client.ts → platform.backend). input/output are TypeScript types written as text;
// method defaults to POST, and GET/DELETE get their input as ?key=value.
export const endpoints = {
  'search-notes': {
    method: 'GET',
    input: '{ query: string }',
    output: '{ notes: { id: string; title: string; content: string; tags: string[] }[] }',
    description: 'Searches notes by title and content.'
  },
  'get-note-tags': {
    method: 'GET',
    input: '{ noteId: string }',
    output: '{ tags: string[] }',
    description: 'Gets all tags associated with a note.'
  },
  'get-all-tags': {
    method: 'GET',
    output: '{ tags: string[] }',
    description: 'Gets all tags in the system.'
  },
  'add-tag-to-note': {
    method: 'POST',
    input: '{ noteId: string; tagName: string }',
    output: '{ success: true }',
    description: 'Adds a tag to a note.'
  },
  'remove-tag-from-note': {
    method: 'POST',
    input: '{ noteId: string; tagName: string }',
    output: '{ success: true }',
    description: 'Removes a tag from a note.'
  },
  'get-note-count': {
    method: 'GET',
    output: '{ count: number }',
    description: 'Gets the total number of notes.'
  }
} as const;

export function registerCustomRoutes(app: Hono<AppEnv>, ctx: CustomContext): void {
  // Search notes by title and content
  app.get('/v1/fn/search-notes', async (c) => {
    const query = c.req.query('query');
    if (!query) {
      return c.json({ error: { code: 'invalid', message: 'Query parameter is required' } }, 400);
    }

    const results = await ctx.orm.select({
      id: notesTable.id,
      title: notesTable.title,
      content: notesTable.content,
      tags: notesTable.tags
    })
    .from(notesTable)
    .where(
      and(
        query ? eq(notesTable.title, query) : undefined,
        query ? eq(notesTable.content, query) : undefined
      )
    );

    return c.json({ notes: results });
  });

  // Get all tags associated with a note
  app.get('/v1/fn/get-note-tags', async (c) => {
    const noteId = c.req.query('noteId');
    if (!noteId) {
      return c.json({ error: { code: 'invalid', message: 'noteId parameter is required' } }, 400);
    }

    const note = await ctx.orm.select({ tags: notesTable.tags })
      .from(notesTable)
      .where(eq(notesTable.id, noteId));

    if (note.length === 0) {
      return c.json({ error: { code: 'not-found', message: 'Note not found' } }, 404);
    }

    return c.json({ tags: note[0].tags || [] });
  });

  // Get all tags in the system
  app.get('/v1/fn/get-all-tags', async (c) => {
    const tags = await ctx.orm.select({ name: tagsTable.name })
      .from(tagsTable);

    return c.json({ tags: tags.map(t => t.name) });
  });

  // Add a tag to a note
  app.post('/v1/fn/add-tag-to-note', async (c) => {
    const { noteId, tagName } = await c.req.json();
    if (!noteId || !tagName) {
      return c.json({ error: { code: 'invalid', message: 'noteId and tagName are required' } }, 400);
    }

    // Check if note exists
    const note = await ctx.orm.select({ id: notesTable.id })
      .from(notesTable)
      .where(eq(notesTable.id, noteId));

    if (note.length === 0) {
      return c.json({ error: { code: 'not-found', message: 'Note not found' } }, 404);
    }

    // Check if tag exists, if not create it
    const existingTag = await ctx.orm.select({ id: tagsTable.id })
      .from(tagsTable)
      .where(eq(tagsTable.name, tagName));

    if (existingTag.length === 0) {
      await ctx.orm.insert(tagsTable).values({ name: tagName });
    }

    // Get current tags for the note
    const currentTags = await ctx.orm.select({ tags: notesTable.tags })
      .from(notesTable)
      .where(eq(notesTable.id, noteId));

    const updatedTags = [...new Set([...(currentTags[0].tags || []), tagName])];

    await ctx.orm.update(notesTable)
      .set({ tags: updatedTags })
      .where(eq(notesTable.id, noteId));

    return c.json({ success: true }, 200);
  });

  // Remove a tag from a note
  app.post('/v1/fn/remove-tag-from-note', async (c) => {
    const { noteId, tagName } = await c.req.json();
    if (!noteId || !tagName) {
      return c.json({ error: { code: 'invalid', message: 'noteId and tagName are required' } }, 400);
    }

    // Check if note exists
    const note = await ctx.orm.select({ id: notesTable.id })
      .from(notesTable)
      .where(eq(notesTable.id, noteId));

    if (note.length === 0) {
      return c.json({ error: { code: 'not-found', message: 'Note not found' } }, 404);
    }

    // Get current tags for the note
    const currentTags = await ctx.orm.select({ tags: notesTable.tags })
      .from(notesTable)
      .where(eq(notesTable.id, noteId));

    const updatedTags = (currentTags[0].tags || []).filter((t: string) => t !== tagName);

    await ctx.orm.update(notesTable)
      .set({ tags: updatedTags })
      .where(eq(notesTable.id, noteId));

    return c.json({ success: true }, 200);
  });

  // Get total note count
  app.get('/v1/fn/get-note-count', async (c) => {
    const count = await ctx.orm.select({ count: notesTable.id })
      .from(notesTable)
      .groupBy(notesTable.id);

    return c.json({ count: count.length });
  });
}