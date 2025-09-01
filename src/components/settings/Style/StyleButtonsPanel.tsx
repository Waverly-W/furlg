import React from 'react'
import type { GlobalSettings, CardStyleSettings } from '../../../types'

interface StyleButtonsPanelProps {
  settings: GlobalSettings
  onUpdateCardStyle: (updates: Partial<CardStyleSettings>) => void
  onResetButtonStyle: () => void
}

const StyleButtonsPanel: React.FC<StyleButtonsPanelProps> = ({ settings, onUpdateCardStyle, onResetButtonStyle }) => {
  return (
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
              onChange={(e) => onUpdateCardStyle({ searchButtonBorderRadius: Number(e.target.value) })}
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
                onChange={(e) => onUpdateCardStyle({ searchButtonBackgroundColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardStyle?.searchButtonBackgroundColor || '#3b82f6'}
                onChange={(e) => onUpdateCardStyle({ searchButtonBackgroundColor: e.target.value })}
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
                onChange={(e) => onUpdateCardStyle({ searchButtonTextColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardStyle?.searchButtonTextColor || '#ffffff'}
                onChange={(e) => onUpdateCardStyle({ searchButtonTextColor: e.target.value })}
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
                onChange={(e) => onUpdateCardStyle({ searchButtonHoverColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardStyle?.searchButtonHoverColor || '#2563eb'}
                onChange={(e) => onUpdateCardStyle({ searchButtonHoverColor: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="#2563eb"
              />
            </div>
          </div>

          {/* 重置按钮 */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onResetButtonStyle}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              重置按钮样式
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StyleButtonsPanel

