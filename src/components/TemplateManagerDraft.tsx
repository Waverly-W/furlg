import React, { useEffect, useState, useRef } from 'react'
import type { Template, PlaceholderInfo, TemplatePlaceholderValidationResult } from '../types'
import { StorageManager } from '../utils/storage'
import { PlaceholderParser } from '../utils/placeholderParser'
import { PlaceholderManager } from './PlaceholderManager'

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
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([])
  const [consistencyValidation, setConsistencyValidation] = useState<TemplatePlaceholderValidationResult>({
    isValid: true,
    errors: [],
    missingInList: [],
    missingInTemplate: [],
    usedPlaceholders: []
  })
  const urlPatternRef = useRef<HTMLTextAreaElement>(null)

  // 初始化表单和占位符列表
  useEffect(() => {
    if (template) {
      setEditForm({ name: template.name, urlPattern: template.urlPattern })

      // 如果模板已有占位符列表，使用现有的
      if (template.placeholders && template.placeholders.length > 0) {
        setPlaceholders(template.placeholders)
      } else {
        // 否则从URL模板自动生成（数据迁移）
        const generatedPlaceholders = PlaceholderParser.generatePlaceholderListFromTemplate(template.urlPattern)
        setPlaceholders(generatedPlaceholders)
      }
    }
  }, [template])

  // 监听URL模板和占位符列表变化，验证一致性
  useEffect(() => {
    if (editForm.urlPattern.trim()) {
      const validation = PlaceholderParser.validateTemplatePlaceholderConsistency(
        editForm.urlPattern,
        placeholders
      )
      setConsistencyValidation(validation)
    } else {
      setConsistencyValidation({
        isValid: true,
        errors: [],
        missingInList: [],
        missingInTemplate: [],
        usedPlaceholders: []
      })
    }
  }, [editForm.urlPattern, placeholders])

  // 插入占位符到URL模板
  const handleInsertPlaceholder = (code: string) => {
    const textarea = urlPatternRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const placeholder = `{${code}}`

    const newValue = editForm.urlPattern.substring(0, start) +
                     placeholder +
                     editForm.urlPattern.substring(end)

    setEditForm(prev => ({ ...prev, urlPattern: newValue }))

    // 设置光标位置到插入的占位符之后
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length)
    }, 0)
  }

  // 同步占位符列表
  const handleSyncPlaceholders = () => {
    const syncedPlaceholders = PlaceholderParser.syncPlaceholderList(editForm.urlPattern, placeholders)
    setPlaceholders(syncedPlaceholders)
  }

  const handleSave = () => {
    if (!template || !editForm.name.trim() || !editForm.urlPattern.trim() || !consistencyValidation.isValid || placeholders.length === 0) return
    
    const updatedTemplate: Template = {
      ...template,
      name: editForm.name.trim(),
      urlPattern: editForm.urlPattern.trim(),
      placeholders: placeholders,
      updatedAt: Date.now()
    }
    
    onSave(updatedTemplate)
    onClose()
  }

  if (!isOpen || !template) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
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
            <textarea
              ref={urlPatternRef}
              value={editForm.urlPattern}
              onChange={(e) => setEditForm(prev => ({ ...prev, urlPattern: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                !consistencyValidation.isValid ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="例如：https://www.bing.com/search?q={query}&cat={category}"
              rows={3}
            />

            {/* 一致性验证提示 */}
            {!consistencyValidation.isValid && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-red-600 text-sm font-medium">占位符不一致：</p>
                    <ul className="text-red-600 text-xs mt-1 list-disc list-inside">
                      {consistencyValidation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={handleSyncPlaceholders}
                    className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    同步占位符
                  </button>
                </div>
              </div>
            )}

            <p className="text-gray-500 text-xs mt-1">
              在下方的占位符管理区域添加占位符，然后在URL模板中使用 {'{占位符代码}'} 格式引用。
            </p>
          </div>

          {/* 占位符管理区域 */}
          <PlaceholderManager
            placeholders={placeholders}
            onPlaceholdersChange={setPlaceholders}
            onInsertPlaceholder={handleInsertPlaceholder}
            template={template}
          />
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
            disabled={!editForm.name.trim() || !editForm.urlPattern.trim() || !consistencyValidation.isValid || placeholders.length === 0}
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
