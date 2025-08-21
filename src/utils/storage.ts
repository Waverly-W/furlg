import type { Template, SearchHistory, StorageData, GlobalSettings, OpenBehavior } from "../types";

// 存储键名常量
const STORAGE_KEYS = {
  TEMPLATES: 'templates',
  SEARCH_HISTORY: 'searchHistory',
  GLOBAL_SETTINGS: 'globalSettings'
} as const;

// 默认数据
const DEFAULT_DATA: StorageData = {
  templates: [],
  searchHistory: [],
  globalSettings: {
    openBehavior: 'newtab',
    topHintEnabled: true,
    topHintTitle: '搜索模板',
    topHintSubtitle: '选择任意模板开始搜索'
  }
};

/**
 * Chrome Storage API 封装类
 */
export class StorageManager {
  /** 获取全局设置 */
  static async getGlobalSettings(): Promise<GlobalSettings> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GLOBAL_SETTINGS)
      return result[STORAGE_KEYS.GLOBAL_SETTINGS] || DEFAULT_DATA.globalSettings!
    } catch (e) {
      console.error('获取全局设置失败:', e)
      return DEFAULT_DATA.globalSettings!
    }
  }

  /** 保存全局设置（部分更新） */
  static async saveGlobalSettings(partial: Partial<GlobalSettings>): Promise<GlobalSettings> {
    const current = await this.getGlobalSettings()
    const updated = { ...current, ...partial }
    await chrome.storage.local.set({ [STORAGE_KEYS.GLOBAL_SETTINGS]: updated })
    return updated
  }

  /**
   * 获取所有模板
   */
  static async getTemplates(): Promise<Template[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.TEMPLATES);
      return result[STORAGE_KEYS.TEMPLATES] || DEFAULT_DATA.templates;
    } catch (error) {
      console.error('获取模板失败:', error);
      return DEFAULT_DATA.templates;
    }
  }

  /**
   * 保存模板
   */
  static async saveTemplate(template: Template): Promise<void> {
    try {
      const templates = await this.getTemplates();
      const existingIndex = templates.findIndex(t => t.id === template.id);

      if (existingIndex >= 0) {
        templates[existingIndex] = { ...template, updatedAt: Date.now() };
      } else {
        templates.push({ ...template, createdAt: Date.now(), updatedAt: Date.now() });
      }

      await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates });
    } catch (error) {
      console.error('保存模板失败:', error);
      throw error;
    }
  }

  /**
   * 删除模板
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      const templates = await this.getTemplates();
      const filteredTemplates = templates.filter(t => t.id !== templateId);
      await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: filteredTemplates });

      // 同时删除该模板的所有历史记录
      await this.deleteHistoryByTemplate(templateId);
    } catch (error) {
      console.error('删除模板失败:', error);
      throw error;
    }
  }

  /** 批量替换模板，并清理不存在模板的历史记录 */
  static async setTemplates(templates: Template[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.TEMPLATES]: templates })
      // 清理历史
      const allHistory = await this.getSearchHistory()
      const idSet = new Set(templates.map(t => t.id))
      const filtered = allHistory.filter(h => idSet.has(h.templateId))
      await chrome.storage.local.set({ [STORAGE_KEYS.SEARCH_HISTORY]: filtered })
    } catch (e) {
      console.error('批量保存模板失败:', e)
      throw e
    }
  }

  /**
   * 获取搜索历史记录
   */
  static async getSearchHistory(templateId?: string): Promise<SearchHistory[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.SEARCH_HISTORY);
      const allHistory = result[STORAGE_KEYS.SEARCH_HISTORY] || DEFAULT_DATA.searchHistory;

      if (templateId) {
        return allHistory.filter((h: SearchHistory) => h.templateId === templateId);
      }

      return allHistory;
    } catch (error) {
      console.error('获取搜索历史失败:', error);
      return [];
    }
  }

  /**
   * 添加搜索历史记录
   */
  static async addSearchHistory(templateId: string, keyword: string): Promise<void> {
    try {
      const allHistory = await this.getSearchHistory();

      // 检查是否已存在相同的记录
      const existingIndex = allHistory.findIndex(
        h => h.templateId === templateId && h.keyword === keyword
      );

      if (existingIndex >= 0) {
        // 更新时间戳
        allHistory[existingIndex].timestamp = Date.now();
      } else {
        // 添加新记录
        const newHistory: SearchHistory = {
          id: `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          templateId,
          keyword,
          timestamp: Date.now()
        };
        allHistory.push(newHistory);
      }

      // 按时间戳降序排序，保留最近的50条记录
      allHistory.sort((a, b) => b.timestamp - a.timestamp);
      const limitedHistory = allHistory.slice(0, 50);

      await chrome.storage.local.set({ [STORAGE_KEYS.SEARCH_HISTORY]: limitedHistory });
    } catch (error) {
      console.error('添加搜索历史失败:', error);
      throw error;
    }
  }

  /**
   * 删除指定模板的所有历史记录
   */
  static async deleteHistoryByTemplate(templateId: string): Promise<void> {
    try {
      const allHistory = await this.getSearchHistory();
      const filteredHistory = allHistory.filter(h => h.templateId !== templateId);
      await chrome.storage.local.set({ [STORAGE_KEYS.SEARCH_HISTORY]: filteredHistory });
    } catch (error) {
      console.error('删除模板历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除单个历史记录
   */
  static async deleteSearchHistory(historyId: string): Promise<void> {
    try {
      const allHistory = await this.getSearchHistory();
      const filteredHistory = allHistory.filter(h => h.id !== historyId);
      await chrome.storage.local.set({ [STORAGE_KEYS.SEARCH_HISTORY]: filteredHistory });
    } catch (error) {
      console.error('删除历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有历史记录
   */
  static async clearAllSearchHistory(): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.SEARCH_HISTORY]: [] });
    } catch (error) {
      console.error('清空历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除历史记录
   */
  static async deleteMultipleSearchHistory(historyIds: string[]): Promise<void> {
    try {
      const allHistory = await this.getSearchHistory();
      const idSet = new Set(historyIds);
      const filteredHistory = allHistory.filter(h => !idSet.has(h.id));
      await chrome.storage.local.set({ [STORAGE_KEYS.SEARCH_HISTORY]: filteredHistory });
    } catch (error) {
      console.error('批量删除历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有数据
   */
  static async clearAll(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('清空数据失败:', error);
      throw error;
    }
  }
}
