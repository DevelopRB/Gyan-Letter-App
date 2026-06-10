import { useState, useRef, useEffect } from 'react'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Link, Image as ImageIcon, Type, X } from 'lucide-react'

const ALIGN_STYLES = {
  left: 'left',
  center: 'center',
  right: 'right'
}

const SIZE_WIDTH = {
  small: '25',
  medium: '50',
  large: '75',
  full: '100'
}

const FORMATTING_SELECTOR = 'font, span, b, strong, i, em, u, s, strike, a, sub, sup'
const STYLED_BLOCK_SELECTOR = 'p[style], div[style], li[style], h1[style], h2[style], h3[style], h4[style], h5[style], h6[style]'

const hasFormatting = (root) => {
  return Boolean(
    root.querySelector(`${FORMATTING_SELECTOR}, ${STYLED_BLOCK_SELECTOR}, [align]`)
  )
}

const unwrapElement = (element) => {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }
  parent.removeChild(element)
}

const clearFormattingInNode = (root) => {
  const formattingEls = root.querySelectorAll(FORMATTING_SELECTOR)
  for (let i = formattingEls.length - 1; i >= 0; i--) {
    const el = formattingEls[i]
    if (el.closest('.editor-image-wrap')) continue
    unwrapElement(el)
  }

  root.querySelectorAll(STYLED_BLOCK_SELECTOR).forEach((el) => {
    if (el.classList?.contains('editor-image-wrap')) return
    el.removeAttribute('style')
    el.removeAttribute('align')
    el.removeAttribute('class')
  })
}

function applyImageWrapperStyles(wrapper, align = 'center') {
  wrapper.className = 'editor-image-wrap'
  wrapper.dataset.align = align
  wrapper.style.cssText = 'display:block;width:100%;clear:both;margin:12px 0;text-align:' + (ALIGN_STYLES[align] || 'center') + ';'
}

function applyImageStyles(img, widthPercent = '50', align = 'center') {
  img.className = 'editor-image'
  img.dataset.width = widthPercent
  img.dataset.align = align
  img.style.cssText = 'max-width:' + widthPercent + '%;width:' + widthPercent + '%;height:auto;display:inline-block;vertical-align:top;cursor:pointer;'
}

function wrapOrphanImages(root) {
  if (!root) return
  root.querySelectorAll('img').forEach((img) => {
    if (img.closest('.editor-image-wrap')) return
    const wrapper = document.createElement('div')
    applyImageWrapperStyles(wrapper, img.dataset.align || 'center')
    applyImageStyles(img, img.dataset.width || '50', img.dataset.align || 'center')
    img.parentNode?.insertBefore(wrapper, img)
    wrapper.appendChild(img)
  })
}

function attachImageClickHandlers(root, onImageClick) {
  root?.querySelectorAll('img.editor-image').forEach((img) => {
    img.onclick = (e) => {
      e.stopPropagation()
      onImageClick(img)
    }
  })
}

export default function SimpleLetterEditor({ value, onChange, placeholder, onVariableInsert }) {
  const editorRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const openImageOptions = (img) => {
    setSelectedImage(img)
    setShowImageOptions(true)
  }

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || ''
      wrapOrphanImages(editorRef.current)
      attachImageClickHandlers(editorRef.current, openImageOptions)
    }
  }, [value])

  const preventToolbarFocusLoss = (e) => {
    e.preventDefault()
  }

  const execCommand = (command, value = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    updateContent()
  }

  const clearFormatting = () => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    const selection = window.getSelection()
    const hasSelection = selection?.rangeCount > 0 && !selection.isCollapsed

    if (hasSelection) {
      const range = selection.getRangeAt(0)
      const fragment = range.extractContents()
      const wrapper = document.createElement('div')
      wrapper.appendChild(fragment)

      if (!hasFormatting(wrapper)) {
        range.insertNode(fragment)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
        return
      }

      clearFormattingInNode(wrapper)
      const restored = document.createDocumentFragment()
      while (wrapper.firstChild) {
        restored.appendChild(wrapper.firstChild)
      }
      range.insertNode(restored)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      updateContent()
    } else if (hasFormatting(editor)) {
      clearFormattingInNode(editor)

      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      updateContent()
    }
  }

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Ensure editor is focused
    if (editorRef.current) {
      editorRef.current.focus()
    }
    
    // Get clipboard data - use getData() method, not getText()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    
    if (!text && !html) {
      return
    }
    
    // Use execCommand for better compatibility - it handles both HTML and text
    try {
      // First try to paste as HTML if available
      if (html && html.trim() && html !== text) {
        // Use insertHTML command which is more reliable
        const success = document.execCommand('insertHTML', false, html)
        if (success) {
          updateContent()
          return
        }
      }
      
      // Fallback to insertText for plain text
      if (text) {
        const success = document.execCommand('insertText', false, text)
        if (success) {
          updateContent()
          return
        }
      }
      
      // Manual fallback if execCommand fails
      const selection = window.getSelection()
      let range = null
      
      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
      } else if (editorRef.current) {
        range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
      }
      
      if (range) {
        range.deleteContents()
        
        if (html && html.trim() && html !== text) {
          // Create temporary container for HTML
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = html
          wrapOrphanImages(tempDiv)
          tempDiv.querySelectorAll('img').forEach((img) => {
            img.style.float = 'none'
          })
          
          const fragment = document.createDocumentFragment()
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild)
          }
          
          range.insertNode(fragment)
          attachImageClickHandlers(editorRef.current, openImageOptions)
          range.setStartAfter(fragment.lastChild || range.startContainer)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        } else if (text) {
          const textNode = document.createTextNode(text)
          range.insertNode(textNode)
          range.setStartAfter(textNode)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        updateContent()
      }
    } catch (error) {
      console.error('Error in paste handler:', error)
      // Last resort: just insert text
      if (text) {
        try {
          document.execCommand('insertText', false, text)
          updateContent()
        } catch (e) {
          console.error('Failed to paste:', e)
        }
      }
    }
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should be less than 5MB')
          return
        }
        const reader = new FileReader()
        reader.onload = (event) => {
          const wrapper = document.createElement('div')
          const img = document.createElement('img')
          img.src = event.target.result
          applyImageWrapperStyles(wrapper, 'center')
          applyImageStyles(img, '50', 'center')
          img.onclick = (e) => {
            e.stopPropagation()
            openImageOptions(img)
          }
          wrapper.appendChild(img)

          const selection = window.getSelection()
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.collapse(false)
            range.insertNode(wrapper)
            range.setStartAfter(wrapper)
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
            updateContent()
            setTimeout(() => openImageOptions(img), 100)
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const formatImage = (property, value) => {
    if (!selectedImage) return

    const wrapper = selectedImage.closest('.editor-image-wrap')
    const align = property === 'align' ? value : (selectedImage.dataset.align || 'center')
    let width = selectedImage.dataset.width || '50'

    if (property === 'align') {
      if (wrapper) applyImageWrapperStyles(wrapper, value)
    } else if (property === 'width') {
      width = String(value)
    } else if (property === 'size') {
      width = SIZE_WIDTH[value] || '50'
    }

    applyImageStyles(selectedImage, width, align)
    updateContent()
  }

  const insertVariable = (variableName) => {
    const variableText = `{{${variableName}}}`
    const selection = window.getSelection()
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const textNode = document.createTextNode(variableText + ' ')
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      updateContent()
    } else {
      // Insert at end
      if (editorRef.current) {
        const textNode = document.createTextNode(' ' + variableText + ' ')
        editorRef.current.appendChild(textNode)
        updateContent()
      }
    }
    editorRef.current?.focus()
  }

  return (
    <div className="border-2 border-gray-300 rounded-lg bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap items-center gap-2">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => execCommand('bold')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => execCommand('italic')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => execCommand('underline')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <select
            onMouseDown={preventToolbarFocusLoss}
            onChange={(e) => execCommand('fontSize', e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            defaultValue="3"
          >
            <option value="1">Small</option>
            <option value="2">Normal</option>
            <option value="3">Large</option>
            <option value="4">Extra Large</option>
            <option value="5">Huge</option>
            <option value="6">Extra Huge</option>
          </select>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => execCommand('justifyLeft')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => execCommand('justifyCenter')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => execCommand('justifyRight')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => execCommand('insertOrderedList')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Numbered List"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>

        {/* Links & Images */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => {
              const url = prompt('Enter URL:')
              if (url) execCommand('createLink', url)
            }}
            className="p-2 hover:bg-gray-200 rounded"
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={handleImageUpload}
            className="p-2 hover:bg-gray-200 rounded"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Clear Formatting */}
        <div className="ml-auto">
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={clearFormatting}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
            title="Clear Formatting"
          >
            Clear Format
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        onPaste={handlePaste}
        onCopy={(e) => {
          // Allow copy to work normally - browser handles it automatically
          // This ensures copy works with formatting preserved
        }}
        onCut={(e) => {
          // Allow cut to work normally
          setTimeout(() => updateContent(), 0)
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`letter-editor-content min-h-[400px] p-4 outline-none overflow-auto ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        data-placeholder={placeholder || "Start typing your letter here..."}
        suppressContentEditableWarning
      />

      {/* Image Formatting Options Modal */}
      {showImageOptions && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowImageOptions(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Image Formatting</h3>
              <button
                type="button"
                onClick={() => setShowImageOptions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Alignment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => formatImage('align', 'left')}
                  className={`px-4 py-2 border rounded flex items-center gap-2 ${selectedImage?.dataset.align === 'left' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                >
                  <AlignLeft className="w-4 h-4" />
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => formatImage('align', 'center')}
                  className={`px-4 py-2 border rounded flex items-center gap-2 ${selectedImage?.dataset.align === 'center' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                >
                  <AlignCenter className="w-4 h-4" />
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => formatImage('align', 'right')}
                  className={`px-4 py-2 border rounded flex items-center gap-2 ${selectedImage?.dataset.align === 'right' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                >
                  <AlignRight className="w-4 h-4" />
                  Right
                </button>
              </div>
            </div>

            {/* Size Presets */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => formatImage('size', 'small')}
                  className={`px-3 py-2 border rounded text-sm ${selectedImage?.dataset.width === '25' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                >
                  Small
                </button>
                <button
                  type="button"
                  onClick={() => formatImage('size', 'medium')}
                  className={`px-3 py-2 border rounded text-sm ${selectedImage?.dataset.width === '50' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => formatImage('size', 'large')}
                  className={`px-3 py-2 border rounded text-sm ${selectedImage?.dataset.width === '75' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                >
                  Large
                </button>
                <button
                  type="button"
                  onClick={() => formatImage('size', 'full')}
                  className={`px-3 py-2 border rounded text-sm ${selectedImage?.dataset.width === '100' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                >
                  Full
                </button>
              </div>
            </div>

            {/* Custom Width */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Width: {selectedImage?.dataset.width || '100'}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={selectedImage?.dataset.width || '100'}
                onChange={(e) => formatImage('width', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Preview */}
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Preview:</p>
              <div
                className="bg-white p-2 rounded border border-gray-300 min-h-[100px]"
                style={{ textAlign: selectedImage?.dataset.align || 'center' }}
              >
                <img
                  src={selectedImage?.src}
                  alt="Preview"
                  style={{
                    width: `${selectedImage?.dataset.width || '50'}%`,
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'inline-block'
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedImage && confirm('Delete this image?')) {
                    const wrapper = selectedImage.closest('.editor-image-wrap')
                    if (wrapper) {
                      wrapper.remove()
                    } else {
                      selectedImage.remove()
                    }
                    updateContent()
                    setShowImageOptions(false)
                  }
                }}
                className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                Delete Image
              </button>
              <button
                type="button"
                onClick={() => setShowImageOptions(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder CSS */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #999;
          pointer-events: none;
        }
        .letter-editor-content {
          overflow: auto;
        }
        .letter-editor-content .editor-image-wrap {
          display: block;
          width: 100%;
          clear: both;
          margin: 12px 0;
        }
        .letter-editor-content .editor-image {
          cursor: pointer;
          transition: opacity 0.2s;
          max-width: 100%;
          height: auto;
          float: none !important;
        }
        .letter-editor-content .editor-image:hover {
          opacity: 0.9;
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        .letter-editor-content::after {
          content: '';
          display: table;
          clear: both;
        }
        .letter-preview-content .editor-image-wrap,
        .letter-preview-content img {
          float: none !important;
          display: block;
          max-width: 100%;
          height: auto;
          margin: 12px auto;
        }
        .letter-preview-content .editor-image-wrap {
          width: 100%;
          text-align: center;
        }
      `}</style>
    </div>
  )
}

