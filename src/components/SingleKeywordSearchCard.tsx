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
    // 立即执行搜索
    setTimeout(() => {
      onSearch(template, selectedKeyword);
    }, 0);
  };

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      // 如果建议框没有打开，执行搜索
      if (!showSuggestions) {
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
      domain={template.domain}
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
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 text-sm"
                placeholder="输入搜索关键词..."
                disabled={isSearching}
              />

              {/* 搜索建议 */}
              <SearchSuggestions
                template={template}
                query={keyword}
                onSelect={handleSuggestionSelect}
                onClose={() => setShowSuggestions(false)}
                visible={showSuggestions}
                placeholderName="keyword"
                onEnterWithoutSelection={() => {
                  setShowSuggestions(false);
                  handleSearch();
                }}
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
