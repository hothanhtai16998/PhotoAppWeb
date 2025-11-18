"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useImageStore } from "@/stores/useImageStore"
import { categoryService, type Category } from "@/services/categoryService"
import './CategoryNavigation.css'

export function CategoryNavigation() {
  const { fetchImages, currentCategory } = useImageStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState<string[]>(['Tất cả'])
  const activeCategory = currentCategory || 'Tất cả'

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

  const handleCategoryClick = (category: string) => {
    if (location.pathname !== '/') {
      navigate('/')
    }
    fetchImages({
      category: category !== 'Tất cả' ? category : undefined,
    })
  }

  // Only show on homepage
  if (location.pathname !== '/') {
    return null
  }

  return (
    <div className="category-navigation-container">
      <div className="category-navigation-wrapper">
        <nav className="category-navigation">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`category-nav-link ${activeCategory === category ? 'active' : ''}`}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default CategoryNavigation

