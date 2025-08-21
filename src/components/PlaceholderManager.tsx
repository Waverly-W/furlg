import React, { useState, useRef } from 'react';
import type { PlaceholderInfo, Template } from '../types';
import { PlaceholderParser } from '../utils/placeholderParser';
import { PlaceholderHistoryManager } from './PlaceholderHistoryManager';

interface PlaceholderManagerProps {
  placeholders: PlaceholderInfo[];
  onPlaceholdersChange: (placeholders: PlaceholderInfo[]) => void;
  onInsertPlaceholder?: (code: string) => void; // 插入占位符到URL模板的回调
  template?: Template; // 模板信息，用于关键词预设管理
  className?: string;
}

interface PlaceholderFormData {
  code: string;
  name: string;
}

export const PlaceholderManager: React.FC<PlaceholderManagerProps> = ({
  placeholders,
  onPlaceholdersChange,
  onInsertPlaceholder,
  template,
  className = ''
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlaceholderFormData>({ code: '', name: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [historyManagerOpen, setHistoryManagerOpen] = useState<string | null>(null); // 当前打开历史管理的占位符ID

  // 验证表单数据
  const validateForm = (data: PlaceholderFormData, excludeId?: string): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!data.code.trim()) {
      newErrors.code = '占位符代码不能为空';
    } else if (!PlaceholderParser.validatePlaceholderCode(data.code)) {
      newErrors.code = '占位符代码格式无效，必须以字母开头，只能包含字母、数字和下划线';
    } else {
      // 检查代码是否重复
      const existingPlaceholder = placeholders.find(p => 
        p.code === data.code && p.id !== excludeId
      );
      if (existingPlaceholder) {
        newErrors.code = '占位符代码已存在';
      }
    }

    if (!data.name.trim()) {
      newErrors.name = '占位符名称不能为空';
    } else if (data.name.length > 50) {
      newErrors.name = '占位符名称不能超过50个字符';
    }

    return newErrors;
  };

  // 处理添加占位符
  const handleAdd = () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newPlaceholder = PlaceholderParser.createPlaceholderInfo(
      formData.code.trim(),
      formData.name.trim()
    );

    onPlaceholdersChange([...placeholders, newPlaceholder]);
    
    // 自动插入到URL模板
    if (onInsertPlaceholder) {
      onInsertPlaceholder(formData.code.trim());
    }

    // 重置表单
    setFormData({ code: '', name: '' });
    setErrors({});
    setShowAddForm(false);
  };

  // 处理编辑占位符
  const handleEdit = (placeholder: PlaceholderInfo) => {
    setEditingId(placeholder.id || '');
    setFormData({ code: placeholder.code, name: placeholder.name });
    setErrors({});
  };

  // 处理保存编辑
  const handleSaveEdit = () => {
    const validationErrors = validateForm(formData, editingId || undefined);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedPlaceholders = placeholders.map(p => 
      p.id === editingId 
        ? { ...p, code: formData.code.trim(), name: formData.name.trim() }
        : p
    );

    onPlaceholdersChange(updatedPlaceholders);
    
    // 重置编辑状态
    setEditingId(null);
    setFormData({ code: '', name: '' });
    setErrors({});
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ code: '', name: '' });
    setErrors({});
    setShowAddForm(false);
  };

  // 处理删除占位符
  const handleDelete = (placeholder: PlaceholderInfo) => {
    if (confirm(`确定要删除占位符 "${placeholder.name}" 吗？`)) {
      const updatedPlaceholders = placeholders.filter(p => p.id !== placeholder.id);
      onPlaceholdersChange(updatedPlaceholders);
    }
  };

  // 复制占位符代码
  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(`{${code}}`);
      // 这里可以添加一个临时的成功提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 打开关键词预设管理
  const handleOpenHistoryManager = (placeholderId: string) => {
    setHistoryManagerOpen(placeholderId);
  };

  // 关闭关键词预设管理
  const handleCloseHistoryManager = () => {
    setHistoryManagerOpen(null);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* 标题和添加按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">占位符管理</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          添加占位符
        </button>
      </div>

      {/* 占位符列表 */}
      <div className="space-y-2">
        {placeholders.map((placeholder) => (
          <div key={placeholder.id} className="border border-gray-200 rounded p-3">
            {editingId === placeholder.id ? (
              // 编辑模式
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="占位符代码"
                      className={`w-full px-2 py-1 text-xs border rounded ${
                        errors.code ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="占位符名称"
                      className={`w-full px-2 py-1 text-xs border rounded ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    保存
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              // 显示模式
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {'{' + placeholder.code + '}'}
                    </span>
                    <span className="text-sm text-gray-900">{placeholder.name}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopy(placeholder.code)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="复制占位符"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {/* 关键词预设管理按钮 */}
                  {template && (
                    <button
                      onClick={() => handleOpenHistoryManager(placeholder.id || '')}
                      className="p-1 text-gray-400 hover:text-purple-600"
                      title="关键词预设管理"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(placeholder)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="编辑占位符"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(placeholder)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="删除占位符"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 添加表单 */}
        {showAddForm && (
          <div className="border border-blue-200 rounded p-3 bg-blue-50">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="占位符代码（如：query）"
                    className={`w-full px-2 py-1 text-xs border rounded ${
                      errors.code ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="占位符名称（如：搜索词）"
                    className={`w-full px-2 py-1 text-xs border rounded ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  添加并插入
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {placeholders.length === 0 && !showAddForm && (
          <div className="text-center py-6 text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-.707.293H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
            </svg>
            <p className="text-sm">暂无占位符</p>
            <p className="text-xs text-gray-400 mt-1">点击"添加占位符"开始创建</p>
          </div>
        )}
      </div>

      {/* 占位符历史管理弹窗 */}
      {template && historyManagerOpen && (
        <PlaceholderHistoryManager
          template={template}
          placeholder={placeholders.find(p => p.id === historyManagerOpen)!}
          isOpen={!!historyManagerOpen}
          onClose={handleCloseHistoryManager}
          onHistoryChange={() => {
            // 历史记录变更时的回调，可以用于刷新相关数据
          }}
        />
      )}
    </div>
  );
};
