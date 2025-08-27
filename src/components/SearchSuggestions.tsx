import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  onSelectionChange?: (hasSelection: boolean, selectedKeyword?: string) => void; // 新增：选中状态变化回调
  anchorRef?: React.RefObject<HTMLElement>; // 新增：锚点元素（通常为输入框容器或输入框）
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  template,
  query,
  onSelect,
  onClose,
  visible,
  onEnterWithoutSelection,
  placeholderName,
  onSelectionChange,
  anchorRef
}) => {
  const [suggestions, setSuggestions] = useState<SearchHistory[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState<'time' | 'frequency'>('time');
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const positionRef = useRef<{ top: number; left: number; width: number } | null>(null)
  const measureRef = useRef<HTMLDivElement>(null); // 用于测量文本宽度的隐藏元素

  // 计算建议项的最佳宽度
  const calculateOptimalWidth = (suggestions: SearchHistory[], minWidth: number): number => {
    if (!measureRef.current || suggestions.length === 0) {
      return minWidth;
    }

    const measureEl = measureRef.current;
    let maxWidth = minWidth;

    suggestions.forEach(suggestion => {
      // 创建临时测量元素
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'nowrap';
      tempSpan.style.fontSize = '14px'; // text-sm
      tempSpan.style.fontFamily = getComputedStyle(measureEl).fontFamily;

      // 设置文本内容（包括图标和时间的估算宽度）
      const alias = ((suggestion as any).alias || suggestion.keyword) as string
      const display = alias === suggestion.keyword ? alias : `${alias} (${suggestion.keyword})`
      tempSpan.textContent = display;
      document.body.appendChild(tempSpan);

      // 计算总宽度：文本宽度 + 图标(16px) + 间距(8px) + 时间文本(约60px) + 内边距(24px)
      const textWidth = tempSpan.offsetWidth;
      const totalWidth = textWidth + 16 + 8 + 60 + 24;

      maxWidth = Math.max(maxWidth, totalWidth);
      document.body.removeChild(tempSpan);
    });

    // 设置最大宽度限制，避免过宽
    const maxAllowedWidth = Math.min(window.innerWidth * 0.6, 500);
    return Math.min(maxWidth, maxAllowedWidth);
  };

  // 基于 anchor 定位（仅在可见且锚点存在时）
  useLayoutEffect(() => {
    if (!visible) return
    const update = () => {
      const el = anchorRef?.current
      if (!el) { setPosition(null); positionRef.current = null; return }
      const r = el.getBoundingClientRect()

      // 计算最佳宽度
      const minWidth = r.width;
      const optimalWidth = calculateOptimalWidth(suggestions, minWidth);

      const next = { top: r.bottom + 4, left: r.left, width: optimalWidth }
      const prev = positionRef.current
      if (!prev || prev.top !== next.top || prev.left !== next.left || prev.width !== next.width) {
        positionRef.current = next
        setPosition(next)
      }
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [visible, anchorRef, suggestions]) // 添加 suggestions 依赖

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
      // 自动选中第一个建议项（如果有建议的话）
      const newSelectedIndex = matches.length > 0 ? 0 : -1;
      setSelectedIndex(newSelectedIndex);

      // 通知父组件选中状态变化
      if (onSelectionChange) {
        const hasSelection = newSelectedIndex >= 0 && matches.length > 0;
        const selectedKeyword = hasSelection ? matches[newSelectedIndex].keyword : undefined;
        onSelectionChange(hasSelection, selectedKeyword);
      }

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

  // 将回调存入ref，避免依赖变化导致的不必要effect触发
  const onSelectionChangeRef = useRef<typeof onSelectionChange | undefined>(onSelectionChange)
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange }, [onSelectionChange])

  // 仅在选中状态真实变化时通知父组件，避免循环更新
  const lastSelectionRef = useRef<{ hasSelection: boolean; keyword?: string }>({ hasSelection: false })
  useEffect(() => {
    if (!visible) return
    const hasSelection = selectedIndex >= 0 && selectedIndex < suggestions.length
    const selectedKeyword = hasSelection ? suggestions[selectedIndex].keyword : undefined
    const last = lastSelectionRef.current
    if (last.hasSelection !== hasSelection || last.keyword !== selectedKeyword) {
      lastSelectionRef.current = { hasSelection, keyword: selectedKeyword }
      onSelectionChangeRef.current?.(hasSelection, selectedKeyword)
    }
  }, [selectedIndex, suggestions, visible]);

  // 监听Chrome存储变化，实现排序方式与历史记录变更时的实时更新
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'local') return;

      if (!visible || !template) return;

      // 全局设置变化（排序方式等）或历史记录变化（别名/关键词预设更新）
      if (changes.globalSettings || changes.searchHistory) {
        loadSuggestions();
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

  // 点击外部关闭：忽略锚点内点击
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const panel = containerRef.current
      const anchor = anchorRef?.current
      const target = event.target as Node
      if (!panel) return
      const clickedInsidePanel = panel.contains(target)
      const clickedInsideAnchor = anchor ? anchor.contains(target) : false
      if (!clickedInsidePanel && !clickedInsideAnchor) {
        onClose()
      }
    }
    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose, anchorRef]);

  if (!visible) return null

  const panel = (
    <>
      {/* 隐藏的测量元素 */}
      <div
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          fontSize: '14px'
        }}
      />

      <div
        ref={containerRef}
        className="fixed bg-white/95 backdrop-blur border border-gray-200 rounded-md shadow-lg z-[1000] max-h-64 overflow-y-auto"
        style={{ top: position?.top, left: position?.left, width: position?.width }}
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

          {/* 交互提示 */}
          {suggestions.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {selectedIndex >= 0 ? (
                    <span className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                      按 Enter 使用选中项
                    </span>
                  ) : (
                    '↑↓ 选择 • Enter 搜索'
                  )}
                </span>
                <span>Esc 关闭</span>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );

  // Portal 渲染为 overlay，避免影响瀑布流测量
  return createPortal(panel, document.body)
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
      className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-all duration-150 ${
        isSelected
          ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500 shadow-sm'
          : 'hover:bg-gray-50 border-l-4 border-transparent'
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
        <span className="text-sm whitespace-nowrap">
          {(() => {
            const alias = ((suggestion as any).alias || suggestion.keyword) as string
            const prefer = SearchMatcher.getPreferredMatchField(suggestion, query)
            const aliasHTML = SearchMatcher.highlightMatch(alias, query)
            const keywordHTML = SearchMatcher.highlightMatch(suggestion.keyword, query)
            if (alias === suggestion.keyword) {
              return <span dangerouslySetInnerHTML={{ __html: prefer === 'alias' || prefer === 'keyword' ? aliasHTML : alias }} />
            }
            return (
              <>
                <span className="text-sm text-gray-900" dangerouslySetInnerHTML={{ __html: prefer === 'alias' ? aliasHTML : alias }} />
                <span className="text-xs text-gray-500 ml-2" dangerouslySetInnerHTML={{ __html: `(${prefer === 'keyword' ? keywordHTML : suggestion.keyword})` }} />
              </>
            )
          })()}
        </span>
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
