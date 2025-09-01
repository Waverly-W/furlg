import type { CardStyleTheme, CardStyleSettings } from '../types';

// 浅色主题 - 现代简约风格，适合日常办公
// 配色理念：基于中性灰色调，搭配蓝色作为主色调，营造专业、清爽的视觉体验
const LIGHT_THEME: CardStyleSettings = {
  // 卡片布局设置 - 适中的间距，营造舒适的视觉节奏
  cardSpacing: 20,
  cardBackgroundColor: '#ffffff',        // 纯白背景，提供最佳对比度
  cardOpacity: 98,                       // 接近不透明，确保内容清晰
  cardMaskOpacity: 8,                    // 极轻的遮罩，保持背景可见性
  cardBlurStrength: 16,                  // 适中的模糊，营造层次感

  // 卡片边框设置 - 精细的边框设计，增强卡片边界感
  cardBorderEnabled: true,
  cardBorderColor: '#e2e8f0',           // 浅灰色边框，与背景形成微妙对比
  cardBorderWidth: 1,
  cardBorderStyle: 'solid',

  // 卡片标题样式 - 清晰的层级关系
  titleFontSize: 17,                     // 稍大的标题，增强可读性
  titleFontColor: '#1e293b',             // 深灰色，确保高对比度
  titleFontWeight: '600',                // 半粗体，平衡可读性和优雅感

  // 搜索框样式 - 现代化的输入体验
  searchBoxBorderRadius: 12,             // 圆润的圆角，现代感
  searchBoxBackgroundColor: '#f8fafc',   // 极浅的背景，与卡片形成层次
  searchBoxBorderColor: '#cbd5e1',       // 中性边框色
  searchBoxFontSize: 15,                 // 舒适的阅读尺寸
  searchBoxTextColor: '#334155',         // 深灰色文字
  searchBoxPlaceholderColor: '#94a3b8',  // 柔和的占位符色

  // 搜索按钮样式 - 现代蓝色系，体现专业感
  searchButtonBorderRadius: 12,
  searchButtonBackgroundColor: '#3b82f6', // 标准蓝色，专业可信
  searchButtonTextColor: '#ffffff',
  searchButtonHoverColor: '#2563eb'       // 深蓝色悬停，增强交互反馈
};

// 深色主题 - 优雅专业风格，适合夜间使用
// 配色理念：基于深灰色调，搭配紫色作为主色调，营造优雅、专业的夜间体验
const DARK_THEME: CardStyleSettings = {
  // 卡片布局设置 - 紧凑而不失呼吸感的布局
  cardSpacing: 24,
  cardBackgroundColor: '#1e293b',        // 深蓝灰色，减少眼部疲劳
  cardOpacity: 95,                       // 高透明度，保持内容清晰
  cardMaskOpacity: 25,                   // 适中的遮罩，平衡背景和内容
  cardBlurStrength: 20,                  // 较强的模糊，增强深度感

  // 卡片边框设置 - 精致的边框，增强卡片定义
  cardBorderEnabled: true,
  cardBorderColor: '#475569',           // 中灰色边框，与背景形成适度对比
  cardBorderWidth: 1,
  cardBorderStyle: 'solid',

  // 卡片标题样式 - 清晰的白色文字层级
  titleFontSize: 17,
  titleFontColor: '#f1f5f9',             // 接近白色，确保高对比度
  titleFontWeight: '600',

  // 搜索框样式 - 深色模式下的舒适输入体验
  searchBoxBorderRadius: 14,             // 更圆润的设计，柔化视觉
  searchBoxBackgroundColor: '#334155',   // 深灰色背景，层次分明
  searchBoxBorderColor: '#64748b',       // 中性边框，不过于突出
  searchBoxFontSize: 15,
  searchBoxTextColor: '#e2e8f0',         // 浅灰色文字，舒适阅读
  searchBoxPlaceholderColor: '#94a3b8',  // 柔和的占位符

  // 搜索按钮样式 - 优雅的紫色系，体现专业感
  searchButtonBorderRadius: 14,
  searchButtonBackgroundColor: '#6366f1', // 靛蓝色，优雅专业
  searchButtonTextColor: '#ffffff',
  searchButtonHoverColor: '#4f46e5'       // 深靛蓝悬停效果
};

// 高对比度主题 - 无障碍设计，确保最佳可读性
// 配色理念：纯黑白对比，最大化对比度，符合WCAG AAA级无障碍标准
const HIGH_CONTRAST_THEME: CardStyleSettings = {
  // 卡片布局设置 - 宽松的布局，便于视觉识别
  cardSpacing: 28,
  cardBackgroundColor: '#ffffff',        // 纯白背景，最大对比度
  cardOpacity: 100,                      // 完全不透明，确保清晰度
  cardMaskOpacity: 0,                    // 无遮罩，避免干扰
  cardBlurStrength: 8,                   // 最小模糊，保持清晰

  // 卡片边框设置 - 强烈的边框，增强边界识别
  cardBorderEnabled: true,
  cardBorderColor: '#000000',           // 纯黑边框，最大对比
  cardBorderWidth: 2,                   // 较粗边框，增强可见性
  cardBorderStyle: 'solid',

  // 卡片标题样式 - 大字体，高对比
  titleFontSize: 19,                     // 较大字体，提升可读性
  titleFontColor: '#000000',             // 纯黑文字，最大对比
  titleFontWeight: 'bold',               // 粗体，增强识别度

  // 搜索框样式 - 清晰的黑白对比设计
  searchBoxBorderRadius: 6,              // 较小圆角，保持清晰边界
  searchBoxBackgroundColor: '#ffffff',   // 白色背景
  searchBoxBorderColor: '#000000',       // 黑色边框，强对比
  searchBoxFontSize: 16,                 // 较大字体
  searchBoxTextColor: '#000000',         // 黑色文字
  searchBoxPlaceholderColor: '#4a4a4a',  // 深灰占位符，保持可读性

  // 搜索按钮样式 - 反转的黑白设计
  searchButtonBorderRadius: 6,
  searchButtonBackgroundColor: '#000000', // 黑色按钮
  searchButtonTextColor: '#ffffff',       // 白色文字
  searchButtonHoverColor: '#2d2d2d'       // 深灰悬停，保持对比
};

// 柔和主题 - 温暖舒适风格，减少视觉疲劳
// 配色理念：基于暖色调的米色和桃色系，营造温暖、舒适的视觉环境
const SOFT_THEME: CardStyleSettings = {
  // 卡片布局设置 - 宽松舒适的布局节奏
  cardSpacing: 22,
  cardBackgroundColor: '#fef9f3',        // 温暖的米白色，减少刺激
  cardOpacity: 92,                       // 适中透明度，保持柔和感
  cardMaskOpacity: 12,                   // 轻微遮罩，不影响温暖感
  cardBlurStrength: 18,                  // 柔和的模糊效果

  // 卡片边框设置 - 温暖的边框色调
  cardBorderEnabled: true,
  cardBorderColor: '#fed7aa',           // 浅桃色边框，温暖柔和
  cardBorderWidth: 1,
  cardBorderStyle: 'solid',

  // 卡片标题样式 - 温暖的棕色系文字
  titleFontSize: 16,
  titleFontColor: '#9a3412',             // 温暖的棕色，舒适阅读
  titleFontWeight: '600',

  // 搜索框样式 - 柔和的圆润设计
  searchBoxBorderRadius: 16,             // 圆润的设计，增加亲和力
  searchBoxBackgroundColor: '#fef3e2',   // 浅米色背景
  searchBoxBorderColor: '#fdba74',       // 柔和的橙色边框
  searchBoxFontSize: 15,
  searchBoxTextColor: '#9a3412',         // 温暖的文字色
  searchBoxPlaceholderColor: '#c2410c',  // 柔和的占位符色

  // 搜索按钮样式 - 温暖的橙色系
  searchButtonBorderRadius: 16,
  searchButtonBackgroundColor: '#f97316', // 温暖的橙色
  searchButtonTextColor: '#ffffff',
  searchButtonHoverColor: '#ea580c'       // 深橙色悬停
};

// 科技主题 - 未来感设计，体现科技感
// 配色理念：基于深蓝色和青色的科技配色，营造未来感和专业的技术氛围
const TECH_THEME: CardStyleSettings = {
  // 卡片布局设置 - 紧凑精密的布局，体现效率
  cardSpacing: 16,
  cardBackgroundColor: '#0c1426',        // 深蓝黑色，科技感背景
  cardOpacity: 96,                       // 高透明度，保持清晰
  cardMaskOpacity: 20,                   // 适度遮罩，增强层次
  cardBlurStrength: 14,                  // 精确的模糊效果

  // 卡片边框设置 - 科技感的青色边框
  cardBorderEnabled: true,
  cardBorderColor: '#06b6d4',           // 青色边框，科技感强烈
  cardBorderWidth: 1,
  cardBorderStyle: 'solid',

  // 卡片标题样式 - 明亮的青色文字
  titleFontSize: 16,
  titleFontColor: '#22d3ee',             // 亮青色，科技感十足
  titleFontWeight: '600',

  // 搜索框样式 - 现代化的几何设计
  searchBoxBorderRadius: 8,              // 适中圆角，现代感
  searchBoxBackgroundColor: '#1e293b',   // 深蓝灰背景
  searchBoxBorderColor: '#0891b2',       // 深青色边框
  searchBoxFontSize: 15,
  searchBoxTextColor: '#e0f2fe',         // 浅青色文字
  searchBoxPlaceholderColor: '#67e8f9',  // 明亮的占位符

  // 搜索按钮样式 - 醒目的青色系
  searchButtonBorderRadius: 8,
  searchButtonBackgroundColor: '#0891b2', // 深青色按钮
  searchButtonTextColor: '#ffffff',
  searchButtonHoverColor: '#0e7490'       // 更深的青色悬停
};

// 自然主题 - 清新自然风格，营造舒适感
// 配色理念：基于自然绿色系，模拟植物和自然环境，营造清新、舒缓的视觉体验
const NATURE_THEME: CardStyleSettings = {
  // 卡片布局设置 - 自然舒展的布局节奏
  cardSpacing: 24,
  cardBackgroundColor: '#f7fdf7',        // 极浅的绿白色，自然清新
  cardOpacity: 94,                       // 适中透明度，保持自然感
  cardMaskOpacity: 15,                   // 轻微遮罩，不破坏自然感
  cardBlurStrength: 16,                  // 柔和的模糊，如自然光影

  // 卡片边框设置 - 自然的绿色边框
  cardBorderEnabled: true,
  cardBorderColor: '#86efac',           // 浅绿色边框，清新自然
  cardBorderWidth: 1,
  cardBorderStyle: 'solid',

  // 卡片标题样式 - 深绿色的自然文字
  titleFontSize: 16,
  titleFontColor: '#15803d',             // 深绿色，如森林般沉稳
  titleFontWeight: '600',

  // 搜索框样式 - 自然圆润的设计
  searchBoxBorderRadius: 14,             // 圆润设计，模拟自然形态
  searchBoxBackgroundColor: '#f0fdf4',   // 极浅绿色背景
  searchBoxBorderColor: '#4ade80',       // 明亮绿色边框
  searchBoxFontSize: 15,
  searchBoxTextColor: '#166534',         // 深绿色文字
  searchBoxPlaceholderColor: '#22c55e',  // 中绿色占位符

  // 搜索按钮样式 - 生机勃勃的绿色
  searchButtonBorderRadius: 14,
  searchButtonBackgroundColor: '#22c55e', // 标准绿色，充满生机
  searchButtonTextColor: '#ffffff',
  searchButtonHoverColor: '#16a34a'       // 深绿色悬停，稳重自然
};

// 预设主题列表
export const CARD_STYLE_THEMES: CardStyleTheme[] = [
  {
    name: '浅色主题',
    description: '现代简约风格，专业清爽，适合日常办公使用',
    settings: LIGHT_THEME
  },
  {
    name: '深色主题',
    description: '优雅专业风格，护眼舒适，适合夜间长时间使用',
    settings: DARK_THEME
  },
  {
    name: '高对比度',
    description: '无障碍设计，最佳可读性，符合WCAG AAA标准',
    settings: HIGH_CONTRAST_THEME
  },
  {
    name: '柔和主题',
    description: '温暖舒适风格，减少视觉疲劳，营造亲和体验',
    settings: SOFT_THEME
  },
  {
    name: '科技主题',
    description: '未来感设计，科技氛围浓厚，适合技术工作者',
    settings: TECH_THEME
  },
  {
    name: '自然主题',
    description: '清新自然风格，绿色护眼，营造宁静舒缓感受',
    settings: NATURE_THEME
  }
];

// 获取默认主题（与浅色主题保持一致）
export const getDefaultCardStyle = (): CardStyleSettings => ({
  ...LIGHT_THEME,
  // 默认宽度范围，影响瀑布流列数
  cardMinWidth: 240,
  cardMaxWidth: 360
});

// 根据名称获取主题
export const getThemeByName = (name: string): CardStyleTheme | undefined => {
  return CARD_STYLE_THEMES.find(theme => theme.name === name);
};

// 验证卡片样式设置的有效性
export const validateCardStyleSettings = (settings: Partial<CardStyleSettings>): CardStyleSettings => {
  const defaultSettings = getDefaultCardStyle();
  
  const minWidth = Math.max(180, Math.min(480, settings.cardMinWidth ?? defaultSettings.cardMinWidth ?? 240));
  const maxWidth = Math.max(minWidth, Math.min(640, settings.cardMaxWidth ?? defaultSettings.cardMaxWidth ?? 360));

  return {
    // 卡片布局设置
    cardSpacing: Math.max(0, Math.min(50, settings.cardSpacing ?? defaultSettings.cardSpacing)),
    cardBackgroundColor: settings.cardBackgroundColor ?? defaultSettings.cardBackgroundColor,
    cardOpacity: Math.max(0, Math.min(100, settings.cardOpacity ?? defaultSettings.cardOpacity)),
    cardMaskOpacity: Math.max(0, Math.min(100, settings.cardMaskOpacity ?? defaultSettings.cardMaskOpacity)),
    cardBlurStrength: Math.max(8, Math.min(24, settings.cardBlurStrength ?? defaultSettings.cardBlurStrength)),
    cardMinWidth: minWidth,
    cardMaxWidth: maxWidth,

    // 卡片边框设置
    cardBorderEnabled: settings.cardBorderEnabled ?? defaultSettings.cardBorderEnabled,
    cardBorderColor: settings.cardBorderColor ?? defaultSettings.cardBorderColor,
    cardBorderWidth: Math.max(0, Math.min(5, settings.cardBorderWidth ?? defaultSettings.cardBorderWidth)),
    cardBorderStyle: settings.cardBorderStyle ?? defaultSettings.cardBorderStyle,

    // 卡片标题样式
    titleFontSize: Math.max(12, Math.min(24, settings.titleFontSize ?? defaultSettings.titleFontSize)),
    titleFontColor: settings.titleFontColor ?? defaultSettings.titleFontColor,
    titleFontWeight: settings.titleFontWeight ?? defaultSettings.titleFontWeight,

    // 搜索框样式
    searchBoxBorderRadius: Math.max(0, Math.min(25, settings.searchBoxBorderRadius ?? defaultSettings.searchBoxBorderRadius)),
    searchBoxBackgroundColor: settings.searchBoxBackgroundColor ?? defaultSettings.searchBoxBackgroundColor,
    searchBoxBorderColor: settings.searchBoxBorderColor ?? defaultSettings.searchBoxBorderColor,
    searchBoxFontSize: Math.max(12, Math.min(18, settings.searchBoxFontSize ?? defaultSettings.searchBoxFontSize)),
    searchBoxTextColor: settings.searchBoxTextColor ?? defaultSettings.searchBoxTextColor,
    searchBoxPlaceholderColor: settings.searchBoxPlaceholderColor ?? defaultSettings.searchBoxPlaceholderColor,

    // 搜索按钮样式
    searchButtonBorderRadius: Math.max(0, Math.min(25, settings.searchButtonBorderRadius ?? defaultSettings.searchButtonBorderRadius)),
    searchButtonBackgroundColor: settings.searchButtonBackgroundColor ?? defaultSettings.searchButtonBackgroundColor,
    searchButtonTextColor: settings.searchButtonTextColor ?? defaultSettings.searchButtonTextColor,
    searchButtonHoverColor: settings.searchButtonHoverColor ?? defaultSettings.searchButtonHoverColor
  };
};
