import React, { useState, useEffect, useRef } from 'react';
import type { SearchHistory, Template } from '../types';
import { StorageManager } from '../utils/storage';
import { SearchMatcher } from '../utils/searchMatcher';

interface SearchSuggestionsProps {
  template: Template;
  query: string;
  onSelect: (keyword: string) => void;
  onClose: () => void;
  visible: boolean;
  onEnterWithoutSelection?: () => void;
  placeholderName?: string; // 新增：占位符名称，用于获取特定占位符的历史记录
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  template,
  query,
  onSelect,
  onClose,
  visible,
  onEnterWithoutSelection,
  placeholderName
}) => {
  const [suggestions, setSuggestions] = useState<SearchHistory[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState<'time' | 'frequency'>('time');
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载搜索建议
  const loadSuggestions = async () => {
    if (!template) return;

    try {
      setLoading(true);

      // 根据是否有占位符名称来获取对应的历史记录
      let history: SearchHistory[];
      if (placeholderName) {
        // 获取特定占位符的历史记录
        history = await StorageManager.getSortedPlaceholderSearchHistory(template.id, placeholderName);
      } else {
        // 向后兼容：获取所有历史记录
        history = await StorageManager.getSortedSearchHistory(template.id);
      }

      const matches = SearchMatcher.fuzzyMatch(history, query, 8);
      setSuggestions(matches);
      setSelectedIndex(-1);

      // 获取当前排序方式
      const settings = await StorageManager.getGlobalSettings();
      setSortType(settings.historySortType || 'time');
    } catch (error) {
      console.error('加载搜索建议失败:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && template) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [template, query, visible, placeholderName]);

  // 监听Chrome存储变化，实现排序方式变更时的实时更新
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'local') return;

      // 监听全局设置变化
      if (changes.globalSettings && visible && template) {
        loadSuggestions(); // 重新加载以应用新的排序方式
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [visible, template]);

  // 处理键盘导航
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!visible || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          onSelect(suggestions[selectedIndex].keyword);
        } else {
          // 没有选中任何建议时，执行直接搜索
          onEnterWithoutSelection?.();
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, suggestions, selectedIndex]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
    >
      {loading ? (
        <div className="p-3 text-center text-gray-500 text-sm">
          加载中...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="p-3 text-center text-gray-500 text-sm">
          {query.trim() ? '暂无匹配的搜索记录' : '暂无搜索历史'}
        </div>
      ) : (
        <div className="py-1">
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              query={query}
              isSelected={index === selectedIndex}
              onClick={() => onSelect(suggestion.keyword)}
              onMouseEnter={() => setSelectedIndex(index)}
              sortType={sortType}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 搜索建议项组件
interface SuggestionItemProps {
  suggestion: SearchHistory;
  query: string;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  sortType: 'time' | 'frequency';
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({
  suggestion,
  query,
  isSelected,
  onClick,
  onMouseEnter,
  sortType
}) => {
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div
      className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
        isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={isSelected}
    >
      <div className="flex items-center flex-1 min-w-0">
        <svg
          className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {sortType === 'frequency' ? (
            // 频率图标
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          ) : (
            // 时间图标
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          )}
        </svg>
        <span
          className="truncate text-sm"
          dangerouslySetInnerHTML={{
            __html: SearchMatcher.highlightMatch(suggestion.keyword, query)
          }}
        />
      </div>
      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
        {sortType === 'frequency'
          ? `${suggestion.usageCount || 1} 次`
          : formatTime(suggestion.timestamp)
        }
      </span>
    </div>
  );
};
