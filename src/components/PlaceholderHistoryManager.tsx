import React, { useState, useEffect } from 'react';
import type { SearchHistory, Template, PlaceholderInfo } from '../types';
import { StorageManager } from '../utils/storage';
import { LoadingSpinner } from './LoadingSpinner';

interface PlaceholderHistoryManagerProps {
  template: Template;
  placeholder: PlaceholderInfo;
  isOpen: boolean;
  onClose: () => void;
  onHistoryChange?: () => void;
}

export const PlaceholderHistoryManager: React.FC<PlaceholderHistoryManagerProps> = ({
  template,
  placeholder,
  isOpen,
  onClose,
  onHistoryChange
}) => {
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<'time' | 'frequency'>('time');

  // 加载该占位符的关键词预设
  const loadHistory = async () => {
    try {
      setLoading(true);
      const placeholderHistory = await StorageManager.getSortedPlaceholderSearchHistory(
        template.id, 
        placeholder.code
      );
      setHistory(placeholderHistory);

      // 获取当前排序方式
      const settings = await StorageManager.getGlobalSettings();
      setSortType(settings.historySortType || 'time');
    } catch (error) {
      console.error('加载占位符关键词预设失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, template.id, placeholder.code]);

  // 监听Chrome存储变化，实现排序方式变更时的实时更新
  useEffect(() => {
    if (!isOpen) return;

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'local') return;

      // 监听全局设置变化
      if (changes.globalSettings) {
        loadHistory(); // 重新加载以应用新的排序方式
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [isOpen]);

  // 过滤关键词预设（保持原有排序）
  const filteredHistory = history.filter(h => {
    if (!searchQuery.trim()) return true;
    return h.keyword.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  // 切换选择状态
  const toggleSelection = (historyId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(historyId)) {
      newSelected.delete(historyId);
    } else {
      newSelected.add(historyId);
    }
    setSelectedItems(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map(h => h.id)));
    }
  };

  // 删除单个关键词预设
  const handleDeleteHistory = async (historyId: string) => {
    try {
      await StorageManager.deleteSearchHistory(historyId);
      await loadHistory();
      onHistoryChange?.();
    } catch (error) {
      console.error('删除关键词预设失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 批量删除选中的关键词预设
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    if (!confirm(`确定要删除选中的 ${selectedItems.size} 条关键词预设吗？`)) {
      return;
    }

    try {
      await StorageManager.deleteMultipleSearchHistory(Array.from(selectedItems));
      await loadHistory();
      setSelectedItems(new Set());
      onHistoryChange?.();
    } catch (error) {
      console.error('批量删除关键词预设失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 格式化时间显示
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
    
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const formatCreatedTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                占位符关键词预设管理
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                占位符：<span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600">
                  {'{' + placeholder.code + '}'}
                </span> - {placeholder.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {history.length} 条记录
            </span>
            <span className="text-xs text-gray-500">
              排序方式：{sortType === 'time' ? '按时间' : '按频率'}
            </span>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : (
            <>
              {/* 搜索框和操作按钮 */}
              {history.length > 0 && (
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="搜索关键词预设..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  {filteredHistory.length > 0 && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === filteredHistory.length && filteredHistory.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        全选 ({selectedItems.size}/{filteredHistory.length})
                      </label>

                      {selectedItems.size > 0 && (
                        <button
                          onClick={handleDeleteSelected}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          删除选中 ({selectedItems.size})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 关键词预设列表 */}
              <div className="space-y-2">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">
                      {searchQuery.trim() ? '没有找到匹配的关键词预设' : '暂无关键词预设'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      在主页搜索时会自动记录关键词预设
                    </p>
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <HistoryItem
                      key={item.id}
                      history={item}
                      isSelected={selectedItems.has(item.id)}
                      onToggleSelect={() => toggleSelection(item.id)}
                      onDelete={() => handleDeleteHistory(item.id)}
                      formatTime={formatTime}
                      formatCreatedTime={formatCreatedTime}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 关键词预设项组件
interface HistoryItemProps {
  history: SearchHistory;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  formatTime: (timestamp: number) => string;
  formatCreatedTime: (timestamp: number) => string;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  history,
  isSelected,
  onToggleSelect,
  onDelete,
  formatTime,
  formatCreatedTime
}) => {
  return (
    <div className={`p-3 rounded border transition-colors ${
      isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {history.keyword}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>使用 {history.usageCount || 1} 次</span>
              <span>•</span>
              <span>{formatTime(history.timestamp)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              创建于 {formatCreatedTime(history.createdAt || history.timestamp)}
            </p>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="删除此记录"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
