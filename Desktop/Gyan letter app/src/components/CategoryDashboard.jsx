import { useMemo } from 'react'
import { Folder, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import { categoryService } from '../services/categoryService'

const buildStatsFromRecords = (records) => {
  const stats = {}
  const categories = categoryService.getAll()

  Object.keys(categories).forEach(catId => {
    const cat = categories[catId]
    stats[catId] = {
      id: catId,
      name: cat.name,
      type: cat.type,
      totalRecords: 0,
      items: {}
    }
  })

  records.forEach(record => {
    const categoryId = record._categoryId
    const categoryName = record._categoryName
    const selectedItem = record._selectedItem

    if (categoryId) {
      if (!stats[categoryId]) {
        stats[categoryId] = {
          id: categoryId,
          name: categoryName || 'Unknown Category',
          type: 'custom',
          totalRecords: 0,
          items: {}
        }
      }

      stats[categoryId].totalRecords++

      if (selectedItem) {
        if (!stats[categoryId].items[selectedItem]) {
          stats[categoryId].items[selectedItem] = 0
        }
        stats[categoryId].items[selectedItem]++
      }
    }
  })

  const uncategorizedCount = records.filter(r => !r._categoryId).length

  return {
    categories: Object.values(stats).filter(cat => cat.totalRecords > 0),
    uncategorized: uncategorizedCount,
    total: records.length
  }
}

const buildStatsFromOverview = (overviewStats) => {
  const stats = {}
  const categories = categoryService.getAll()

  Object.keys(categories).forEach(catId => {
    const cat = categories[catId]
    stats[catId] = {
      id: catId,
      name: cat.name,
      type: cat.type,
      totalRecords: 0,
      items: overviewStats.itemsByCategory?.[catId] || {}
    }
  })

  for (const row of overviewStats.byCategory || []) {
    const categoryId = row.categoryId
    if (!categoryId) continue

    if (!stats[categoryId]) {
      stats[categoryId] = {
        id: categoryId,
        name: row.categoryName || 'Unknown Category',
        type: 'custom',
        totalRecords: 0,
        items: overviewStats.itemsByCategory?.[categoryId] || {}
      }
    }

    stats[categoryId].totalRecords = row.count
    if (!stats[categoryId].name && row.categoryName) {
      stats[categoryId].name = row.categoryName
    }
    if (!stats[categoryId].items || Object.keys(stats[categoryId].items).length === 0) {
      stats[categoryId].items = overviewStats.itemsByCategory?.[categoryId] || {}
    }
  }

  return {
    categories: Object.values(stats).filter(cat => cat.totalRecords > 0),
    uncategorized: overviewStats.uncategorized || 0,
    total: overviewStats.total || 0
  }
}

export default function CategoryDashboard({ records = [], overviewStats, onCategorySelect }) {
  const categoryStats = useMemo(() => {
    if (overviewStats) {
      return buildStatsFromOverview(overviewStats)
    }
    return buildStatsFromRecords(records)
  }, [records, overviewStats])

  const handleCategoryClick = (categoryId) => {
    onCategorySelect?.(categoryId)
  }

  if (categoryStats.total === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Data Overview</h3>
        <p className="text-gray-600">Click on any category to view its records</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Records</p>
              <p className="text-3xl font-bold mt-1">{categoryStats.total}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Categories</p>
              <p className="text-3xl font-bold mt-1">{categoryStats.categories.length}</p>
            </div>
            <Folder className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Uncategorized</p>
              <p className="text-3xl font-bold mt-1">{categoryStats.uncategorized}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Category Cards */}
      {categoryStats.categories.length > 0 && (
        <div>
          <h4 className="text-xl font-semibold text-gray-700 mb-4">Categories</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.categories.map(category => {
              const itemCount = Object.keys(category.items).length
              const topItems = Object.entries(category.items)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
              
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600">
                        {category.name}
                      </h5>
                      <p className="text-3xl font-bold text-blue-600">{category.totalRecords}</p>
                      <p className="text-sm text-gray-500 mt-1">records</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Item Breakdown */}
                  {itemCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">
                        Top {Math.min(3, itemCount)} {category.type === 'states' ? 'states' : category.type === 'universities' ? 'universities' : 'items'}
                      </p>
                      <div className="space-y-1">
                        {topItems.map(([item, count]) => (
                          <div key={item} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 truncate flex-1">{item}</span>
                            <span className="text-blue-600 font-semibold ml-2">{count}</span>
                          </div>
                        ))}
                        {itemCount > 3 && (
                          <p className="text-xs text-gray-400 mt-1">
                            +{itemCount - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(category.totalRecords / categoryStats.total) * 100}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {((category.totalRecords / categoryStats.total) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Uncategorized Records */}
      {categoryStats.uncategorized > 0 && (
        <div className="mt-6">
          <div
            onClick={() => onCategorySelect?.('_uncategorized')}
            className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-lg font-bold text-gray-700 mb-1 group-hover:text-blue-600">
                  Uncategorized Records
                </h5>
                <p className="text-2xl font-bold text-gray-600">{categoryStats.uncategorized}</p>
                <p className="text-sm text-gray-500 mt-1">records without category</p>
                <p className="text-xs text-blue-600 mt-2 group-hover:underline">
                  Click to view these records
                </p>
              </div>
              <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





