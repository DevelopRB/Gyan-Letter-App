// API service for frontend to communicate with backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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
    const response = await fetch(`${API_BASE_URL}/records/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to bulk create records')
    }
    return response.json()
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















