import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { ChevronRight, TrendingUp } from 'lucide-react';
import type { Image } from '@/types/image';
import './ImageGrid.css';

const ImageGrid = () => {
  const { images, loading, error, fetchImages } = useImageStore();
  const trendingSearches = ['School Library', 'Dentist', 'Thanksgiving', 'Christmas Background', 'Dollar', 'Beautiful House'];

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Group images by category to create collections
  const collections = useMemo(() => {
    if (images.length === 0) return [];

    const categoryMap = new Map<string, Image[]>();
    images.forEach(img => {
      if (img.imageCategory) {
        const category = img.imageCategory;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(img);
      }
    });

    return Array.from(categoryMap.entries())
      .map(([name, imgs]) => ({
        name,
        images: imgs.slice(0, 4),
        count: imgs.length
      }))
      .filter(col => col.count >= 2)
      .slice(0, 4);
  }, [images]);

  // Track image aspect ratios (portrait vs landscape)
  const [imageTypes, setImageTypes] = useState<Map<string, 'portrait' | 'landscape'>>(new Map());
  const processedImages = useRef<Set<string>>(new Set());

  // Get current image IDs for comparison
  const currentImageIds = useMemo(() => new Set(images.map(img => img._id)), [images]);

  // Determine image type when it loads - memoized to prevent recreation
  const handleImageLoad = useCallback((imageId: string, img: HTMLImageElement) => {
    // Only process once per image and only if image still exists
    if (!currentImageIds.has(imageId) || processedImages.current.has(imageId)) return;

    processedImages.current.add(imageId);
    const isPortrait = img.naturalHeight > img.naturalWidth;
    const imageType = isPortrait ? 'portrait' : 'landscape';

    // Update state only if not already set (prevent unnecessary re-renders)
    setImageTypes(prev => {
      if (prev.has(imageId)) return prev;
      const newMap = new Map(prev);
      newMap.set(imageId, imageType);
      return newMap;
    });
  }, [currentImageIds]);

  // Track attached handlers per image element to prevent re-attachment
  const attachedHandlers = useRef<WeakMap<HTMLImageElement, boolean>>(new WeakMap());

  const handleTrendingClick = (search: string) => {
    fetchImages({ search });
  };

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

  return (
    <div className="image-grid-container">
      {/* Collections Section */}
      {collections.length > 0 && (
        <div className="collections-section">
          <div className="section-header">
            <h2 className="section-title">Collections</h2>
            <button className="see-all-link">See all</button>
          </div>
          <div className="collections-grid">
            {collections.map((collection, idx) => (
              <div key={idx} className="collection-card">
                <div className="collection-thumbnails">
                  {collection.images.length > 0 && (
                    <>
                      <div className="collection-main-thumb">
                        <img src={collection.images[0].imageUrl} alt={collection.name} />
                      </div>
                      {collection.images.length > 1 && (
                        <div className="collection-side-thumbs">
                          {collection.images.slice(1, 3).map((img, i) => (
                            <div key={i} className="collection-side-thumb">
                              <img src={img.imageUrl} alt="" />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="collection-info">
                  <h3 className="collection-name">{collection.name}</h3>
                  <p className="collection-count">{collection.count} images</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Searches Section */}
      <div className="trending-section">
        <div className="trending-header">
          <TrendingUp size={20} className="trend-icon" />
          <h2 className="section-title">Trending searches</h2>
        </div>
        <div className="trending-tags">
          {trendingSearches.map((search, idx) => (
            <button
              key={idx}
              className="trending-tag"
              onClick={() => handleTrendingClick(search)}
            >
              {search}
            </button>
          ))}
        </div>
        <button className="see-trending-link">
          See trending searches
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Main Image Grid */}
      {images.length === 0 ? (
        <div className="empty-state">
          <p>No images found. Be the first to upload one!</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {images.map((image) => {
            const imageType = imageTypes.get(image._id) || 'landscape'; // Get from state
            return (
              <div
                key={image._id}
                className={`masonry-item ${imageType}`}
              >
                <a href={image.imageUrl} target="_blank" rel="noopener noreferrer" className="masonry-link">
                  <img
                    ref={(el) => {
                      if (!el) return;
                      // Only process once per image element
                      if (attachedHandlers.current.has(el)) return;
                      attachedHandlers.current.set(el, true);

                      // Check if image is already loaded
                      if (el.complete && el.naturalWidth > 0 && el.naturalHeight > 0) {
                        if (!processedImages.current.has(image._id) && currentImageIds.has(image._id)) {
                          handleImageLoad(image._id, el);
                        }
                      } else {
                        // Set up load handler only once with once: true
                        el.addEventListener('load', () => {
                          if (!processedImages.current.has(image._id) && currentImageIds.has(image._id)) {
                            handleImageLoad(image._id, el);
                          }
                        }, { once: true });
                      }
                    }}
                    src={image.imageUrl}
                    alt={image.imageTitle || 'Photo'}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.png';
                      target.onerror = null;
                    }}
                  />
                  <div className="masonry-overlay">
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
            );
          })}
        </div>
      )}
      {loading && images.length > 0 && (
        <div className="loading-more">
          <p>Loading more images...</p>
        </div>
      )}
    </div>
  );
};

export default ImageGrid;
