import { ExtendedColorPalette, ColorInfo, rgbToHsl, hslToRgb, getContrastRatio } from './colorExtractor';

export interface ColorScheme {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  harmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary';
  mood: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted' | 'elegant';
  contrastScore: number; // 对比度评分 (0-100)
  harmonyScore: number;  // 和谐度评分 (0-100)
}

export interface SchemeGenerationOptions {
  preferredMood?: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted' | 'elegant';
  preferredHarmony?: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary';
  ensureAccessibility?: boolean;
  minContrastRatio?: number;
  variationSeed?: number; // 用于生成不同变体的种子
}

/**
 * 基于提取的颜色调色板生成多种配色方案
 */
export function generateColorSchemes(
  palette: ExtendedColorPalette, 
  options: SchemeGenerationOptions = {}
): ColorScheme[] {
  const {
    preferredMood,
    preferredHarmony,
    ensureAccessibility = true,
    minContrastRatio = 4.5,
    variationSeed = 0
  } = options;

  const schemes: ColorScheme[] = [];
  
  // 生成基于主色调的方案
  schemes.push(...generateDominantBasedSchemes(palette, ensureAccessibility, minContrastRatio, variationSeed));
  
  // 生成基于暖色调的方案
  if (palette.warm.length > 0) {
    schemes.push(...generateWarmSchemes(palette, ensureAccessibility, minContrastRatio, variationSeed));
  }
  
  // 生成基于冷色调的方案
  if (palette.cool.length > 0) {
    schemes.push(...generateCoolSchemes(palette, ensureAccessibility, minContrastRatio, variationSeed));
  }
  
  // 生成高饱和度方案
  if (palette.vibrant.length > 0) {
    schemes.push(...generateVibrantSchemes(palette, ensureAccessibility, minContrastRatio, variationSeed));
  }
  
  // 生成低饱和度方案
  if (palette.muted.length > 0) {
    schemes.push(...generateMutedSchemes(palette, ensureAccessibility, minContrastRatio, variationSeed));
  }
  
  // 生成互补色方案
  schemes.push(...generateComplementarySchemes(palette, ensureAccessibility, minContrastRatio, variationSeed));
  
  // 根据偏好过滤和排序
  let filteredSchemes = schemes;
  
  if (preferredMood) {
    filteredSchemes = schemes.filter(scheme => scheme.mood === preferredMood);
    if (filteredSchemes.length === 0) filteredSchemes = schemes; // 如果没有匹配的，返回所有
  }
  
  if (preferredHarmony) {
    filteredSchemes = filteredSchemes.filter(scheme => scheme.harmony === preferredHarmony);
    if (filteredSchemes.length === 0) filteredSchemes = schemes; // 如果没有匹配的，返回所有
  }
  
  // 按和谐度和对比度评分排序
  return filteredSchemes
    .sort((a, b) => (b.harmonyScore + b.contrastScore) - (a.harmonyScore + a.contrastScore))
    .slice(0, 8); // 最多返回8个方案
}

/**
 * 生成基于主色调的配色方案
 */
function generateDominantBasedSchemes(
  palette: ExtendedColorPalette, 
  ensureAccessibility: boolean, 
  minContrastRatio: number,
  seed: number
): ColorScheme[] {
  const schemes: ColorScheme[] = [];
  const dominant = palette.dominant;
  const [h, s, l] = dominant.hsl;
  
  // 单色调方案
  const monochromaticScheme = createMonochromaticScheme(dominant, ensureAccessibility, minContrastRatio, seed);
  schemes.push(monochromaticScheme);
  
  // 类似色方案
  const analogousScheme = createAnalogousScheme(dominant, palette.secondary, ensureAccessibility, minContrastRatio, seed);
  schemes.push(analogousScheme);
  
  return schemes;
}

/**
 * 生成暖色调方案
 */
function generateWarmSchemes(
  palette: ExtendedColorPalette, 
  ensureAccessibility: boolean, 
  minContrastRatio: number,
  seed: number
): ColorScheme[] {
  const schemes: ColorScheme[] = [];
  const warmColors = palette.warm;
  
  if (warmColors.length > 0) {
    const warmScheme = createWarmScheme(warmColors, ensureAccessibility, minContrastRatio, seed);
    schemes.push(warmScheme);
  }
  
  return schemes;
}

/**
 * 生成冷色调方案
 */
function generateCoolSchemes(
  palette: ExtendedColorPalette, 
  ensureAccessibility: boolean, 
  minContrastRatio: number,
  seed: number
): ColorScheme[] {
  const schemes: ColorScheme[] = [];
  const coolColors = palette.cool;
  
  if (coolColors.length > 0) {
    const coolScheme = createCoolScheme(coolColors, ensureAccessibility, minContrastRatio, seed);
    schemes.push(coolScheme);
  }
  
  return schemes;
}

/**
 * 生成高饱和度方案
 */
function generateVibrantSchemes(
  palette: ExtendedColorPalette, 
  ensureAccessibility: boolean, 
  minContrastRatio: number,
  seed: number
): ColorScheme[] {
  const schemes: ColorScheme[] = [];
  const vibrantColors = palette.vibrant;
  
  if (vibrantColors.length > 0) {
    const vibrantScheme = createVibrantScheme(vibrantColors, ensureAccessibility, minContrastRatio, seed);
    schemes.push(vibrantScheme);
  }
  
  return schemes;
}

/**
 * 生成低饱和度方案
 */
function generateMutedSchemes(
  palette: ExtendedColorPalette, 
  ensureAccessibility: boolean, 
  minContrastRatio: number,
  seed: number
): ColorScheme[] {
  const schemes: ColorScheme[] = [];
  const mutedColors = palette.muted;
  
  if (mutedColors.length > 0) {
    const mutedScheme = createMutedScheme(mutedColors, ensureAccessibility, minContrastRatio, seed);
    schemes.push(mutedScheme);
  }
  
  return schemes;
}

/**
 * 生成互补色方案
 */
function generateComplementarySchemes(
  palette: ExtendedColorPalette, 
  ensureAccessibility: boolean, 
  minContrastRatio: number,
  seed: number
): ColorScheme[] {
  const schemes: ColorScheme[] = [];
  const dominant = palette.dominant;
  
  const complementaryScheme = createComplementaryScheme(dominant, ensureAccessibility, minContrastRatio, seed);
  schemes.push(complementaryScheme);
  
  return schemes;
}

/**
 * 计算颜色和谐度评分
 */
function calculateHarmonyScore(colors: string[], harmony: string): number {
  // 基于色彩理论计算和谐度
  // 这里简化实现，实际可以更复杂
  const baseScore = {
    'monochromatic': 85,
    'analogous': 80,
    'complementary': 75,
    'triadic': 70,
    'tetradic': 65,
    'split-complementary': 72
  }[harmony] || 60;
  
  // 可以根据实际颜色关系进行调整
  return baseScore + Math.random() * 10 - 5; // 添加一些随机变化
}

/**
 * 计算对比度评分
 */
function calculateContrastScore(background: string, text: string): number {
  // 将hex转换为rgb
  const bgRgb = hexToRgb(background);
  const textRgb = hexToRgb(text);
  
  if (!bgRgb || !textRgb) return 0;
  
  const contrastRatio = getContrastRatio(bgRgb, textRgb);
  
  // 将对比度比值转换为0-100的评分
  if (contrastRatio >= 7) return 100;
  if (contrastRatio >= 4.5) return 80;
  if (contrastRatio >= 3) return 60;
  if (contrastRatio >= 2) return 40;
  return 20;
}

/**
 * 将hex颜色转换为rgb
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

/**
 * 创建单色调配色方案
 */
function createMonochromaticScheme(
  dominant: ColorInfo,
  ensureAccessibility: boolean,
  minContrastRatio: number,
  seed: number
): ColorScheme {
  const [h, s, l] = dominant.hsl;
  const variation = (seed % 3) * 10; // 根据种子创建变化

  // 生成不同亮度的同色调颜色
  const primary = `hsl(${h}, ${Math.max(20, s - variation)}%, ${Math.max(30, Math.min(70, l))}%)`;
  const secondary = `hsl(${h}, ${Math.max(15, s - variation - 10)}%, ${Math.max(40, Math.min(80, l + 20))}%)`;
  const accent = `hsl(${h}, ${Math.min(100, s + 20)}%, ${Math.max(25, Math.min(65, l - 10))}%)`;

  // 背景和文字颜色
  const background = `hsl(${h}, ${Math.max(5, s - 30)}%, 95%)`;
  const surface = `hsl(${h}, ${Math.max(8, s - 25)}%, 98%)`;
  const text = ensureAccessibility ? '#1a1a1a' : `hsl(${h}, ${Math.max(10, s - 20)}%, 15%)`;
  const textSecondary = `hsl(${h}, ${Math.max(8, s - 25)}%, 45%)`;

  return {
    id: `monochromatic-${seed}`,
    name: '单色调方案',
    description: '基于主色调的不同明度变化，营造统一和谐的视觉效果',
    primary,
    secondary,
    accent,
    background,
    surface,
    text,
    textSecondary,
    border: `hsl(${h}, ${Math.max(10, s - 20)}%, 85%)`,
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    harmony: 'monochromatic',
    mood: s > 50 ? 'vibrant' : 'muted',
    contrastScore: calculateContrastScore(background, text),
    harmonyScore: calculateHarmonyScore([primary, secondary, accent], 'monochromatic')
  };
}

/**
 * 创建类似色配色方案
 */
function createAnalogousScheme(
  dominant: ColorInfo,
  secondary: ColorInfo[],
  ensureAccessibility: boolean,
  minContrastRatio: number,
  seed: number
): ColorScheme {
  const [h, s, l] = dominant.hsl;
  const variation = (seed % 4) * 15; // 根据种子创建变化

  // 生成相邻色相的颜色
  const hue1 = (h + 30 + variation) % 360;
  const hue2 = (h - 30 + variation) % 360;

  const primary = `hsl(${h}, ${Math.max(25, s)}%, ${Math.max(35, Math.min(65, l))}%)`;
  const secondaryColor = `hsl(${hue1}, ${Math.max(20, s - 10)}%, ${Math.max(40, Math.min(70, l + 10))}%)`;
  const accent = `hsl(${hue2}, ${Math.min(100, s + 15)}%, ${Math.max(30, Math.min(60, l - 5))}%)`;

  const background = `hsl(${h}, ${Math.max(8, s - 25)}%, 96%)`;
  const surface = `hsl(${h}, ${Math.max(10, s - 20)}%, 99%)`;
  const text = ensureAccessibility ? '#1a1a1a' : `hsl(${h}, ${Math.max(15, s - 15)}%, 20%)`;
  const textSecondary = `hsl(${h}, ${Math.max(12, s - 20)}%, 50%)`;

  return {
    id: `analogous-${seed}`,
    name: '类似色方案',
    description: '使用相邻色相创造自然和谐的渐变效果',
    primary,
    secondary: secondaryColor,
    accent,
    background,
    surface,
    text,
    textSecondary,
    border: `hsl(${h}, ${Math.max(12, s - 18)}%, 88%)`,
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    harmony: 'analogous',
    mood: 'neutral',
    contrastScore: calculateContrastScore(background, text),
    harmonyScore: calculateHarmonyScore([primary, secondaryColor, accent], 'analogous')
  };
}

/**
 * 创建暖色调配色方案
 */
function createWarmScheme(
  warmColors: ColorInfo[],
  ensureAccessibility: boolean,
  minContrastRatio: number,
  seed: number
): ColorScheme {
  const baseColor = warmColors[seed % warmColors.length];
  const [h, s, l] = baseColor.hsl;

  // 确保色相在暖色范围内
  const warmHue = h <= 60 ? h : (h >= 300 ? h : 30);

  const primary = `hsl(${warmHue}, ${Math.max(40, s)}%, ${Math.max(35, Math.min(65, l))}%)`;
  const secondary = `hsl(${(warmHue + 20) % 360}, ${Math.max(30, s - 15)}%, ${Math.max(45, Math.min(75, l + 15))}%)`;
  const accent = `hsl(${(warmHue - 15 + 360) % 360}, ${Math.min(100, s + 25)}%, ${Math.max(30, Math.min(60, l - 10))}%)`;

  const background = `hsl(${warmHue}, ${Math.max(15, s - 20)}%, 97%)`;
  const surface = `hsl(${warmHue}, ${Math.max(18, s - 15)}%, 99%)`;
  const text = ensureAccessibility ? '#2d1b0e' : `hsl(${warmHue}, ${Math.max(20, s - 10)}%, 25%)`;
  const textSecondary = `hsl(${warmHue}, ${Math.max(15, s - 15)}%, 55%)`;

  return {
    id: `warm-${seed}`,
    name: '暖色调方案',
    description: '温暖舒适的色调，营造亲切友好的氛围',
    primary,
    secondary,
    accent,
    background,
    surface,
    text,
    textSecondary,
    border: `hsl(${warmHue}, ${Math.max(15, s - 15)}%, 90%)`,
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    harmony: 'analogous',
    mood: 'warm',
    contrastScore: calculateContrastScore(background, text),
    harmonyScore: calculateHarmonyScore([primary, secondary, accent], 'analogous')
  };
}

/**
 * 创建冷色调配色方案
 */
function createCoolScheme(
  coolColors: ColorInfo[],
  ensureAccessibility: boolean,
  minContrastRatio: number,
  seed: number
): ColorScheme {
  const baseColor = coolColors[seed % coolColors.length];
  const [h, s, l] = baseColor.hsl;

  // 确保色相在冷色范围内
  const coolHue = h >= 180 && h <= 300 ? h : 210;

  const primary = `hsl(${coolHue}, ${Math.max(35, s)}%, ${Math.max(35, Math.min(65, l))}%)`;
  const secondary = `hsl(${(coolHue + 25) % 360}, ${Math.max(25, s - 15)}%, ${Math.max(45, Math.min(75, l + 15))}%)`;
  const accent = `hsl(${(coolHue - 20 + 360) % 360}, ${Math.min(100, s + 20)}%, ${Math.max(30, Math.min(60, l - 10))}%)`;

  const background = `hsl(${coolHue}, ${Math.max(12, s - 25)}%, 97%)`;
  const surface = `hsl(${coolHue}, ${Math.max(15, s - 20)}%, 99%)`;
  const text = ensureAccessibility ? '#0f1419' : `hsl(${coolHue}, ${Math.max(18, s - 12)}%, 22%)`;
  const textSecondary = `hsl(${coolHue}, ${Math.max(15, s - 18)}%, 52%)`;

  return {
    id: `cool-${seed}`,
    name: '冷色调方案',
    description: '清爽冷静的色调，营造专业理性的氛围',
    primary,
    secondary,
    accent,
    background,
    surface,
    text,
    textSecondary,
    border: `hsl(${coolHue}, ${Math.max(12, s - 20)}%, 88%)`,
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    harmony: 'analogous',
    mood: 'cool',
    contrastScore: calculateContrastScore(background, text),
    harmonyScore: calculateHarmonyScore([primary, secondary, accent], 'analogous')
  };
}

/**
 * 创建高饱和度配色方案
 */
function createVibrantScheme(
  vibrantColors: ColorInfo[],
  ensureAccessibility: boolean,
  minContrastRatio: number,
  seed: number
): ColorScheme {
  const baseColor = vibrantColors[seed % vibrantColors.length];
  const [h, s, l] = baseColor.hsl;

  const primary = `hsl(${h}, ${Math.min(100, s + 10)}%, ${Math.max(40, Math.min(60, l))}%)`;
  const secondary = `hsl(${(h + 30) % 360}, ${Math.max(60, s)}%, ${Math.max(50, Math.min(70, l + 10))}%)`;
  const accent = `hsl(${(h + 180) % 360}, ${Math.min(100, s + 15)}%, ${Math.max(35, Math.min(55, l - 5))}%)`;

  // 高饱和度方案需要更中性的背景
  const background = `hsl(${h}, ${Math.max(8, s - 40)}%, 96%)`;
  const surface = `hsl(${h}, ${Math.max(10, s - 35)}%, 98%)`;
  const text = ensureAccessibility ? '#1a1a1a' : `hsl(${h}, ${Math.max(15, s - 30)}%, 25%)`;
  const textSecondary = `hsl(${h}, ${Math.max(12, s - 35)}%, 50%)`;

  return {
    id: `vibrant-${seed}`,
    name: '活力方案',
    description: '高饱和度的鲜艳色彩，营造活力四射的视觉效果',
    primary,
    secondary,
    accent,
    background,
    surface,
    text,
    textSecondary,
    border: `hsl(${h}, ${Math.max(10, s - 30)}%, 85%)`,
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    harmony: 'triadic',
    mood: 'vibrant',
    contrastScore: calculateContrastScore(background, text),
    harmonyScore: calculateHarmonyScore([primary, secondary, accent], 'triadic')
  };
}

/**
 * 创建低饱和度配色方案
 */
function createMutedScheme(
  mutedColors: ColorInfo[],
  ensureAccessibility: boolean,
  minContrastRatio: number,
  seed: number
): ColorScheme {
  const baseColor = mutedColors[seed % mutedColors.length];
  const [h, s, l] = baseColor.hsl;

  const primary = `hsl(${h}, ${Math.max(15, Math.min(35, s))}%, ${Math.max(40, Math.min(65, l))}%)`;
  const secondary = `hsl(${(h + 40) % 360}, ${Math.max(12, Math.min(30, s - 5))}%, ${Math.max(50, Math.min(75, l + 15))}%)`;
  const accent = `hsl(${(h + 120) % 360}, ${Math.max(20, Math.min(45, s + 10))}%, ${Math.max(35, Math.min(60, l - 5))}%)`;

  const background = `hsl(${h}, ${Math.max(5, s - 10)}%, 97%)`;
  const surface = `hsl(${h}, ${Math.max(8, s - 5)}%, 99%)`;
  const text = ensureAccessibility ? '#2a2a2a' : `hsl(${h}, ${Math.max(10, s)}%, 30%)`;
  const textSecondary = `hsl(${h}, ${Math.max(8, s - 5)}%, 55%)`;

  return {
    id: `muted-${seed}`,
    name: '优雅方案',
    description: '低饱和度的柔和色彩，营造优雅精致的氛围',
    primary,
    secondary,
    accent,
    background,
    surface,
    text,
    textSecondary,
    border: `hsl(${h}, ${Math.max(8, s - 5)}%, 88%)`,
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    harmony: 'triadic',
    mood: 'elegant',
    contrastScore: calculateContrastScore(background, text),
    harmonyScore: calculateHarmonyScore([primary, secondary, accent], 'triadic')
  };
}

/**
 * 创建互补色配色方案
 */
function createComplementaryScheme(
  dominant: ColorInfo,
  ensureAccessibility: boolean,
  minContrastRatio: number,
  seed: number
): ColorScheme {
  const [h, s, l] = dominant.hsl;
  const complementaryHue = (h + 180) % 360;
  const variation = (seed % 3) * 10;

  const primary = `hsl(${h}, ${Math.max(30, s)}%, ${Math.max(35, Math.min(65, l))}%)`;
  const secondary = `hsl(${h}, ${Math.max(20, s - 15)}%, ${Math.max(50, Math.min(80, l + 20))}%)`;
  const accent = `hsl(${complementaryHue + variation}, ${Math.max(40, s + 10)}%, ${Math.max(30, Math.min(60, l - 5))}%)`;

  const background = `hsl(${h}, ${Math.max(8, s - 30)}%, 96%)`;
  const surface = `hsl(${h}, ${Math.max(10, s - 25)}%, 98%)`;
  const text = ensureAccessibility ? '#1a1a1a' : `hsl(${h}, ${Math.max(15, s - 20)}%, 25%)`;
  const textSecondary = `hsl(${h}, ${Math.max(12, s - 25)}%, 50%)`;

  return {
    id: `complementary-${seed}`,
    name: '互补色方案',
    description: '使用互补色创造强烈对比和视觉冲击力',
    primary,
    secondary,
    accent,
    background,
    surface,
    text,
    textSecondary,
    border: `hsl(${h}, ${Math.max(10, s - 25)}%, 85%)`,
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    harmony: 'complementary',
    mood: 'vibrant',
    contrastScore: calculateContrastScore(background, text),
    harmonyScore: calculateHarmonyScore([primary, secondary, accent], 'complementary')
  };
}
