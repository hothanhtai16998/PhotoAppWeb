import { useState, useEffect, useRef } from 'react';
import './ProgressiveImage.css';

interface ProgressiveImageProps {
  src: string;
  thumbnailUrl?: string;
  smallUrl?: string;
  regularUrl?: string;
  alt: string;
  className?: string;
  onLoad?: (img: HTMLImageElement) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Generate Cloudinary thumbnail URL on-the-fly for old images
 * Uses f_auto to automatically serve WebP/AVIF when supported, with JPEG fallback
 */
const generateThumbnailUrl = (imageUrl: string): string => {
  // If it's already a Cloudinary URL, add transformation
  if (imageUrl.includes('cloudinary.com')) {
    // Insert transformation before filename
    // f_auto: automatically serves best format (AVIF > WebP > original)
    return imageUrl.replace(
      /\/upload\//,
      '/upload/w_200,q_auto:low,f_auto,dpr_auto/'
    );
  }
  return imageUrl;
};

/**
 * Generate Cloudinary small URL on-the-fly for old images
 * Use higher resolution (800px) to prevent pixelation when displayed at full width
 * f_auto: automatically serves best format (AVIF > WebP > original)
 */
const generateSmallUrl = (imageUrl: string): string => {
  if (imageUrl.includes('cloudinary.com')) {
    return imageUrl.replace(
      /\/upload\//,
      '/upload/w_800,q_auto:good,f_auto,dpr_auto/'
    );
  }
  return imageUrl;
};

/**
 * Generate Cloudinary regular URL with modern formats
 * Reserved for future use (e.g., detail view)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const generateRegularUrl = (imageUrl: string): string => {
  if (imageUrl.includes('cloudinary.com')) {
    return imageUrl.replace(
      /\/upload\//,
      '/upload/w_1200,q_auto:best,f_auto,dpr_auto/'
    );
  }
  return imageUrl;
};

/**
 * ProgressiveImage component - loads images progressively like Unsplash
 * 1. Shows blur-up placeholder (thumbnail)
 * 2. Loads small size for grid view
 * 3. Optionally loads full size on hover/click
 */
const ProgressiveImage = ({
  src,
  thumbnailUrl,
  smallUrl,
  regularUrl, // Reserved for future use (e.g., detail view)
  alt,
  className = '',
  onLoad,
  onError,
}: ProgressiveImageProps) => {
  // Suppress unused parameter warning - reserved for future use
  void regularUrl;
  // Generate URLs on-the-fly if not provided (for old images)
  const effectiveThumbnail = thumbnailUrl || generateThumbnailUrl(src);
  const effectiveSmall = smallUrl || generateSmallUrl(src);

  const [currentSrc, setCurrentSrc] = useState<string>(effectiveThumbnail);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [shouldLoadEagerly, setShouldLoadEagerly] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedSrcs = useRef<Set<string>>(new Set());
  const preloadedRef = useRef<boolean>(false);

  // Reset state when src changes
  useEffect(() => {
    // Use a small timeout to avoid cascading renders
    const timeoutId = setTimeout(() => {
      setCurrentSrc(effectiveThumbnail);
      setIsLoaded(false);
      setIsError(false);
      setShouldLoadEagerly(false);
      preloadedRef.current = false;
      loadedSrcs.current.clear();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [src, effectiveThumbnail]);

  // Preload images using Intersection Observer (like Unsplash)
  useEffect(() => {
    if (!containerRef.current || preloadedRef.current) return;

    // Check if already in viewport
    const rect = containerRef.current.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight + 200 && rect.bottom > -200;

    if (isInViewport && !preloadedRef.current) {
      // Already visible, start loading immediately
      preloadedRef.current = true;
      // Use setTimeout to avoid cascading renders
      setTimeout(() => setShouldLoadEagerly(true), 0);

      // Preload small size in background
      if (effectiveSmall !== effectiveThumbnail && !loadedSrcs.current.has(effectiveSmall)) {
        const smallImg = new Image();
        smallImg.onload = () => {
          loadedSrcs.current.add(effectiveSmall);
          setCurrentSrc(effectiveSmall);
          setIsLoaded(true);
          if (onLoad && imgRef.current) {
            onLoad(imgRef.current);
          }
        };
        smallImg.onerror = () => {
          // If small size fails, keep thumbnail
          setIsLoaded(true);
          if (onLoad && imgRef.current) {
            onLoad(imgRef.current);
          }
        };
        smallImg.src = effectiveSmall;
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !preloadedRef.current) {
            // Image is about to be visible, preload it
            preloadedRef.current = true;
            setShouldLoadEagerly(true);

            // Preload small size in background
            if (effectiveSmall !== effectiveThumbnail && !loadedSrcs.current.has(effectiveSmall)) {
              const smallImg = new Image();
              smallImg.onload = () => {
                loadedSrcs.current.add(effectiveSmall);
                setCurrentSrc(effectiveSmall);
                setIsLoaded(true);
                if (onLoad && imgRef.current) {
                  onLoad(imgRef.current);
                }
              };
              smallImg.onerror = () => {
                // If small size fails, keep thumbnail
                setIsLoaded(true);
                if (onLoad && imgRef.current) {
                  onLoad(imgRef.current);
                }
              };
              smallImg.src = effectiveSmall;
            }

            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '300px', // Start loading 300px before image enters viewport
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
    // onLoad is stable and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveThumbnail, effectiveSmall]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    const loadedSrc = img.src;

    // Mark this source as loaded
    loadedSrcs.current.add(loadedSrc);

    // If we just loaded thumbnail, upgrade to small
    if (loadedSrc === effectiveThumbnail && !isLoaded) {
      if (effectiveSmall !== effectiveThumbnail && !loadedSrcs.current.has(effectiveSmall)) {
        // Load the small size in the background
        const nextImg = new Image();
        nextImg.onload = () => {
          loadedSrcs.current.add(effectiveSmall);
          setCurrentSrc(effectiveSmall);
          setIsLoaded(true);
          if (onLoad && imgRef.current) {
            onLoad(imgRef.current);
          }
        };
        nextImg.onerror = () => {
          // If next size fails, keep current
          setIsLoaded(true);
          if (onLoad && imgRef.current) {
            onLoad(imgRef.current);
          }
        };
        nextImg.src = effectiveSmall;
        return;
      }
    }

    setIsLoaded(true);
    if (onLoad) onLoad(img);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsError(true);
    if (onError) {
      onError(e);
    } else {
      // Fallback to placeholder
      const target = e.currentTarget;
      target.src = '/placeholder-image.png';
      target.onerror = null;
    }
  };

  // Generate srcset for responsive images with modern formats
  // Cloudinary f_auto automatically serves best format, but we can be explicit
  const generateSrcSet = (baseUrl: string, sizes: number[]): string => {
    if (!baseUrl.includes('cloudinary.com')) {
      return '';
    }
    return sizes
      .map((size) => {
        const url = baseUrl.replace(/\/upload\//, `/upload/w_${size},q_auto:good,f_auto,dpr_auto/`);
        return `${url} ${size}w`;
      })
      .join(', ');
  };

  const srcSet = generateSrcSet(effectiveSmall, [400, 800, 1200, 1600]);

  return (
    <div ref={containerRef} className={`progressive-image-wrapper ${className}`}>
      <img
        ref={imgRef}
        src={currentSrc}
        srcSet={srcSet || undefined}
        sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, (max-width: 1200px) 1200px, 1600px"
        alt={alt}
        className={`progressive-image ${isLoaded ? 'loaded' : 'loading'} ${isError ? 'error' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={shouldLoadEagerly ? 'eager' : 'lazy'}
        decoding="async"
      />
      {/* Blur-up overlay effect while loading */}
      {!isLoaded && effectiveThumbnail && (
        <div
          className="progressive-image-blur"
          style={{
            backgroundImage: `url(${effectiveThumbnail})`,
          }}
        />
      )}
    </div>
  );
};

export default ProgressiveImage;

