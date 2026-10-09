import { useState, useEffect } from 'react';
import { searchNotes } from '../data/backend-client';
import { Note } from '../data/store';
import { truncateText } from '../utils/helpers';

type SearchResultsProps = {
  query: string;
  results: Note[];
  onNoteSelect: (note: Note) => void;
  onBack: () => void;
  onBackToSearch: () => void;
};

export default function SearchResults({ query, results, onNoteSelect, onBack, onBackToSearch }: SearchResultsProps) {
  const [searchResults, setSearchResults] = useState<Note[]>(results);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim()) {
      handleSearch(query);
    }
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchNotes({ query: searchQuery });
      setSearchResults(response.notes);
    } catch (err) {
      setError('Couldn\'t search notes. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteClick = (note: Note) => {
    onNoteSelect(note);
  };

  const handleBack = () => {
    onBack();
  };

  const handleBackToSearch = () => {
    onBackToSearch();
  };

  if (loading) {
    return (
      <div className="search-results">
        <header className="search-results-header">
          <button 
            className="back-button"
            onClick={handleBack}
            aria-label="Back to notes list"
          >
            ←
          </button>
          <h1>Search Results</h1>
        </header>
        <div className="loading-state">
          <p>Searching...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results">
        <header className="search-results-header">
          <button 
            className="back-button"
            onClick={handleBack}
            aria-label="Back to notes list"
          >
            ←
          </button>
          <h1>Search Results</h1>
        </header>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={handleBackToSearch}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <header className="search-results-header">
        <button 
          className="back-button"
          onClick={handleBack}
          aria-label="Back to notes list"
        >
          ←
        </button>
        <h1>Search Results</h1>
      </header>

      {searchResults.length === 0 ? (
        <div className="empty-state">
          <p>No notes match your search.</p>
        </div>
      ) : (
        <ul className="search-results-list">
          {searchResults.map((note) => (
            <li 
              key={note.id} 
              className="search-result-item"
              onClick={() => handleNoteClick(note)}
            >
              <h2 className="search-result-title">{note.title}</h2>
              <p className="search-result-content">{truncateText(note.content || '', 150)}</p>
              {note.tags && note.tags.length > 0 && (
                <div className="search-result-tags">
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
    </div>
  );
}