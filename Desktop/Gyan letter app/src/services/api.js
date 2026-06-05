// API service for frontend to communicate with backend
// Automatically detect API URL based on environment
const getApiBaseUrl = () => {
  // If VITE_API_URL is set (for Render or custom deployments), use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL + '/api'
  }
  // In production without VITE_API_URL (Vercel), use the same origin
  if (import.meta.env.PROD) {
    return window.location.origin + '/api'
  }
  // In development, use localhost
  return 'http://localhost:5000/api'
}

const API_BASE_URL = getApiBaseUrl()

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// Helper function to get headers with auth token
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  }
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export const apiService = {
  // Get paginated records
  async getRecordsPage({ search = '', page = 1, limit = 100, categoryId = '' } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (search) params.set('search', search)
    if (categoryId) params.set('categoryId', categoryId)
    const url = `${API_BASE_URL}/records?${params.toString()}`
    
    const response = await fetch(url, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to fetch records')
    }
    return response.json()
  },

  // Backward compatible all-records fetch (legacy screens)
  async getAll(search = '') {
    const limit = 500
    let page = 1
    let totalPages = 1
    const allRecords = []

    do {
      const result = await this.getRecordsPage({ search, page, limit })
      allRecords.push(...(result.records || []))
      totalPages = result.totalPages || 1
      page += 1
    } while (page <= totalPages)

    return allRecords
  },

  // Get a single record
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/records/${id}`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to fetch record')
    }
    return response.json()
  },

  // Create a new record
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/records`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ data }),
    })
    if (!response.ok) {
      throw new Error('Failed to create record')
    }
    return response.json()
  },

  // Bulk create records
  async bulkCreate(records) {
    try {
      const response = await fetch(`${API_BASE_URL}/records/bulk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ records }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }
      return response.json()
    } catch (error) {
      if (error.message) {
        throw error
      }
      throw new Error(`Network error: ${error.message}`)
    }
  },

  // Bulk update records by Unique ID
  async bulkUpdate(records) {
    try {
      const response = await fetch(`${API_BASE_URL}/records/bulk-update`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ records }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }
      return response.json()
    } catch (error) {
      if (error.message) {
        throw error
      }
      throw new Error(`Network error: ${error.message}`)
    }
  },

  // Update a record
  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/records/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ data }),
    })
    if (!response.ok) {
      throw new Error('Failed to update record')
    }
    return response.json()
  },

  // Delete a record
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/records/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to delete record')
    }
    return response.json()
  },

  // Delete all records
  async deleteAll() {
    const response = await fetch(`${API_BASE_URL}/records`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to delete all records')
    }
    return response.json()
  },

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.json()
  },

  // Categories
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }
    return response.json()
  },

  async createCategory(name, type = 'custom') {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, type }),
    })
    if (!response.ok) {
      throw new Error('Failed to create category')
    }
    return response.json()
  },

  async renameCategory(categoryId, name) {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    })
    if (!response.ok) {
      throw new Error('Failed to rename category')
    }
    return response.json()
  },

  async deleteCategory(categoryId) {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to delete category')
    }
    return response.json()
  },
}

