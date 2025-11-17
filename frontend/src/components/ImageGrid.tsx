import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { ChevronRight, TrendingUp } from 'lucide-react';
import type { Image } from '@/types/image';
import ProgressiveImage from './ProgressiveImage';
import './ImageGrid.css';

const ImageGrid = () => {
  const { images, loading, error, pagination, currentSearch, currentCategory, fetchImages } = useImageStore();
  const trendingSearches = ['School Library', 'Dentist', 'Thanksgiving', 'Christmas Background', 'Dollar', 'Beautiful House'];
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);

  // Initial load
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Infinite scroll: Load more when reaching bottom
  useEffect(() => {
    if (!loadMoreRef.current || !pagination) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        // If load more trigger is visible and we have more pages
        if (
          entry.isIntersecting &&
          !loading &&
          !isLoadingMoreRef.current &&
          pagination.page < pagination.pages
        ) {
          isLoadingMoreRef.current = true;
          
          // Load next page with current search/category from store
          fetchImages({
            page: pagination.page + 1,
            search: currentSearch,
            category: currentCategory,
          }).finally(() => {
            isLoadingMoreRef.current = false;
          });
        }
      },
      {
        rootMargin: '400px', // Start loading 400px before reaching bottom
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [pagination, loading, fetchImages, currentSearch, currentCategory]);

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

  const handleTrendingClick = (search: string) => {
    fetchImages({ search, page: 1 });
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
                        <ProgressiveImage
                          src={collection.images[0].imageUrl}
                          thumbnailUrl={collection.images[0].thumbnailUrl}
                          smallUrl={collection.images[0].smallUrl}
                          alt={collection.name}
                        />
                      </div>
                      {collection.images.length > 1 && (
                        <div className="collection-side-thumbs">
                          {collection.images.slice(1, 3).map((img, i) => (
                            <div key={i} className="collection-side-thumb">
                              <ProgressiveImage
                                src={img.imageUrl}
                                thumbnailUrl={img.thumbnailUrl}
                                smallUrl={img.smallUrl}
                                alt=""
                              />
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
            // Debug: Check if uploadedBy exists
            const hasUserInfo = image.uploadedBy && (image.uploadedBy.displayName || image.uploadedBy.username);
            return (
              <div
                key={image._id}
                className={`masonry-item ${imageType}`}
              >
                <a href={image.imageUrl} target="_blank" rel="noopener noreferrer" className="masonry-link">
                  <ProgressiveImage
                    src={image.imageUrl}
                    thumbnailUrl={image.thumbnailUrl}
                    smallUrl={image.smallUrl}
                    regularUrl={image.regularUrl}
                    alt={image.imageTitle || 'Photo'}
                    onLoad={(img) => {
                      // Handle image load for aspect ratio detection
                      if (!processedImages.current.has(image._id) && currentImageIds.has(image._id)) {
                        handleImageLoad(image._id, img);
                      }
                    }}
                    onError={() => {
                      // Error handling is done in ProgressiveImage component
                    }}
                  />
                  <div 
                    className="masonry-overlay"
                    onMouseMove={(e) => {
                      const overlay = e.currentTarget;
                      const rect = overlay.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      // Keep tooltip within bounds (with 10px margin)
                      const tooltipWidth = 200;
                      const tooltipHeight = 40;
                      const adjustedX = Math.max(tooltipWidth / 2, Math.min(x, rect.width - tooltipWidth / 2));
                      const adjustedY = Math.max(tooltipHeight / 2, Math.min(y, rect.height - tooltipHeight / 2));
                      overlay.style.setProperty('--mouse-x', `${adjustedX}px`);
                      overlay.style.setProperty('--mouse-y', `${adjustedY}px`);
                    }}
                  >
                    {/* Image Title Tooltip - follows mouse */}
                    {image.imageTitle && (
                      <div className="image-title-tooltip">
                        {image.imageTitle}
                      </div>
                    )}
                    
                    {/* Top Right - Download Button */}
                    <div className="image-actions">
                      <button
                        className="image-action-btn download-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Create download link
                          const link = document.createElement('a');
                          link.href = image.imageUrl;
                          link.download = image.imageTitle || 'photo';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        title="Download"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </button>
                    </div>
                    
                    {/* Bottom Left - User Info */}
                    {hasUserInfo && (
                      <div className="image-info">
                        <div className="image-author-info">
                          {image.uploadedBy.avatarUrl ? (
                            <img 
                              src={image.uploadedBy.avatarUrl} 
                              alt={image.uploadedBy.displayName || image.uploadedBy.username}
                              className="author-avatar"
                              style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
                              onError={(e) => {
                                // Hide avatar if it fails to load
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="author-avatar-placeholder" style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}>
                              {(image.uploadedBy.displayName || image.uploadedBy.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="author-details">
                            <span className="image-author-name">
                              {image.uploadedBy.displayName?.trim() || image.uploadedBy.username}
                            </span>
                            {image.uploadedBy.bio && (
                              <span className="author-bio">{image.uploadedBy.bio}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      )}
      {/* Infinite Scroll Trigger - invisible element at bottom */}
      {pagination && pagination.page < pagination.pages && (
        <div ref={loadMoreRef} className="infinite-scroll-trigger" />
      )}
      
      {/* Loading indicator */}
      {loading && images.length > 0 && (
        <div className="loading-more">
          <div className="loading-spinner" />
          <p>Loading more images...</p>
        </div>
      )}
      
      {/* End of results */}
      {pagination && pagination.page >= pagination.pages && images.length > 0 && (
        <div className="end-of-results">
          <p>You've reached the end</p>
        </div>
      )}
    </div>
  );
};

export default ImageGrid;
