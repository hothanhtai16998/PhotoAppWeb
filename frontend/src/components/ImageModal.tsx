import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Share2,
  Info,
  MoreVertical,
  CheckCircle2,
  ChevronDown,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Mail,
} from 'lucide-react';
import type { Image } from '@/types/image';
import ProgressiveImage from './ProgressiveImage';
import { imageService } from '@/services/imageService';
import './ImageModal.css';

interface ImageModalProps {
  image: Image;
  images: Image[];
  onClose: () => void;
  onImageSelect: (image: Image) => void;
  onDownload: (image: Image, e: React.MouseEvent) => void;
  imageTypes: Map<string, 'portrait' | 'landscape'>;
  onImageLoad: (imageId: string, img: HTMLImageElement) => void;
  currentImageIds: Set<string>;
  processedImages: React.MutableRefObject<Set<string>>;
}

const ImageModal = ({
  image,
  images,
  onClose,
  onImageSelect,
  onDownload,
  imageTypes,
  onImageLoad,
  currentImageIds,
  processedImages,
}: ImageModalProps) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const relatedImagesLoadMoreRef = useRef<HTMLDivElement>(null);
  const [relatedImagesLimit, setRelatedImagesLimit] = useState(12);
  const [isLoadingRelatedImages, setIsLoadingRelatedImages] = useState(false);
  const [views, setViews] = useState<number>(image.views || 0);
  const [downloads, setDownloads] = useState<number>(image.downloads || 0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'views' | 'downloads'>('views');
  const [hoveredBar, setHoveredBar] = useState<{ date: string; views: number; downloads: number; x: number; y: number } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const incrementedViewIds = useRef<Set<string>>(new Set());
  const currentImageIdRef = useRef<string | null>(null);

  // Generate accurate chart data - only show actual data for today, 0 for previous days
  const chartData = useMemo(() => {
    const publishedDate = new Date(image.createdAt);
    publishedDate.setHours(0, 0, 0, 0);

    // Get today's date in local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Helper to format date as YYYY-MM-DD for reliable comparison (using local timezone)
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatDate(today);

    return Array.from({ length: 14 }, (_, i) => {
      // Calculate date: i=0 is 13 days ago, i=13 is today (0 days ago)
      const daysAgo = 13 - i;
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);

      // Compare dates properly to determine if this is today
      const dateStr = formatDate(date);
      const isToday = dateStr === todayStr;
      const isBeforePublished = date < publishedDate;

      // Only show actual data for today, 0 for all previous days
      const viewsValue = (isToday && !isBeforePublished) ? (views || 0) : 0;
      const downloadsValue = (isToday && !isBeforePublished) ? (downloads || 0) : 0;

      return {
        date,
        views: viewsValue,
        downloads: downloadsValue,
        isBeforePublished,
      };
    });
  }, [image.createdAt, views, downloads]);

  // Reset related images limit and update stats when image changes
  useEffect(() => {
    setRelatedImagesLimit(12);
    setViews(image.views || 0);
    setDownloads(image.downloads || 0);
    currentImageIdRef.current = image._id;
  }, [image]);

  // Close info modal when clicking outside
  useEffect(() => {
    if (!showInfoModal) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        infoButtonRef.current &&
        !infoButtonRef.current.contains(target) &&
        !target.closest('.info-modal')
      ) {
        setShowInfoModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfoModal]);

  // Close share menu when clicking outside
  useEffect(() => {
    if (!showShareMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        shareButtonRef.current &&
        !shareButtonRef.current.contains(target) &&
        !target.closest('.share-menu')
      ) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  // Generate share URL
  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/image/${image._id}`;
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      const shareUrl = getShareUrl();
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = getShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  // Share to social media
  const handleShare = (platform: 'facebook' | 'twitter' | 'email') => {
    const shareUrl = getShareUrl();
    const encodedUrl = encodeURIComponent(shareUrl);
    const imageTitle = encodeURIComponent(image.imageTitle || 'Photo');

    let shareWindowUrl = '';

    switch (platform) {
      case 'facebook':
        shareWindowUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareWindowUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${imageTitle}`;
        break;
      case 'email':
        shareWindowUrl = `mailto:?subject=${imageTitle}&body=${encodedUrl}`;
        window.location.href = shareWindowUrl;
        return;
    }

    if (shareWindowUrl) {
      window.open(shareWindowUrl, '_blank', 'width=600,height=400');
    }
  };

  // Increment view count when modal opens (only once per image)
  useEffect(() => {
    const imageId = image._id;
    // Only increment if we haven't incremented for this image ID before
    if (imageId && !incrementedViewIds.current.has(imageId)) {
      incrementedViewIds.current.add(imageId);
      imageService.incrementView(imageId)
        .then((response) => {
          setViews(response.views);
          // Update the image in the parent component and store
          // Use the current image from the ref to avoid stale closure
          const currentImage = image;
          if (onImageSelect && currentImage) {
            onImageSelect({ ...currentImage, views: response.views });
          }
        })
        .catch((error) => {
          console.error('Failed to increment view:', error);
          // Remove from set on error so it can be retried
          incrementedViewIds.current.delete(imageId);
        });
    }
    // Only depend on image._id to avoid re-running when image object changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image._id]);

  // Get related images (same category, excluding current image) with infinite scroll
  const relatedImages = useMemo(() => {
    if (!image || images.length === 0) return [];

    const currentCategoryId = typeof image.imageCategory === 'string'
      ? image.imageCategory
      : image.imageCategory?._id;

    let filtered: Image[];

    if (!currentCategoryId) {
      // If no category, return other images from current view (excluding current)
      filtered = images.filter(img => img._id !== image._id);
    } else {
      // Filter images by same category, excluding current image
      filtered = images.filter(img => {
        if (img._id === image._id) return false;
        const imgCategoryId = typeof img.imageCategory === 'string'
          ? img.imageCategory
          : img.imageCategory?._id;
        return imgCategoryId === currentCategoryId;
      });
    }

    // Return limited images for infinite scroll
    return filtered.slice(0, relatedImagesLimit);
  }, [image, images, relatedImagesLimit]);

  // Check if there are more related images to load
  const hasMoreRelatedImages = useMemo(() => {
    if (!image || images.length === 0) return false;

    const currentCategoryId = typeof image.imageCategory === 'string'
      ? image.imageCategory
      : image.imageCategory?._id;

    let filtered: Image[];

    if (!currentCategoryId) {
      filtered = images.filter(img => img._id !== image._id);
    } else {
      filtered = images.filter(img => {
        if (img._id === image._id) return false;
        const imgCategoryId = typeof img.imageCategory === 'string'
          ? img.imageCategory
          : img.imageCategory?._id;
        return imgCategoryId === currentCategoryId;
      });
    }

    return filtered.length > relatedImagesLimit;
  }, [image, images, relatedImagesLimit]);

  // Infinite scroll for related images (modal content scrolling)
  useEffect(() => {
    if (!relatedImagesLoadMoreRef.current || isLoadingRelatedImages || !modalContentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMoreRelatedImages && !isLoadingRelatedImages) {
          setIsLoadingRelatedImages(true);
          // Load more images after a short delay for smooth UX
          setTimeout(() => {
            setRelatedImagesLimit(prev => prev + 12);
            setIsLoadingRelatedImages(false);
          }, 300);
        }
      },
      {
        root: modalContentRef.current, // Use modal content as root for scrolling detection
        rootMargin: '200px',
      }
    );

    observer.observe(relatedImagesLoadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreRelatedImages, isLoadingRelatedImages]);

  // Focus management: focus modal when it opens
  useEffect(() => {
    const modalElement = document.querySelector('.image-modal') as HTMLElement;
    if (modalElement) {
      modalElement.focus();
    }
  }, [image._id]);

  // Keyboard navigation: Escape to close, Arrow keys to navigate between images
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Don't handle keyboard if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateToAdjacentImage(-1); // Previous image
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateToAdjacentImage(1); // Next image
          break;
        case 'Home':
          e.preventDefault();
          navigateToImage(0); // First image
          break;
        case 'End':
          e.preventDefault();
          navigateToImage(images.length - 1); // Last image
          break;
      }
    };

    // Find current image index and navigate to adjacent image
    const navigateToAdjacentImage = (direction: number) => {
      const currentIndex = images.findIndex(img => img._id === image._id);
      if (currentIndex === -1) return;

      const newIndex = currentIndex + direction;
      if (newIndex >= 0 && newIndex < images.length) {
        onImageSelect(images[newIndex]);
        // Scroll to top of modal content
        if (modalContentRef.current) {
          modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    // Navigate to specific image by index
    const navigateToImage = (index: number) => {
      if (index >= 0 && index < images.length) {
        onImageSelect(images[index]);
        if (modalContentRef.current) {
          modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    // Handle wheel events to scroll modal content when scrolling on overlay or anywhere
    const handleWheel = (e: Event) => {
      if (!modalContentRef.current) return;

      const wheelEvent = e as WheelEvent;
      const target = e.target as HTMLElement;

      // Don't interfere if scrolling inside the modal content itself
      if (modalContentRef.current.contains(target)) {
        return;
      }

      // Prevent default scrolling
      wheelEvent.preventDefault();

      // Scroll the modal content instead
      const modalContent = modalContentRef.current;
      modalContent.scrollTop += wheelEvent.deltaY;
    };

    document.addEventListener('keydown', handleKeyboard);
    // Prevent page/body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    // Prevent scrolling on the image grid container
    const gridContainer = document.querySelector('.image-grid-container');
    if (gridContainer) {
      (gridContainer as HTMLElement).style.overflow = 'hidden';
    }

    // Add wheel event listener to document to catch all scroll events
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyboard);
      document.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
      const gridContainer = document.querySelector('.image-grid-container');
      if (gridContainer) {
        (gridContainer as HTMLElement).style.overflow = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, image._id, images, onImageSelect]);

  return (
    <>
      <div
        className="image-modal-overlay"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className="image-modal"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-image-title"
      >
        {/* Modal Header */}
        <div className="image-modal-header">
          {/* Left: User Info */}
          <div className="modal-header-left">
            {image.uploadedBy.avatarUrl ? (
              <img
                src={image.uploadedBy.avatarUrl}
                alt={image.uploadedBy.displayName || image.uploadedBy.username}
                className="modal-user-avatar"
              />
            ) : (
              <div className="modal-user-avatar-placeholder">
                {(image.uploadedBy.displayName || image.uploadedBy.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="modal-user-info">
              <div className="modal-user-name">
                {image.uploadedBy.displayName?.trim() || image.uploadedBy.username}
                <CheckCircle2 className="verified-badge" size={16} />
              </div>
              <div className="modal-user-status">Available for hire</div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="modal-header-right">
            {/* <button className="modal-action-btn" title="Save">
              <Bookmark size={20} />
            </button>
            <button className="modal-action-btn" title="Add">
              <Plus size={20} />
            </button>
            <button className="modal-action-btn" title="Edit image">
              <Edit size={20} />
            </button> */}
            <button
              className="modal-download-btn"
              aria-label={`Download ${image.imageTitle || 'image'}`}
              onClick={async (e) => {
                e.stopPropagation();
                // Increment download count
                try {
                  const response = await imageService.incrementDownload(image._id);
                  setDownloads(response.downloads);
                  // Update the image in the parent component and store
                  if (onImageSelect) {
                    onImageSelect({ ...image, downloads: response.downloads });
                  }
                } catch (error) {
                  console.error('Failed to increment download:', error);
                }
                // Then trigger the download
                onDownload(image, e);
              }}
              title="Download"
            >
              <span>Tải xuống</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Modal Image Content - Scrollable */}
        <div
          className="image-modal-content"
          ref={modalContentRef}
        >
          {/* Main Image */}
          <div className="modal-main-image-container">
            <img
              src={image.imageUrl}
              alt={image.imageTitle || 'Photo'}
              className="modal-image"
              id="modal-image-title"
            />
          </div>

          {/* Modal Footer */}
          <div className="image-modal-footer">
            {/* Left: Stats */}
            <div className="modal-footer-left">
              <div className="modal-footer-left-stats" role="group" aria-label="Image statistics">
                <div className="modal-stat" role="text">
                  <span className="stat-label">Lượt xem</span>
                  <span className="stat-value" aria-label={`${views.toLocaleString()} lượt xem`}>{views.toLocaleString()}</span>
                </div>
                <div className="modal-stat" role="text">
                  <span className="stat-label">Lượt tải</span>
                  <span className="stat-value" aria-label={`${downloads.toLocaleString()} lượt tải`}>{downloads.toLocaleString()}</span>
                </div>
              </div>
              {/* Image Info */}
              <div className="modal-image-info">
                {image.imageTitle && (
                  <div className="image-info-title">{image.imageTitle}</div>
                )}
                {(image.location || image.cameraModel) && (
                  <div className="image-info-details">
                    {image.location && <span>{image.location}</span>}
                    {image.location && image.cameraModel && <span> • </span>}
                    {image.cameraModel && <span>{image.cameraModel}</span>}
                  </div>
                )}
                {image.createdAt && (
                  <div className="image-info-date">
                    {new Date(image.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="modal-footer-right">
              <div style={{ position: 'relative' }}>
                <button
                  ref={shareButtonRef}
                  className={`modal-footer-btn ${showShareMenu ? 'active' : ''}`}
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  aria-label="Share image"
                  aria-expanded={showShareMenu}
                  aria-haspopup="true"
                >
                  <Share2 size={18} aria-hidden="true" />
                  <span>Chia sẻ</span>
                </button>
                {/* Share Menu */}
                {showShareMenu && (
                  <div className="share-menu-wrapper">
                    <div className="share-menu">
                      <button
                        className="share-menu-item"
                        onClick={handleCopyLink}
                        aria-label="Copy link"
                      >
                        <LinkIcon size={18} aria-hidden="true" />
                        <span>{linkCopied ? 'Đã sao chép!' : 'Sao chép liên kết'}</span>
                      </button>
                      <button
                        className="share-menu-item"
                        onClick={() => handleShare('facebook')}
                        aria-label="Share on Facebook"
                      >
                        <Facebook size={18} aria-hidden="true" />
                        <span>Facebook</span>
                      </button>
                      <button
                        className="share-menu-item"
                        onClick={() => handleShare('twitter')}
                        aria-label="Share on Twitter"
                      >
                        <Twitter size={18} aria-hidden="true" />
                        <span>Twitter</span>
                      </button>
                      <button
                        className="share-menu-item"
                        onClick={() => handleShare('email')}
                        aria-label="Share via email"
                      >
                        <Mail size={18} aria-hidden="true" />
                        <span>Email</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <button
                  ref={infoButtonRef}
                  className={`modal-footer-btn ${showInfoModal ? 'active' : ''}`}
                  onClick={() => setShowInfoModal(!showInfoModal)}
                  aria-label="Show image information"
                  aria-expanded={showInfoModal}
                  aria-haspopup="true"
                >
                  <Info size={18} aria-hidden="true" />
                  <span>Thông tin</span>
                </button>
                {/* Info Modal */}
                {showInfoModal && (
                  <div className="info-modal-wrapper">
                    <div className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
                      <div className="info-modal-header">
                        <h2 className="info-modal-title" id="info-modal-title">Thông tin</h2>
                        <button
                          className="info-modal-close"
                          onClick={() => setShowInfoModal(false)}
                          aria-label="Close info modal"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                      <div className="info-modal-content">
                        <div className="info-published">
                          Đã đăng vào {(() => {
                            const daysAgo = Math.floor((Date.now() - new Date(image.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                            if (daysAgo === 0) return 'hôm nay';
                            if (daysAgo === 1) return '1 ngày trước';
                            return `${daysAgo} ngày trước`;
                          })()}
                        </div>

                        {/* Chart Container */}
                        <div
                          className="info-chart-container"
                          ref={chartContainerRef}
                          id="info-chart-container"
                          role="img"
                          aria-label={`Chart showing ${activeTab === 'views' ? 'views' : 'downloads'} over the last 14 days`}
                          onMouseMove={(e) => {
                            if (!chartContainerRef.current) return;

                            const chartInner = chartContainerRef.current.querySelector('.info-chart') as HTMLElement;
                            if (!chartInner) return;

                            // Get all bar elements to find exact positions
                            const bars = Array.from(chartInner.querySelectorAll('.info-chart-bar'));
                            if (bars.length === 0) return;

                            const chartInnerRect = chartInner.getBoundingClientRect();

                            // Find which bar the mouse is closest to horizontally
                            let hoveredBarIndex = -1;
                            let minDistance = Infinity;
                            let barCenterX = 0;
                            let barTopY = 0;

                            bars.forEach((bar, index) => {
                              const barRect = bar.getBoundingClientRect();
                              const barCenter = barRect.left + (barRect.width / 2);
                              const distance = Math.abs(e.clientX - barCenter);

                              // Also check if mouse is within the chart area vertically
                              if (e.clientY >= chartInnerRect.top && e.clientY <= chartInnerRect.bottom) {
                                if (distance < minDistance) {
                                  minDistance = distance;
                                  hoveredBarIndex = index;
                                  barCenterX = barCenter;
                                  // Get the top of the bar (where the tooltip should appear)
                                  barTopY = barRect.top;
                                }
                              }
                            });

                            if (hoveredBarIndex >= 0 && hoveredBarIndex < chartData.length) {
                              const data = chartData[hoveredBarIndex];
                              const dateStr = data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                              // Ensure tooltip stays within viewport
                              const tooltipWidth = 200;
                              const margin = 10;
                              let finalX = barCenterX;

                              // Adjust if too far right
                              if (finalX + (tooltipWidth / 2) > window.innerWidth - margin) {
                                finalX = window.innerWidth - (tooltipWidth / 2) - margin;
                              }

                              // Adjust if too far left
                              if (finalX - (tooltipWidth / 2) < margin) {
                                finalX = (tooltipWidth / 2) + margin;
                              }

                              setHoveredBar({
                                date: dateStr,
                                views: data.views,
                                downloads: data.downloads,
                                x: finalX,
                                y: barTopY - 8
                              });
                            } else {
                              setHoveredBar(null);
                            }
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div className="info-chart">
                            {chartData.map((data, i) => {
                              const value = activeTab === 'views' ? data.views : data.downloads;
                              const maxValue = activeTab === 'views'
                                ? Math.max(...chartData.map(d => d.views), 1)
                                : Math.max(...chartData.map(d => d.downloads), 1);
                              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

                              return (
                                <div
                                  key={i}
                                  className={`info-chart-bar ${data.isBeforePublished ? 'before-published' : ''}`}
                                  style={{ height: `${Math.max(height, 2)}%` }}
                                />
                              );
                            })}
                          </div>
                          {hoveredBar && typeof document !== 'undefined' && createPortal(
                            <div
                              className="info-chart-tooltip"
                              style={{
                                left: `${hoveredBar.x}px`,
                                top: `${hoveredBar.y}px`,
                                transform: 'translate(-50%, -100%)'
                              }}
                            >
                              <div>{hoveredBar.date} (UTC)</div>
                              {activeTab === 'views' ? (
                                <div>Đã xem {hoveredBar.views.toLocaleString()} lần</div>
                              ) : (
                                <div>Đã tải {hoveredBar.downloads.toLocaleString()} lần</div>
                              )}
                            </div>,
                            document.body
                          )}
                        </div>

                        {/* Tabs */}
                        <div className="info-tabs" role="tablist" aria-label="Statistics view">
                          <button
                            className={`info-tab ${activeTab === 'views' ? 'active' : ''}`}
                            onClick={() => setActiveTab('views')}
                            role="tab"
                            aria-selected={activeTab === 'views'}
                            aria-controls="info-chart-container"
                          >
                            Lượt xem
                          </button>
                          <button
                            className={`info-tab ${activeTab === 'downloads' ? 'active' : ''}`}
                            onClick={() => setActiveTab('downloads')}
                            role="tab"
                            aria-selected={activeTab === 'downloads'}
                            aria-controls="info-chart-container"
                          >
                            Lượt tải
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button className="modal-footer-btn" aria-label="More options">
                <MoreVertical size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Related Images Section */}
          {relatedImages.length > 0 && (
            <div className="modal-related-images">
              <h3 className="related-images-title">Các ảnh cùng chủ đề</h3>
              <div className="related-images-grid">
                {relatedImages.map((relatedImage) => {
                  const imageType = imageTypes.get(relatedImage._id) || 'landscape';
                  return (
                    <div
                      key={relatedImage._id}
                      className={`related-image-item ${imageType}`}
                      onClick={() => {
                        onImageSelect(relatedImage);
                        // Scroll to top of modal content
                        if (modalContentRef.current) {
                          modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    >
                      <ProgressiveImage
                        src={relatedImage.imageUrl}
                        thumbnailUrl={relatedImage.thumbnailUrl}
                        smallUrl={relatedImage.smallUrl}
                        regularUrl={relatedImage.regularUrl}
                        alt={relatedImage.imageTitle || 'Photo'}
                        onLoad={(img) => {
                          if (!processedImages.current.has(relatedImage._id) && currentImageIds.has(relatedImage._id)) {
                            onImageLoad(relatedImage._id, img);
                          }
                        }}
                      />
                      <div className="related-image-overlay">
                        <span className="related-image-title">{relatedImage.imageTitle}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Infinite scroll trigger for related images */}
              {hasMoreRelatedImages && (
                <div ref={relatedImagesLoadMoreRef} className="related-images-load-more-trigger" />
              )}
              {isLoadingRelatedImages && (
                <div className="related-images-loading">
                  <div className="loading-spinner" />
                  <p>Đang tải ảnh...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        {/* <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={24} />
        </button> */}
      </div>
    </>
  );
};

export default ImageModal;

