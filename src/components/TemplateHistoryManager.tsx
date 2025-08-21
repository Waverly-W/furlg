import React, { useState, useEffect } from 'react';
import type { SearchHistory, Template } from '../types';
import { StorageManager } from '../utils/storage';
import { LoadingSpinner } from './LoadingSpinner';

interface TemplateHistoryManagerProps {
  template: Template;
  onHistoryChange?: () => void;
  onApplyKeyword?: (keyword: string) => void;
  className?: string;
}

export const TemplateHistoryManager: React.FC<TemplateHistoryManagerProps> = ({
  template,
  onHistoryChange,
  onApplyKeyword,
  className = ''
}) => {
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  // 加载该模板的关键词预设
  const loadHistory = async () => {
    try {
      setLoading(true);
      const templateHistory = await StorageManager.getSearchHistory(template.id);
      setHistory(templateHistory);
    } catch (error) {
      console.error('加载模板关键词预设失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [template.id]);

  // 过滤关键词预设
  const filteredHistory = history.filter(h => {
    if (!searchQuery.trim()) return true;
    return h.keyword.toLowerCase().includes(searchQuery.toLowerCase().trim());
  }).sort((a, b) => b.timestamp - a.timestamp);

  // 格式化时间
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

  // 清空该模板的所有关键词预设
  const handleClearAll = async () => {
    if (!confirm(`确定要清空"${template.name}"的所有关键词预设吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await StorageManager.deleteHistoryByTemplate(template.id);
      await loadHistory();
      setSelectedItems(new Set());
      onHistoryChange?.();
    } catch (error) {
      console.error('清空关键词预设失败:', error);
      alert('清空失败，请重试');
    }
  };

  // 应用预设关键词
  const handleApplyKeyword = (keyword: string) => {
    onApplyKeyword?.(keyword);
  };

  // 导入关键词预设
  const handleImportKeywords = async () => {
    if (!importText.trim()) {
      alert('请输入要导入的关键词');
      return;
    }

    try {
      setImporting(true);

      // 解析导入文本，每行一个关键词
      const keywords = importText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0); // 过滤空行

      if (keywords.length === 0) {
        alert('没有找到有效的关键词');
        return;
      }

      // 获取现有的关键词，避免重复
      const existingKeywords = new Set(history.map(h => h.keyword));
      const newKeywords = keywords.filter(keyword => !existingKeywords.has(keyword));

      if (newKeywords.length === 0) {
        alert('所有关键词都已存在，无需导入');
        return;
      }

      // 批量添加关键词预设
      for (const keyword of newKeywords) {
        await StorageManager.addSearchHistory(template.id, keyword);
      }

      // 刷新列表
      await loadHistory();
      onHistoryChange?.();

      // 重置导入状态
      setImportText('');
      setShowImportDialog(false);

      alert(`成功导入 ${newKeywords.length} 个关键词预设${keywords.length > newKeywords.length ? `，跳过 ${keywords.length - newKeywords.length} 个重复项` : ''}`);
    } catch (error) {
      console.error('导入关键词预设失败:', error);
      alert('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  // 切换选中状态
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

  if (loading) {
    return (
      <div className={`${className} p-4 border border-gray-200 rounded-lg bg-gray-50`}>
        <div className="flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-500">加载关键词预设中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} border border-gray-200 rounded-lg bg-gray-50`}>
      {/* 头部 */}
      <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              关键词预设管理
            </button>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {history.length} 条
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
            >
              导入关键词
            </button>
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
              >
                清空全部
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 展开的内容 */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* 搜索框和操作按钮 */}
          {history.length > 0 && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="搜索关键词预设..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {filteredHistory.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {selectedItems.size === filteredHistory.length ? '取消全选' : '全选'}
                    </button>
                    {selectedItems.size > 0 && (
                      <span className="text-gray-500">已选中 {selectedItems.size} 项</span>
                    )}
                  </div>
                  
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      删除选中
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 关键词预设列表 */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">
                  {searchQuery.trim() ? '没有找到匹配的关键词预设' : '暂无关键词预设'}
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
                  onApply={() => handleApplyKeyword(item.keyword)}
                  formatTime={formatTime}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* 导入关键词对话框 */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-w-[90vw] mx-4">
            <h3 className="text-lg font-semibold mb-4">导入关键词预设</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关键词列表（每行一个关键词）
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="请输入关键词，每行一个，例如：&#10;React教程&#10;JavaScript基础&#10;前端开发"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  支持批量导入，重复的关键词将自动跳过
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleImportKeywords}
                disabled={importing || !importText.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {importing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">导入中...</span>
                  </>
                ) : (
                  '导入'
                )}
              </button>
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportText('');
                }}
                disabled={importing}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 关键词预设项组件
interface HistoryItemProps {
  history: SearchHistory;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onApply: () => void;
  formatTime: (timestamp: number) => string;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  history,
  isSelected,
  onToggleSelect,
  onDelete,
  onApply,
  formatTime
}) => {
  return (
    <div className={`p-2 rounded border transition-colors ${
      isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {history.keyword}
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(history.timestamp)}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={onApply}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="应用到输入框"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="删除"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
