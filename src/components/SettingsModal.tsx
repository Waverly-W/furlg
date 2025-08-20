import React, { useEffect, useRef, useState } from 'react'
import { StorageManager } from '../utils/storage'
import type { GlobalSettings, OpenBehavior, Template } from '../types'
import { TemplateManagerDraft } from './TemplateManagerDraft'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  onApply?: (settings: GlobalSettings) => void
  onTemplatesSaved?: (templates: Template[]) => void
}

const defaultSettings: GlobalSettings = {
  openBehavior: 'newtab',
  topHintEnabled: true,
  topHintTitle: '搜索模板',
  topHintSubtitle: '选择任意模板开始搜索'
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, onApply, onTemplatesSaved }) => {
  const [draftTemplates, setDraftTemplates] = useState<Template[]>([])

  const [activeTab, setActiveTab] = useState<'global' | 'templates'>('global')
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings)
  const dialogRef = useRef<HTMLDivElement>(null)

  // 加载全局设置
  useEffect(() => {
    if (!open) return
    ;(async () => {
      const s = await StorageManager.getGlobalSettings()
      setSettings(s)
      // 载入当前模板为草稿
      const t = await StorageManager.getTemplates()
      setDraftTemplates(t)
    })()
  }, [open])

  // 关闭事件: ESC 与点击遮罩
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleMaskClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  // 暂存：只更新本地草稿，保存时一次性写入存储
  const setOpenBehavior = (v: OpenBehavior) => setSettings((p) => ({ ...p, openBehavior: v }))
  const setTopHintEnabled = (v: boolean) => setSettings((p) => ({ ...p, topHintEnabled: v }))
  const setTopHintTitle = (v: string) => setSettings((p) => ({ ...p, topHintTitle: v }))
  const setTopHintSubtitle = (v: string) => setSettings((p) => ({ ...p, topHintSubtitle: v }))

  if (!open) return null

  return (
    <div
      ref={dialogRef}
      onMouseDown={handleMaskClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    >
      <div className="bg-white rounded-xl shadow-2xl w-[920px] max-w-[95vw] h-[80vh] overflow-hidden border border-gray-200 flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/60">
          <h2 className="text-lg font-semibold text-gray-900">设置</h2>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* 左侧导航 */}
          <aside className="w-56 border-r border-gray-200 bg-white flex-shrink-0">
            <nav className="py-2">
              <button
                onClick={() => setActiveTab('global')}
                className={`w-full text-left px-5 py-2.5 transition-colors ${
                  activeTab === 'global'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                全局设置
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`w-full text-left px-5 py-2.5 transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                模板管理
              </button>
            </nav>
          </aside>

          {/* 右侧内容 */}
          <section className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'global' ? (
              <div className="p-6 space-y-8 overflow-y-auto">
                {/* 搜索行为设置 */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">搜索行为设置</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="openBehavior"
                        checked={settings.openBehavior === 'current'}
                        onChange={() => setOpenBehavior('current')}
                      />
                      <span className="text-sm text-gray-700">在当前标签页打开</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="openBehavior"
                        checked={settings.openBehavior === 'newtab'}
                        onChange={() => setOpenBehavior('newtab')}
                      />
                      <span className="text-sm text-gray-700">在新标签页打开</span>
                    </label>
                  </div>
                </div>

                {/* 界面显示设置 */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">界面显示设置</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">顶部提示文案</span>
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={settings.topHintEnabled}
                        onChange={(e) => setTopHintEnabled(e.target.checked)}
                      />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 text-sm disabled:opacity-50"
                        placeholder="顶部标题（如：搜索模板）"
                        value={settings.topHintTitle}
                        onChange={(e) => setTopHintTitle(e.target.value)}
                        disabled={!settings.topHintEnabled}
                      />
                      <input
                        type="text"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 text-sm disabled:opacity-50"
                        placeholder="顶部副标题（如：选择任意模板开始搜索）"
                        value={settings.topHintSubtitle}
                        onChange={(e) => setTopHintSubtitle(e.target.value)}
                        disabled={!settings.topHintEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <TemplateManagerDraft
                  initialTemplates={draftTemplates}
                  onChange={setDraftTemplates}
                  onTemplateUpdate={() => onTemplatesSaved?.(draftTemplates)}
                />
              </div>
            )}
          </section>
        </div>

        {/* 底部 */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={async () => {
              await StorageManager.setTemplates(draftTemplates)
              const updated = await StorageManager.saveGlobalSettings(settings)
              onApply?.(updated)
              onTemplatesSaved?.(draftTemplates)
              onClose()
            }}
            className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
}

