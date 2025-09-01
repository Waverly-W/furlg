import React, { useEffect, useRef, useState } from 'react'
import { StorageManager } from '../utils/storage'
import type { GlobalSettings, OpenBehavior, Template, HistorySortType, CardStyleSettings, DockShortcut } from '../types'
import { TemplateManagerDraft } from './TemplateManagerDraft'
import DockSettingsPanel from './DockSettingsPanel'
import { SidebarUtils } from '../utils/sidebarUtils'
import GeneralSettingsPanel from './settings/GeneralSettingsPanel'
import StyleGlobalPanel from './settings/Style/StyleGlobalPanel'
import StyleCardsPanel from './settings/Style/StyleCardsPanel'
import StyleSearchBoxPanel from './settings/Style/StyleSearchBoxPanel'
import StyleButtonsPanel from './settings/Style/StyleButtonsPanel'
import StyleTextPanel from './settings/Style/StyleTextPanel'
import { useCardStyle } from './settings/hooks/useCardStyle'

// 设置面板的主要分类
type SettingsCategory = 'general' | 'templates' | 'style' | 'history' | 'dock';

// 样式设置的子分类
type StyleSubCategory = 'global' | 'cards' | 'searchBox' | 'buttons' | 'text';

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  onApply?: (settings: GlobalSettings) => void
  onTemplatesSaved?: (templates: Template[]) => void
  templates?: Template[] // 用于计算侧边栏最小宽度
  onSidebarWidthChange?: (width: number) => void // 实时预览回调
  onBackgroundChange?: (settings: { backgroundImage?: string, backgroundMaskOpacity?: number, backgroundBlur?: number }) => void // 背景实时预览回调
  onCardStyleChange?: (cardStyle: CardStyleSettings) => void // 卡片样式实时预览回调
  onDockShortcutsChange?: (shortcuts: DockShortcut[]) => void // Dock快捷方式变化回调
}

const defaultSettings: GlobalSettings = {
  openBehavior: 'newtab',
  topHintEnabled: true,
  topHintTitle: '搜索模板',
  topHintSubtitle: '选择任意模板开始搜索',
  historySortType: 'time',
  sidebarWidth: SidebarUtils.DEFAULT_WIDTH,
  backgroundImage: undefined,
  backgroundMaskOpacity: 30,
  backgroundBlur: 0,
  dockSettings: {
    enabled: true,
    maxDisplayCount: 8,
    position: 'bottom'
  },
  cardStyle: {
    // 卡片布局设置
    cardSpacing: 20,
    cardBackgroundColor: '#ffffff',
    cardOpacity: 98,
    cardMaskOpacity: 8,
    cardBlurStrength: 16,

    // 卡片边框设置
    cardBorderEnabled: true,
    cardBorderColor: '#e2e8f0',
    cardBorderWidth: 1,
    cardBorderStyle: 'solid',

    // 卡片标题样式
    titleFontSize: 17,
    titleFontColor: '#1e293b',
    titleFontWeight: '600',

    // 搜索框样式
    searchBoxBorderRadius: 12,
    searchBoxBackgroundColor: '#f8fafc',
    searchBoxBorderColor: '#cbd5e1',
    searchBoxFontSize: 15,
    searchBoxTextColor: '#334155',
    searchBoxPlaceholderColor: '#94a3b8',

    // 搜索按钮样式
    searchButtonBorderRadius: 12,
    searchButtonBackgroundColor: '#3b82f6',
    searchButtonTextColor: '#ffffff',
    searchButtonHoverColor: '#2563eb'
  }
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  onApply,
  onTemplatesSaved,
  templates = [],
  onSidebarWidthChange,
  onBackgroundChange,
  onCardStyleChange,
  onDockShortcutsChange
}) => {
  const [draftTemplates, setDraftTemplates] = useState<Template[]>([])
  const [dockShortcuts, setDockShortcuts] = useState<DockShortcut[]>([])

  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings)
  const dialogRef = useRef<HTMLDivElement>(null)

  // 导航状态
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general')
  const [activeStyleSubCategory, setActiveStyleSubCategory] = useState<StyleSubCategory>('global')

  // 侧边栏宽度相关状态
  const [sidebarWidthRange, setSidebarWidthRange] = useState(() =>
    SidebarUtils.getWidthRange(templates)
  )
  const [isMobile, setIsMobile] = useState(SidebarUtils.isMobile())

  // 背景设置已迁移到增强背景设置组件

  // 加载全局设置
  useEffect(() => {
    if (!open) return
    ;(async () => {
      const s = await StorageManager.getGlobalSettings()
      setSettings(s)
      // 载入当前模板为草稿
      const t = await StorageManager.getTemplates()
      setDraftTemplates(t)
      // 载入Dock快捷方式
      const d = await StorageManager.getDockShortcuts()
      setDockShortcuts(d)
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

  // 背景设置函数已迁移到增强背景设置组件

  // 处理增强背景设置
  const handleEnhancedBackgroundChange = (backgroundSettings: {
    backgroundImage?: string,
    backgroundImageId?: string,
    backgroundMaskOpacity?: number,
    backgroundBlur?: number
  }) => {
    console.log('🎨 增强背景设置实时预览:', backgroundSettings);

    setSettings((prev) => {
      const newSettings = { ...prev };

      if (backgroundSettings.backgroundImage !== undefined) {
        console.log('📷 设置背景图片:', backgroundSettings.backgroundImage ? '有图片' : '无图片');
        newSettings.backgroundImage = backgroundSettings.backgroundImage;
      }

      if (backgroundSettings.backgroundImageId !== undefined) {
        console.log('🆔 设置背景图片ID:', backgroundSettings.backgroundImageId);
        newSettings.backgroundImageId = backgroundSettings.backgroundImageId;
      }

      if (backgroundSettings.backgroundMaskOpacity !== undefined) {
        console.log('🎭 设置遮罩透明度:', backgroundSettings.backgroundMaskOpacity);
        newSettings.backgroundMaskOpacity = backgroundSettings.backgroundMaskOpacity;
      }

      if (backgroundSettings.backgroundBlur !== undefined) {
        console.log('🌫️ 设置背景模糊:', backgroundSettings.backgroundBlur);
        newSettings.backgroundBlur = backgroundSettings.backgroundBlur;
      }

      // 实时预览
      if (onBackgroundChange) {
        onBackgroundChange({
          backgroundImage: newSettings.backgroundImage,
          backgroundMaskOpacity: newSettings.backgroundMaskOpacity,
          backgroundBlur: newSettings.backgroundBlur
        });
      }

      return newSettings;
    });
  };
  // 卡片样式相关 Hook（统一更新/预设/重置逻辑）
  const { updateCardStyle, applyTheme, resetCardStyle, resetSearchBoxStyle, resetButtonStyle, resetTextStyle } = useCardStyle({
    settings,
    setSettings,
    onCardStyleChange
  });


  // 注意：旧的文件上传和背景处理函数已被新的增强背景设置组件替代





  // 注意：重置功能已集成到增强背景设置组件中
  const resetCardStyleGroup = () => {
    resetCardStyle();
  };

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
                onClick={() => {
                  setActiveCategory('general');
                }}
                className={`w-full text-left px-5 py-2.5 transition-colors ${
                  activeCategory === 'general'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                常规设置
              </button>
              <button
                onClick={() => {
                  setActiveCategory('templates');
                }}
                className={`w-full text-left px-5 py-2.5 transition-colors ${
                  activeCategory === 'templates'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                模板管理
              </button>
              <button
                onClick={() => setActiveCategory('style')}
                className={`w-full text-left px-5 py-2.5 transition-colors ${
                  activeCategory === 'style'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                样式设置
              </button>
              <button
                onClick={() => setActiveCategory('history')}
                className={`w-full text-left px-5 py-2.5 transition-colors ${
                  activeCategory === 'history'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                历史记录
              </button>
              <button
                onClick={() => setActiveCategory('dock')}
                className={`w-full text-left px-5 py-2.5 transition-colors ${
                  activeCategory === 'dock'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                Dock栏
              </button>
            </nav>
          </aside>

          {/* 右侧内容 */}
          <section className="flex-1 overflow-hidden flex flex-col">
            {/* 根据当前分类显示不同内容 */}
            {activeCategory === 'general' ? (
              <GeneralSettingsPanel
                settings={settings}
                setOpenBehavior={setOpenBehavior}
                setTopHintEnabled={setTopHintEnabled}
                setTopHintTitle={setTopHintTitle}
                setTopHintSubtitle={setTopHintSubtitle}
                isMobile={isMobile}
                sidebarWidthRange={sidebarWidthRange}
                setSidebarWidth={setSidebarWidth}
                templates={templates}
              />
            ) : activeCategory === 'templates' ? (
              <div className="flex flex-col h-full">
                <TemplateManagerDraft
                  initialTemplates={draftTemplates}
                  onChange={setDraftTemplates}
                  onTemplateUpdate={() => onTemplatesSaved?.(draftTemplates)}
                />
              </div>
            ) : activeCategory === 'style' ? (
              <div className="flex h-full">
                {/* 样式设置子导航 */}
                <aside className="w-48 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                  <nav className="py-2">
                    <button
                      onClick={() => setActiveStyleSubCategory('global')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        activeStyleSubCategory === 'global'
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      全局样式
                    </button>
                    <button
                      onClick={() => setActiveStyleSubCategory('cards')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        activeStyleSubCategory === 'cards'
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      卡片样式
                    </button>
                    <button
                      onClick={() => setActiveStyleSubCategory('searchBox')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        activeStyleSubCategory === 'searchBox'
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      搜索框样式
                    </button>
                    <button
                      onClick={() => setActiveStyleSubCategory('buttons')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        activeStyleSubCategory === 'buttons'
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      按钮样式
                    </button>
                    <button
                      onClick={() => setActiveStyleSubCategory('text')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        activeStyleSubCategory === 'text'
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      文字样式
                    </button>
                  </nav>
                </aside>

                {/* 样式设置内容区域 */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {activeStyleSubCategory === 'global' && (
                    <StyleGlobalPanel settings={settings} onBackgroundChange={handleEnhancedBackgroundChange} />
                  )}

                  {activeStyleSubCategory === 'cards' && (
                    <StyleCardsPanel
                      settings={settings}
                      onUpdateCardStyle={updateCardStyle}
                      onApplyTheme={applyTheme}
                      onResetCardStyle={resetCardStyleGroup}
                      onCardStyleChange={onCardStyleChange}
                    />


                  )}

                  {activeStyleSubCategory === 'searchBox' && (
                    <StyleSearchBoxPanel
                      settings={settings}
                      onUpdateCardStyle={updateCardStyle}
                      onResetSearchBoxStyle={resetSearchBoxStyle}
                    />
                  )}

                  {activeStyleSubCategory === 'buttons' && (
                    <StyleButtonsPanel
                      settings={settings}
                      onUpdateCardStyle={updateCardStyle}
                      onResetButtonStyle={resetButtonStyle}
                    />
                  )}

                  {activeStyleSubCategory === 'text' && (
                    <StyleTextPanel
                      settings={settings}
                      onUpdateCardStyle={updateCardStyle}
                      onResetTextStyle={resetTextStyle}
                    />
                  )}
                </div>
              </div>
            ) : activeCategory === 'history' ? (
              <div className="p-6 space-y-8 overflow-y-auto">
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
            ) : activeCategory === 'dock' ? (
              <DockSettingsPanel
                settings={settings}
                shortcuts={dockShortcuts}
                onSettingsChange={(newSettings) => setSettings(newSettings)}
                onShortcutsChange={(newShortcuts) => {
                  setDockShortcuts(newShortcuts);
                  onDockShortcutsChange?.(newShortcuts);
                }}
              />
            ) : null}
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
              // 保存前清洗：禁止持久化 blob: URL；若有 ID，以 ID 为准，URL 置空
              const sanitized = { ...settings }
              if (sanitized.backgroundImageId) {
                sanitized.backgroundImage = undefined
              } else if (sanitized.backgroundImage?.startsWith('blob:')) {
                sanitized.backgroundImage = undefined
              }
              const updated = await StorageManager.saveGlobalSettings(sanitized)
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

