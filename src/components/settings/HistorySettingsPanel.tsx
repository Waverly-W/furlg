import React from 'react'
import type { GlobalSettings, HistorySortType } from '../../types'

interface HistorySettingsPanelProps {
  settings: GlobalSettings
  setHistorySortType: (v: HistorySortType) => void
}

const HistorySettingsPanel: React.FC<HistorySettingsPanelProps> = ({ settings, setHistorySortType }) => {
  return (
    <div className="p-6 space-y-8 overflow-y-auto">
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
  )
}

export default HistorySettingsPanel

