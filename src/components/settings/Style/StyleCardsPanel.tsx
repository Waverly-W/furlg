import React from 'react'
import type { GlobalSettings, CardStyleSettings, CardStyleTheme } from '../../../types'
import { IntelligentThemeGenerator } from '../../IntelligentThemeGenerator'
import { CARD_STYLE_THEMES } from '../../../utils/cardStyleThemes'

interface StyleCardsPanelProps {
  settings: GlobalSettings
  onUpdateCardStyle: (updates: Partial<CardStyleSettings>) => void
  onApplyTheme: (theme: CardStyleTheme) => void
  onResetCardStyle: () => void
  onCardStyleChange?: (style: CardStyleSettings) => void
}

const StyleCardsPanel: React.FC<StyleCardsPanelProps> = ({
  settings,
  onUpdateCardStyle,
  onApplyTheme,
  onResetCardStyle,
  onCardStyleChange
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">卡片样式设置</h3>

        <IntelligentThemeGenerator
          backgroundImage={settings.backgroundImage}
          onThemeGenerated={(theme) => {
            onUpdateCardStyle(theme)
            onCardStyleChange?.(theme)
          }}
          onPreviewTheme={(theme) => onCardStyleChange?.(theme)}
          onCancelPreview={() => {
            if (settings.cardStyle) onCardStyleChange?.(settings.cardStyle)
          }}
        />

        {/* 预设主题 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">预设主题</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CARD_STYLE_THEMES.map((theme) => (
              <button
                key={theme.name}
                type="button"
                onClick={() => onApplyTheme(theme)}
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
              onChange={(e) => onUpdateCardStyle({ cardSpacing: Number(e.target.value) })}
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
                onChange={(e) => onUpdateCardStyle({ cardBackgroundColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardStyle?.cardBackgroundColor || '#ffffff'}
                onChange={(e) => onUpdateCardStyle({ cardBackgroundColor: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="#ffffff"
              />
            </div>
          </div>


          {/* 卡片最小/最大宽度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 最小宽度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">最小宽度</span>
                <span className="text-xs text-gray-500">{settings.cardStyle?.cardMinWidth ?? 240}px</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={180}
                  max={600}
                  step={10}
                  value={settings.cardStyle?.cardMinWidth ?? 240}
                  onChange={(e) => {
                    const minW = Number(e.target.value)
                    const maxW = settings.cardStyle?.cardMaxWidth ?? 360
                    // 保证 min <= max
                    const next = {
                      cardMinWidth: minW,
                      cardMaxWidth: Math.max(minW, maxW)
                    }
                    onUpdateCardStyle(next)
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <input
                  type="number"
                  min={180}
                  max={600}
                  step={10}
                  value={settings.cardStyle?.cardMinWidth ?? 240}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    const clamped = isNaN(v) ? 240 : Math.min(600, Math.max(180, v))
                    const maxW = settings.cardStyle?.cardMaxWidth ?? 360
                    onUpdateCardStyle({
                      cardMinWidth: clamped,
                      cardMaxWidth: Math.max(clamped, maxW)
                    })
                  }}
                  className="w-28 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <p className="text-xs text-gray-500">用于计算瀑布流列数，越小可显示更多列</p>
            </div>
            {/* 最大宽度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">最大宽度</span>
                <span className="text-xs text-gray-500">{settings.cardStyle?.cardMaxWidth ?? 360}px</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={200}
                  max={800}
                  step={10}
                  value={settings.cardStyle?.cardMaxWidth ?? 360}
                  onChange={(e) => {
                    const maxW = Number(e.target.value)
                    const minW = settings.cardStyle?.cardMinWidth ?? 240
                    const next = {
                      cardMaxWidth: maxW,
                      cardMinWidth: Math.min(minW, maxW)
                    }
                    onUpdateCardStyle(next)
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <input
                  type="number"
                  min={200}
                  max={800}
                  step={10}
                  value={settings.cardStyle?.cardMaxWidth ?? 360}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    const clamped = isNaN(v) ? 360 : Math.min(800, Math.max(200, v))
                    const minW = settings.cardStyle?.cardMinWidth ?? 240
                    onUpdateCardStyle({
                      cardMaxWidth: clamped,
                      cardMinWidth: Math.min(minW, clamped)
                    })
                  }}
                  className="w-28 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <p className="text-xs text-gray-500">用于限制自适应列宽上限，屏幕较窄时将自动缩小</p>
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
              onChange={(e) => onUpdateCardStyle({ cardOpacity: Number(e.target.value) })}
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
                onChange={(e) => onUpdateCardStyle({ cardBorderEnabled: e.target.checked })}
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
                  onChange={(e) => onUpdateCardStyle({ cardBorderColor: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.cardStyle?.cardBorderColor || '#e5e7eb'}
                  onChange={(e) => onUpdateCardStyle({ cardBorderColor: e.target.value })}
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
                onChange={(e) => onUpdateCardStyle({ cardBorderWidth: Number(e.target.value) })}
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
                onChange={(e) => onUpdateCardStyle({ cardBorderStyle: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="solid">实线</option>
                <option value="dashed">虚线</option>
                <option value="dotted">点线</option>
              </select>
            </div>
          )}
        </div>

        {/* 重置按钮 */}
        <div className="space-y-4">
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onResetCardStyle}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              重置卡片样式
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StyleCardsPanel

