import React from 'react'
import type { GlobalSettings } from '../../../types'
import { EnhancedBackgroundSettings } from '../../EnhancedBackgroundSettings'

interface StyleGlobalPanelProps {
  settings: GlobalSettings
  onBackgroundChange: (settings: {
    backgroundImage?: string
    backgroundImageId?: string
    backgroundMaskOpacity?: number
    backgroundBlur?: number
  }) => void
}

const StyleGlobalPanel: React.FC<StyleGlobalPanelProps> = ({ settings, onBackgroundChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">全局样式设置</h3>
        <EnhancedBackgroundSettings settings={settings} onBackgroundChange={onBackgroundChange} />
      </div>
    </div>
  )
}

export default StyleGlobalPanel

