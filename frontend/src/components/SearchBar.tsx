import { useState, useEffect, useRef } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import './SearchBar.css';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const { fetchImages } = useImageStore();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchImages({
        search: searchQuery || undefined,
        category: category || undefined,
      });
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, category, fetchImages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchImages({
      search: searchQuery || undefined,
      category: category || undefined,
    });
  };

  const handleClear = () => {
    setSearchQuery('');
    setCategory('');
    fetchImages();
  };

  return (
    <div className="search-hero">
      <div className="search-content">
        <h1 className="hero-title">The internet's source for visuals.</h1>
        <p className="hero-subtitle">Powered by creators everywhere.</p>
        <form onSubmit={handleSubmit} className="search-input-wrapper">
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search photos"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search images"
            className="search-input"
          />
          {(searchQuery || category) && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-btn"
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </form>
        <div className="category-filters">
          <button
            type="button"
            onClick={() => {
              setCategory('');
              fetchImages();
            }}
            className={!category ? 'category-btn active' : 'category-btn'}
          >
            All
          </button>
          {['Nature', 'Portrait', 'Architecture', 'Travel', 'Street', 'Abstract'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                fetchImages({ category: cat });
              }}
              className={category === cat ? 'category-btn active' : 'category-btn'}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
