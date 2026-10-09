import { useState, useEffect } from 'react';
import { listNotes, Note } from '../data/store';
import { platform } from '@duxner/platform';
import { truncateText } from '../utils/helpers';

type NotesListProps = {
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onSearch: (query: string) => void;
  onBack: () => void;
};

export default function NotesList({ onAddNote, onEditNote, onSearch, onBack }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        const notesList = await listNotes();
        setNotes(notesList);
        setError(null);
      } catch (err) {
        setError('Couldn\'t load notes. Try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleNoteClick = (note: Note) => {
    onEditNote(note);
  };

  const handleAddNote = () => {
    onAddNote();
  };

  if (loading) {
    return (
      <div className="notes-list">
        <header className="notes-list-header">
          <h1>Quick Notes</h1>
          <input
            type="search"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
            aria-label="Search notes"
          />
        </header>
        <div className="loading-state">
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notes-list">
        <header className="notes-list-header">
          <h1>Quick Notes</h1>
          <input
            type="search"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
            aria-label="Search notes"
          />
        </header>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-list">
      <header className="notes-list-header">
        <h1>Quick Notes</h1>
        <input
          type="search"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
          aria-label="Search notes"
        />
      </header>

      {notes.length === 0 ? (
        <div className="empty-state">
          <p>No notes yet. Tap + to add your first note.</p>
        </div>
      ) : (
        <ul className="notes-list-items">
          {notes.map((note) => (
            <li 
              key={note.id} 
              className="note-item"
              onClick={() => handleNoteClick(note)}
            >
              <h2 className="note-title">{note.title}</h2>
              <p className="note-content">{truncateText(note.content || '', 100)}</p>
              {note.tags && note.tags.length > 0 && (
                <div className="note-tags">
                  {note.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <button 
        className="add-note-button"
        onClick={handleAddNote}
        aria-label="Add new note"
      >
        +
      </button>
    </div>
  );
}