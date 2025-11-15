"use client"

import { memo, useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Search, X } from "lucide-react"
import { useAuthStore } from "@/stores/useAuthStore"
import { useImageStore } from "@/stores/useImageStore"
import './Header.css'

export const Header = memo(function Header() {
  const { accessToken, signOut } = useAuthStore()
  const { fetchImages } = useImageStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Featured')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const categories = ['Featured', 'Wallpapers', '3D Renders', 'Nature', 'Textures', 'Film', 'Architecture', 'Street Photography', 'Experimental', 'Travel', 'People']

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (location.pathname === '/') {
        fetchImages({
          search: searchQuery || undefined,
          category: activeCategory !== 'Featured' ? activeCategory : undefined,
        })
      }
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, activeCategory, fetchImages, location.pathname])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate('/')
    }
    fetchImages({
      search: searchQuery || undefined,
      category: activeCategory !== 'Featured' ? activeCategory : undefined,
    })
  }

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category)
    if (location.pathname !== '/') {
      navigate('/')
    }
    fetchImages({
      category: category !== 'Featured' ? category : undefined,
    })
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
          <Link to="/" className="header-logo">
            <span>PhotoApp</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="header-search">
            <div className="search-icon-left">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search photos and illustrations"
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
                <Link to="/upload" className="header-link">Submit an image</Link>
                <Link to="/profile" className="header-link">Profile</Link>
                <button onClick={handleSignOut} className="header-link">Log out</button>
              </>
            ) : (
              <>
                <Link to="/signin" className="header-link">Log in</Link>
                <Link to="/upload" className="header-button">Submit an image</Link>
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
    </header>
  )
})

export default Header
