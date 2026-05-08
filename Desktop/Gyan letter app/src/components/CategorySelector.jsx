import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Plus, Edit2, Trash2, X, Save, Filter } from 'lucide-react'
import { categoryService } from '../services/categoryService'

export default function CategorySelector({ selectedCategory, onCategoryChange, onCategorySelect }) {
  const [categories, setCategories] = useState({})
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryType, setCategoryType] = useState('custom')
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    const initCategories = async () => {
      await categoryService.initialize()
      loadCategories()
    }
    initCategories()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDropdown &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  useEffect(() => {
    if (showAddModal || showRenameModal) {
      setShowDropdown(false)
    }
  }, [showAddModal, showRenameModal])

  const loadCategories = () => {
    const cats = categoryService.getAll()
    setCategories(cats)
  }

  const refreshCategoriesFromServer = async () => {
    try {
      await categoryService.loadFromServer()
    } catch (error) {
      console.warn('Category refresh failed, using cached categories:', error.message)
    } finally {
      loadCategories()
    }
  }

  const handleCategorySelect = (categoryId) => {
    const category = categories[categoryId]
    if (category) {
      onCategoryChange(categoryId)
      onCategorySelect?.(category)
      setShowDropdown(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name')
      return
    }

    try {
      const categoryId = await categoryService.addCategory(newCategoryName.trim(), categoryType)
      loadCategories()
      setNewCategoryName('')
      setShowAddModal(false)
      setCategoryType('custom')
      handleCategorySelect(categoryId)
    } catch (error) {
      console.error('Failed to add category:', error)
      alert('Failed to add category. Please try again.')
    }
  }

  const handleRenameCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a new name')
      return
    }

    try {
      await categoryService.renameCategory(editingCategoryId, newCategoryName.trim())
      loadCategories()
      setNewCategoryName('')
      setShowRenameModal(false)
      setEditingCategoryId(null)
    } catch (error) {
      console.error('Failed to rename category:', error)
      alert('Failed to rename category. Please try again.')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const success = await categoryService.deleteCategory(categoryId)
        if (!success) {
          alert('Cannot delete default categories')
          return
        }
        loadCategories()
        if (selectedCategory === categoryId) {
          onCategoryChange(null)
        }
      } catch (error) {
        console.error('Failed to delete category:', error)
        alert('Failed to delete category. Please try again.')
      }
    }
  }

  const openRenameModal = (categoryId) => {
    const category = categories[categoryId]
    if (category) {
      setShowDropdown(false)
      setEditingCategoryId(categoryId)
      setNewCategoryName(category.name)
      setShowRenameModal(true)
    }
  }

  const selectedCategoryData = selectedCategory ? categories[selectedCategory] : null

  useEffect(() => {
    if (showDropdown) {
      refreshCategoriesFromServer()
    }
  }, [showDropdown])

  useEffect(() => {
    const handleWindowFocus = () => {
      refreshCategoriesFromServer()
    }
    window.addEventListener('focus', handleWindowFocus)
    return () => window.removeEventListener('focus', handleWindowFocus)
  }, [])

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center space-x-2 text-sm font-semibold text-blue-900">
          <Filter className="w-4 h-4" />
          <span>Filter by Data Category</span>
        </label>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
          Filter
        </span>
      </div>
      
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className={`w-full px-4 py-2.5 border-2 rounded-lg text-left flex items-center justify-between transition-colors ${
            showDropdown
              ? 'bg-blue-50 border-blue-500'
              : 'bg-blue-50/40 border-blue-300 hover:bg-blue-50'
          }`}
        >
          <span className={selectedCategoryData ? 'text-gray-900' : 'text-gray-600'}>
            {selectedCategoryData ? selectedCategoryData.name : 'Choose category to filter records...'}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`} />
        </button>

        {showDropdown && !showAddModal && !showRenameModal && (
          <div 
            ref={dropdownRef}
            className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-auto"
          >
            <div className="p-2">
              {/* Default Categories */}
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Default Categories</div>
                {['default', 'states', 'universities', 'emails'].map(catId => {
                  const cat = categories[catId]
                  if (!cat) return null
                  return (
                    <div key={catId} className="flex items-center group">
                      <button
                        onClick={() => handleCategorySelect(catId)}
                        className={`flex-1 px-3 py-2 text-left hover:bg-blue-50 rounded ${
                          selectedCategory === catId ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                      <button
                        onClick={() => openRenameModal(catId)}
                        className="p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100"
                        title="Rename"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Custom Categories */}
              {Object.keys(categories).filter(id => !['states', 'universities', 'emails'].includes(id)).length > 0 && (
                <div className="mb-2 border-t pt-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Custom Categories</div>
                  {Object.keys(categories)
                    .filter(id => !['states', 'universities', 'emails'].includes(id))
                    .map(catId => {
                      const cat = categories[catId]
                      return (
                        <div key={catId} className="flex items-center group">
                          <button
                            onClick={() => handleCategorySelect(catId)}
                            className={`flex-1 px-3 py-2 text-left hover:bg-blue-50 rounded ${
                              selectedCategory === catId ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            {cat.name}
                          </button>
                          <button
                            onClick={() => openRenameModal(catId)}
                            className="p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100"
                            title="Rename"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(catId)}
                            className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                </div>
              )}

              {/* Add New Category Button */}
              <button
                onClick={() => {
                  setShowAddModal(true)
                  setShowDropdown(false)
                }}
                className="w-full mt-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Category</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Category Info */}
      {selectedCategoryData && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-blue-900">Category: {selectedCategoryData.name}</span>
            </div>
            <button
              onClick={() => {
                onCategoryChange(null)
                setShowDropdown(false)
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Category</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Type</label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="custom">Custom List</option>
                <option value="states">Indian States</option>
                <option value="universities">Universities</option>
                <option value="emails">Complete Mails</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddCategory}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Create</span>
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewCategoryName('')
                }}
                className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Category Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Rename Category</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRenameCategory}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setShowRenameModal(false)
                  setNewCategoryName('')
                  setEditingCategoryId(null)
                }}
                className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
