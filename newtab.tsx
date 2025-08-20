import React, { useState, useEffect, useRef } from "react";
import type { Template } from "./src/types";
import { StorageManager } from "./src/utils/storage";
import { UrlBuilder } from "./src/utils/urlBuilder";
import { TemplateManager } from "./src/components/TemplateManager";
import { SearchSuggestions } from "./src/components/SearchSuggestions";
import { ToastContainer, useToast } from "./src/components/Toast";
import { LoadingSpinner, LoadingButton } from "./src/components/LoadingSpinner";
import { SettingsModal } from "./src/components/SettingsModal";
import "./style.css";

const NewTabPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchingTemplates, setSearchingTemplates] = useState<Record<string, boolean>>({});
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [topHintEnabled, setTopHintEnabled] = useState(true);
  const [topHintTitle, setTopHintTitle] = useState('搜索模板');
  const [topHintSubtitle, setTopHintSubtitle] = useState('选择任意模板开始搜索');
  const [openBehavior, setOpenBehavior] = useState<'current' | 'newtab'>('newtab');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const toast = useToast();

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateList = await StorageManager.getTemplates();
      setTemplates(templateList);

      // 初始化搜索查询状态
      const initialQueries: Record<string, string> = {};
      templateList.forEach(template => {
        initialQueries[template.id] = "";
      });
      setSearchQueries(initialQueries);

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
    })();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, []);

  // 处理搜索（使用指定关键词）
  const handleSearchWithKeyword = async (template: Template, keyword: string) => {
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

  // 处理搜索（使用输入框中的内容）
  const handleSearch = async (template: Template) => {
    const query = searchQueries[template.id];
    await handleSearchWithKeyword(template, query);
  };

  // 处理输入变化
  const handleInputChange = (templateId: string, value: string) => {
    setSearchQueries(prev => ({ ...prev, [templateId]: value }));
    // 只要输入框有焦点就显示建议，不管是否有内容
    setActiveSuggestions(templateId);
  };

  // 处理建议选择
  const handleSuggestionSelect = (templateId: string, keyword: string) => {
    setSearchQueries(prev => ({ ...prev, [templateId]: keyword }));
    setActiveSuggestions(null);

    // 立即执行搜索
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // 使用setTimeout确保状态更新完成后再执行搜索
      setTimeout(() => {
        handleSearchWithKeyword(template, keyword);
      }, 0);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (templateId: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      // 如果建议框打开且有选中项，让SearchSuggestions组件处理
      // 否则直接执行搜索
      if (activeSuggestions !== templateId) {
        const template = templates.find(t => t.id === templateId);
        if (template) {
          handleSearch(template);
        }
      }
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
      // 聚焦到对应的输入框
      setTimeout(() => {
        inputRefs.current[templateId]?.focus();
      }, 400);
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
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
        <div className="flex min-h-screen">
          {/* 侧边栏 */}
          <div className="w-64 bg-white/95 backdrop-blur border-r border-gray-200 shadow-sm flex flex-col">
            {/* 侧边栏头部 */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold tracking-wide text-gray-900">Furlg</h2>
              <p className="text-xs text-gray-500 mt-1">快速搜索中心</p>
            </div>

            {/* 模板列表 */}
            <div className="flex-1 overflow-y-auto">
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
                <div className="py-3 space-y-1">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => scrollToTemplate(template.id)}
                      className={`w-full text-left px-5 py-2.5 rounded-md transition-colors flex items-center gap-2 border border-transparent ${
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

            {/* 侧边栏底部设置按钮 */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                设置
              </button>
            </div>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1 overflow-y-auto">
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
              <div className="px-6 md:px-8 py-8">
                {/* 模板卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      ref={(el) => (cardRefs.current[template.id] = el)}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-5"
                    >
                      {/* 模板名称 */}
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                          {template.name}
                        </h3>
                        {template.domain && (
                          <p className="text-xs text-gray-500">{template.domain}</p>
                        )}
                      </div>

                      {/* 搜索输入框和按钮 */}
                      <div className="relative">
                        <div className="flex space-x-2">
                          <div className="flex-1 relative">
                            <input
                              ref={(el) => (inputRefs.current[template.id] = el)}
                              type="text"
                              value={searchQueries[template.id] || ''}
                              onChange={(e) => handleInputChange(template.id, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(template.id, e)}
                              onFocus={() => {
                                // 聚焦时总是显示建议（包括空查询时显示所有历史记录）
                                setActiveSuggestions(template.id);
                              }}
                              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 text-sm"
                              placeholder="输入搜索关键词..."
                              disabled={searchingTemplates[template.id]}
                            />

                            {/* 搜索建议 */}
                            <SearchSuggestions
                              template={template}
                              query={searchQueries[template.id] || ''}
                              onSelect={(keyword) => handleSuggestionSelect(template.id, keyword)}
                              onClose={() => setActiveSuggestions(null)}
                              visible={activeSuggestions === template.id}
                              onEnterWithoutSelection={() => {
                                setActiveSuggestions(null);
                                handleSearch(template);
                              }}
                            />
                          </div>

                          <LoadingButton
                            loading={searchingTemplates[template.id] || false}
                            disabled={!searchQueries[template.id]?.trim()}
                            onClick={() => handleSearch(template)}
                            className="px-3.5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </LoadingButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 使用提示 */}
                <div className="text-center mt-12 text-gray-500 text-sm">
                  <p>提示：聚焦输入框查看搜索历史，点击历史记录立即搜索，按 Enter 键快速搜索，点击侧边栏模板名称可快速定位到对应卡片</p>
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
        }}
        onTemplatesSaved={() => {
          // 重新加载模板列表
          loadTemplates()
        }}
      />

      <ToastContainer messages={toast.messages} onRemove={toast.removeToast} />
    </div>
  );
};

export default NewTabPage;
