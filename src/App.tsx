import { useState, useEffect } from 'react';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import SearchResults from './components/SearchResults';
import { platform } from '@duxner/platform';
import { Note } from './data/store';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'list' | 'edit' | 'search'>('list');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);

  // Check for theme preference
  useEffect(() => {
    const checkTheme = async () => {
      const theme = await platform.storage.get('theme');
      if (theme) {
        document.documentElement.setAttribute('data-theme', theme);
      } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
      }
    };
    
    checkTheme();
  }, []);

  const handleAddNote = () => {
    setEditingNote(null);
    setCurrentScreen('edit');
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setCurrentScreen('edit');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setCurrentScreen('search');
    }
  };

  const handleBackToList = () => {
    setCurrentScreen('list');
    setSearchQuery('');
  };

  const handleBackToSearch = () => {
    setCurrentScreen('search');
  };

  return (
    <main className="app">
      {currentScreen === 'list' && (
        <NotesList
          onAddNote={handleAddNote}
          onEditNote={handleEditNote}
          onSearch={handleSearch}
          onBack={handleBackToList}
        />
      )}
      
      {currentScreen === 'edit' && (
        <NoteEditor
          note={editingNote}
          onSave={() => handleBackToList()}
          onDelete={() => handleBackToList()}
          onBack={handleBackToList}
        />
      )}
      
      {currentScreen === 'search' && (
        <SearchResults
          query={searchQuery}
          results={searchResults}
          onNoteSelect={handleEditNote}
          onBack={handleBackToList}
          onBackToSearch={handleBackToSearch}
        />
      )}
    </main>
  );
}