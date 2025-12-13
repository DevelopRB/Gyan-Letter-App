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

export const apiService = {
  // Get all records
  async getAll(search = '') {
    const url = search 
      ? `${API_BASE_URL}/records?search=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/records`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch records')
    }
    return response.json()
  },

  // Get a single record
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/records/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch record')
    }
    return response.json()
  },

  // Create a new record
  async create(data) {
    const response = await fetch(`${API_BASE_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
}

