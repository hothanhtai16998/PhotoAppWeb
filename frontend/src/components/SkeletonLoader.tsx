import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
}

export const ImageGridSkeleton = ({ count = 12, className = '' }: SkeletonLoaderProps) => {
  return (
    <div className={`skeleton-grid ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-item">
          <div className="skeleton-image" />
          <div className="skeleton-overlay">
            <div className="skeleton-title" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ImageCardSkeleton = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton-title" />
        <div className="skeleton-text" />
      </div>
    </div>
  );
};

export default ImageGridSkeleton;

