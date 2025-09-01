import React from 'react'
import type { GlobalSettings, CardStyleSettings } from '../../../types'

interface StyleTextPanelProps {
  settings: GlobalSettings
  onUpdateCardStyle: (updates: Partial<CardStyleSettings>) => void
  onResetTextStyle: () => void
}

const StyleTextPanel: React.FC<StyleTextPanelProps> = ({ settings, onUpdateCardStyle, onResetTextStyle }) => {
  return (
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
              onChange={(e) => onUpdateCardStyle({ titleFontSize: Number(e.target.value) })}
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
                onChange={(e) => onUpdateCardStyle({ titleFontColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardStyle?.titleFontColor || '#1f2937'}
                onChange={(e) => onUpdateCardStyle({ titleFontColor: e.target.value })}
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
              onChange={(e) => onUpdateCardStyle({ titleFontWeight: e.target.value as any })}
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
              onClick={onResetTextStyle}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              重置文字样式
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StyleTextPanel

