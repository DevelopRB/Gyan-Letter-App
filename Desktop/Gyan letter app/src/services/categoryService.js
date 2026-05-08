import { apiService } from './api'

const CATEGORIES_KEY = 'data_categories'

const getDefaultCategories = () => ({
  default: { name: 'Default', type: 'default', items: [] },
  states: { name: 'Indian States', type: 'states', items: [] },
  universities: { name: 'Universities', type: 'universities', items: [] },
  emails: { name: 'Complete Mails', type: 'emails', items: [] },
})

let categoriesCache = null

const readLocalCategories = () => {
  try {
    const categories = localStorage.getItem(CATEGORIES_KEY)
    return categories ? JSON.parse(categories) : null
  } catch (error) {
    console.error('Error loading categories from localStorage:', error)
    return null
  }
}

const saveLocalCategories = (categories) => {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
    return true
  } catch (error) {
    console.error('Error saving categories:', error)
    return false
  }
}

const ensureDefaults = (categories) => {
  const merged = { ...getDefaultCategories(), ...(categories || {}) }
  return merged
}

export const categoryService = {
  getDefaultCategories,

  getAll() {
    if (categoriesCache) {
      return categoriesCache
    }
    categoriesCache = ensureDefaults(readLocalCategories())
    return categoriesCache
  },

  async loadFromServer() {
    const serverCategories = await apiService.getCategories()
    categoriesCache = ensureDefaults(serverCategories)
    saveLocalCategories(categoriesCache)
    return categoriesCache
  },

  async initialize() {
    this.getAll()
    try {
      await this.loadFromServer()
    } catch (error) {
      console.warn('Category server sync failed, using local cache:', error.message)
    }
    return this.getAll()
  },

  async addCategory(categoryName, categoryType = 'custom') {
    const result = await apiService.createCategory(categoryName, categoryType)
    const categories = { ...this.getAll() }
    categories[result.id] = result.category
    categoriesCache = ensureDefaults(categories)
    saveLocalCategories(categoriesCache)
    return result.id
  },

  async renameCategory(categoryId, newName) {
    await apiService.renameCategory(categoryId, newName)
    const categories = { ...this.getAll() }
    if (categories[categoryId]) {
      categories[categoryId].name = newName
      categories[categoryId].updatedAt = new Date().toISOString()
      categoriesCache = categories
      saveLocalCategories(categoriesCache)
    }
    return true
  },

  async deleteCategory(categoryId) {
    if (['default', 'states', 'universities', 'emails'].includes(categoryId)) {
      return false
    }
    await apiService.deleteCategory(categoryId)
    const categories = { ...this.getAll() }
    delete categories[categoryId]
    categoriesCache = categories
    saveLocalCategories(categoriesCache)
    return true
  },

  getCategory(categoryId) {
    const categories = this.getAll()
    return categories[categoryId] || null
  },
}





