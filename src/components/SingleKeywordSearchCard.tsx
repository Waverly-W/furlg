import React, { useState, useRef } from 'react';
import type { Template } from '../types';
import { SearchSuggestions } from './SearchSuggestions';
import { LoadingButton } from './LoadingSpinner';
import { SearchCardBase } from './SearchCardBase';

interface SingleKeywordSearchCardProps {
  template: Template;
  onSearch: (template: Template, keyword: string) => void;
  isSearching?: boolean;
  className?: string;
}

export const SingleKeywordSearchCard: React.FC<SingleKeywordSearchCardProps> = React.memo(({
  template,
  onSearch,
  isSearching = false,
  className = ''
}) => {
  // 单关键词输入状态
  const [keyword, setKeyword] = useState('');

  // 搜索建议状态
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false);
  const [selectedSuggestionKeyword, setSelectedSuggestionKeyword] = useState<string>();

  // 输入框引用
  const inputRef = useRef<HTMLInputElement>(null);

  // 处理输入变化
  const handleInputChange = (value: string) => {
    setKeyword(value);
    setShowSuggestions(true);
  };

  // 处理搜索建议选择
  const handleSuggestionSelect = (selectedKeyword: string) => {
    setKeyword(selectedKeyword);
    setShowSuggestions(false);
    setHasSelectedSuggestion(false);
    setSelectedSuggestionKeyword(undefined);
    // 立即执行搜索
    setTimeout(() => {
      onSearch(template, selectedKeyword);
    }, 0);
  };

  // 处理建议选中状态变化
  const handleSelectionChange = (hasSelection: boolean, selectedKeyword?: string) => {
    setHasSelectedSuggestion(hasSelection);
    setSelectedSuggestionKeyword(selectedKeyword);
  };

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      // 智能Enter键行为
      if (showSuggestions && hasSelectedSuggestion && selectedSuggestionKeyword) {
        // 有建议且已选中：使用选中的建议项
        handleSuggestionSelect(selectedSuggestionKeyword);
      } else {
        // 无建议或未选中：直接搜索当前输入内容
        setShowSuggestions(false);
        handleSearch();
      }
    }
  };

  // 处理搜索
  const handleSearch = () => {
    if (keyword.trim()) {
      onSearch(template, keyword);
    }
  };

  return (
    <SearchCardBase
      title={template.name}
      className={`search-card ${className}`}
    >
      <div className="flex flex-col h-full">
        {/* 输入区域 */}
        <div className="flex-1 mb-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={keyword}
                onChange={(e) => handleInputChange(e.target.value)}
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
                    : "输入搜索关键词..."
                }
                disabled={isSearching}
              />

              {/* 搜索建议 */}
              <SearchSuggestions
                template={template}
                query={keyword}
                onSelect={handleSuggestionSelect}
                onClose={() => {
                  setShowSuggestions(false);
                  setHasSelectedSuggestion(false);
                  setSelectedSuggestionKeyword(undefined);
                }}
                visible={showSuggestions}
                placeholderName="keyword"
                onSelectionChange={handleSelectionChange}
                onEnterWithoutSelection={() => {
                  setShowSuggestions(false);
                  handleSearch();
                }}
                anchorRef={inputRef as React.RefObject<HTMLElement>}
              />
            </div>

            <LoadingButton
              loading={isSearching}
              disabled={!keyword.trim()}
              onClick={handleSearch}
              className="px-3.5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </LoadingButton>
          </div>
        </div>
      </div>
    </SearchCardBase>
  );
}, (prevProps, nextProps) => {
  // 优化渲染性能
  return (
    prevProps.template.id === nextProps.template.id &&
    prevProps.template.updatedAt === nextProps.template.updatedAt &&
    prevProps.isSearching === nextProps.isSearching &&
    prevProps.className === nextProps.className
  );
});
