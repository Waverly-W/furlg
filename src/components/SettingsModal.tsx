import React, { useEffect, useRef, useState } from 'react'
import { StorageManager } from '../utils/storage'
import type { GlobalSettings, OpenBehavior, Template, HistorySortType, CardStyleSettings, CardStyleTheme } from '../types'
import { TemplateManagerDraft } from './TemplateManagerDraft'
import { SidebarUtils } from '../utils/sidebarUtils'
import { CARD_STYLE_THEMES, getDefaultCardStyle, validateCardStyleSettings } from '../utils/cardStyleThemes'

// 设置面板的主要分类
type SettingsCategory = 'general' | 'templates' | 'style' | 'history';

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
  onCardStyleChange
}) => {
  const [draftTemplates, setDraftTemplates] = useState<Template[]>([])

  const [activeTab, setActiveTab] = useState<'global' | 'templates'>('global')
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

  // 背景设置相关状态
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载全局设置
  useEffect(() => {
    if (!open) return
    ;(async () => {
      const s = await StorageManager.getGlobalSettings()
      setSettings(s)
      // 设置背景预览
      setBackgroundPreview(s.backgroundImage || null)
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

  // 背景设置函数
  const setBackgroundImage = (image: string | undefined) => {
    setSettings((p) => {
      const newSettings = { ...p, backgroundImage: image };
      // 实时预览
      if (onBackgroundChange) {
        onBackgroundChange({
          backgroundImage: image,
          backgroundMaskOpacity: newSettings.backgroundMaskOpacity,
          backgroundBlur: newSettings.backgroundBlur
        });
      }
      return newSettings;
    });
  }

  const setBackgroundMaskOpacity = (opacity: number) => {
    setSettings((p) => {
      const newSettings = { ...p, backgroundMaskOpacity: opacity };
      // 实时预览
      if (onBackgroundChange) {
        onBackgroundChange({
          backgroundImage: newSettings.backgroundImage,
          backgroundMaskOpacity: opacity,
          backgroundBlur: newSettings.backgroundBlur
        });
      }
      return newSettings;
    });
  }

  const setBackgroundBlur = (blur: number) => {
    setSettings((p) => {
      const newSettings = { ...p, backgroundBlur: blur };
      // 实时预览
      if (onBackgroundChange) {
        onBackgroundChange({
          backgroundImage: newSettings.backgroundImage,
          backgroundMaskOpacity: newSettings.backgroundMaskOpacity,
          backgroundBlur: blur
        });
      }
      return newSettings;
    });
  }

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('请选择支持的图片格式：JPG, PNG, GIF, WebP');
      return;
    }

    // 验证文件大小（限制为5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('图片文件大小不能超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBackgroundPreview(result);
      setBackgroundImage(result);
    };
    reader.readAsDataURL(file);
  }

  // 移除背景图片
  const removeBackground = () => {
    setBackgroundPreview(null);
    setBackgroundImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // 重置背景设置为默认值
  const resetBackgroundSettings = () => {
    setBackgroundImage(undefined);
    setBackgroundMaskOpacity(30);
    setBackgroundBlur(0);
    setBackgroundPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // 卡片样式设置函数
  const updateCardStyle = (updates: Partial<CardStyleSettings>) => {
    setSettings((prev) => {
      const newCardStyle = {
        ...getDefaultCardStyle(),
        ...prev.cardStyle,
        ...updates
      };
      const newSettings = {
        ...prev,
        cardStyle: validateCardStyleSettings(newCardStyle)
      };

      // 实时预览
      if (onCardStyleChange) {
        onCardStyleChange(newSettings.cardStyle!);
      }

      return newSettings;
    });
  };

  // 应用预设主题
  const applyTheme = (theme: CardStyleTheme) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        cardStyle: theme.settings
      };

      // 实时预览
      if (onCardStyleChange) {
        onCardStyleChange(theme.settings);
      }

      return newSettings;
    });
  };

  // 重置卡片样式为默认值
  const resetCardStyle = () => {
    const defaultStyle = getDefaultCardStyle();
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        cardStyle: defaultStyle
      };

      // 实时预览
      if (onCardStyleChange) {
        onCardStyleChange(defaultStyle);
      }

      return newSettings;
    });
  };

  // 分组重置函数
  const resetGlobalStyle = () => {
    setBackgroundImage(undefined);
    setBackgroundMaskOpacity(30);
    setBackgroundBlur(0);
    setBackgroundPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // 触发实时预览
    if (onBackgroundChange) {
      onBackgroundChange({
        backgroundImage: undefined,
        backgroundMaskOpacity: 30,
        backgroundBlur: 0
      });
    }
  };

  const resetCardStyleGroup = () => {
    resetCardStyle();
  };

  const resetSearchBoxStyle = () => {
    const defaultStyle = getDefaultCardStyle();
    updateCardStyle({
      searchBoxBorderRadius: defaultStyle.searchBoxBorderRadius,
      searchBoxBackgroundColor: defaultStyle.searchBoxBackgroundColor,
      searchBoxBorderColor: defaultStyle.searchBoxBorderColor,
      searchBoxFontSize: defaultStyle.searchBoxFontSize,
      searchBoxTextColor: defaultStyle.searchBoxTextColor,
      searchBoxPlaceholderColor: defaultStyle.searchBoxPlaceholderColor
    });
  };

  const resetButtonStyle = () => {
    const defaultStyle = getDefaultCardStyle();
    updateCardStyle({
      searchButtonBorderRadius: defaultStyle.searchButtonBorderRadius,
      searchButtonBackgroundColor: defaultStyle.searchButtonBackgroundColor,
      searchButtonTextColor: defaultStyle.searchButtonTextColor,
      searchButtonHoverColor: defaultStyle.searchButtonHoverColor
    });
  };

  const resetTextStyle = () => {
    const defaultStyle = getDefaultCardStyle();
    updateCardStyle({
      titleFontSize: defaultStyle.titleFontSize,
      titleFontColor: defaultStyle.titleFontColor,
      titleFontWeight: defaultStyle.titleFontWeight
    });
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
                  setActiveTab('global');
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
                  setActiveTab('templates');
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
            </nav>
          </aside>

          {/* 右侧内容 */}
          <section className="flex-1 overflow-hidden flex flex-col">
            {/* 根据当前分类显示不同内容 */}
            {activeCategory === 'general' ? (
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

                    {/* 顶部标题和副标题设置 */}
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


                  </div>
                </div>





              </div>
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
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">全局样式设置</h3>

                        {/* 背景图片设置 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">背景图片设置</h4>

                          {/* 背景图片选择 */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">背景图片</span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-3 py-1.5 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                >
                                  选择图片
                                </button>
                                {(settings.backgroundImage || backgroundPreview) && (
                                  <button
                                    type="button"
                                    onClick={removeBackground}
                                    className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                  >
                                    移除背景
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 隐藏的文件输入 */}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleFileUpload}
                              className="hidden"
                            />

                            {/* 背景图片预览 */}
                            {(settings.backgroundImage || backgroundPreview) && (
                              <div className="relative">
                                <img
                                  src={backgroundPreview || settings.backgroundImage}
                                  alt="背景预览"
                                  className="w-full h-24 object-cover rounded-md border border-gray-200"
                                />
                                <div className="absolute inset-0 bg-black/20 rounded-md flex items-center justify-center">
                                  <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">预览</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 遮罩透明度 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">遮罩透明度</span>
                              <span className="text-xs text-gray-500">{settings.backgroundMaskOpacity || 30}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={settings.backgroundMaskOpacity || 30}
                              onChange={(e) => setBackgroundMaskOpacity(Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          {/* 背景模糊 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">背景模糊</span>
                              <span className="text-xs text-gray-500">{settings.backgroundBlur || 0}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="20"
                              step="1"
                              value={settings.backgroundBlur || 0}
                              onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          {/* 重置按钮 */}
                          <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={resetGlobalStyle}
                              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              重置全局样式
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStyleSubCategory === 'cards' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">卡片样式设置</h3>

                        {/* 预设主题 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">预设主题</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {CARD_STYLE_THEMES.map((theme) => (
                              <button
                                key={theme.name}
                                type="button"
                                onClick={() => applyTheme(theme)}
                                className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              >
                                <div className="font-medium text-sm text-gray-900">{theme.name}</div>
                                <div className="text-xs text-gray-500 mt-1">{theme.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 卡片布局 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">卡片布局</h4>

                          {/* 卡片间距 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">卡片间距</span>
                              <span className="text-xs text-gray-500">{settings.cardStyle?.cardSpacing || 16}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="2"
                              value={settings.cardStyle?.cardSpacing || 16}
                              onChange={(e) => updateCardStyle({ cardSpacing: Number(e.target.value) })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          {/* 卡片背景颜色 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">卡片背景颜色</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.cardStyle?.cardBackgroundColor || '#ffffff'}
                                onChange={(e) => updateCardStyle({ cardBackgroundColor: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.cardStyle?.cardBackgroundColor || '#ffffff'}
                                onChange={(e) => updateCardStyle({ cardBackgroundColor: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>

                          {/* 卡片透明度 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">卡片透明度</span>
                              <span className="text-xs text-gray-500">{settings.cardStyle?.cardOpacity || 95}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={settings.cardStyle?.cardOpacity || 95}
                              onChange={(e) => updateCardStyle({ cardOpacity: Number(e.target.value) })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>

                        {/* 卡片边框 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">卡片边框</h4>

                          {/* 是否显示边框 */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">显示边框</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.cardStyle?.cardBorderEnabled ?? true}
                                onChange={(e) => updateCardStyle({ cardBorderEnabled: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          {/* 边框颜色 */}
                          {settings.cardStyle?.cardBorderEnabled && (
                            <div className="space-y-2">
                              <span className="text-sm text-gray-700">边框颜色</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={settings.cardStyle?.cardBorderColor || '#e5e7eb'}
                                  onChange={(e) => updateCardStyle({ cardBorderColor: e.target.value })}
                                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={settings.cardStyle?.cardBorderColor || '#e5e7eb'}
                                  onChange={(e) => updateCardStyle({ cardBorderColor: e.target.value })}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder="#e5e7eb"
                                />
                              </div>
                            </div>
                          )}

                          {/* 边框宽度 */}
                          {settings.cardStyle?.cardBorderEnabled && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">边框宽度</span>
                                <span className="text-xs text-gray-500">{settings.cardStyle?.cardBorderWidth || 1}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="5"
                                step="1"
                                value={settings.cardStyle?.cardBorderWidth || 1}
                                onChange={(e) => updateCardStyle({ cardBorderWidth: Number(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                              />
                            </div>
                          )}

                          {/* 边框样式 */}
                          {settings.cardStyle?.cardBorderEnabled && (
                            <div className="space-y-2">
                              <span className="text-sm text-gray-700">边框样式</span>
                              <select
                                value={settings.cardStyle?.cardBorderStyle || 'solid'}
                                onChange={(e) => updateCardStyle({ cardBorderStyle: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="solid">实线</option>
                                <option value="dashed">虚线</option>
                                <option value="dotted">点线</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          {/* 重置按钮 */}
                          <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={resetCardStyleGroup}
                              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              重置卡片样式
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStyleSubCategory === 'searchBox' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">搜索框样式设置</h3>

                        {/* 搜索框外观 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">搜索框外观</h4>

                          {/* 搜索框圆角 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">圆角大小</span>
                              <span className="text-xs text-gray-500">{settings.cardStyle?.searchBoxBorderRadius || 8}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="25"
                              step="1"
                              value={settings.cardStyle?.searchBoxBorderRadius || 8}
                              onChange={(e) => updateCardStyle({ searchBoxBorderRadius: Number(e.target.value) })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          {/* 搜索框背景颜色 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">背景颜色</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.cardStyle?.searchBoxBackgroundColor || '#f9fafb'}
                                onChange={(e) => updateCardStyle({ searchBoxBackgroundColor: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.cardStyle?.searchBoxBackgroundColor || '#f9fafb'}
                                onChange={(e) => updateCardStyle({ searchBoxBackgroundColor: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="#f9fafb"
                              />
                            </div>
                          </div>

                          {/* 搜索框边框颜色 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">边框颜色</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.cardStyle?.searchBoxBorderColor || '#d1d5db'}
                                onChange={(e) => updateCardStyle({ searchBoxBorderColor: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.cardStyle?.searchBoxBorderColor || '#d1d5db'}
                                onChange={(e) => updateCardStyle({ searchBoxBorderColor: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="#d1d5db"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 搜索框文字 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">搜索框文字</h4>

                          {/* 字体大小 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">字体大小</span>
                              <span className="text-xs text-gray-500">{settings.cardStyle?.searchBoxFontSize || 14}px</span>
                            </div>
                            <input
                              type="range"
                              min="12"
                              max="18"
                              step="1"
                              value={settings.cardStyle?.searchBoxFontSize || 14}
                              onChange={(e) => updateCardStyle({ searchBoxFontSize: Number(e.target.value) })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          {/* 文字颜色 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">文字颜色</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.cardStyle?.searchBoxTextColor || '#374151'}
                                onChange={(e) => updateCardStyle({ searchBoxTextColor: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.cardStyle?.searchBoxTextColor || '#374151'}
                                onChange={(e) => updateCardStyle({ searchBoxTextColor: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="#374151"
                              />
                            </div>
                          </div>

                          {/* 占位符颜色 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">占位符颜色</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.cardStyle?.searchBoxPlaceholderColor || '#9ca3af'}
                                onChange={(e) => updateCardStyle({ searchBoxPlaceholderColor: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.cardStyle?.searchBoxPlaceholderColor || '#9ca3af'}
                                onChange={(e) => updateCardStyle({ searchBoxPlaceholderColor: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="#9ca3af"
                              />
                            </div>
                          </div>

                          {/* 重置按钮 */}
                          <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={resetSearchBoxStyle}
                              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              重置搜索框样式
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStyleSubCategory === 'buttons' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">按钮样式设置</h3>

                        {/* 按钮外观 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">按钮外观</h4>

                          {/* 按钮圆角 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">圆角大小</span>
                              <span className="text-xs text-gray-500">{settings.cardStyle?.searchButtonBorderRadius || 8}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="25"
                              step="1"
                              value={settings.cardStyle?.searchButtonBorderRadius || 8}
                              onChange={(e) => updateCardStyle({ searchButtonBorderRadius: Number(e.target.value) })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          {/* 按钮背景颜色 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">背景颜色</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.cardStyle?.searchButtonBackgroundColor || '#3b82f6'}
                                onChange={(e) => updateCardStyle({ searchButtonBackgroundColor: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.cardStyle?.searchButtonBackgroundColor || '#3b82f6'}
                                onChange={(e) => updateCardStyle({ searchButtonBackgroundColor: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="#3b82f6"
                              />
                            </div>
                          </div>

                          {/* 按钮文字颜色 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">文字颜色</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.cardStyle?.searchButtonTextColor || '#ffffff'}
                                onChange={(e) => updateCardStyle({ searchButtonTextColor: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.cardStyle?.searchButtonTextColor || '#ffffff'}
                                onChange={(e) => updateCardStyle({ searchButtonTextColor: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 按钮交互效果 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">按钮交互效果</h4>

                          {/* 悬停颜色 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">悬停颜色</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.cardStyle?.searchButtonHoverColor || '#2563eb'}
                                onChange={(e) => updateCardStyle({ searchButtonHoverColor: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.cardStyle?.searchButtonHoverColor || '#2563eb'}
                                onChange={(e) => updateCardStyle({ searchButtonHoverColor: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="#2563eb"
                              />
                            </div>
                          </div>

                          {/* 重置按钮 */}
                          <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={resetButtonStyle}
                              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              重置按钮样式
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStyleSubCategory === 'text' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">文字样式设置</h3>

                        {/* 卡片标题 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">卡片标题</h4>

                          {/* 字体大小 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">字体大小</span>
                              <span className="text-xs text-gray-500">{settings.cardStyle?.titleFontSize || 16}px</span>
                            </div>
                            <input
                              type="range"
                              min="12"
                              max="24"
                              step="1"
                              value={settings.cardStyle?.titleFontSize || 16}
                              onChange={(e) => updateCardStyle({ titleFontSize: Number(e.target.value) })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          {/* 字体颜色 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">字体颜色</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.cardStyle?.titleFontColor || '#1f2937'}
                                onChange={(e) => updateCardStyle({ titleFontColor: e.target.value })}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={settings.cardStyle?.titleFontColor || '#1f2937'}
                                onChange={(e) => updateCardStyle({ titleFontColor: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="#1f2937"
                              />
                            </div>
                          </div>

                          {/* 字体粗细 */}
                          <div className="space-y-2">
                            <span className="text-sm text-gray-700">字体粗细</span>
                            <select
                              value={settings.cardStyle?.titleFontWeight || '600'}
                              onChange={(e) => updateCardStyle({ titleFontWeight: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="normal">正常</option>
                              <option value="500">中等</option>
                              <option value="600">半粗体</option>
                              <option value="bold">粗体</option>
                              <option value="700">加粗</option>
                            </select>
                          </div>

                          {/* 重置按钮 */}
                          <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={resetTextStyle}
                              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              重置文字样式
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
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

