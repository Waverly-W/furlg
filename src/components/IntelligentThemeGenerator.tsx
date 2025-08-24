import React, { useState } from 'react';
import type { CardStyleSettings } from '../types';
import {
  generateIntelligentTheme,
  generateIntelligentThemes,
  validateThemeAccessibility,
  optimizeThemeAccessibility,
  type IntelligentTheme,
  type ThemeGenerationOptions
} from '../utils/intelligentThemeGenerator';

interface IntelligentThemeGeneratorProps {
  backgroundImage?: string;
  onThemeGenerated: (theme: CardStyleSettings) => void;
  onPreviewTheme: (theme: CardStyleSettings) => void;
  onCancelPreview: () => void;
}

export const IntelligentThemeGenerator: React.FC<IntelligentThemeGeneratorProps> = ({
  backgroundImage,
  onThemeGenerated,
  onPreviewTheme,
  onCancelPreview
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThemes, setGeneratedThemes] = useState<IntelligentTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<IntelligentTheme | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationSeed, setGenerationSeed] = useState(0);

  // 生成多个智能主题
  const handleGenerateThemes = async (regenerate: boolean = false) => {
    if (!backgroundImage) {
      setError('请先设置背景图片');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🎨 开始生成智能主题...');

      const options: ThemeGenerationOptions = {
        maxThemes: 6,
        ensureAccessibility: true,
        extractionStrategy: 'distributed',
        variationSeed: regenerate ? generationSeed + 1 : generationSeed
      };

      const themes = await generateIntelligentThemes(backgroundImage, options);
      console.log('✅ 智能主题生成成功:', themes);

      // 验证和优化所有主题的可访问性
      const optimizedThemes = themes.map(theme => {
        const validation = validateThemeAccessibility(theme);
        if (!validation.isValid) {
          console.log('⚠️ 主题可访问性不足，正在优化:', validation.issues);
          return optimizeThemeAccessibility(theme);
        }
        return theme;
      });

      setGeneratedThemes(optimizedThemes);

      // 自动选择第一个主题并进入预览模式
      if (optimizedThemes.length > 0) {
        const firstTheme = optimizedThemes[0];
        setSelectedTheme(firstTheme);
        setIsPreviewMode(true);
        onPreviewTheme(firstTheme.settings);
      }

      // 更新种子以便下次重新生成时产生不同结果
      if (regenerate) {
        setGenerationSeed(prev => prev + 1);
      }

    } catch (err) {
      console.error('❌ 智能主题生成失败:', err);
      setError(err instanceof Error ? err.message : '主题生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 选择主题
  const handleSelectTheme = (theme: IntelligentTheme) => {
    setSelectedTheme(theme);
    setIsPreviewMode(true);
    onPreviewTheme(theme.settings);
  };

  // 应用主题
  const handleApplyTheme = () => {
    if (selectedTheme) {
      onThemeGenerated(selectedTheme.settings);
      setIsPreviewMode(false);
      setSelectedTheme(null);
      setGeneratedThemes([]);
    }
  };

  // 取消预览
  const handleCancelPreview = () => {
    setIsPreviewMode(false);
    setSelectedTheme(null);
    setGeneratedThemes([]);
    onCancelPreview();
  };

  // 重新生成
  const handleRegenerate = () => {
    setIsPreviewMode(false);
    setSelectedTheme(null);
    onCancelPreview();
    handleGenerateThemes(true);
  };

  return (
    <div className="space-y-4">
      {/* 智能主题生成按钮 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">智能主题生成</h4>
            <p className="text-xs text-gray-600 mb-3">
              基于背景图片自动提取主色调，生成配色协调的个性化主题
            </p>
            
            {!backgroundImage ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-xs text-amber-700">请先在"全局样式"中设置背景图片</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => handleGenerateThemes(false)}
                  disabled={isGenerating}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded-md hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>正在分析图片...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>生成智能主题</span>
                  </div>
                )}
                </button>

                {generatedThemes.length > 0 && (
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>重新生成</span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* 主题选择网格 */}
      {generatedThemes.length > 0 && !isPreviewMode && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">选择主题方案</h4>
          <div className="grid grid-cols-2 gap-3">
            {generatedThemes.map((theme, index) => (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme)}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-900">{theme.name}</span>
                  <div className="flex gap-1">
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.sourceColors.dominant }}
                      title="主色调"
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.sourceColors.accent }}
                      title="强调色"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">{theme.description}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>{theme.colorScheme.mood}</span>
                  <span>•</span>
                  <span>{theme.colorScheme.harmony}</span>
                  {theme.accessibility.isAccessible && (
                    <>
                      <span>•</span>
                      <span className="text-green-600">可访问</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 主题预览和操作 */}
      {selectedTheme && isPreviewMode && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{selectedTheme.name}</h4>
              <p className="text-xs text-gray-600">{selectedTheme.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{selectedTheme.colorScheme.mood}</span>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">{selectedTheme.colorScheme.harmony}</span>
                {selectedTheme.accessibility.isAccessible && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    {selectedTheme.accessibility.wcagLevel}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: selectedTheme.sourceColors.dominant }}
                  title="主色调"
                />
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: selectedTheme.sourceColors.accent }}
                  title="强调色"
                />
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: selectedTheme.sourceColors.neutral }}
                  title="中性色"
                />
              </div>
            </div>
          </div>

          {/* 主题预览 */}
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <div className="text-xs text-gray-600 mb-2">主题预览：</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedTheme.settings.cardBackgroundColor }}></div>
                  <span>卡片背景</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedTheme.settings.cardBorderColor }}></div>
                  <span>卡片边框</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedTheme.settings.titleFontColor }}></div>
                  <span>标题文字</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedTheme.settings.searchBoxBackgroundColor }}></div>
                  <span>搜索框背景</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedTheme.settings.searchButtonBackgroundColor }}></div>
                  <span>搜索按钮</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedTheme.settings.searchButtonHoverColor }}></div>
                  <span>按钮悬停</span>
                </div>
              </div>
            </div>

            {/* 颜色协调度信息 */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">协调度评分:</span>
                <span className="font-medium">{selectedTheme.colorScheme.harmonyScore.toFixed(0)}/100</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-600">对比度评分:</span>
                <span className="font-medium">{selectedTheme.colorScheme.contrastScore.toFixed(0)}/100</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleApplyTheme}
              className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
            >
              应用主题
            </button>
            <button
              onClick={() => {
                setIsPreviewMode(false);
                setSelectedTheme(null);
              }}
              className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
            >
              返回选择
            </button>
            <button
              onClick={handleRegenerate}
              className="px-3 py-2 bg-purple-500 text-white text-sm font-medium rounded-md hover:bg-purple-600 transition-colors"
            >
              重新生成
            </button>
            <button
              onClick={handleCancelPreview}
              className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
