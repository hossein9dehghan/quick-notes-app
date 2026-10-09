import { platform } from '@duxner/platform';

// Types
export type Note = {
  id: string;
  title: string;
  content?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type SearchHistory = {
  id: string;
  query: string;
  createdAt: string;
  updatedAt: string;
};

// Notes
export async function listNotes(): Promise<Note[]> {
  return await platform.db.list('notes', { orderBy: { field: 'createdAt', dir: 'desc' } });
}

export async function getNote(id: string): Promise<Note | null> {
  return await platform.db.get('notes', id);
}

export async function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  return await platform.db.add('notes', note);
}

export async function updateNote(id: string, note: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Note> {
  return await platform.db.update('notes', id, note);
}

export async function removeNote(id: string): Promise<void> {
  await platform.db.remove('notes', id);
}

export function watchNotes(callback: (notes: Note[]) => void) {
  return platform.db.subscribe('notes', { orderBy: { field: 'createdAt', dir: 'desc' } }, callback);
}

// Tags
export async function listTags(): Promise<Tag[]> {
  return await platform.db.list('tags', { orderBy: { field: 'createdAt', dir: 'desc' } });
}

export async function getTag(id: string): Promise<Tag | null> {
  return await platform.db.get('tags', id);
}

export async function addTag(tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
  return await platform.db.add('tags', tag);
}

export async function removeTag(id: string): Promise<void> {
  await platform.db.remove('tags', id);
}

export function watchTags(callback: (tags: Tag[]) => void) {
  return platform.db.subscribe('tags', { orderBy: { field: 'createdAt', dir: 'desc' } }, callback);
}

// Search History
export async function listSearchHistory(): Promise<SearchHistory[]> {
  return await platform.db.list('searchHistory', { orderBy: { field: 'createdAt', dir: 'desc' } });
}

export async function addSearchQuery(query: string): Promise<SearchHistory> {
  return await platform.db.add('searchHistory', { query });
}

export async function clearSearchHistory(): Promise<void> {
  const history = await listSearchHistory();
  for (const item of history) {
    await platform.db.remove('searchHistory', item.id);
  }
}

export function watchSearchHistory(callback: (history: SearchHistory[]) => void) {
  return platform.db.subscribe('searchHistory', { orderBy: { field: 'createdAt', dir: 'desc' } }, callback);
}

// Settings
export async function getSetting(key: string): Promise<any> {
  return await platform.storage.get(key);
}

export async function setSetting(key: string, value: any): Promise<void> {
  await platform.storage.set(key, value);
}