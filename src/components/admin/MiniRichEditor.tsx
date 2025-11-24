"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link, 
  Unlink,
  Eye,
  Code,
  X,
  Check
} from 'lucide-react'

interface MiniRichEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

export function MiniRichEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your content...",
  minHeight = 120 
}: MiniRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [savedSelection, setSavedSelection] = useState<Range | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value, isHtmlMode])

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current && !isHtmlMode) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange, isHtmlMode])

  // Save selection for link insertion
  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange())
      const selectedText = selection.toString()
      setLinkText(selectedText)
    }
  }

  // Restore selection
  const restoreSelection = () => {
    if (savedSelection) {
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(savedSelection)
    }
  }

  // Execute formatting command
  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    handleInput()
  }

  // Format handlers
  const handleBold = () => execCommand('bold')
  const handleItalic = () => execCommand('italic')
  const handleUnorderedList = () => execCommand('insertUnorderedList')
  const handleOrderedList = () => execCommand('insertOrderedList')
  
  const handleLinkClick = () => {
    saveSelection()
    setShowLinkModal(true)
  }

  const insertLink = () => {
    if (!linkUrl) return
    
    restoreSelection()
    editorRef.current?.focus()
    
    if (linkText) {
      // If we have selected text, wrap it in a link
      document.execCommand('createLink', false, linkUrl)
    } else {
      // If no text selected, insert the URL as both text and link
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`
      document.execCommand('insertHTML', false, linkHtml)
    }
    
    handleInput()
    setShowLinkModal(false)
    setLinkUrl('')
    setLinkText('')
    setSavedSelection(null)
  }

  const removeLink = () => {
    execCommand('unlink')
  }

  // Toggle HTML mode
  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML to visual
      setIsHtmlMode(false)
    } else {
      // Switching from visual to HTML
      setIsHtmlMode(true)
    }
  }

  // Handle HTML textarea changes
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  // Check if format is active
  const isFormatActive = (command: string): boolean => {
    if (typeof document !== 'undefined') {
      return document.queryCommandState(command)
    }
    return false
  }

  // Toolbar button component
  const ToolbarButton = ({ 
    onClick, 
    active, 
    children, 
    title 
  }: { 
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
        ${active 
          ? 'bg-dusty-rose text-white shadow-sm' 
          : 'bg-white/60 text-dune/60 hover:bg-white hover:text-dune hover:shadow-sm'
        }
      `}
    >
      {children}
    </button>
  )

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className={`
        flex items-center gap-1.5 p-2 rounded-t-xl border border-b-0 transition-all duration-200
        ${isFocused 
          ? 'bg-white/80 backdrop-blur-lg border-dusty-rose/30' 
          : 'bg-warm-sand/50 backdrop-blur border-sage/20'
        }
      `}>
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleBold} title="Bold (⌘B)">
            <Bold className="w-4 h-4" strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton onClick={handleItalic} title="Italic (⌘I)">
            <Italic className="w-4 h-4" />
          </ToolbarButton>
        </div>
        
        <div className="w-px h-5 bg-sage/30" />
        
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleUnorderedList} title="Bullet List">
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={handleOrderedList} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>
        
        <div className="w-px h-5 bg-sage/30" />
        
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={handleLinkClick} title="Insert Link">
            <Link className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={removeLink} title="Remove Link">
            <Unlink className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <ToolbarButton 
            onClick={() => setShowPreview(!showPreview)} 
            active={showPreview}
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={toggleHtmlMode} 
            active={isHtmlMode}
            title="HTML Mode"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor / HTML Mode */}
      <div className={`
        border rounded-b-xl overflow-hidden transition-all duration-200
        ${isFocused 
          ? 'border-dusty-rose/30 shadow-sm shadow-dusty-rose/10' 
          : 'border-sage/20'
        }
      `}>
        {isHtmlMode ? (
          <textarea
            value={value}
            onChange={handleHtmlChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full p-4 bg-dune/5 text-sm font-mono text-dune/80 focus:outline-none resize-none"
            style={{ minHeight }}
            placeholder="<p>Enter HTML...</p>"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              w-full p-4 bg-white focus:outline-none prose prose-sm max-w-none
              prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
              prose-a:text-dusty-rose prose-a:no-underline hover:prose-a:underline
              [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dune/30
            `}
            style={{ minHeight }}
            data-placeholder={placeholder}
            suppressContentEditableWarning
          />
        )}
      </div>

      {/* Preview Panel */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 bg-cream/50 rounded-xl border border-sage/20">
              <div className="text-xs uppercase tracking-wider text-dune/40 mb-2 font-medium">
                Preview
              </div>
              <div 
                className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-a:text-dusty-rose"
                dangerouslySetInnerHTML={{ __html: value || '<span class="text-dune/30">No content yet</span>' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Modal */}
      <AnimatePresence>
        {showLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-cream rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-sage/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-dune">Insert Link</h3>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="w-8 h-8 rounded-lg bg-sage/10 text-dune/50 hover:bg-sage/20 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {linkText && (
                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider block mb-1.5">
                      Selected Text
                    </label>
                    <div className="px-3 py-2 bg-sage/10 rounded-lg text-sm text-dune/70 truncate">
                      {linkText}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider block mb-1.5">
                    URL
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2.5 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose/50 text-sm"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && insertLink()}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 px-4 py-2.5 bg-sage/10 text-dune/70 rounded-xl hover:bg-sage/20 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={insertLink}
                  disabled={!linkUrl}
                  className="flex-1 px-4 py-2.5 bg-dusty-rose text-white rounded-xl hover:bg-terracotta transition-colors disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Insert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

