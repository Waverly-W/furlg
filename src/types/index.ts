// 模板接口定义
export interface Template {
  id: string;
  name: string;          // 模板名称，如 "Bing搜索"
  urlPattern: string;    // URL模板，如 "https://www.bing.com/search?q={keyword}"
  domain?: string;       // 可选：关联域名，用于自动匹配
  createdAt: number;     // 创建时间
  updatedAt: number;     // 更新时间
}

// 搜索历史记录接口定义
export interface SearchHistory {
  id: string;
  templateId: string;    // 关联的模板ID
  keyword: string;       // 搜索关键词
  timestamp: number;     // 搜索时间戳
}

// 存储数据结构
export type OpenBehavior = "current" | "newtab"

// 全局设置
export interface GlobalSettings {
  openBehavior: OpenBehavior      // 搜索结果打开方式
  topHintEnabled: boolean         // 是否显示顶部提示
  topHintTitle: string            // 顶部提示标题
  topHintSubtitle: string         // 顶部提示副标题
}

export interface StorageData {
  templates: Template[];
  searchHistory: SearchHistory[];
  globalSettings?: GlobalSettings;
}
