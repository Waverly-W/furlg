/**
 * 智能主题生成器
 * 基于背景图片的主色调生成协调的卡片样式主题
 */

import type { CardStyleSettings } from '../types';
import {
  extractColorsFromImage,
  generateColorVariants,
  adjustSaturation,
  adjustLightness,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  isAccessibleContrast,
  getContrastRatio,
  type ExtendedColorPalette,
  type ColorExtractionOptions
} from './colorExtractor';
import {
  generateColorSchemes,
  type ColorScheme,
  type SchemeGenerationOptions
} from './colorSchemeGenerator';

export interface IntelligentTheme {
  id: string;
  name: string;
  description: string;
  settings: CardStyleSettings;
  sourceColors: {
    dominant: string;
    accent: string;
    neutral: string;
  };
  colorScheme: ColorScheme;
  extractionStrategy: string;
  accessibility: {
    contrastRatio: number;
    wcagLevel: 'AA' | 'AAA' | 'FAIL';
    isAccessible: boolean;
  };
  metadata: {
    generatedAt: number;
    extractedColors: number;
    harmonyType: string;
    moodType: string;
  };
}

export interface ThemeGenerationOptions {
  extractionStrategy?: 'dominant' | 'average' | 'edge' | 'center' | 'corners' | 'distributed';
  filterExtremes?: boolean;
  weightByPosition?: boolean;
  weightBySaturation?: boolean;
  preferredMood?: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted' | 'elegant';
  preferredHarmony?: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary';
  ensureAccessibility?: boolean;
  minContrastRatio?: number;
  maxThemes?: number;
  variationSeed?: number;
}

/**
 * 生成安全的文字颜色（确保对比度符合WCAG标准）
 */
function generateAccessibleTextColor(backgroundColor: [number, number, number]): [number, number, number] {
  // 先尝试纯黑色
  if (isAccessibleContrast([0, 0, 0], backgroundColor, 'AA')) {
    return [0, 0, 0];
  }
  
  // 再尝试纯白色
  if (isAccessibleContrast([255, 255, 255], backgroundColor, 'AA')) {
    return [255, 255, 255];
  }
  
  // 如果都不行，生成对比度足够的灰色
  const [h, s, l] = rgbToHsl(...backgroundColor);
  const targetL = l > 50 ? 15 : 85; // 如果背景较亮用深色，否则用浅色
  return hslToRgb(h, Math.min(s, 10), targetL); // 降低饱和度
}

/**
 * 生成悬停颜色（比基础颜色稍深或稍浅）
 */
function generateHoverColor(baseColor: [number, number, number]): [number, number, number] {
  const [h, s, l] = rgbToHsl(...baseColor);
  // 如果颜色较亮，悬停时变深；如果较暗，悬停时变浅
  const adjustment = l > 50 ? -15 : 15;
  return hslToRgb(h, s, Math.max(0, Math.min(100, l + adjustment)));
}

/**
 * 生成边框颜色（比背景颜色稍深的同色系）
 */
function generateBorderColor(backgroundColor: [number, number, number]): [number, number, number] {
  const [h, s, l] = rgbToHsl(...backgroundColor);
  // 边框比背景稍深一些
  const newL = Math.max(0, l - 20);
  const newS = Math.min(100, s + 10); // 稍微增加饱和度
  return hslToRgb(h, newS, newL);
}

/**
 * 生成搜索框背景色（比卡片背景稍浅或稍深）
 */
function generateSearchBoxBackground(cardBackground: [number, number, number]): [number, number, number] {
  const [h, s, l] = rgbToHsl(...cardBackground);
  // 搜索框背景比卡片背景稍浅
  const newL = Math.min(100, l + 8);
  const newS = Math.max(0, s - 5); // 稍微降低饱和度
  return hslToRgb(h, newS, newL);
}

/**
 * 生成多个智能主题变体
 */
export async function generateIntelligentThemes(
  imageUrl: string,
  options: ThemeGenerationOptions = {}
): Promise<IntelligentTheme[]> {
  const {
    extractionStrategy = 'distributed',
    filterExtremes = true,
    weightByPosition = true,
    weightBySaturation = true,
    preferredMood,
    preferredHarmony,
    ensureAccessibility = true,
    minContrastRatio = 4.5,
    maxThemes = 6,
    variationSeed = Date.now() % 1000
  } = options;

  try {
    // 提取颜色调色板
    const extractionOptions: ColorExtractionOptions = {
      strategy: extractionStrategy,
      filterExtremes,
      weightByPosition,
      weightBySaturation,
      maxColors: 12,
      sampleRate: 3
    };

    const palette = await extractColorsFromImage(imageUrl, extractionOptions);

    // 生成多种配色方案
    const schemeOptions: SchemeGenerationOptions = {
      preferredMood,
      preferredHarmony,
      ensureAccessibility,
      minContrastRatio,
      variationSeed
    };

    const colorSchemes = generateColorSchemes(palette, schemeOptions);

    // 为每个配色方案创建完整主题
    const themes: IntelligentTheme[] = [];

    for (let i = 0; i < Math.min(colorSchemes.length, maxThemes); i++) {
      const scheme = colorSchemes[i];
      const theme = await createThemeFromScheme(
        scheme,
        imageUrl,
        extractionStrategy,
        palette.dominant.frequency + palette.secondary.length
      );
      themes.push(theme);
    }

    // 如果主题数量不足，生成更多变体
    if (themes.length < maxThemes) {
      const additionalThemes = await generateAdditionalVariations(
        imageUrl,
        maxThemes - themes.length,
        variationSeed + 100
      );
      themes.push(...additionalThemes);
    }

    return themes.slice(0, maxThemes);

  } catch (error) {
    console.error('智能主题生成失败:', error);
    throw new Error(`主题生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 基于色彩理论生成协调配色方案（保留向后兼容性）
 */
function generateHarmoniousColorScheme(palette: ExtendedColorPalette) {
  const dominant = palette.dominant.rgb;
  const accent = palette.accent.rgb;
  const neutral = palette.neutral.rgb;

  // 生成卡片背景色（使用主色调的浅色版本）
  const cardBackground = adjustLightness(adjustSaturation(dominant, -30), 40);

  // 生成按钮颜色（使用强调色）
  const buttonColor = adjustSaturation(accent, 10);

  // 生成中性色调（用于边框等）
  const neutralColor = adjustSaturation(neutral, -20);

  return {
    cardBackground,
    buttonColor,
    neutralColor,
    dominant,
    accent,
    neutral
  };
}

/**
 * 从配色方案创建完整主题
 */
async function createThemeFromScheme(
  scheme: ColorScheme,
  sourceImage: string,
  extractionStrategy: string,
  extractedColors: number
): Promise<IntelligentTheme> {
  // 解析颜色
  const parseColor = (color: string): [number, number, number] => {
    if (color.startsWith('hsl(')) {
      const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        const [, h, s, l] = match.map(Number);
        return hslToRgb(h, s, l);
      }
    }
    // 默认返回白色
    return [255, 255, 255];
  };

  const primaryRgb = parseColor(scheme.primary);
  const secondaryRgb = parseColor(scheme.secondary);
  const accentRgb = parseColor(scheme.accent);
  const backgroundRgb = parseColor(scheme.background);
  const surfaceRgb = parseColor(scheme.surface);
  const textRgb = parseColor(scheme.text);

  // 生成卡片样式设置
  const settings: CardStyleSettings = {
    // 卡片布局设置
    cardSpacing: 20,
    cardBackgroundColor: scheme.surface,
    cardOpacity: 92,
    cardMaskOpacity: 15,
    cardBlurStrength: 12,

    // 卡片边框设置
    cardBorderEnabled: true,
    cardBorderColor: scheme.border,
    cardBorderWidth: 1,
    cardBorderStyle: 'solid',

    // 卡片标题样式
    titleFontSize: 16,
    titleFontColor: scheme.text,
    titleFontWeight: '600',

    // 搜索框样式
    searchBoxBorderRadius: 12,
    searchBoxBackgroundColor: scheme.background,
    searchBoxBorderColor: scheme.border,
    searchBoxFontSize: 15,
    searchBoxTextColor: scheme.text,
    searchBoxPlaceholderColor: scheme.textSecondary,

    // 搜索按钮样式
    searchButtonBorderRadius: 12,
    searchButtonBackgroundColor: scheme.primary,
    searchButtonTextColor: scheme.background,
    searchButtonHoverColor: adjustColorBrightness(scheme.primary, -10)
  };

  // 计算可访问性信息
  const contrastRatio = getContrastRatio(backgroundRgb, textRgb);
  const accessibility = {
    contrastRatio,
    wcagLevel: getWCAGLevel(contrastRatio),
    isAccessible: contrastRatio >= 4.5
  };

  return {
    id: `theme-${scheme.id}-${Date.now()}`,
    name: scheme.name,
    description: scheme.description,
    settings,
    sourceColors: {
      dominant: rgbToHex(...primaryRgb),
      accent: rgbToHex(...accentRgb),
      neutral: rgbToHex(...secondaryRgb)
    },
    colorScheme: scheme,
    extractionStrategy,
    accessibility,
    metadata: {
      generatedAt: Date.now(),
      extractedColors,
      harmonyType: scheme.harmony,
      moodType: scheme.mood
    }
  };
}

/**
 * 生成额外的主题变体
 */
async function generateAdditionalVariations(
  imageUrl: string,
  count: number,
  baseSeed: number
): Promise<IntelligentTheme[]> {
  const variations: IntelligentTheme[] = [];
  const strategies = ['center', 'edge', 'corners', 'distributed'];

  for (let i = 0; i < count; i++) {
    const strategy = strategies[i % strategies.length];
    const seed = baseSeed + i * 50;

    try {
      const extractionOptions: ColorExtractionOptions = {
        strategy: strategy as any,
        filterExtremes: true,
        weightByPosition: true,
        weightBySaturation: true,
        maxColors: 10,
        sampleRate: 4
      };

      const palette = await extractColorsFromImage(imageUrl, extractionOptions);

      const schemeOptions: SchemeGenerationOptions = {
        ensureAccessibility: true,
        minContrastRatio: 4.5,
        variationSeed: seed
      };

      const schemes = generateColorSchemes(palette, schemeOptions);

      if (schemes.length > 0) {
        const theme = await createThemeFromScheme(
          schemes[0],
          imageUrl,
          strategy,
          palette.dominant.frequency + palette.secondary.length
        );
        variations.push(theme);
      }
    } catch (error) {
      console.warn(`生成变体 ${i} 失败:`, error);
    }
  }

  return variations;
}

/**
 * 调整颜色亮度
 */
function adjustColorBrightness(color: string, adjustment: number): string {
  if (color.startsWith('hsl(')) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const [, h, s, l] = match;
      const newL = Math.max(0, Math.min(100, parseInt(l) + adjustment));
      return `hsl(${h}, ${s}%, ${newL}%)`;
    }
  }
  return color;
}

/**
 * 获取WCAG等级
 */
function getWCAGLevel(ratio: number): 'AA' | 'AAA' | 'FAIL' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'FAIL';
}

/**
 * 从背景图片生成智能主题（保留向后兼容性）
 */
export async function generateIntelligentTheme(imageUrl: string): Promise<IntelligentTheme> {
  try {
    // 使用新的智能主题生成系统，但只返回第一个主题以保持向后兼容性
    const themes = await generateIntelligentThemes(imageUrl, {
      maxThemes: 1,
      ensureAccessibility: true,
      extractionStrategy: 'distributed'
    });

    if (themes.length === 0) {
      throw new Error('无法生成主题');
    }

    return themes[0];

  } catch (error) {
    console.error('智能主题生成失败:', error);
    throw new Error('无法从背景图片生成主题，请确保图片已正确加载');
  }
}

/**
 * 验证生成的主题是否符合可访问性标准
 */
export function validateThemeAccessibility(theme: IntelligentTheme): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const settings = theme.settings;
  
  // 解析颜色
  const parseHex = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  
  try {
    const cardBg = parseHex(settings.cardBackgroundColor);
    const titleColor = parseHex(settings.titleFontColor);
    const searchBoxBg = parseHex(settings.searchBoxBackgroundColor);
    const searchBoxText = parseHex(settings.searchBoxTextColor);
    const buttonBg = parseHex(settings.searchButtonBackgroundColor);
    const buttonText = parseHex(settings.searchButtonTextColor);
    
    // 检查标题对比度
    if (!isAccessibleContrast(titleColor, cardBg, 'AA')) {
      issues.push('标题文字对比度不足');
    }
    
    // 检查搜索框文字对比度
    if (!isAccessibleContrast(searchBoxText, searchBoxBg, 'AA')) {
      issues.push('搜索框文字对比度不足');
    }
    
    // 检查按钮文字对比度
    if (!isAccessibleContrast(buttonText, buttonBg, 'AA')) {
      issues.push('按钮文字对比度不足');
    }
    
  } catch (error) {
    issues.push('颜色格式解析错误');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * 优化主题以提高可访问性
 */
export function optimizeThemeAccessibility(theme: IntelligentTheme): IntelligentTheme {
  const settings = { ...theme.settings };
  
  // 解析颜色
  const parseHex = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  
  try {
    const cardBg = parseHex(settings.cardBackgroundColor);
    const searchBoxBg = parseHex(settings.searchBoxBackgroundColor);
    const buttonBg = parseHex(settings.searchButtonBackgroundColor);
    
    // 优化标题颜色
    settings.titleFontColor = rgbToHex(...generateAccessibleTextColor(cardBg));
    
    // 优化搜索框文字颜色
    settings.searchBoxTextColor = rgbToHex(...generateAccessibleTextColor(searchBoxBg));
    settings.searchBoxPlaceholderColor = rgbToHex(...adjustLightness(generateAccessibleTextColor(searchBoxBg), 20));
    
    // 优化按钮文字颜色
    settings.searchButtonTextColor = rgbToHex(...generateAccessibleTextColor(buttonBg));
    
  } catch (error) {
    console.error('主题优化失败:', error);
  }
  
  return {
    ...theme,
    settings,
    description: theme.description + '（已优化可访问性）'
  };
}
