import { apiService } from './api'

const CATEGORIES_KEY = 'data_categories'

const getDefaultCategories = () => ({
  default: { name: 'Default', type: 'default', items: [] },
  states: { name: 'Indian States', type: 'states', items: [] },
  universities: { name: 'Universities', type: 'universities', items: [] },
  emails: { name: 'Complete Mails', type: 'emails', items: [] },
})

let categoriesCache = null

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
    categoriesCache = getDefaultCategories()
    return categoriesCache
  },

  async loadFromServer() {
    const serverCategories = await apiService.getCategories()
    categoriesCache = ensureDefaults(serverCategories)
    saveLocalCategories(categoriesCache)
    return categoriesCache
  },

  async initialize() {
    if (!categoriesCache) {
      categoriesCache = getDefaultCategories()
    }
    try {
      await this.loadFromServer()
    } catch (error) {
      // Never hydrate custom categories from browser-local storage.
      // Shared backend is the source of truth for cross-system consistency.
      console.warn('Category server sync failed, using defaults only:', error.message)
      categoriesCache = getDefaultCategories()
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





