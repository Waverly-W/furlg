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

// 全局设置
export interface GlobalSettings {
  openBehavior: OpenBehavior      // 搜索结果打开方式
  topHintEnabled: boolean         // 是否显示顶部提示
  topHintTitle: string            // 顶部提示标题
  topHintSubtitle: string         // 顶部提示副标题
  historySortType?: HistorySortType // 历史记录排序方式（可选，用于向后兼容）
  sidebarWidth?: number           // 侧边栏宽度（像素），默认256px
  sidebarVisible?: boolean        // 侧边栏是否可见，默认true
}

export interface StorageData {
  templates: Template[];
  searchHistory: SearchHistory[];
  globalSettings?: GlobalSettings;
}
