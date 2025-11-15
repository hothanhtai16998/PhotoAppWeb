import { useEffect } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import './ImageGrid.css';

const ImageGrid = () => {
  const { images, loading, error, fetchImages } = useImageStore();

  useEffect(() => {
    // Fetch images when component mounts
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && images.length === 0) {
    return (
      <div className="image-grid-container">
        <div className="loading-state">
          <p>Loading images...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="image-grid-container">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={() => fetchImages()}>Try Again</button>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="image-grid-container">
        <div className="empty-state">
          <p>No images found. Be the first to upload one!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-grid-container">
      <div className="image-grid">
        {images.map((image) => (
          <div key={image._id} className="image-item">
            <a href={image.imageUrl} target="_blank" rel="noopener noreferrer" className="image-link">
              <img
                src={image.imageUrl}
                alt={image.imageTitle || 'Photo'}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.png'; // Add fallback
                  target.onerror = null; // Prevent infinite loop
                }}
              />
              <div className="image-overlay">
                <div className="image-actions">
                  <button
                    className="image-action-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(image.imageUrl, '_blank');
                    }}
                    title="Download"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                  <button
                    className="image-action-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      // Bookmark functionality can be added later
                    }}
                    title="Bookmark"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                </div>
                <div className="image-info">
                  {image.uploadedBy && (
                    <div className="image-author-info">
                      <span className="image-author-name">
                        {image.uploadedBy.displayName || image.uploadedBy.username}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
      {loading && images.length > 0 && (
        <div className="loading-more">
          <p>Loading more images...</p>
        </div>
      )}
    </div>
  );
};

export default ImageGrid;
