import React, { useState, useRef, useEffect } from 'react';
import type { Template, PlaceholderInfo, MultiKeywordValues } from '../types';
import { PlaceholderParser } from '../utils/placeholderParser';
import { SearchSuggestions } from './SearchSuggestions';
import { LoadingButton } from './LoadingSpinner';

interface MultiKeywordSearchCardProps {
  template: Template;
  onSearch: (template: Template, keywords: MultiKeywordValues) => void;
  isSearching?: boolean;
  className?: string;
}

export const MultiKeywordSearchCard: React.FC<MultiKeywordSearchCardProps> = ({
  template,
  onSearch,
  isSearching = false,
  className = ''
}) => {
  // 使用模板中定义的占位符列表
  const placeholders = template.placeholders || [];

  // 多关键词输入状态
  const [keywordValues, setKeywordValues] = useState<MultiKeywordValues>({});
  
  // 搜索建议状态
  const [activeSuggestions, setActiveSuggestions] = useState<string | null>(null);
  
  // 输入框引用
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 初始化关键词值
  useEffect(() => {
    const initialValues: MultiKeywordValues = {};
    placeholders.forEach(placeholder => {
      initialValues[placeholder.code] = '';
    });
    setKeywordValues(initialValues);
  }, [template.id, placeholders]);

  // 处理输入变化
  const handleInputChange = (placeholderCode: string, value: string) => {
    setKeywordValues(prev => ({
      ...prev,
      [placeholderCode]: value
    }));
    // 显示搜索建议
    setActiveSuggestions(placeholderCode);
  };

  // 处理搜索建议选择
  const handleSuggestionSelect = (placeholderCode: string, keyword: string) => {
    setKeywordValues(prev => ({
      ...prev,
      [placeholderCode]: keyword
    }));
    setActiveSuggestions(null);
  };

  // 处理键盘事件
  const handleKeyDown = (placeholderCode: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      // 如果建议框没有打开，执行搜索
      if (activeSuggestions !== placeholderCode) {
        handleSearch();
      }
    } else if (event.key === 'Tab') {
      // Tab键切换到下一个输入框
      const currentIndex = placeholders.findIndex(p => p.code === placeholderCode);
      const nextIndex = (currentIndex + 1) % placeholders.length;
      const nextPlaceholder = placeholders[nextIndex];

      setTimeout(() => {
        inputRefs.current[nextPlaceholder.code]?.focus();
      }, 0);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    // 验证必填字段
    const validation = PlaceholderParser.validateKeywordValues(placeholders, keywordValues);
    if (!validation.isValid) {
      // 聚焦到第一个缺失的必填字段
      if (validation.missingRequired.length > 0) {
        const missingPlaceholder = placeholders.find(p =>
          validation.missingRequired.includes(p.name)
        );
        if (missingPlaceholder) {
          inputRefs.current[missingPlaceholder.code]?.focus();
        }
      }
      return;
    }

    onSearch(template, keywordValues);
  };

  // 检查是否可以搜索
  const canSearch = placeholders.some(placeholder => {
    const value = keywordValues[placeholder.code];
    return value && value.trim();
  });

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      {/* 模板标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
        {template.domain && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {template.domain}
          </span>
        )}
      </div>

      {/* 多关键词输入区域 */}
      <div className="space-y-3 mb-4">
        {placeholders.map((placeholder, index) => (
          <div key={placeholder.code} className="relative">
            {/* 标签 */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {placeholder.name}
              {placeholder.required !== false && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>

            {/* 输入框 */}
            <div className="relative">
              <input
                ref={(el) => (inputRefs.current[placeholder.code] = el)}
                type="text"
                value={keywordValues[placeholder.code] || ''}
                onChange={(e) => handleInputChange(placeholder.code, e.target.value)}
                onKeyDown={(e) => handleKeyDown(placeholder.code, e)}
                onFocus={() => setActiveSuggestions(placeholder.code)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 text-sm"
                placeholder={placeholder.placeholder || `请输入${placeholder.name}`}
                disabled={isSearching}
              />

              {/* 搜索建议 */}
              <SearchSuggestions
                template={template}
                query={keywordValues[placeholder.code] || ''}
                onSelect={(keyword) => handleSuggestionSelect(placeholder.code, keyword)}
                onClose={() => setActiveSuggestions(null)}
                visible={activeSuggestions === placeholder.code}
                placeholderName={placeholder.code}
                onEnterWithoutSelection={() => {
                  setActiveSuggestions(null);
                  handleSearch();
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 搜索按钮 */}
      <div className="flex justify-end">
        <LoadingButton
          loading={isSearching}
          disabled={!canSearch}
          onClick={handleSearch}
          className="px-4 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          搜索
        </LoadingButton>
      </div>
    </div>
  );
};
