import React, { useState, useRef } from 'react'
import type { Template } from '../types'
import { SearchSuggestions } from './SearchSuggestions'

interface SearchInputWithSuggestionsProps {
  template: Template
  value: string
  onChange: (value: string) => void
  onSuggestionSelect: (keyword: string) => void
  onEnterWithoutSelection: () => void
  placeholderName: string
  disabled?: boolean
  defaultPlaceholder?: string
  anchorRef?: React.RefObject<HTMLInputElement>
  onTabNext?: () => void
}

export const SearchInputWithSuggestions: React.FC<SearchInputWithSuggestionsProps> = ({
  template,
  value,
  onChange,
  onSuggestionSelect,
  onEnterWithoutSelection,
  placeholderName,
  disabled,
  defaultPlaceholder = '输入搜索关键词...',
  anchorRef,
  onTabNext
}) => {
  const internalRef = useRef<HTMLInputElement>(null)
  const inputRef = anchorRef || internalRef

  // 搜索建议状态（内部管理）
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false)
  const [selectedSuggestionKeyword, setSelectedSuggestionKeyword] = useState<string | undefined>()

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (showSuggestions && hasSelectedSuggestion && selectedSuggestionKeyword) {
        // 有建议且已选中：使用选中的建议项
        handleSuggestionSelect(selectedSuggestionKeyword)
      } else {
        // 无建议或未选中：交由上层处理（通常触发搜索）
        setShowSuggestions(false)
        onEnterWithoutSelection()
      }
    } else if (event.key === 'Tab') {
      if (onTabNext) {
        event.preventDefault()
        onTabNext()
      }
    }
  }

  const handleSuggestionSelect = (kw: string) => {
    onSuggestionSelect(kw)
    setShowSuggestions(false)
    setHasSelectedSuggestion(false)
    setSelectedSuggestionKeyword(undefined)
  }

  const handleSelectionChange = (has: boolean, kw?: string) => {
    setHasSelectedSuggestion(has)
    setSelectedSuggestionKeyword(kw)
  }

  return (
    <div className="flex-1 relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowSuggestions(true) }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        className={`w-full px-3.5 py-2.5 border rounded-md focus:outline-none focus:ring-2 text-sm transition-all duration-200 ${
          showSuggestions && hasSelectedSuggestion
            ? 'border-blue-400 focus:ring-blue-500 focus:border-blue-500 bg-blue-50'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        } placeholder:text-gray-400`}
        placeholder={
          showSuggestions && hasSelectedSuggestion
            ? `按 Enter 搜索 "${selectedSuggestionKeyword}"`
            : defaultPlaceholder
        }
        disabled={!!disabled}
      />

      <SearchSuggestions
        template={template}
        query={value}
        onSelect={handleSuggestionSelect}
        onClose={() => {
          setShowSuggestions(false)
          setHasSelectedSuggestion(false)
          setSelectedSuggestionKeyword(undefined)
        }}
        visible={showSuggestions}
        placeholderName={placeholderName}
        onSelectionChange={handleSelectionChange}
        onEnterWithoutSelection={() => {
          setShowSuggestions(false)
          onEnterWithoutSelection()
        }}
        anchorRef={inputRef as React.RefObject<HTMLElement>}
      />
    </div>
  )
}

