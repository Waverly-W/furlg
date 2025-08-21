import React, { useState, useEffect } from 'react';
import type { Template } from '../types';
import { StorageManager } from '../utils/storage';
import { UrlBuilder } from '../utils/urlBuilder';
import { LoadingSpinner, LoadingButton } from './LoadingSpinner';
import { TemplateHistoryManager } from './TemplateHistoryManager';

interface TemplateManagerProps {
  onTemplateSelect?: (template: Template) => void;
  onClose?: () => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  onTemplateSelect, 
  onClose 
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateList = await StorageManager.getTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // 删除模板
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('确定要删除这个模板吗？这将同时删除相关的搜索历史记录。')) {
      return;
    }

    try {
      await StorageManager.deleteTemplate(templateId);
      await loadTemplates();
    } catch (error) {
      console.error('删除模板失败:', error);
      alert('删除模板失败，请重试');
    }
  };

  // 选择模板
  const handleSelectTemplate = (template: Template) => {
    onTemplateSelect?.(template);
    onClose?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-gray-500">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">模板管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddingTemplate(true)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            添加模板
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">还没有任何模板</div>
          <button
            onClick={() => setIsAddingTemplate(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            创建第一个模板
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.urlPattern}</p>
                  {template.domain && (
                    <p className="text-xs text-gray-500 mt-1">域名: {template.domain}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {onTemplateSelect && (
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                    >
                      选择
                    </button>
                  )}
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑模板表单 */}
      {(isAddingTemplate || editingTemplate) && (
        <TemplateForm
          template={editingTemplate}
          onSave={async () => {
            await loadTemplates();
            setIsAddingTemplate(false);
            setEditingTemplate(null);
          }}
          onCancel={() => {
            setIsAddingTemplate(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
};

// 模板表单组件
interface TemplateFormProps {
  template?: Template | null;
  onSave: () => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    urlPattern: template?.urlPattern || '',
    domain: template?.domain || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '模板名称不能为空';
    }

    if (!formData.urlPattern.trim()) {
      newErrors.urlPattern = 'URL模板不能为空';
    } else if (!UrlBuilder.validateTemplate(formData.urlPattern)) {
      newErrors.urlPattern = 'URL模板格式无效，必须包含 {keyword} 占位符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存模板
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const templateData: Template = {
        id: template?.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        urlPattern: formData.urlPattern.trim(),
        domain: formData.domain.trim() || undefined,
        createdAt: template?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await StorageManager.saveTemplate(templateData);
      onSave();
    } catch (error) {
      console.error('保存模板失败:', error);
      alert('保存模板失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 应用预设关键词到表单
  const handleApplyKeyword = (keyword: string) => {
    // 这里可以将关键词应用到某个字段，比如作为测试关键词
    // 或者可以显示一个提示，让用户知道可以使用这个关键词进行测试
    alert(`预设关键词: "${keyword}"\n您可以使用此关键词测试模板的搜索功能。`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {template ? '编辑模板' : '添加模板'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模板名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例如：Bing搜索"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL模板 *
            </label>
            <input
              type="text"
              value={formData.urlPattern}
              onChange={(e) => setFormData({ ...formData, urlPattern: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.urlPattern ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://www.bing.com/search?q={keyword}"
            />
            {errors.urlPattern && <p className="text-red-500 text-xs mt-1">{errors.urlPattern}</p>}
            <p className="text-gray-500 text-xs mt-1">
              使用 {'{keyword}'} 作为搜索关键词的占位符
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              关联域名（可选）
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="www.bing.com"
            />
            <p className="text-gray-500 text-xs mt-1">
              设置后可在对应网站自动选择此模板
            </p>
          </div>

          {/* 关键词预设管理 - 仅在编辑现有模板时显示 */}
          {template && (
            <TemplateHistoryManager
              key={historyRefreshKey}
              template={template}
              onHistoryChange={() => {
                // 关键词预设变更时刷新组件
                setHistoryRefreshKey(prev => prev + 1);
              }}
              onApplyKeyword={handleApplyKeyword}
              className="mt-4"
            />
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <LoadingButton
            loading={saving}
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            保存
          </LoadingButton>
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
