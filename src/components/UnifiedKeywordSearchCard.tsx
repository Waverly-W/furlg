import React, { useEffect, useRef, useState } from 'react'
import type { Template, MultiKeywordValues } from '../types'
import { PlaceholderParser } from '../utils/placeholderParser'
import { SearchCardBase } from './SearchCardBase'
import { LoadingButton } from './LoadingSpinner'
import { SearchInputWithSuggestions } from './SearchInputWithSuggestions'

interface UnifiedKeywordSearchCardProps {
  template: Template
  onSearchSingle?: (template: Template, keyword: string) => void
  onSearchMultiple?: (template: Template, keywords: MultiKeywordValues) => void
  isSearching?: boolean
  className?: string
}

export const UnifiedKeywordSearchCard: React.FC<UnifiedKeywordSearchCardProps> = React.memo(({
  template,
  onSearchSingle,
  onSearchMultiple,
  isSearching = false,
  className = ''
}) => {
  const placeholders = template.placeholders || []
  const isSingle = placeholders.length === 1 && placeholders[0].code === 'keyword'

  // 单关键词状态
  const [singleKeyword, setSingleKeyword] = useState('')

  // 多关键词状态
  const [keywordValues, setKeywordValues] = useState<MultiKeywordValues>({})
  const inputRefs = useRef<Record<string, React.RefObject<HTMLInputElement>>>({})

  // 初始化多关键词输入与 refs
  useEffect(() => {
    if (!isSingle) {
      const initial: MultiKeywordValues = {}
      placeholders.forEach(p => {
        initial[p.code] = ''
        if (!inputRefs.current[p.code]) {
          inputRefs.current[p.code] = React.createRef<HTMLInputElement>()
        }
      })
      setKeywordValues(initial)
    }
    // 对于切换模板的单关键词，重置输入
    if (isSingle) {
      setSingleKeyword('')
    }
  }, [template.id, isSingle, placeholders])

  // 单关键词搜索
  const handleSearchSingle = () => {
    if (!onSearchSingle) {
      console.warn('onSearchSingle 未提供，但当前模板为单关键词模式')
      return
    }
    if (singleKeyword.trim()) {
      onSearchSingle(template, singleKeyword)
    }
  }

  // 多关键词输入变化
  const handleMultiChange = (code: string, v: string) => {
    setKeywordValues(prev => ({ ...prev, [code]: v }))
  }

  // 多关键词建议选择
  const handleMultiSelect = (code: string, kw: string) => {
    setKeywordValues(prev => ({ ...prev, [code]: kw }))
  }

  // 多关键词搜索
  const handleSearchMultiple = () => {
    if (!onSearchMultiple) {
      console.warn('onSearchMultiple 未提供，但当前模板为多关键词模式')
      return
    }
    const validation = PlaceholderParser.validateKeywordValues(placeholders, keywordValues)
    if (!validation.isValid) {
      if (validation.missingRequired.length > 0) {
        const missing = placeholders.find(p => validation.missingRequired.includes(p.name))
        if (missing) {
          inputRefs.current[missing.code]?.current?.focus()
        }
      }
      return
    }
    onSearchMultiple(template, keywordValues)
  }

  // 多关键词：是否可以搜索（至少有一项非空）
  const canSearchMultiple = isSingle ? false : placeholders.some(p => (keywordValues[p.code] || '').trim())

  return (
    <SearchCardBase title={template.name} className={`search-card ${className}`}>
      <div className="flex flex-col h-full">
        <div className={isSingle ? 'flex-1 mb-4' : 'flex-1 space-y-3 mb-4'}>
          {isSingle ? (
            <div className="flex space-x-2">
              <SearchInputWithSuggestions
                template={template}
                value={singleKeyword}
                onChange={setSingleKeyword}
                onSuggestionSelect={(kw) => {
                  setSingleKeyword(kw)
                  // 选中建议后立即搜索（保持原行为）
                  setTimeout(() => onSearchSingle && onSearchSingle(template, kw), 0)
                }}
                onEnterWithoutSelection={handleSearchSingle}
                placeholderName="keyword"
                disabled={isSearching}
                defaultPlaceholder="输入搜索关键词..."
              />

              <LoadingButton
                loading={isSearching}
                disabled={!singleKeyword.trim()}
                onClick={handleSearchSingle}
                className="px-3.5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </LoadingButton>
            </div>
          ) : (
            <>
              {placeholders.map((p, index) => {
                const isLast = index === placeholders.length - 1
                return (
                  <div key={p.code} className="relative">
                    <div className={isLast ? 'flex space-x-2' : 'relative'}>
                      <div className="flex-1 relative">
                        <SearchInputWithSuggestions
                          template={template}
                          value={keywordValues[p.code] || ''}
                          onChange={(v) => handleMultiChange(p.code, v)}
                          onSuggestionSelect={(kw) => handleMultiSelect(p.code, kw)}
                          onEnterWithoutSelection={handleSearchMultiple}
                          placeholderName={p.code}
                          disabled={isSearching}
                          defaultPlaceholder={p.placeholder || `请输入${p.name}`}
                          anchorRef={inputRefs.current[p.code]}
                          onTabNext={() => {
                            const currentIndex = placeholders.findIndex(x => x.code === p.code)
                            const nextIndex = (currentIndex + 1) % placeholders.length
                            const nextPlaceholder = placeholders[nextIndex]
                            setTimeout(() => {
                              inputRefs.current[nextPlaceholder.code]?.current?.focus()
                            }, 0)
                          }}
                        />
                      </div>

                      {isLast && (
                        <LoadingButton
                          loading={isSearching}
                          disabled={!canSearchMultiple}
                          onClick={handleSearchMultiple}
                          className="px-3.5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </LoadingButton>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </SearchCardBase>
  )
}, (prev, next) => (
  prev.template.id === next.template.id &&
  prev.template.updatedAt === next.template.updatedAt &&
  prev.isSearching === next.isSearching &&
  prev.className === next.className
))

