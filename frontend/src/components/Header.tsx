"use client"

import { memo, useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Search, X, Shield } from "lucide-react"
import { useAuthStore } from "@/stores/useAuthStore"
import { useImageStore } from "@/stores/useImageStore"
import { categoryService, type Category } from "@/services/categoryService"
import UploadModal from "./UploadModal"
import './Header.css'

export const Header = memo(function Header() {
  const { accessToken, signOut, user } = useAuthStore()
  const { fetchImages } = useImageStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>(['Tất cả'])
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await categoryService.fetchCategories()
        // Map to category names and add 'Tất cả' at the beginning
        const categoryNames = ['Tất cả', ...fetchedCategories.map((cat: Category) => cat.name)]
        setCategories(categoryNames)
      } catch (error) {
        console.error('Failed to load categories:', error)
        // Fallback to default categories if API fails
        setCategories(['Tất cả', 'Nature', 'Portrait', 'Architecture', 'Travel', 'Street', 'Abstract'])
      }
    }
    loadCategories()
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (location.pathname === '/') {
        fetchImages({
          search: searchQuery || undefined,
          category: activeCategory !== 'Tất cả' ? activeCategory : undefined,
        })
      }
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, activeCategory, fetchImages, location.pathname])

  // Listen for refresh event after image upload and re-fetch with current category
  useEffect(() => {
    const handleRefresh = (event: Event) => {
      if (location.pathname === '/') {
        // Get category name from event detail if provided (from uploaded image)
        const customEvent = event as CustomEvent;
        const uploadedCategoryName = customEvent?.detail?.categoryName;
        
        // After upload, the image is already in the store (added by uploadImage)
        // We just need to ensure it's visible by refreshing with the correct filter
        // If user has "Tất cả" selected, refresh with no filter
        // If user has a specific category, refresh with that category (the uploaded image should match)
        setTimeout(() => {
          fetchImages({
            page: 1,
            _refresh: true,
            // Use current category - if "Tất cả", show all; otherwise filter by category
            category: activeCategory !== 'Tất cả' ? activeCategory : undefined,
            search: searchQuery || undefined,
          }).catch((error) => {
            console.error('Error refreshing images after upload:', error);
            // Silently fail - don't show error toast as this is just a refresh
            // The uploaded image is already in the store and visible
          });
        }, 2000) // Increased delay to ensure backend has fully processed and indexed
      }
    }

    window.addEventListener('refreshImages', handleRefresh)
    return () => {
      window.removeEventListener('refreshImages', handleRefresh)
    }
  }, [activeCategory, searchQuery, fetchImages, location.pathname])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate('/')
    }
    fetchImages({
      search: searchQuery || undefined,
      category: activeCategory !== 'Tất cả' ? activeCategory : undefined,
    })
  }

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category)
    if (location.pathname !== '/') {
      navigate('/')
    }
    fetchImages({
      category: category !== 'Tất cả' ? category : undefined,
    })
  }

  const handleLogoClick = () => {
    setSearchQuery('')
    setActiveCategory('Tất cả')
    if (location.pathname !== '/') {
      navigate('/')
    } else {
      // If already on homepage, refresh images
      fetchImages()
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  return (
    <header className="unsplash-header">
      <div className="header-top">
        <div className="header-container">
          {/* Logo */}
          <Link to="/" className="header-logo" onClick={handleLogoClick}>
            <span>PhotoApp</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="header-search">
            <div className="search-icon-left">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Tìm ảnh hoặc bản vẻ illustration"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="search-clear"
              >
                <X size={16} />
              </button>
            )}
            <button type="button" className="search-visual" title="Visual search">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
                <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
          </form>

          {/* Right Actions */}
          <div className="header-actions">
            {accessToken ? (
              <>
                <button onClick={() => setUploadModalOpen(true)} className="header-link">Thêm ảnh</button>
                {user?.isAdmin && (
                  <Link to="/admin" className="header-link" title="Admin Panel">
                    <Shield size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="header-link">Tài khoản</Link>
                <button onClick={handleSignOut} className="header-link">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/signin" className="header-link">Đăng nhập</Link>
                <button onClick={() => navigate('/signin')} className="header-button">Thêm ảnh</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="header-categories">
        <div className="header-container">
          <nav className="category-nav">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`category-link ${activeCategory === category ? 'active' : ''}`}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
    </header>
  )
})

export default Header
