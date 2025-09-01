import { useCallback } from 'react'
import type { CardStyleSettings, CardStyleTheme, GlobalSettings } from '../../../types'
import { getDefaultCardStyle, validateCardStyleSettings } from '../../../utils/cardStyleThemes'

export function useCardStyle({
  settings,
  setSettings,
  onCardStyleChange
}: {
  settings: GlobalSettings
  setSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>
  onCardStyleChange?: (cardStyle: CardStyleSettings) => void
}) {
  const updateCardStyle = useCallback((updates: Partial<CardStyleSettings>) => {
    setSettings((prev) => {
      const newCardStyle = {
        ...getDefaultCardStyle(),
        ...prev.cardStyle,
        ...updates
      }
      const newSettings = {
        ...prev,
        cardStyle: validateCardStyleSettings(newCardStyle)
      }
      onCardStyleChange?.(newSettings.cardStyle!)
      return newSettings
    })
  }, [setSettings, onCardStyleChange])

  const applyTheme = useCallback((theme: CardStyleTheme) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        cardStyle: theme.settings
      }
      onCardStyleChange?.(theme.settings)
      return newSettings
    })
  }, [setSettings, onCardStyleChange])

  const resetCardStyle = useCallback(() => {
    const defaultStyle = getDefaultCardStyle()
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        cardStyle: defaultStyle
      }
      onCardStyleChange?.(defaultStyle)
      return newSettings
    })
  }, [setSettings, onCardStyleChange])

  const resetSearchBoxStyle = useCallback(() => {
    const defaultStyle = getDefaultCardStyle()
    updateCardStyle({
      searchBoxBorderRadius: defaultStyle.searchBoxBorderRadius,
      searchBoxBackgroundColor: defaultStyle.searchBoxBackgroundColor,
      searchBoxBorderColor: defaultStyle.searchBoxBorderColor,
      searchBoxFontSize: defaultStyle.searchBoxFontSize,
      searchBoxTextColor: defaultStyle.searchBoxTextColor,
      searchBoxPlaceholderColor: defaultStyle.searchBoxPlaceholderColor
    })
  }, [updateCardStyle])

  const resetButtonStyle = useCallback(() => {
    const defaultStyle = getDefaultCardStyle()
    updateCardStyle({
      searchButtonBorderRadius: defaultStyle.searchButtonBorderRadius,
      searchButtonBackgroundColor: defaultStyle.searchButtonBackgroundColor,
      searchButtonTextColor: defaultStyle.searchButtonTextColor,
      searchButtonHoverColor: defaultStyle.searchButtonHoverColor
    })
  }, [updateCardStyle])

  const resetTextStyle = useCallback(() => {
    const defaultStyle = getDefaultCardStyle()
    updateCardStyle({
      titleFontSize: defaultStyle.titleFontSize,
      titleFontColor: defaultStyle.titleFontColor,
      titleFontWeight: defaultStyle.titleFontWeight
    })
  }, [updateCardStyle])

  return {
    updateCardStyle,
    applyTheme,
    resetCardStyle,
    resetSearchBoxStyle,
    resetButtonStyle,
    resetTextStyle
  }
}

