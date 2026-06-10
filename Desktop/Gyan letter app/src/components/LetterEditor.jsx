import { useState, useEffect, useRef } from 'react'
import SimpleLetterEditor from './SimpleLetterEditor'
import { Printer, Mail, Save, FileText, User, Download, BookOpen, X, Filter, Plus, CheckSquare, Square, AlertCircle, Loader2, Eye, CheckCircle, Image as ImageIcon } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { databaseService } from '../services/database'
import { categoryService } from '../services/categoryService'
import CategorySelector from './CategorySelector'

export default function LetterEditor() {
  const [content, setContent] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [records, setRecords] = useState([])
  const [subject, setSubject] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [letterFormat, setLetterFormat] = useState('email') // 'email' or 'letter'
  const [savedTemplates, setSavedTemplates] = useState([])
  const [templateName, setTemplateName] = useState('')
  const [savedDrafts, setSavedDrafts] = useState([])
  const [draftName, setDraftName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedCategoryData, setSelectedCategoryData] = useState(null)
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [filterGroups, setFilterGroups] = useState([
    {
      id: 1,
      logic: 'AND',
      conditions: [{
        id: 1,
        field: '',
        operator: 'contains',
        value: '',
        valueList: []
      }]
    }
  ])
  const [globalSearch, setGlobalSearch] = useState('')
  const [allRecords, setAllRecords] = useState([]) // Category records loaded from server
  const [categoryTotalRecords, setCategoryTotalRecords] = useState(0)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [approvedRecords, setApprovedRecords] = useState([]) // Records approved for letter generation
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewRecords, setPreviewRecords] = useState([])
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [templateConfirmed, setTemplateConfirmed] = useState(false)
  const [confirmedTemplate, setConfirmedTemplate] = useState({ content: '', subject: '', toEmail: '' })
  const printRef = useRef(null)
  

  useEffect(() => {
    const initializeEditor = async () => {
      await categoryService.initialize()
      await loadRecords()
      loadTemplates()
      loadDrafts()
    }
    initializeEditor()
  }, [])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (content.trim() || subject.trim() || toEmail.trim()) {
        try {
          const drafts = JSON.parse(localStorage.getItem('letter_drafts') || '[]')
          const autoDraft = {
            id: 'auto_save',
            name: 'Auto-saved Draft',
            content,
            subject,
            toEmail,
            format: letterFormat,
            categoryId: selectedCategory,
            categoryName: selectedCategoryData?.name,
            updatedAt: new Date().toISOString()
          }
          
          const existingIndex = drafts.findIndex(d => d.id === 'auto_save')
          if (existingIndex >= 0) {
            drafts[existingIndex] = autoDraft
          } else {
            drafts.push(autoDraft)
          }
          
          localStorage.setItem('letter_drafts', JSON.stringify(drafts))
          setSavedDrafts(drafts)
        } catch (error) {
          console.error('Error auto-saving draft:', error)
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [content, subject, toEmail, letterFormat, selectedCategory, selectedCategoryData?.name])

  // Operator definitions
  const OPERATORS = {
    text: [
      { value: 'equals', label: 'Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'startsWith', label: 'Starts With' },
      { value: 'endsWith', label: 'Ends With' },
      { value: 'inList', label: 'In List (multi-select)' }
    ],
    number: [
      { value: 'equals', label: 'Equals' },
      { value: 'greaterThan', label: 'Greater Than' },
      { value: 'lessThan', label: 'Less Than' },
      { value: 'greaterThanOrEqual', label: 'Greater Than Or Equal' },
      { value: 'lessThanOrEqual', label: 'Less Than Or Equal' },
      { value: 'between', label: 'Between' }
    ]
  }

  // Get field type (text or number)
  const getFieldType = (fieldName) => {
    const numberFields = ['Year Established', 'Experience (Years)', 'Postal Code']
    const lowerField = fieldName.toLowerCase()
    if (numberFields.some(nf => lowerField.includes(nf.toLowerCase()))) {
      return 'number'
    }
    return 'text'
  }

  // Check if condition matches record
  const conditionMatches = (record, condition) => {
    if (!condition.field || !condition.operator) return true

    const fieldValue = record[condition.field]
    const recordValue = fieldValue !== null && fieldValue !== undefined ? String(fieldValue).trim() : ''
    const conditionValue = String(condition.value || '').trim().toLowerCase()
    const fieldType = getFieldType(condition.field)

    switch (condition.operator) {
      case 'equals':
        return recordValue.toLowerCase() === conditionValue
      
      case 'contains':
        return recordValue.toLowerCase().includes(conditionValue)
      
      case 'startsWith':
        return recordValue.toLowerCase().startsWith(conditionValue)
      
      case 'endsWith':
        return recordValue.toLowerCase().endsWith(conditionValue)
      
      case 'inList':
        if (condition.valueList && condition.valueList.length > 0) {
          return condition.valueList.some(val => 
            recordValue.toLowerCase() === String(val).trim().toLowerCase()
          )
        }
        return true
      
      case 'greaterThan':
        const numValue1 = parseFloat(recordValue)
        const numCondition1 = parseFloat(condition.value)
        return !isNaN(numValue1) && !isNaN(numCondition1) && numValue1 > numCondition1
      
      case 'lessThan':
        const numValue2 = parseFloat(recordValue)
        const numCondition2 = parseFloat(condition.value)
        return !isNaN(numValue2) && !isNaN(numCondition2) && numValue2 < numCondition2
      
      case 'greaterThanOrEqual':
        const numValue3 = parseFloat(recordValue)
        const numCondition3 = parseFloat(condition.value)
        return !isNaN(numValue3) && !isNaN(numCondition3) && numValue3 >= numCondition3
      
      case 'lessThanOrEqual':
        const numValue4 = parseFloat(recordValue)
        const numCondition4 = parseFloat(condition.value)
        return !isNaN(numValue4) && !isNaN(numCondition4) && numValue4 <= numCondition4
      
      case 'between':
        const numValue5 = parseFloat(recordValue)
        const numMin = parseFloat(condition.value)
        const numMax = parseFloat(condition.value2 || condition.value)
        return !isNaN(numValue5) && !isNaN(numMin) && !isNaN(numMax) && 
               numValue5 >= numMin && numValue5 <= numMax
      
      default:
        return true
    }
  }

  // Check if group matches record
  const groupMatches = (record, group) => {
    if (!group.conditions || group.conditions.length === 0) return true

    const results = group.conditions.map(condition => conditionMatches(record, condition))
    
    if (group.logic === 'AND') {
      return results.every(r => r === true)
    } else { // OR
      return results.some(r => r === true)
    }
  }

  // Get filtered records for letter personalization
  const getFilteredRecords = () => {
    let result = [...allRecords]

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      result = result.filter(record => {
        const recordCategoryId = record._categoryId
        return recordCategoryId && selectedCategories.includes(recordCategoryId)
      })
    } else if (selectedCategory) {
      // If no categories selected in filter but category is selected, use that
      result = result.filter(record => {
        const recordCategoryId = record._categoryId
        if (!recordCategoryId) return false
        return recordCategoryId === selectedCategory
      })
    }

    // Apply global search across multiple columns
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase()
      const searchColumns = [
        'Organization Name', 'Full Name', 'Department', 'Subjects Taught',
        'Specialization', 'Research Area', 'City / Campus', 'District', 'State / UT'
      ]
      
      result = result.filter(record => {
        return searchColumns.some(col => {
          const value = String(record[col] || '').toLowerCase()
          return value.includes(searchLower)
        })
      })
    }

    // Apply filter groups (AND between groups, AND/OR within groups)
    if (filterGroups.length > 0 && filterGroups.some(g => g.conditions.some(c => c.field))) {
      result = result.filter(record => {
        // All groups must match (AND logic between groups)
        return filterGroups.every(group => groupMatches(record, group))
      })
    }

    return result
  }

  const extractFieldNamesFromRecords = (recordsList) => {
    const fieldNamesSet = new Set()
    recordsList.forEach(record => {
      Object.keys(record).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && !key.startsWith('_')) {
          fieldNamesSet.add(key)
        }
      })
    })
    return Array.from(fieldNamesSet)
  }

  const loadRecords = async ({ fetchAll = false } = {}) => {
    if (!selectedCategory && selectedCategories.length === 0) {
      setAllRecords([])
      setRecords([])
      setCategoryTotalRecords(0)
      setFieldNames([])
      return []
    }

    setRecordsLoading(true)
    try {
      let data = []
      let total = 0

      if (selectedCategories.length > 0) {
        const categoryIds = [...selectedCategories]
        const results = await Promise.all(
          categoryIds.map((categoryId) =>
            fetchAll
              ? databaseService.getAllForCategory(categoryId, globalSearch.trim())
              : databaseService.getPaginated({
                  categoryId,
                  page: 1,
                  limit: 500,
                  search: globalSearch.trim()
                }).then((response) => {
                  total += response.total || 0
                  return response.records || []
                })
          )
        )
        data = results.flat()
        total = fetchAll ? data.length : total || data.length
      } else if (selectedCategory) {
        if (fetchAll) {
          data = await databaseService.getAllForCategory(selectedCategory, globalSearch.trim())
          total = data.length
        } else {
          const response = await databaseService.getPaginated({
            categoryId: selectedCategory,
            page: 1,
            limit: 500,
            search: globalSearch.trim()
          })
          data = response.records || []
          total = response.total || data.length
        }
      }

      setAllRecords(data)
      setCategoryTotalRecords(total)
      applyFiltersToRecords(data)
      setFieldNames(extractFieldNamesFromRecords(data))
      return data
    } catch (error) {
      console.error('Error loading records:', error)
      setAllRecords([])
      setRecords([])
      setCategoryTotalRecords(0)
      setFieldNames([])
      return []
    } finally {
      setRecordsLoading(false)
    }
  }

  const applyFiltersToRecords = (dataToFilter = allRecords) => {
    let result = [...dataToFilter]

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      result = result.filter(record => {
        const recordCategoryId = record._categoryId
        return recordCategoryId && selectedCategories.includes(recordCategoryId)
      })
    } else if (selectedCategory) {
      // If no categories selected in filter but category is selected, use that
      result = result.filter(record => {
        const recordCategoryId = record._categoryId
        if (!recordCategoryId) return false
        return recordCategoryId === selectedCategory
      })
    }

    // Apply global search across multiple columns
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase()
      const searchColumns = [
        'Organization Name', 'Full Name', 'Department', 'Subjects Taught',
        'Specialization', 'Research Area', 'City / Campus', 'District', 'State / UT'
      ]
      
      result = result.filter(record => {
        return searchColumns.some(col => {
          const value = String(record[col] || '').toLowerCase()
          return value.includes(searchLower)
        })
      })
    }

    // Apply filter groups (AND between groups, AND/OR within groups)
    if (filterGroups.length > 0 && filterGroups.some(g => g.conditions.some(c => c.field))) {
      result = result.filter(record => {
        // All groups must match (AND logic between groups)
        return filterGroups.every(group => groupMatches(record, group))
      })
    }

    setRecords(result)
  }

  useEffect(() => {
    loadRecords()
  }, [selectedCategory, selectedCategories, globalSearch])

  useEffect(() => {
    if (allRecords.length > 0) {
      applyFiltersToRecords()
    }
  }, [filterGroups])

  const loadTemplates = () => {
    try {
      const templates = localStorage.getItem('letter_templates')
      setSavedTemplates(templates ? JSON.parse(templates) : [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadDrafts = () => {
    try {
      const drafts = localStorage.getItem('letter_drafts')
      setSavedDrafts(drafts ? JSON.parse(drafts) : [])
    } catch (error) {
      console.error('Error loading drafts:', error)
    }
  }

  const autoSaveDraft = () => {
    try {
      const drafts = savedDrafts || []
      const autoDraft = {
        id: 'auto_save',
        name: 'Auto-saved Draft',
        content,
        subject,
        toEmail,
        format: letterFormat,
        categoryId: selectedCategory,
        categoryName: selectedCategoryData?.name,
        updatedAt: new Date().toISOString()
      }
      
      const existingIndex = drafts.findIndex(d => d.id === 'auto_save')
      if (existingIndex >= 0) {
        drafts[existingIndex] = autoDraft
      } else {
        drafts.push(autoDraft)
      }
      
      localStorage.setItem('letter_drafts', JSON.stringify(drafts))
      setSavedDrafts(drafts)
    } catch (error) {
      console.error('Error auto-saving draft:', error)
    }
  }

  const saveDraft = () => {
    if (!draftName.trim()) {
      alert('Please enter a draft name')
      return
    }
    
    try {
      const drafts = savedDrafts || []
      const newDraft = {
        id: Date.now().toString(),
        name: draftName.trim(),
        content,
        subject,
        toEmail,
        format: letterFormat,
        categoryId: selectedCategory,
        categoryName: selectedCategoryData?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      drafts.push(newDraft)
      localStorage.setItem('letter_drafts', JSON.stringify(drafts))
      setSavedDrafts(drafts)
      setDraftName('')
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft')
    }
  }

  const loadDraft = (draft) => {
    setContent(draft.content || '')
    setSubject(draft.subject || '')
    setToEmail(draft.toEmail || '')
    setLetterFormat(draft.format || 'email')
    setSelectedCategory(draft.categoryId || null)
    if (draft.categoryId) {
      const categories = categoryService.getAll()
      setSelectedCategoryData(categories[draft.categoryId] || null)
    }
  }

  const deleteDraft = (draftId) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        const drafts = savedDrafts.filter(d => d.id !== draftId)
        localStorage.setItem('letter_drafts', JSON.stringify(drafts))
        setSavedDrafts(drafts)
      } catch (error) {
        console.error('Error deleting draft:', error)
      }
    }
  }

  const saveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }
    
    const templates = savedTemplates || []
    const newTemplate = {
      id: Date.now().toString(),
      name: templateName,
      content,
      subject,
      format: letterFormat,
      createdAt: new Date().toISOString()
    }
    
    templates.push(newTemplate)
    localStorage.setItem('letter_templates', JSON.stringify(templates))
    setSavedTemplates(templates)
    setTemplateName('')
    alert('Template saved successfully!')
  }

  const loadTemplate = (template) => {
    setContent(template.content)
    setSubject(template.subject || '')
    setLetterFormat(template.format || 'email')
  }

  const insertVariable = (variable) => {
    const variableText = `{{${variable}}}`
    const editor = document.querySelector('[contenteditable="true"]')
    
    if (editor) {
      editor.focus()
      const selection = window.getSelection()
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange()
      
      if (selection.rangeCount === 0) {
        range.selectNodeContents(editor)
        range.collapse(false)
      }
      
      range.deleteContents()
      const textNode = document.createTextNode(variableText + ' ')
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      setContent(editor.innerHTML)
    } else {
      // Fallback: append to content
      setContent(prev => {
        const newContent = prev ? prev + ' ' + variableText + ' ' : variableText + ' '
        return newContent
      })
      alert('Please click in the editor first, then click the variable button again.')
    }
  }

  // Replace variables in content with record values
  const replaceVariables = (text, record) => {
    if (!text || !record) return text
    
    let result = text
    // Replace {{fieldName}} with actual values
    Object.keys(record).forEach(key => {
      if (!key.startsWith('_')) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        const value = record[key] || ''
        result = result.replace(regex, String(value))
      }
    })
    return result
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const record = selectedRecord || {}
    const processedContent = replaceVariables(content, record)
    const processedSubject = replaceVariables(subject, record)
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${processedSubject || 'Letter'}</title>
          <style>
            @media print {
              @page {
                margin: 2cm;
              }
            }
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .letter-header {
              margin-bottom: 30px;
            }
            .letter-date {
              text-align: right;
              margin-bottom: 20px;
            }
            .letter-content {
              margin-bottom: 30px;
            }
            .letter-signature {
              margin-top: 50px;
            }
          </style>
        </head>
        <body>
          ${letterFormat === 'letter' ? `
            <div class="letter-header">
              <div class="letter-date">${new Date().toLocaleDateString()}</div>
            </div>
          ` : ''}
          <div class="letter-content">
            ${processedContent}
          </div>
          ${letterFormat === 'letter' ? `
            <div class="letter-signature">
              <p>Sincerely,</p>
              <br><br>
              <p>_________________</p>
            </div>
          ` : ''}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleEmailPreview = () => {
    const record = selectedRecord || {}
    const processedContent = replaceVariables(content, record)
    const processedSubject = replaceVariables(subject, record)
    const processedToEmail = replaceVariables(toEmail, record)
    
    const mailtoLink = `mailto:${processedToEmail}?subject=${encodeURIComponent(processedSubject)}&body=${encodeURIComponent(processedContent.replace(/<[^>]*>/g, ''))}`
    window.location.href = mailtoLink
  }

  const exportToHTML = () => {
    const record = selectedRecord || {}
    const processedContent = replaceVariables(content, record)
    const processedSubject = replaceVariables(subject, record)
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${processedSubject || 'Letter'}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
  </style>
</head>
<body>
  ${processedContent}
</body>
</html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${processedSubject || 'letter'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const [fieldNames, setFieldNames] = useState([])

  // Get unique values for filter dropdowns
  const getUniqueValues = (fieldName) => {
    const values = new Set()
    allRecords.forEach(record => {
      const value = record[fieldName]
      if (value && String(value).trim()) {
        values.add(String(value).trim())
      }
    })
    return Array.from(values).sort()
  }

  // Get all field names
  const getAllFieldNames = () => {
    const allFields = new Set()
    allRecords.forEach(record => {
      Object.keys(record).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && !key.startsWith('_')) {
          allFields.add(key)
        }
      })
    })
    return Array.from(allFields)
  }

  // Filter group management functions
  const addFilterGroup = () => {
    const newGroup = {
      id: Date.now(),
      logic: 'AND',
      conditions: [{
        id: Date.now(),
        field: '',
        operator: 'contains',
        value: '',
        valueList: []
      }]
    }
    setFilterGroups([...filterGroups, newGroup])
  }

  const removeFilterGroup = (groupId) => {
    if (filterGroups.length > 1) {
      setFilterGroups(filterGroups.filter(g => g.id !== groupId))
    }
  }

  const updateGroupLogic = (groupId, logic) => {
    setFilterGroups(filterGroups.map(g => 
      g.id === groupId ? { ...g, logic } : g
    ))
  }

  const addCondition = (groupId) => {
    setFilterGroups(filterGroups.map(g => 
      g.id === groupId 
        ? { ...g, conditions: [...g.conditions, { id: Date.now(), field: '', operator: 'contains', value: '', valueList: [] }] }
        : g
    ))
  }

  const removeCondition = (groupId, conditionId) => {
    setFilterGroups(filterGroups.map(g => 
      g.id === groupId 
        ? { ...g, conditions: g.conditions.filter(c => c.id !== conditionId) }
        : g
    ))
  }

  const updateCondition = (groupId, conditionId, updates) => {
    setFilterGroups(filterGroups.map(g => 
      g.id === groupId 
        ? {
            ...g,
            conditions: g.conditions.map(c => 
              c.id === conditionId ? { ...c, ...updates } : c
            )
          }
        : g
    ))
  }

  // Open advanced filter modal
  const openAdvancedFilter = () => {
    setShowAdvancedFilter(true)
  }

  // Close advanced filter modal
  const closeAdvancedFilter = () => {
    setShowAdvancedFilter(false)
  }

  // Show preview of filtered records
  const showPreview = async () => {
    let sourceRecords = allRecords
    if (allRecords.length < categoryTotalRecords) {
      sourceRecords = await loadRecords({ fetchAll: true })
    }

    // Get current filtered records
    let result = [...sourceRecords]

    // Apply filters
    if (selectedCategories.length > 0) {
      result = result.filter(record => {
        const recordCategoryId = record._categoryId
        return recordCategoryId && selectedCategories.includes(recordCategoryId)
      })
    } else if (selectedCategory) {
      result = result.filter(record => {
        const recordCategoryId = record._categoryId
        if (!recordCategoryId) return false
        return recordCategoryId === selectedCategory
      })
    }

    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase()
      const searchColumns = [
        'Organization Name', 'Full Name', 'Department', 'Subjects Taught',
        'Specialization', 'Research Area', 'City / Campus', 'District', 'State / UT'
      ]
      result = result.filter(record => {
        return searchColumns.some(col => {
          const value = String(record[col] || '').toLowerCase()
          return value.includes(searchLower)
        })
      })
    }

    if (filterGroups.length > 0 && filterGroups.some(g => g.conditions.some(c => c.field))) {
      result = result.filter(record => {
        return filterGroups.every(group => groupMatches(record, group))
      })
    }

    setPreviewRecords(result)
    setShowPreviewModal(true)
    setShowAdvancedFilter(false)
  }

  // Approve filtered records for letter generation
  const approveRecords = () => {
    setApprovedRecords([...previewRecords])
    setShowPreviewModal(false)
    // Update records to approved ones
    setRecords([...previewRecords])
    // Reset template confirmation when new records are approved
    setTemplateConfirmed(false)
    setConfirmedTemplate({ content: '', subject: '', toEmail: '' })
    alert(`✅ Approved ${previewRecords.length} records for letter generation.\n\nNow you can edit your letter template and add personalized fields.`)
  }

  // Confirm template before PDF generation
  const confirmTemplate = () => {
    if (!content.trim()) {
      alert('Please create a letter template first.')
      return
    }
    
    setConfirmedTemplate({
      content: content,
      subject: subject,
      toEmail: toEmail
    })
    setTemplateConfirmed(true)
    alert('✅ Template confirmed! You can now generate PDFs for all approved records.')
  }

  // Edit template (allows changes after confirmation)
  const editTemplate = () => {
    setTemplateConfirmed(false)
  }

  // Apply filters button
  const applyFilters = () => {
    applyFiltersToRecords()
    setShowAdvancedFilter(false)
  }

  // Generate PDF for all approved records
  const generatePDFsForAllRecords = async () => {
    if (approvedRecords.length === 0) {
      alert('No approved records. Please filter and approve records first.')
      return
    }

    if (!templateConfirmed) {
      alert('Please confirm your template first before generating PDFs.')
      return
    }

    // Use confirmed template for PDF generation
    const templateToUse = confirmedTemplate.content || content
    const subjectToUse = confirmedTemplate.subject || subject
    const emailToUse = confirmedTemplate.toEmail || toEmail

    setGeneratingPDF(true)

    try {
      for (let i = 0; i < approvedRecords.length; i++) {
        const record = approvedRecords[i]
        
        // Replace variables in content using confirmed template
        const processedContent = replaceVariables(templateToUse, record)
        const processedSubject = replaceVariables(subjectToUse, record)
        const processedEmail = replaceVariables(emailToUse, record)

        // Create a temporary div for PDF generation
        const tempDiv = document.createElement('div')
        tempDiv.style.width = '210mm' // A4 width
        tempDiv.style.padding = '15mm'
        tempDiv.style.fontFamily = 'Arial, sans-serif'
        tempDiv.style.fontSize = '11pt'
        tempDiv.style.lineHeight = '1.5'
        tempDiv.style.color = '#000'
        tempDiv.style.backgroundColor = '#fff'
        tempDiv.style.position = 'absolute'
        tempDiv.style.left = '-9999px'
        tempDiv.style.top = '0'
        tempDiv.style.maxHeight = '267mm' // A4 height minus padding (297 - 15*2)
        tempDiv.style.overflow = 'hidden'
        
        // Build HTML content with proper styling for single page
        let htmlContent = `
          <div style="max-width: 100%; max-height: 267mm; overflow: hidden; word-wrap: break-word;">
            ${letterFormat === 'email' ? `
              <div style="margin-bottom: 15px; font-size: 10pt;">
                <div style="margin-bottom: 5px;"><strong>To:</strong> ${processedEmail || 'N/A'}</div>
                <div><strong>Subject:</strong> ${processedSubject || 'No Subject'}</div>
              </div>
            ` : ''}
            <div style="max-height: ${letterFormat === 'email' ? '240mm' : '267mm'}; overflow: hidden;">
              ${processedContent}
            </div>
          </div>
        `
        
        tempDiv.innerHTML = htmlContent
        document.body.appendChild(tempDiv)

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 500))

        // Convert to canvas then PDF with single page constraint
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: tempDiv.offsetWidth,
          height: Math.min(tempDiv.scrollHeight, 267 * 3.779527559), // Max height in pixels (267mm)
          windowWidth: tempDiv.scrollWidth,
          windowHeight: Math.min(tempDiv.scrollHeight, 267 * 3.779527559)
        })

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, pageHeight - 30) // Max height to fit on one page

        // Add image to single page, centered if needed
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

        // Generate filename
        const recordIdentifier = record['Full Name'] || record['Organization Name'] || record.id || `record_${i + 1}`
        const safeFilename = String(recordIdentifier).replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const filename = `letter_${safeFilename}_${Date.now()}.pdf`

        // Save PDF
        pdf.save(filename)

        // Clean up
        document.body.removeChild(tempDiv)

        // Small delay between PDFs
        if (i < approvedRecords.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      alert(`✅ Successfully generated ${approvedRecords.length} PDF files!`)
    } catch (error) {
      console.error('Error generating PDFs:', error)
      alert(`Error generating PDFs: ${error.message}`)
    } finally {
      setGeneratingPDF(false)
    }
  }

  // Image upload is now handled by SimpleLetterEditor component
  // This function is kept for backward compatibility but does nothing
  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files[0]
      if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should be less than 5MB')
          return
        }
        
        // Convert to base64
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result
          
          // Use ReactQuill ref if available
          if (quillRef && typeof quillRef.insertEmbed === 'function') {
            try {
              const range = quillRef.getSelection(true)
              if (range) {
                quillRef.insertEmbed(range.index, 'image', base64)
                quillRef.setSelection(range.index + 1)
              } else {
                const length = quillRef.getLength()
                quillRef.insertEmbed(length - 1, 'image', base64)
              }
              return
            } catch (error) {
              console.error('Error inserting image:', error)
            }
          }
          
          // Fallback: try to get Quill instance from DOM
          const quillContainer = document.querySelector('.ql-container')
          if (quillContainer) {
            const quillEditor = quillContainer.querySelector('.ql-editor')
            if (quillEditor) {
              const quillInstance = quillEditor.__quill || quillContainer.__quill
              if (quillInstance && quillInstance.insertEmbed) {
                const range = quillInstance.getSelection(true)
                if (range) {
                  quillInstance.insertEmbed(range.index, 'image', base64)
                  quillInstance.setSelection(range.index + 1)
                } else {
                  const length = quillInstance.getLength()
                  quillInstance.insertEmbed(length - 1, 'image', base64)
                }
                setTimeout(() => {
                  setContent(quillEditor.innerHTML)
                }, 0)
                return
              }
            }
          }
          
          // Final fallback: append HTML
          const img = `<img src="${base64}" style="max-width: 100%; height: auto;" />`
          setContent(prev => prev + img)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([])
    setFilterGroups([{
      id: 1,
      logic: 'AND',
      conditions: [{
        id: 1,
        field: '',
        operator: 'contains',
        value: '',
        valueList: []
      }]
    }])
    setGlobalSearch('')
    applyFiltersToRecords()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Letter & Email Editor</h2>

        {/* Workflow Steps Indicator */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Step 1: Filter & Approve */}
              <div className={`flex items-center space-x-2 ${approvedRecords.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${approvedRecords.length > 0 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                  {approvedRecords.length > 0 ? '✓' : '1'}
                </div>
                <span className="text-sm font-medium">Filter & Approve Records</span>
              </div>
              
              <div className="text-gray-300">→</div>
              
              {/* Step 2: Edit Template */}
              <div className={`flex items-center space-x-2 ${approvedRecords.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${approvedRecords.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  {templateConfirmed ? '✓' : '2'}
                </div>
                <span className="text-sm font-medium">Edit Template</span>
              </div>
              
              <div className="text-gray-300">→</div>
              
              {/* Step 3: Confirm Template */}
              <div className={`flex items-center space-x-2 ${templateConfirmed ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${templateConfirmed ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                  {templateConfirmed ? '✓' : '3'}
                </div>
                <span className="text-sm font-medium">Confirm Template</span>
              </div>
              
              <div className="text-gray-300">→</div>
              
              {/* Step 4: Generate PDFs */}
              <div className={`flex items-center space-x-2 ${templateConfirmed ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${templateConfirmed ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>
                  4
                </div>
                <span className="text-sm font-medium">Generate PDFs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="email"
                checked={letterFormat === 'email'}
                onChange={(e) => setLetterFormat(e.target.value)}
                className="mr-2"
              />
              <Mail className="w-4 h-4 mr-1" />
              Email
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="letter"
                checked={letterFormat === 'letter'}
                onChange={(e) => setLetterFormat(e.target.value)}
                className="mr-2"
              />
              <FileText className="w-4 h-4 mr-1" />
              Letter
            </label>
          </div>
        </div>

        {/* Category Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <CategorySelector
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onCategorySelect={setSelectedCategoryData}
            />
            <button
              onClick={openAdvancedFilter}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-purple-700"
            >
              <Filter className="w-4 h-4" />
              <span>Advanced Filter</span>
            </button>
          </div>
          {selectedCategory && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Only fields from "{selectedCategoryData?.name}" will be available for personalization.
              </p>
            </div>
          )}
          {(selectedCategories.length > 0 || globalSearch.trim() || filterGroups.some(g => g.conditions.some(c => c.field))) && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-800">
                  <strong>Filters Active:</strong> Showing {records.length} of {allRecords.length} records
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={showPreview}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview & Approve</span>
                  </button>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-green-700 hover:text-green-900 underline"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
          {approvedRecords.length > 0 && (
            <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-purple-800">
                    <strong>✅ Approved:</strong> {approvedRecords.length} records ready for letter generation
                  </p>
                </div>
                
                {!templateConfirmed ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>📝 Next Step:</strong> Edit your letter template below and add personalized fields (e.g., {`{{Full Name}}`}, {`{{Organization Name}}`})
                    </p>
                    <button
                      onClick={confirmTemplate}
                      disabled={!content.trim()}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Template</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-green-800">
                        <strong>✅ Template Confirmed!</strong> Ready to generate PDFs
                      </p>
                      <button
                        onClick={editTemplate}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Edit Template
                      </button>
                    </div>
                    <button
                      onClick={generatePDFsForAllRecords}
                      disabled={generatingPDF}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {generatingPDF ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating PDFs...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Submit & Generate PDFs ({approvedRecords.length} records)</span>
                        </>
                      )}
                    </button>
                    {generatingPDF && (
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        Processing personalized fields from {approvedRecords.length} approved records...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Record Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Record (for variable replacement)
          </label>
          <select
            value={selectedRecord?.id || ''}
            onChange={(e) => {
              const record = records.find(r => r.id === e.target.value)
              setSelectedRecord(record || null)
              if (record) {
                // Auto-fill email if available
                const emailField = Object.keys(record).find(key => 
                  key.toLowerCase().includes('email')
                )
                if (emailField) {
                  setToEmail(`{{${emailField}}}`)
                }
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={records.length === 0}
          >
            <option value="">
              {records.length === 0 
                ? selectedCategory 
                  ? `-- No records found for "${selectedCategoryData?.name}" --`
                  : '-- Select a category first --'
                : '-- Select a record --'
              }
            </option>
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {Object.values(record).filter((_, idx, arr) => {
                  const key = Object.keys(record)[idx]
                  return key && !key.startsWith('_') && idx < 3
                }).join(' - ')}
              </option>
            ))}
          </select>
          {recordsLoading && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading records...
            </p>
          )}
          {!recordsLoading && selectedCategory && records.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Showing {records.length}
              {categoryTotalRecords > records.length ? ` of ${categoryTotalRecords}` : ''} record{categoryTotalRecords !== 1 ? 's' : ''} from this category
            </p>
          )}
        </div>

        {/* Email Fields */}
        {letterFormat === 'email' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To (Email)
              </label>
              <input
                type="text"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="recipient@example.com or {{email}}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject or {{subject}}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Template Editing Guidance */}
        {approvedRecords.length > 0 && !templateConfirmed && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-800 mb-2">📝 Edit Your Letter Template</h4>
                <p className="text-sm text-blue-700 mb-2">
                  You have {approvedRecords.length} approved record{approvedRecords.length !== 1 ? 's' : ''}. Now create your letter template below:
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mb-2">
                  <li>Write your letter content in the editor below</li>
                  <li>Click on available variables to insert personalized fields (e.g., {`{{Full Name}}`}, {`{{Organization Name}}`})</li>
                  <li>Add images using the image button in the toolbar</li>
                  <li>Preview your template with a selected record</li>
                  <li>Click "Confirm Template" when ready to generate PDFs</li>
                </ul>
                <p className="text-xs text-blue-600 font-medium">
                  💡 Tip: Use variables like {`{{FieldName}}`} to personalize each letter with data from approved records
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Template Variables */}
        {fieldNames.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Variables (Click to insert)
              {approvedRecords.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  - These fields are available from your {approvedRecords.length} approved record{approvedRecords.length !== 1 ? 's' : ''}
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {fieldNames.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    insertVariable(field)
                  }}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 active:bg-blue-300 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <User className="w-3 h-3" />
                  <span>{field}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use double curly braces to insert variables: {`{{fieldName}}`}
            </p>
          </div>
        )}

        {/* Letter Content Editor */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-1">
                Letter Content Editor
              </label>
              <p className="text-sm text-gray-600">
                Write your letter template here. Use variables like {`{{Full Name}}`} for personalization.
              </p>
            </div>
            {templateConfirmed && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded font-medium">
                ✓ Template Confirmed
              </span>
            )}
          </div>
          
          <div 
            className={`border-2 rounded-lg shadow-sm bg-white ${templateConfirmed ? 'border-green-300' : 'border-gray-300'}`} 
            style={{ position: 'relative', zIndex: 10 }}
          >
            <SimpleLetterEditor
              value={content}
              onChange={setContent}
              placeholder={approvedRecords.length > 0 
                ? "Write your letter template here. Use variables like {{Full Name}} for personalization..."
                : "Start writing your letter or email..."}
            />
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              💡 Tip: Click on variables above to insert them, or type {`{{FieldName}}`} manually
            </div>
            {templateConfirmed && (
              <p className="text-xs text-green-700 font-medium">
                Template is confirmed. PDFs will use this template. Click "Edit Template" above to make changes.
              </p>
            )}
          </div>

          {/* Template Actions */}
          {approvedRecords.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {!templateConfirmed ? (
                <button
                  onClick={confirmTemplate}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Use This Template for Creating PDF</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={editTemplate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Edit Template</span>
                  </button>
                  <button
                    onClick={generatePDFsForAllRecords}
                    disabled={generatingPDF}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {generatingPDF ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating PDFs...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Submit & Generate PDFs ({approvedRecords.length} records)</span>
                      </>
                    )}
                  </button>
                  {generatingPDF && (
                    <span className="text-sm text-gray-600">
                      Generating PDFs for {approvedRecords.length} records...
                    </span>
                  )}
                </>
              )}
            </div>
          )}

        {/* Preview */}
        {selectedRecord && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Preview (with selected record):</h3>
            <div className="border border-gray-200 bg-white p-4 rounded">
              {letterFormat === 'email' && (
                <div className="mb-2">
                  <strong>To:</strong> {replaceVariables(toEmail, selectedRecord)}<br />
                  <strong>Subject:</strong> {replaceVariables(subject, selectedRecord)}
                </div>
              )}
              <div
                className="letter-preview-content"
                dangerouslySetInnerHTML={{ __html: replaceVariables(content, selectedRecord) }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          
          {letterFormat === 'email' && (
            <button
              onClick={handleEmailPreview}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
            >
              <Mail className="w-4 h-4" />
              <span>Open in Email Client</span>
            </button>
          )}
          
          <button
            onClick={exportToHTML}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-purple-700"
          >
            <Download className="w-4 h-4" />
            <span>Export HTML</span>
          </button>
        </div>

        {/* Draft Management */}
        <div className="border-t pt-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Draft Management</span>
          </h3>
          
          <div className="mb-4 flex space-x-2">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Draft name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={saveDraft}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-700"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>
          </div>

          {savedDrafts.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Saved Drafts:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {savedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{draft.name}</div>
                        {draft.categoryName && (
                          <div className="text-xs text-blue-600 mt-1">
                            Category: {draft.categoryName}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {draft.updatedAt 
                            ? `Updated: ${new Date(draft.updatedAt).toLocaleString()}`
                            : `Created: ${new Date(draft.createdAt).toLocaleString()}`
                          }
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => loadDraft(draft)}
                          className="text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Load draft"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {draft.id !== 'auto_save' && (
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            className="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete draft"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {savedDrafts.some(d => d.id === 'auto_save') && (
                <p className="text-xs text-gray-500 mt-2">
                  💾 Auto-save: Your draft is automatically saved every 30 seconds
                </p>
              )}
            </div>
          )}
        </div>

        {/* Template Management */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Template Management</h3>
          
          <div className="mb-4 flex space-x-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={saveTemplate}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4" />
              <span>Save Template</span>
            </button>
          </div>

          {savedTemplates.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Saved Templates:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {savedTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filter Modal */}
      {showAdvancedFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Advanced Filter for Letter Personalization</h3>
              <button
                onClick={closeAdvancedFilter}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Select Categories (Multiple)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {Object.entries(categoryService.getAll()).map(([id, category]) => (
                    <label key={id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, id])
                          } else {
                            setSelectedCategories(selectedCategories.filter(catId => catId !== id))
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
                {selectedCategories.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No categories selected - will use category selector above</p>
                )}
              </div>

              {/* Global Search */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Global Search (Across Multiple Columns)</h4>
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search across: Organization Name, Full Name, Department, Subjects Taught, Specialization..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Query Builder - Filter Groups */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-700">Advanced Filter Builder</h4>
                  <button
                    onClick={addFilterGroup}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    + Add Filter Group
                  </button>
                </div>

                <div className="space-y-4">
                  {filterGroups.map((group, groupIndex) => (
                    <div key={group.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">Group {groupIndex + 1}</span>
                          <select
                            value={group.logic}
                            onChange={(e) => updateGroupLogic(group.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="AND">AND (All conditions must match)</option>
                            <option value="OR">OR (Any condition can match)</option>
                          </select>
                        </div>
                        {filterGroups.length > 1 && (
                          <button
                            onClick={() => removeFilterGroup(group.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {group.conditions.map((condition, condIndex) => (
                          <div key={condition.id} className="flex items-start space-x-2 bg-white p-3 rounded border border-gray-200">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                              {/* Field Selection */}
                              <select
                                value={condition.field}
                                onChange={(e) => updateCondition(group.id, condition.id, { field: e.target.value, operator: 'contains' })}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="">Select Field...</option>
                                {getAllFieldNames().map(field => (
                                  <option key={field} value={field}>{field}</option>
                                ))}
                              </select>

                              {/* Operator Selection */}
                              <select
                                value={condition.operator}
                                onChange={(e) => updateCondition(group.id, condition.id, { operator: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                                disabled={!condition.field}
                              >
                                {OPERATORS[getFieldType(condition.field || 'text')].map(op => (
                                  <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                              </select>

                              {/* Value Input */}
                              {condition.operator !== 'inList' && condition.operator !== 'between' && (
                                <input
                                  type={getFieldType(condition.field || 'text') === 'number' ? 'number' : 'text'}
                                  value={condition.value || ''}
                                  onChange={(e) => updateCondition(group.id, condition.id, { value: e.target.value })}
                                  placeholder="Enter value..."
                                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                                  disabled={!condition.field}
                                />
                              )}

                              {/* Between operator */}
                              {condition.operator === 'between' && (
                                <>
                                  <input
                                    type="number"
                                    value={condition.value || ''}
                                    onChange={(e) => updateCondition(group.id, condition.id, { value: e.target.value })}
                                    placeholder="Min value..."
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    disabled={!condition.field}
                                  />
                                  <input
                                    type="number"
                                    value={condition.value2 || ''}
                                    onChange={(e) => updateCondition(group.id, condition.id, { value2: e.target.value })}
                                    placeholder="Max value..."
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    disabled={!condition.field}
                                  />
                                </>
                              )}

                              {/* In List - Multi-select */}
                              {condition.operator === 'inList' && condition.field && (
                                <div className="md:col-span-2">
                                  <select
                                    multiple
                                    value={condition.valueList || []}
                                    onChange={(e) => {
                                      const selected = Array.from(e.target.selectedOptions, option => option.value)
                                      updateCondition(group.id, condition.id, { valueList: selected })
                                    }}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm min-h-[80px]"
                                    size="4"
                                  >
                                    {getUniqueValues(condition.field).map(value => (
                                      <option key={value} value={value}>{value}</option>
                                    ))}
                                  </select>
                                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              {group.conditions.length > 1 && (
                                <button
                                  onClick={() => removeCondition(group.id, condition.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => addCondition(group.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Condition</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Count */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-semibold">
                  Records matching filters: {records.length} of {allRecords.length}
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  These records will be available for letter personalization
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={showPreview}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview & Approve</span>
                </button>
                <button
                  onClick={clearFilters}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                >
                  Clear All
                </button>
                <button
                  onClick={closeAdvancedFilter}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Preview Filtered Records</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-semibold">
                {previewRecords.length} record{previewRecords.length !== 1 ? 's' : ''} will be used for letter generation
              </p>
              <p className="text-blue-700 text-sm mt-1">
                Review the records below and click "Approve" to use them for creating personalized letters.
              </p>
            </div>

            <div className="overflow-x-auto mb-4 border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">#</th>
                    {previewRecords.length > 0 && Object.keys(previewRecords[0])
                      .filter(key => !key.startsWith('_') && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
                      .slice(0, 10)
                      .map((field) => (
                        <th key={field} className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                          {field}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRecords.slice(0, 50).map((record, index) => (
                    <tr key={record.id || index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">{index + 1}</td>
                      {Object.keys(record)
                        .filter(key => !key.startsWith('_') && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
                        .slice(0, 10)
                        .map((field) => (
                          <td key={field} className="border border-gray-300 px-4 py-2 text-gray-700 text-sm">
                            {String(record[field] || '-').substring(0, 50)}
                            {String(record[field] || '').length > 50 ? '...' : ''}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewRecords.length > 50 && (
                <div className="p-2 text-sm text-gray-500 text-center bg-gray-50">
                  Showing first 50 of {previewRecords.length} records
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={approveRecords}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Use These Records</span>
              </button>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

