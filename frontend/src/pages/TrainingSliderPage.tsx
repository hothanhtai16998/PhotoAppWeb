import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Instagram, X } from 'lucide-react';
import './TrainingSliderPage.css';

interface Slide {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  backgroundImage: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Learn to Ride',
    description: 'Join us at our Horse Riding Club, where we celebrate the joy of horse riding in a friendly and supportive environment. Everyone is welcome, from beginners to seasoned riders!',
    buttonText: 'GET STARTED',
    backgroundImage: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&h=1080&fit=crop',
  },
  {
    id: 2,
    title: 'Master the Craft of horse riding',
    description: 'Enhance your riding skills under our expert guidance. Our lessons cater to all levels, focusing on safety, skill, and fun in the great outdoors.',
    buttonText: 'GET STARTED',
    backgroundImage: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=1920&h=1080&fit=crop',
  },
  {
    id: 3,
    title: 'Scenic Trails',
    description: 'Experience the beauty of nature on horseback. Our guided trail rides offer breathtaking views and a perfect way to unwind. It\'s more than a ride; it\'s an exploration',
    buttonText: 'GET STARTED',
    backgroundImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
  },
  {
    id: 4,
    title: 'Healing Journey',
    description: 'Experience the therapeutic power of horse riding at Serenity Stables. Lila\'s approach helps you find inner strength and healing through gentle interactions with our horses.',
    buttonText: 'GET STARTED',
    backgroundImage: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&h=1080&fit=crop',
  },
  {
    id: 5,
    title: 'Adventure Awaits',
    description: 'Step into the saddle and turn ordinary days into extraordinary adventures. Discover horse riding in its most thrilling form.',
    buttonText: 'GET STARTED',
    backgroundImage: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=1920&h=1080&fit=crop',
  },
];

function TrainingSliderPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [currentSlide, isTransitioning]);

  // Auto-play functionality (optional - can be disabled)
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrev]);

  const currentSlideData = slides[currentSlide];

  return (
    <div className="training-slider-page">
      {/* Header */}
      <header className="slider-header">
        <div className="header-left">
          <a href="#about" className="header-link">ABOUT</a>
          <a href="#lessons" className="header-link">LESSONS</a>
        </div>
        <div className="header-center">
          {/* Fullscreen Indicator Box */}
          <div className="fullscreen-indicator">
            <p className="fullscreen-text">Để thoát khỏi chế độ toàn màn hình, hãy nhấn và giữ</p>
            <button className="fullscreen-exit-btn">
              <X size={14} />
              <span>Thoát</span>
            </button>
          </div>
          <div className="circular-logo">
            <svg className="logo-svg" viewBox="0 0 120 120">
              <defs>
                <path id="logo-circle" d="M 60,60 m -55,0 a 55,55 0 1,1 110,0 a 55,55 0 1,1 -110,0" />
              </defs>
              <text className="logo-text-path" fill="rgba(255, 255, 255, 0.9)" fontSize="8" fontWeight="400" textTransform="uppercase" letterSpacing="2">
                <textPath href="#logo-circle" startOffset="0%">
                  HORSES RIDING LESSONS • 
                </textPath>
              </text>
            </svg>
            <div className="logo-icon">⊂</div>
          </div>
        </div>
        <div className="header-right">
          <a href="#contact" className="header-link">CONTACT</a>
          <a href="#" className="header-icon" aria-label="Instagram">
            <Instagram size={20} />
          </a>
        </div>
      </header>

      {/* Slides Container */}
      <div className="slider-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slider-slide ${index === currentSlide ? 'active' : ''} ${
              index < currentSlide ? 'prev' : index > currentSlide ? 'next' : ''
            }`}
            style={{
              backgroundImage: `url(${slide.backgroundImage})`,
            }}
          >
            <div className="slide-overlay"></div>
            
            {/* Title and Navigation in Bottom Left */}
            <div className="slide-content-left">
              <h1 className="slide-title">{slide.title}</h1>
              <div className="slide-nav-buttons">
                <button 
                  className="slide-nav-btn prev-btn" 
                  onClick={goToPrev}
                  aria-label="Previous slide"
                >
                  PREV
                </button>
                <span className="nav-separator">/</span>
                <button 
                  className="slide-nav-btn next-btn" 
                  onClick={goToNext}
                  aria-label="Next slide"
                >
                  NEXT
                </button>
              </div>
            </div>

            {/* Description Box in Bottom Right */}
            <div className="slide-content-right">
              <div className="description-box">
                <p className="slide-description">{slide.description}</p>
                <button className="slide-button">
                  GET STARTED
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Brown Block in Bottom Left */}
      <div className="brown-block-bottom"></div>
      <div className="brown-block-bottom-2"></div>

      {/* Right Side Navigation with S Icon */}
      <div className="slider-right-nav">
        <div className="nav-icon-s">S</div>
      </div>

      {/* Slide Indicators */}
      <div className="slider-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`slider-indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Bottom Navigation Links */}
      <nav className="slider-bottom-nav">
        <a href="#about" className="nav-link">about</a>
        <a href="#lessons" className="nav-link">lessons</a>
        <a href="#contact" className="nav-link">contact</a>
      </nav>

      {/* Right Scrollbar */}
      <div className="custom-scrollbar"></div>
    </div>
  );
}

export default TrainingSliderPage;

