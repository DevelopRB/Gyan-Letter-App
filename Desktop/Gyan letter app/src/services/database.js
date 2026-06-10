// Database service using PostgreSQL API
import { apiService } from './api.js'

// Transform API response to match expected format
const transformRecord = (apiRecord) => {
  return {
    id: apiRecord.id.toString(),
    ...apiRecord.data,
    createdAt: apiRecord.created_at,
    updatedAt: apiRecord.updated_at
  }
}

export const databaseService = {
  // Get paginated records
  async getPaginated({ search = '', page = 1, limit = 100, categoryId = '' } = {}) {
    try {
      const result = await apiService.getRecordsPage({ search, page, limit, categoryId })
      return {
        ...result,
        records: (result.records || []).map(transformRecord)
      }
    } catch (error) {
      console.error('Error fetching paginated records:', error)
      throw error
    }
  },

  // Fetch all records for a single category (paginated server-side)
  async getAllForCategory(categoryId, search = '') {
    const limit = 500
    let page = 1
    let totalPages = 1
    const allRecords = []

    do {
      const result = await this.getPaginated({ categoryId, search, page, limit })
      allRecords.push(...(result.records || []))
      totalPages = result.totalPages || 1
      page += 1
    } while (page <= totalPages)

    return allRecords
  },

  // Get aggregated overview stats
  async getStats() {
    try {
      return await apiService.getRecordStats()
    } catch (error) {
      console.error('Error fetching record stats:', error)
      throw error
    }
  },

  // Get all records
  async getAll() {
    try {
      const records = await apiService.getAll()
      return records.map(transformRecord)
    } catch (error) {
      console.error('Error fetching records:', error)
      throw error
    }
  },

  // Get a single record by ID
  async getById(id) {
    try {
      const record = await apiService.getById(id)
      return transformRecord(record)
    } catch (error) {
      console.error('Error fetching record:', error)
      throw error
    }
  },

  // Add a new record
  async add(record) {
    try {
      const result = await apiService.create(record)
      return transformRecord(result)
    } catch (error) {
      console.error('Error creating record:', error)
      throw error
    }
  },

  // Update an existing record
  async update(id, updates) {
    try {
      // First get the existing record to merge updates
      const existing = await this.getById(id)
      const { id: _, createdAt, updatedAt, ...existingData } = existing
      const updatedData = { ...existingData, ...updates }
      
      const result = await apiService.update(id, updatedData)
      return transformRecord(result)
    } catch (error) {
      console.error('Error updating record:', error)
      throw error
    }
  },

  // Delete a record
  async delete(id) {
    try {
      await apiService.delete(id)
      return true
    } catch (error) {
      console.error('Error deleting record:', error)
      throw error
    }
  },

  // Search records
  async search(query) {
    try {
      const result = await this.getPaginated({ search: query, page: 1, limit: 100 })
      return result.records
    } catch (error) {
      console.error('Error searching records:', error)
      throw error
    }
  },

  // Get field names from all records (for template variables)
  async getFieldNames() {
    try {
      const records = await this.getAll()
      if (records.length === 0) return []
      
      const fieldNames = new Set()
      records.forEach(record => {
        Object.keys(record).forEach(key => {
          if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
            fieldNames.add(key)
          }
        })
      })
      return Array.from(fieldNames)
    } catch (error) {
      console.error('Error getting field names:', error)
      return []
    }
  },

  // Bulk add records (for Excel import)
  async bulkAdd(records) {
    try {
      const result = await apiService.bulkCreate(records)
      return result
    } catch (error) {
      console.error('Error bulk adding records:', error)
      throw error
    }
  },

  // Bulk update records by Unique ID
  async bulkUpdate(records) {
    try {
      const result = await apiService.bulkUpdate(records)
      return result
    } catch (error) {
      console.error('Error bulk updating records:', error)
      throw error
    }
  }
}
