import { useState, useEffect } from 'react';
import { Note, addNote, updateNote, removeNote } from '../data/store';
import { platform } from '@duxner/platform';

type NoteEditorProps = {
  note: Note | null;
  onSave: () => void;
  onDelete: () => void;
  onBack: () => void;
};

export default function NoteEditor({ note, onSave, onDelete, onBack }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setTags(note.tags ? note.tags.join(', ') : '');
    } else {
      setTitle('');
      setContent('');
      setTags('');
    }
  }, [note]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (note) {
        // Update existing note
        await updateNote(note.id, noteData);
      } else {
        // Create new note
        await addNote(noteData);
      }

      onSave();
    } catch (err) {
      setError('Failed to save note. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await removeNote(note.id);
        onDelete();
      } catch (err) {
        setError('Failed to delete note. Please try again.');
        console.error(err);
      }
    }
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <div className="note-editor">
      <header className="note-editor-header">
        <button 
          className="back-button"
          onClick={handleBack}
          aria-label="Back to notes list"
        >
          ←
        </button>
        <h1>{note ? 'Edit Note' : 'New Note'}</h1>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="note-form">
        <input
          type="text"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="note-title-input"
          aria-label="Note title"
        />
        
        <textarea
          placeholder="Note content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="note-content-textarea"
          aria-label="Note content"
        />
        
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="note-tags-input"
          aria-label="Tags"
        />
      </div>

      <div className="note-editor-actions">
        {note && (
          <button 
            className="delete-button"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </button>
        )}
        <button 
          className="save-button"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}