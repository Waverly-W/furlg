import React, { useEffect, useState } from 'react'
import type { Template } from '../types'
import { StorageManager } from '../utils/storage'

interface TemplateManagerDraftProps {
  initialTemplates: Template[]
  onChange: (templates: Template[]) => void
  onTemplateUpdate?: () => void
}

interface EditModalProps {
  template: Template | null
  isOpen: boolean
  onClose: () => void
  onSave: (template: Template) => void
}

// 编辑模态弹窗组件
const EditModal: React.FC<EditModalProps> = ({ template, isOpen, onClose, onSave }) => {
  const [editForm, setEditForm] = useState({ name: '', urlPattern: '' })

  useEffect(() => {
    if (template) {
      setEditForm({ name: template.name, urlPattern: template.urlPattern })
    }
  }, [template])

  const handleSave = () => {
    if (!template || !editForm.name.trim() || !editForm.urlPattern.trim()) return
    
    const updatedTemplate: Template = {
      ...template,
      name: editForm.name.trim(),
      urlPattern: editForm.urlPattern.trim(),
      updatedAt: Date.now()
    }
    
    onSave(updatedTemplate)
    onClose()
  }

  if (!isOpen || !template) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[90vw]">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">编辑模板</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">模板名称</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：Bing搜索"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL模板</label>
            <input
              type="text"
              value={editForm.urlPattern}
              onChange={(e) => setEditForm(prev => ({ ...prev, urlPattern: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.bing.com/search?q={keyword}"
            />
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!editForm.name.trim() || !editForm.urlPattern.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export const TemplateManagerDraft: React.FC<TemplateManagerDraftProps> = ({ initialTemplates, onChange, onTemplateUpdate }) => {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => { setTemplates(initialTemplates) }, [initialTemplates])

  const addTemplate = () => {
    const t: Template = {
      id: `template_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
      name: '新模板', 
      urlPattern: 'https://example.com?q={keyword}', 
      createdAt: Date.now(), 
      updatedAt: Date.now()
    }
    const next = [t, ...templates]
    setTemplates(next); onChange(next)
  }

  const remove = (id: string) => {
    const next = templates.filter(t => t.id !== id)
    setTemplates(next); onChange(next)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async (updatedTemplate: Template) => {
    const next = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
    setTemplates(next)
    onChange(next)

    // 立即保存到存储并通知主页面更新
    try {
      await StorageManager.setTemplates(next)
      onTemplateUpdate?.()
    } catch (error) {
      console.error('保存模板失败:', error)
    }
  }

  const handleCloseEdit = () => {
    setEditingTemplate(null)
    setIsEditModalOpen(false)
  }

  return (
    <>
      <div className="flex flex-col h-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">模板管理</h3>
          <button
            onClick={addTemplate}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
          >
            添加模板
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 mb-4">还没有任何模板</div>
              <button
                onClick={addTemplate}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                创建第一个模板
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{t.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 break-all">{t.urlPattern}</p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="编辑"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => remove(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EditModal
        template={editingTemplate}
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
      />
    </>
  )
}
