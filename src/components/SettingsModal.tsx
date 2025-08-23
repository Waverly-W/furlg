import React, { useEffect, useRef, useState } from 'react'
import { StorageManager } from '../utils/storage'
import type { GlobalSettings, OpenBehavior, Template, HistorySortType } from '../types'
import { TemplateManagerDraft } from './TemplateManagerDraft'
import { SidebarUtils } from '../utils/sidebarUtils'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  onApply?: (settings: GlobalSettings) => void
  onTemplatesSaved?: (templates: Template[]) => void
  templates?: Template[] // 用于计算侧边栏最小宽度
  onSidebarWidthChange?: (width: number) => void // 实时预览回调
}

const defaultSettings: GlobalSettings = {
  openBehavior: 'newtab',
  topHintEnabled: true,
  topHintTitle: '搜索模板',
  topHintSubtitle: '选择任意模板开始搜索',
  historySortType: 'time',
  sidebarWidth: SidebarUtils.DEFAULT_WIDTH
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  onApply,
  onTemplatesSaved,
  templates = [],
  onSidebarWidthChange
}) => {
  const [draftTemplates, setDraftTemplates] = useState<Template[]>([])

  const [activeTab, setActiveTab] = useState<'global' | 'templates'>('global')
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings)
  const dialogRef = useRef<HTMLDivElement>(null)

  // 侧边栏宽度相关状态
  const [sidebarWidthRange, setSidebarWidthRange] = useState(() =>
    SidebarUtils.getWidthRange(templates)
  )
  const [isMobile, setIsMobile] = useState(SidebarUtils.isMobile())

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

  // 监听模板变化，更新侧边栏宽度范围
  useEffect(() => {
    const newRange = SidebarUtils.getWidthRange(templates);
    setSidebarWidthRange(newRange);

    // 如果当前设置的宽度超出了新的范围，自动调整
    if (settings.sidebarWidth) {
      const validatedWidth = SidebarUtils.validateWidth(settings.sidebarWidth, templates);
      if (validatedWidth !== settings.sidebarWidth) {
        setSettings(prev => ({ ...prev, sidebarWidth: validatedWidth }));
      }
    }
  }, [templates, settings.sidebarWidth]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = SidebarUtils.isMobile();
      setIsMobile(newIsMobile);

      if (!newIsMobile) {
        const newRange = SidebarUtils.getWidthRange(templates);
        setSidebarWidthRange(newRange);

        // 重新验证当前宽度
        if (settings.sidebarWidth) {
          const validatedWidth = SidebarUtils.validateWidth(settings.sidebarWidth, templates);
          if (validatedWidth !== settings.sidebarWidth) {
            setSettings(prev => ({ ...prev, sidebarWidth: validatedWidth }));
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [templates, settings.sidebarWidth]);

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
  const setHistorySortType = (v: HistorySortType) => setSettings((p) => ({ ...p, historySortType: v }))

  // 侧边栏宽度设置
  const setSidebarWidth = (width: number) => {
    const validatedWidth = SidebarUtils.validateWidth(width, templates);
    setSettings((p) => ({ ...p, sidebarWidth: validatedWidth }));

    // 实时预览
    if (onSidebarWidthChange) {
      onSidebarWidthChange(validatedWidth);
    }
  }

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

                    {/* 侧边栏宽度设置 - 仅在桌面端显示 */}
                    {!isMobile && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">侧边栏宽度</span>
                          <span className="text-xs text-gray-500">
                            {settings.sidebarWidth || sidebarWidthRange.default}px
                          </span>
                        </div>

                        <div className="space-y-2">
                          {/* 滑块控件 */}
                          <input
                            type="range"
                            min={sidebarWidthRange.min}
                            max={sidebarWidthRange.max}
                            step="1"
                            value={settings.sidebarWidth || sidebarWidthRange.default}
                            onChange={(e) => setSidebarWidth(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />

                          {/* 范围提示 */}
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>最小: {sidebarWidthRange.min}px</span>
                            <span>最大: {sidebarWidthRange.max}px</span>
                          </div>

                          {/* 快捷设置按钮 */}
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setSidebarWidth(sidebarWidthRange.min)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                            >
                              最小
                            </button>
                            <button
                              type="button"
                              onClick={() => setSidebarWidth(sidebarWidthRange.default)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                            >
                              默认
                            </button>
                            <button
                              type="button"
                              onClick={() => setSidebarWidth(sidebarWidthRange.suggested)}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            >
                              推荐
                            </button>
                          </div>

                          {/* 说明文字 */}
                          <p className="text-xs text-gray-500 mt-2">
                            最小宽度根据模板名称长度自动计算，确保所有内容都能完整显示
                          </p>

                          {/* 调试信息 - 开发时可以启用 */}
                          {process.env.NODE_ENV === 'development' && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-400 cursor-pointer">调试信息</summary>
                              <div className="text-xs text-gray-400 mt-1 space-y-1">
                                {(() => {
                                  const details = SidebarUtils.getWidthCalculationDetails(templates);
                                  return (
                                    <div className="font-mono">
                                      <div>模板数量: {details.templateCount}</div>
                                      <div>最长模板: "{details.longestTemplateName}" ({details.longestTemplateWidth.toFixed(1)}px)</div>
                                      <div>平均宽度: {details.averageTemplateWidth.toFixed(1)}px</div>
                                      <div>计算最小宽度: {details.calculatedMinWidth.toFixed(1)}px</div>
                                      <div>最终最小宽度: {details.finalMinWidth}px</div>
                                      <div>推荐宽度: {details.suggestedWidth}px</div>
                                      <div className="mt-1 text-gray-500">
                                        组成: {details.breakdown.paddingLeft} + {details.breakdown.iconWidth} + {details.breakdown.iconMargin} + {details.breakdown.textWidth.toFixed(1)} + {details.breakdown.paddingRight} + {details.breakdown.scrollbarWidth} + {details.breakdown.extraPadding}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    )}

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

                {/* 历史记录排序设置 */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">历史记录排序</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="historySortType"
                        checked={settings.historySortType === 'time'}
                        onChange={() => setHistorySortType('time')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm text-gray-700">按添加时间排序</span>
                        <p className="text-xs text-gray-500 mt-1">最新添加的关键词显示在前面</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="historySortType"
                        checked={settings.historySortType === 'frequency'}
                        onChange={() => setHistorySortType('frequency')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm text-gray-700">按使用频率排序</span>
                        <p className="text-xs text-gray-500 mt-1">使用次数最多的关键词显示在前面</p>
                      </div>
                    </label>
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

