// 占位符信息接口
export interface PlaceholderInfo {
  id?: string;           // 占位符唯一ID（用于编辑时的标识）
  code: string;          // 占位符代码，如 "query", "category"，用于URL模板中的 {code} 格式
  name: string;          // 占位符显示名称，如 "搜索词", "商品分类"，用于界面标签显示
  required?: boolean;    // 是否必填，默认true
  placeholder?: string;  // 输入框占位符文本
}

// 模板接口定义
export interface Template {
  id: string;
  name: string;          // 模板名称，如 "Bing搜索"
  urlPattern: string;    // URL模板，如 "https://www.bing.com/search?q={query}&cat={category}"
  domain?: string;       // 可选：关联域名，用于自动匹配
  createdAt: number;     // 创建时间
  updatedAt: number;     // 更新时间
  // 占位符列表（主动管理模式）
  placeholders: PlaceholderInfo[];   // 占位符配置列表，必填字段
  // 向后兼容字段（已废弃，仅用于数据迁移）
  isMultiKeyword?: boolean;          // 是否为多关键词模板（废弃）
}

// 搜索历史记录接口定义
export interface SearchHistory {
  id: string;
  templateId: string;    // 关联的模板ID
  keyword: string;       // 搜索关键词
  alias?: string;        // 可选：别名（用于简短输入与展示，默认等于keyword）
  timestamp: number;     // 搜索时间戳
  usageCount?: number;   // 使用次数（可选，用于向后兼容）
  createdAt?: number;    // 创建时间（可选，用于向后兼容）
  placeholderName?: string; // 占位符名称（可选，用于向后兼容和多关键词支持）
}

// 存储数据结构
export type OpenBehavior = "current" | "newtab"

// 历史记录排序方式
export type HistorySortType = "time" | "frequency"

// 多关键词输入值类型
export type MultiKeywordValues = Record<string, string>

// 占位符验证结果
export interface PlaceholderValidationResult {
  isValid: boolean;
  errors: string[];
  placeholders: string[];
}

// 模板占位符一致性验证结果
export interface TemplatePlaceholderValidationResult {
  isValid: boolean;
  errors: string[];
  missingInList: string[];      // URL模板中存在但占位符列表中缺失的占位符
  missingInTemplate: string[];  // 占位符列表中存在但URL模板中未使用的占位符
  usedPlaceholders: string[];   // URL模板中实际使用的占位符
}

// 搜索卡片样式设置
export interface CardStyleSettings {
  // 卡片布局设置
  cardSpacing: number             // 卡片间距（px）
  cardBackgroundColor: string     // 卡片背景颜色（hex或rgba）
  cardOpacity: number             // 卡片透明度（0-100）
  cardMaskOpacity: number         // 背景遮罩透明度（0-100）
  cardBlurStrength: number        // 背景模糊强度（8-24px）
  cardMinWidth?: number           // 卡片最小宽度（px，可选，影响瀑布流列数）
  cardMaxWidth?: number           // 卡片最大宽度（px，可选，影响瀑布流列数）

  // 卡片边框设置
  cardBorderEnabled: boolean      // 是否显示边框
  cardBorderColor: string         // 边框颜色（hex或rgba）
  cardBorderWidth: number         // 边框宽度（0-5px）
  cardBorderStyle: 'solid' | 'dashed' | 'dotted' // 边框样式

  // 卡片标题样式
  titleFontSize: number           // 标题字体大小（12-24px）
  titleFontColor: string          // 标题字体颜色
  titleFontWeight: 'normal' | 'bold' | '500' | '600' | '700' // 标题字体粗细

  // 搜索框样式
  searchBoxBorderRadius: number   // 搜索框圆角（0-25px）
  searchBoxBackgroundColor: string // 搜索框背景颜色
  searchBoxBorderColor: string    // 搜索框边框颜色
  searchBoxFontSize: number       // 搜索框文字大小（12-18px）
  searchBoxTextColor: string      // 搜索框文字颜色
  searchBoxPlaceholderColor: string // 搜索框占位符颜色

  // 搜索按钮样式
  searchButtonBorderRadius: number // 搜索按钮圆角（0-25px）
  searchButtonBackgroundColor: string // 搜索按钮背景颜色
  searchButtonTextColor: string   // 搜索按钮文字颜色
  searchButtonHoverColor: string  // 搜索按钮悬停颜色
}

// 预设主题
export interface CardStyleTheme {
  name: string                    // 主题名称
  description: string             // 主题描述
  settings: CardStyleSettings     // 主题设置
}

// Dock快捷方式接口
export interface DockShortcut {
  id: string;                     // 唯一标识符
  name: string;                   // 显示名称
  url: string;                    // 目标链接
  icon?: string;                  // 图标URL或favicon
  index: number;                  // 排序索引（数字，用于控制显示顺序）
  createdAt: number;              // 创建时间
  updatedAt: number;              // 更新时间
}

// Dock设置接口
export interface DockSettings {
  enabled: boolean;               // 是否启用Dock栏
  maxDisplayCount: number;        // 最大显示数量
  position: 'bottom' | 'top';     // 位置（预留扩展选项）
}

// 全局设置
export interface GlobalSettings {
  openBehavior: OpenBehavior      // 搜索结果打开方式
  topHintEnabled: boolean         // 是否显示顶部提示
  topHintTitle: string            // 顶部提示标题
  topHintSubtitle: string         // 顶部提示副标题
  historySortType?: HistorySortType // 历史记录排序方式（可选，用于向后兼容）
  sidebarWidth?: number           // 侧边栏宽度（像素），默认256px
  sidebarVisible?: boolean        // 侧边栏是否可见，默认true
  // 背景设置
  backgroundImage?: string        // 背景图片的base64数据或URL（向后兼容）
  backgroundImageId?: string      // 背景图片ID（新的存储方式）
  backgroundMaskOpacity?: number  // 背景遮罩透明度（0-100）
  backgroundBlur?: number         // 背景模糊程度（0-20px）
  // 搜索卡片样式设置
  cardStyle?: CardStyleSettings   // 搜索卡片样式配置
  // Dock设置
  dockSettings?: DockSettings     // Dock栏配置
}

export interface StorageData {
  templates: Template[];
  searchHistory: SearchHistory[];
  globalSettings?: GlobalSettings;
  dockShortcuts?: DockShortcut[];  // Dock快捷方式列表
}
