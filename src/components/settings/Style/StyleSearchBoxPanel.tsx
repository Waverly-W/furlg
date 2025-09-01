import React from 'react'
import type { GlobalSettings, CardStyleSettings } from '../../../types'

interface StyleSearchBoxPanelProps {
  settings: GlobalSettings
  onUpdateCardStyle: (updates: Partial<CardStyleSettings>) => void
  onResetSearchBoxStyle: () => void
}

const StyleSearchBoxPanel: React.FC<StyleSearchBoxPanelProps> = ({ settings, onUpdateCardStyle, onResetSearchBoxStyle }) => {
  return (
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
              onChange={(e) => onUpdateCardStyle({ searchBoxBorderRadius: Number(e.target.value) })}
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
                onChange={(e) => onUpdateCardStyle({ searchBoxBackgroundColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardStyle?.searchBoxBackgroundColor || '#f9fafb'}
                onChange={(e) => onUpdateCardStyle({ searchBoxBackgroundColor: e.target.value })}
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
                onChange={(e) => onUpdateCardStyle({ searchBoxBorderColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardStyle?.searchBoxBorderColor || '#d1d5db'}
                onChange={(e) => onUpdateCardStyle({ searchBoxBorderColor: e.target.value })}
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
              onChange={(e) => onUpdateCardStyle({ searchBoxFontSize: Number(e.target.value) })}
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
                onChange={(e) => onUpdateCardStyle({ searchBoxTextColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardStyle?.searchBoxTextColor || '#374151'}
                onChange={(e) => onUpdateCardStyle({ searchBoxTextColor: e.target.value })}
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
                onChange={(e) => onUpdateCardStyle({ searchBoxPlaceholderColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardStyle?.searchBoxPlaceholderColor || '#9ca3af'}
                onChange={(e) => onUpdateCardStyle({ searchBoxPlaceholderColor: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="#9ca3af"
              />
            </div>
          </div>

          {/* 重置按钮 */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onResetSearchBoxStyle}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              重置搜索框样式
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StyleSearchBoxPanel

