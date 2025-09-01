import React from 'react'
import type { GlobalSettings, OpenBehavior, Template } from '../../types'
import { SidebarUtils } from '../../utils/sidebarUtils'

interface SidebarWidthRange {
  min: number
  max: number
  default: number
  suggested: number
}

interface GeneralSettingsPanelProps {
  settings: GlobalSettings
  setOpenBehavior: (v: OpenBehavior) => void
  setTopHintEnabled: (v: boolean) => void
  setTopHintTitle: (v: string) => void
  setTopHintSubtitle: (v: string) => void
  isMobile: boolean
  sidebarWidthRange: SidebarWidthRange
  setSidebarWidth: (width: number) => void
  templates: Template[]
}

const GeneralSettingsPanel: React.FC<GeneralSettingsPanelProps> = ({
  settings,
  setOpenBehavior,
  setTopHintEnabled,
  setTopHintTitle,
  setTopHintSubtitle,
  isMobile,
  sidebarWidthRange,
  setSidebarWidth,
  templates
}) => {
  return (
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
                    <summary className="text-xs text-gray-400 cursor-pointer">调试信息（开发模式）</summary>
                    <div className="text-xs text-gray-400 mt-1 space-y-1">
                      {(() => {
                        const details = SidebarUtils.getWidthCalculationDetails(templates); // 仅用于开发诊断
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
  )
}

export default GeneralSettingsPanel

