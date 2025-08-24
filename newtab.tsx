import React, { useState, useEffect, useRef } from "react";
import type { Template, MultiKeywordValues, CardStyleSettings } from "./src/types";
import { StorageManager } from "./src/utils/storage";
import { UrlBuilder } from "./src/utils/urlBuilder";
import { TemplateManager } from "./src/components/TemplateManager";
import { SmartSearchCard } from "./src/components/SmartSearchCard";
import { MasonryGrid } from "./src/components/MasonryGrid";
import { ToastContainer, useToast } from "./src/components/Toast";
import { LoadingSpinner, LoadingButton } from "./src/components/LoadingSpinner";
import { SettingsModal } from "./src/components/SettingsModal";
import "./style.css";

const NewTabPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchingTemplates, setSearchingTemplates] = useState<Record<string, boolean>>({});
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [topHintEnabled, setTopHintEnabled] = useState(true);
  const [topHintTitle, setTopHintTitle] = useState('搜索模板');
  const [topHintSubtitle, setTopHintSubtitle] = useState('选择任意模板开始搜索');
  const [openBehavior, setOpenBehavior] = useState<'current' | 'newtab'>('newtab');
  const [sidebarWidth, setSidebarWidth] = useState(256); // 默认侧边栏宽度
  const [sidebarVisible, setSidebarVisible] = useState(true); // 侧边栏显示状态
  // 背景设置状态
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined);
  const [backgroundMaskOpacity, setBackgroundMaskOpacity] = useState(30);
  const [backgroundBlur, setBackgroundBlur] = useState(0);
  // 卡片样式状态
  const [cardStyle, setCardStyle] = useState<CardStyleSettings>({
    cardSpacing: 20,
    cardBackgroundColor: '#ffffff',
    cardOpacity: 98,
    cardMaskOpacity: 8,
    cardBlurStrength: 16,
    cardBorderEnabled: true,
    cardBorderColor: '#e2e8f0',
    cardBorderWidth: 1,
    cardBorderStyle: 'solid',
    titleFontSize: 17,
    titleFontColor: '#1e293b',
    titleFontWeight: '600',
    searchBoxBorderRadius: 12,
    searchBoxBackgroundColor: '#f8fafc',
    searchBoxBorderColor: '#cbd5e1',
    searchBoxFontSize: 15,
    searchBoxTextColor: '#334155',
    searchBoxPlaceholderColor: '#94a3b8',
    searchButtonBorderRadius: 12,
    searchButtonBackgroundColor: '#3b82f6',
    searchButtonTextColor: '#ffffff',
    searchButtonHoverColor: '#2563eb'
  });
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const toast = useToast();

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateList = await StorageManager.getTemplates();
      setTemplates(templateList);

      // 如果没有模板，显示模板管理界面
      if (templateList.length === 0) {
        setShowTemplateManager(true);
      }
    } catch (error) {
      console.error('加载模板失败:', error);
      toast.showError('加载失败', '无法加载模板列表，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 读取全局设置
  useEffect(() => {
    (async () => {
      const s = await StorageManager.getGlobalSettings();
      setOpenBehavior(s.openBehavior);
      setTopHintEnabled(s.topHintEnabled);
      setTopHintTitle(s.topHintTitle);
      setTopHintSubtitle(s.topHintSubtitle);
      setSidebarWidth(s.sidebarWidth || 256);
      setSidebarVisible(s.sidebarVisible !== false); // 默认显示
      // 加载背景设置
      setBackgroundImage(s.backgroundImage);
      setBackgroundMaskOpacity(s.backgroundMaskOpacity || 30);
      setBackgroundBlur(s.backgroundBlur || 0);
      // 加载卡片样式设置
      if (s.cardStyle) {
        setCardStyle(s.cardStyle);
      }
    })();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, []);

  // 监听Chrome存储变化，实现数据同步
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'local') return;

      // 监听模板变化
      if (changes.templates) {
        console.log('检测到模板数据变化，重新加载模板列表');
        loadTemplates();
      }

      // 监听全局设置变化
      if (changes.globalSettings) {
        console.log('检测到全局设置变化，重新加载设置');
        (async () => {
          const s = await StorageManager.getGlobalSettings();
          setOpenBehavior(s.openBehavior);
          setTopHintEnabled(s.topHintEnabled);
          setTopHintTitle(s.topHintTitle);
          setTopHintSubtitle(s.topHintSubtitle);
          // 更新背景设置
          setBackgroundImage(s.backgroundImage);
          setBackgroundMaskOpacity(s.backgroundMaskOpacity || 30);
          setBackgroundBlur(s.backgroundBlur || 0);
          // 更新卡片样式设置
          if (s.cardStyle) {
            setCardStyle(s.cardStyle);
          }
        })();
      }

      // 监听历史记录变化
      if (changes.searchHistory) {
        console.log('检测到历史记录变化');
        // 历史记录变化会自动被各个搜索卡片组件监听到
      }
    };

    // 添加存储变化监听器
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    // 清理监听器
    return () => {
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  // 切换侧边栏显示/隐藏
  const toggleSidebar = async () => {
    const newVisible = !sidebarVisible;
    setSidebarVisible(newVisible);

    // 保存到存储
    try {
      const currentSettings = await StorageManager.getGlobalSettings();
      await StorageManager.saveGlobalSettings({
        ...currentSettings,
        sidebarVisible: newVisible
      });
    } catch (error) {
      console.error('保存侧边栏状态失败:', error);
    }
  };

  // 处理背景设置实时预览
  const handleBackgroundChange = (backgroundSettings: {
    backgroundImage?: string,
    backgroundMaskOpacity?: number,
    backgroundBlur?: number
  }) => {
    console.log('🎨 背景设置实时预览:', backgroundSettings);
    if (backgroundSettings.backgroundImage !== undefined) {
      console.log('📷 设置背景图片:', backgroundSettings.backgroundImage ? '有图片' : '无图片');
      setBackgroundImage(backgroundSettings.backgroundImage);
    }
    if (backgroundSettings.backgroundMaskOpacity !== undefined) {
      console.log('🎭 设置遮罩透明度:', backgroundSettings.backgroundMaskOpacity);
      setBackgroundMaskOpacity(backgroundSettings.backgroundMaskOpacity);
    }
    if (backgroundSettings.backgroundBlur !== undefined) {
      console.log('🌫️设置背景模糊:', backgroundSettings.backgroundBlur);
      setBackgroundBlur(backgroundSettings.backgroundBlur);
    }
  };

  // 处理卡片样式设置实时预览
  const handleCardStyleChange = (newCardStyle: CardStyleSettings) => {
    console.log('🎨 卡片样式实时预览:', newCardStyle);
    setCardStyle(newCardStyle);
  };

  // 处理单关键词搜索
  const handleSingleKeywordSearch = async (template: Template, keyword: string) => {
    if (!keyword?.trim()) {
      toast.showWarning('请输入搜索内容', '搜索关键词不能为空');
      return;
    }

    try {
      setSearchingTemplates(prev => ({ ...prev, [template.id]: true }));

      // 保存搜索历史
      await StorageManager.addSearchHistory(template.id, keyword.trim());

      const searchUrl = UrlBuilder.buildUrl(template.urlPattern, keyword.trim());
      if (openBehavior === 'newtab') {
        await UrlBuilder.openInNewTab(searchUrl)
      } else {
        window.location.href = searchUrl
      }

    } catch (error) {
      console.error('搜索失败:', error);
      toast.showError('搜索失败', '无法打开搜索页面，请检查模板配置');
    } finally {
      setSearchingTemplates(prev => ({ ...prev, [template.id]: false }));
    }
  };

  // 处理多关键词搜索
  const handleMultiKeywordSearch = async (template: Template, keywords: MultiKeywordValues) => {
    // 验证关键词
    const hasValidKeywords = Object.values(keywords).some(value => value && value.trim());
    if (!hasValidKeywords) {
      toast.showWarning('请输入搜索内容', '至少需要填写一个关键词');
      return;
    }

    try {
      setSearchingTemplates(prev => ({ ...prev, [template.id]: true }));

      // 保存多关键词搜索历史（每个占位符独立保存）
      await StorageManager.addMultiKeywordSearchHistory(template.id, keywords);

      const searchUrl = UrlBuilder.buildUrlWithMultipleKeywords(template.urlPattern, keywords);
      if (openBehavior === 'newtab') {
        await UrlBuilder.openInNewTab(searchUrl)
      } else {
        window.location.href = searchUrl
      }

    } catch (error) {
      console.error('搜索失败:', error);
      toast.showError('搜索失败', '无法打开搜索页面，请检查模板配置');
    } finally {
      setSearchingTemplates(prev => ({ ...prev, [template.id]: false }));
    }
  };



  // 滚动到指定模板卡片
  const scrollToTemplate = (templateId: string) => {
    const cardElement = cardRefs.current[templateId];
    if (cardElement) {
      setActiveTemplateId(templateId);
      cardElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // 高亮显示选中的卡片
      setTimeout(() => {
        setActiveTemplateId(null);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className="text-xl text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  // 调试信息
  console.log('🖼️ 当前背景状态:', {
    backgroundImage: backgroundImage ? '有图片' : '无图片',
    backgroundMaskOpacity,
    backgroundBlur
  });

  // 生成动态CSS样式
  const generateCardStyleCSS = () => {
    return `
      /* 卡片容器样式 - 使用更高的特异性 */
      .smart-masonry-item .card-style-target {
        margin: ${cardStyle.cardSpacing / 2}px !important;
        background-color: ${cardStyle.cardBackgroundColor} !important;
        opacity: ${cardStyle.cardOpacity / 100} !important;
        backdrop-filter: blur(${cardStyle.cardBlurStrength}px) !important;
        -webkit-backdrop-filter: blur(${cardStyle.cardBlurStrength}px) !important;
        position: relative !important;
        border-radius: 12px !important;
        ${cardStyle.cardBorderEnabled
          ? `border: ${cardStyle.cardBorderWidth}px ${cardStyle.cardBorderStyle} ${cardStyle.cardBorderColor} !important;`
          : 'border: none !important;'
        }
      }

      /* 卡片遮罩层 */
      .smart-masonry-item .card-style-target::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, ${cardStyle.cardMaskOpacity / 100});
        pointer-events: none;
        z-index: 1;
        border-radius: inherit;
      }

      /* 确保卡片内容在遮罩层之上 */
      .smart-masonry-item .card-style-target > * {
        position: relative;
        z-index: 2;
      }

      /* 标题样式 */
      .smart-masonry-item .card-style-target h3 {
        font-size: ${cardStyle.titleFontSize}px !important;
        color: ${cardStyle.titleFontColor} !important;
        font-weight: ${cardStyle.titleFontWeight} !important;
      }

      /* 搜索框样式 */
      .smart-masonry-item .card-style-target input[type="text"] {
        border-radius: ${cardStyle.searchBoxBorderRadius}px !important;
        background-color: ${cardStyle.searchBoxBackgroundColor} !important;
        border-color: ${cardStyle.searchBoxBorderColor} !important;
        border-width: 1px !important;
        font-size: ${cardStyle.searchBoxFontSize}px !important;
        color: ${cardStyle.searchBoxTextColor} !important;
        transition: border-width 0.2s ease, box-shadow 0.2s ease !important;
      }

      /* 搜索框焦点状态 - 使用相同颜色但更粗的边框 */
      .smart-masonry-item .card-style-target input[type="text"]:focus {
        border-color: ${cardStyle.searchBoxBorderColor} !important;
        border-width: 2px !important;
        outline: none !important;
        box-shadow: 0 0 0 1px ${cardStyle.searchBoxBorderColor}40 !important;
      }

      .smart-masonry-item .card-style-target input[type="text"]::placeholder {
        color: ${cardStyle.searchBoxPlaceholderColor} !important;
      }

      /* 搜索按钮样式 - 使用更高特异性覆盖Tailwind CSS */
      .smart-masonry-item .card-style-target button[type="button"],
      .smart-masonry-item .card-style-target button[type="submit"],
      .smart-masonry-item .card-style-target button.bg-blue-500,
      .smart-masonry-item .card-style-target button {
        border-radius: ${cardStyle.searchButtonBorderRadius}px !important;
        background-color: ${cardStyle.searchButtonBackgroundColor} !important;
        color: ${cardStyle.searchButtonTextColor} !important;
        transition: background-color 0.2s ease !important;
        border: none !important;
      }

      .smart-masonry-item .card-style-target button[type="button"]:hover,
      .smart-masonry-item .card-style-target button[type="submit"]:hover,
      .smart-masonry-item .card-style-target button.bg-blue-500:hover,
      .smart-masonry-item .card-style-target button:hover {
        background-color: ${cardStyle.searchButtonHoverColor} !important;
      }

      /* 确保按钮在禁用状态下也应用自定义样式 */
      .smart-masonry-item .card-style-target button:disabled {
        background-color: ${cardStyle.searchButtonBackgroundColor} !important;
        opacity: 0.5 !important;
      }

      /* 卡片间距调整 */
      .smart-masonry-grid {
        gap: ${cardStyle.cardSpacing}px !important;
      }
    `;
  };

  return (
    <>
      {/* 动态卡片样式 */}
      <style dangerouslySetInnerHTML={{ __html: generateCardStyleCSS() }} />

      {/* 背景图片层 - 动态调整扩展尺寸以消除模糊边缘泛白 */}
      {backgroundImage && (
        <div
          className="background-image-layer"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            filter: `blur(${backgroundBlur}px)`,
            // 根据模糊强度动态调整扩展尺寸，模糊越强扩展越大
            top: `${-Math.max(20, backgroundBlur * 2)}px`,
            left: `${-Math.max(20, backgroundBlur * 2)}px`,
            width: `calc(100vw + ${Math.max(40, backgroundBlur * 4)}px)`,
            height: `calc(100vh + ${Math.max(40, backgroundBlur * 4)}px)`,
            // 轻微缩放确保覆盖完整
            transform: `scale(${1 + Math.max(0.02, backgroundBlur * 0.002)})`
          }}
        />
      )}

      {/* 背景遮罩层 */}
      {backgroundImage && (
        <div
          className="background-mask-layer"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${(backgroundMaskOpacity || 30) / 100})`
          }}
        />
      )}

      <div className="min-h-screen text-gray-800 main-container"
           style={{
             backgroundColor: backgroundImage ? 'transparent' : '#f9fafb'
           }}>

      {showTemplateManager ? (
        <div className="container mx-auto px-4 py-8">
          <TemplateManager
            onTemplateSelect={() => {
              setShowTemplateManager(false);
              loadTemplates();
            }}
            onClose={() => {
              setShowTemplateManager(false);
            }}
          />
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          {/* 侧边栏 */}
          <div
            className="bg-white/95 backdrop-blur border-r border-gray-200 shadow-sm flex flex-col h-full sidebar-width-transition overflow-hidden"
            style={{
              width: sidebarVisible ? `${sidebarWidth}px` : '0px',
              minWidth: sidebarVisible ? `${sidebarWidth}px` : '0px',
              opacity: sidebarVisible ? 1 : 0
            }}
          >
            {sidebarVisible && (
              <>
                {/* 侧边栏头部 */}
                <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-wide text-gray-900">Furlg</h2>
                  <p className="text-xs text-gray-500 mt-1">快速搜索中心</p>
                </div>
              </div>
            </div>

            {/* 模板列表 */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {templates.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-gray-500 text-sm mb-4">还没有任何模板</div>
                  <button
                    onClick={() => setShowTemplateManager(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    创建模板
                  </button>
                </div>
              ) : (
                <div className="py-3 space-y-1 px-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => scrollToTemplate(template.id)}
                      className={`w-full text-left px-2 py-2.5 rounded-md transition-colors flex items-center gap-2 border border-transparent ${
                        activeTemplateId === template.id
                          ? 'bg-blue-50/80 text-blue-700 border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <div className="font-medium truncate">
                        {template.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 侧边栏底部设置按钮 - 固定在底部 */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white/95 backdrop-blur">
              <div className="flex justify-center gap-3">
                {/* 侧边栏切换按钮 */}
                <button
                  onClick={toggleSidebar}
                  className="w-10 h-10 rounded-full bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 shadow-sm border border-gray-200 flex items-center justify-center transition-colors"
                  title="隐藏侧边栏"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* 设置按钮 */}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm flex items-center justify-center transition-colors"
                  title="设置"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
              </>
            )}
          </div>

          {/* 侧边栏隐藏时的显示按钮 */}
          {!sidebarVisible && (
            <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-50">
              <button
                onClick={toggleSidebar}
                className="w-10 h-12 bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 shadow-lg border border-gray-200 rounded-r-lg flex items-center justify-center transition-all duration-200 hover:w-12"
                title="显示侧边栏"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* 主内容区域 */}
          <div className={`flex-1 h-full overflow-y-auto transition-all duration-300 ease-out main-content-expanding ${
            sidebarVisible ? '' : 'ml-0'
          }`}>
            {/* 顶部提示条（受全局设置控制） */}
            {topHintEnabled && (
              <div className="sticky top-0 z-10 backdrop-blur bg-gray-50/80 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-4">
                  <h1 className="text-lg md:text-xl font-semibold text-gray-900">{topHintTitle}</h1>
                  <p className="text-xs md:text-sm text-gray-500 mt-0.5">{topHintSubtitle}</p>
                </div>
              </div>
            )}
            {templates.length === 0 ? (
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="text-gray-500 mb-6 text-xl">欢迎使用 Furlg</div>
                  <div className="text-gray-400 mb-8">请先创建搜索模板开始使用</div>
                  <button
                    onClick={() => setShowTemplateManager(true)}
                    className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
                  >
                    创建第一个模板
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 md:px-8 py-8 pb-16">
                {/* 模板卡片瀑布流 */}
                <div className="max-w-7xl mx-auto">
                  <MasonryGrid>
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          ref={(el) => { cardRefs.current[template.id] = el; }}
                          className={`transition-all duration-300 ${
                            activeTemplateId === template.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                          }`}
                        >
                          <SmartSearchCard
                            template={template}
                            onSearchSingle={handleSingleKeywordSearch}
                            onSearchMultiple={handleMultiKeywordSearch}
                            isSearching={searchingTemplates[template.id] || false}
                          />
                        </div>
                      ))}
                    </MasonryGrid>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {/* 设置弹窗 */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onApply={(s) => {
          setOpenBehavior(s.openBehavior)
          setTopHintEnabled(s.topHintEnabled)
          setTopHintTitle(s.topHintTitle)
          setTopHintSubtitle(s.topHintSubtitle)
          setSidebarWidth(s.sidebarWidth || 256)
          // 应用背景设置
          setBackgroundImage(s.backgroundImage)
          setBackgroundMaskOpacity(s.backgroundMaskOpacity || 30)
          setBackgroundBlur(s.backgroundBlur || 0)
          // 应用卡片样式设置
          if (s.cardStyle) {
            setCardStyle(s.cardStyle)
          }
        }}
        onTemplatesSaved={() => {
          // 重新加载模板列表
          loadTemplates()
        }}
        templates={templates}
        onSidebarWidthChange={(width) => {
          // 实时预览侧边栏宽度变化
          setSidebarWidth(width)
        }}
        onBackgroundChange={handleBackgroundChange}
        onCardStyleChange={handleCardStyleChange}
      />

      <ToastContainer messages={toast.messages} onRemove={toast.removeToast} />
      </div>
    </>
  );
};

export default NewTabPage;
