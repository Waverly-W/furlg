import type { Template, SearchHistory, StorageData, GlobalSettings, OpenBehavior, HistorySortType, CardStyleSettings } from "../types";
import { SidebarUtils } from "./sidebarUtils";

// 存储键名常量
const STORAGE_KEYS = {
  TEMPLATES: 'templates',
  SEARCH_HISTORY: 'searchHistory',
  GLOBAL_SETTINGS: 'globalSettings'
} as const;

// 默认卡片样式设置（与浅色主题保持一致）
const DEFAULT_CARD_STYLE: CardStyleSettings = {
  // 卡片布局设置
  cardSpacing: 20,
  cardBackgroundColor: '#ffffff',
  cardOpacity: 98,
  cardMaskOpacity: 8,
  cardBlurStrength: 16,

  // 卡片边框设置
  cardBorderEnabled: true,
  cardBorderColor: '#e2e8f0',
  cardBorderWidth: 1,
  cardBorderStyle: 'solid',

  // 卡片标题样式
  titleFontSize: 17,
  titleFontColor: '#1e293b',
  titleFontWeight: '600',

  // 搜索框样式
  searchBoxBorderRadius: 12,
  searchBoxBackgroundColor: '#f8fafc',
  searchBoxBorderColor: '#cbd5e1',
  searchBoxFontSize: 15,
  searchBoxTextColor: '#334155',
  searchBoxPlaceholderColor: '#94a3b8',

  // 搜索按钮样式
  searchButtonBorderRadius: 12,
  searchButtonBackgroundColor: '#3b82f6',
  searchButtonTextColor: '#ffffff',
  searchButtonHoverColor: '#2563eb'
};

// 默认数据
const DEFAULT_DATA: StorageData = {
  templates: [],
  searchHistory: [],
  globalSettings: {
    openBehavior: 'newtab',
    topHintEnabled: true,
    topHintTitle: '搜索模板',
    topHintSubtitle: '选择任意模板开始搜索',
    historySortType: 'time',
    sidebarWidth: SidebarUtils.DEFAULT_WIDTH,
    backgroundImage: undefined,
    backgroundMaskOpacity: 30,
    backgroundBlur: 0,
    cardStyle: DEFAULT_CARD_STYLE
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
      let templates = result[STORAGE_KEYS.TEMPLATES] || DEFAULT_DATA.templates;

      // 数据迁移：为没有占位符列表的模板自动生成
      let needsMigration = false;
      templates = templates.map((template: Template) => {
        if (!template.placeholders || template.placeholders.length === 0) {
          needsMigration = true;
          const { PlaceholderParser } = require('./placeholderParser');
          return {
            ...template,
            placeholders: PlaceholderParser.generatePlaceholderListFromTemplate(template.urlPattern)
          };
        }
        return template;
      });

      // 如果需要迁移，保存更新后的数据
      if (needsMigration) {
        await this.setTemplates(templates);
      }

      return templates;
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
      let allHistory = result[STORAGE_KEYS.SEARCH_HISTORY] || DEFAULT_DATA.searchHistory;

      // 数据迁移：为旧数据添加新字段
      let needsMigration = false;
      allHistory = allHistory.map((h: SearchHistory) => {
        if (h.usageCount === undefined || h.createdAt === undefined) {
          needsMigration = true;
          return {
            ...h,
            usageCount: h.usageCount || 1,
            createdAt: h.createdAt || h.timestamp
          };
        }
        return h;
      });

      // 如果需要迁移，保存更新后的数据
      if (needsMigration) {
        await chrome.storage.local.set({ [STORAGE_KEYS.SEARCH_HISTORY]: allHistory });
      }

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
   * 根据全局设置获取排序后的搜索历史记录
   */
  static async getSortedSearchHistory(templateId?: string): Promise<SearchHistory[]> {
    try {
      const history = await this.getSearchHistory(templateId);
      const settings = await this.getGlobalSettings();
      const sortType = settings.historySortType || 'time';

      if (sortType === 'frequency') {
        // 按使用频率排序（使用次数倒序，次数相同时按时间倒序）
        return history.sort((a, b) => {
          const aCount = a.usageCount || 1;
          const bCount = b.usageCount || 1;
          if (aCount !== bCount) {
            return bCount - aCount;
          }
          return b.timestamp - a.timestamp;
        });
      } else {
        // 按时间排序（时间倒序）
        return history.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (error) {
      console.error('获取排序后的搜索历史失败:', error);
      return [];
    }
  }

  /**
   * 获取特定占位符的搜索历史记录
   */
  static async getPlaceholderSearchHistory(templateId: string, placeholderName: string): Promise<SearchHistory[]> {
    try {
      const allHistory = await this.getSearchHistory();

      // 过滤出指定模板和占位符的历史记录
      return allHistory.filter(h =>
        h.templateId === templateId &&
        (h.placeholderName === placeholderName ||
         // 向后兼容：如果没有placeholderName字段，且占位符是keyword，则包含该记录
         (!h.placeholderName && placeholderName === 'keyword'))
      );
    } catch (error) {
      console.error('获取占位符搜索历史失败:', error);
      return [];
    }
  }

  /**
   * 根据全局设置获取特定占位符的排序后搜索历史记录
   */
  static async getSortedPlaceholderSearchHistory(templateId: string, placeholderName: string): Promise<SearchHistory[]> {
    try {
      const history = await this.getPlaceholderSearchHistory(templateId, placeholderName);
      const settings = await this.getGlobalSettings();
      const sortType = settings.historySortType || 'time';

      if (sortType === 'frequency') {
        // 按使用频率排序（使用次数倒序，次数相同时按时间倒序）
        return history.sort((a, b) => {
          const aCount = a.usageCount || 1;
          const bCount = b.usageCount || 1;
          if (aCount !== bCount) {
            return bCount - aCount;
          }
          return b.timestamp - a.timestamp;
        });
      } else {
        // 按时间排序（时间倒序）
        return history.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (error) {
      console.error('获取排序后的占位符搜索历史失败:', error);
      return [];
    }
  }

  /**
   * 添加搜索历史记录（向后兼容的单关键词版本）
   */
  static async addSearchHistory(templateId: string, keyword: string): Promise<void> {
    // 默认使用 'keyword' 作为占位符名称以保持向后兼容
    return this.addPlaceholderSearchHistory(templateId, 'keyword', keyword);
  }

  /**
   * 添加特定占位符的搜索历史记录
   */
  static async addPlaceholderSearchHistory(templateId: string, placeholderName: string, keyword: string): Promise<void> {
    try {
      const allHistory = await this.getSearchHistory();

      // 检查是否已存在相同的记录（模板ID + 占位符名称 + 关键词）
      const existingIndex = allHistory.findIndex(
        h => h.templateId === templateId &&
             h.keyword === keyword &&
             (h.placeholderName === placeholderName ||
              // 向后兼容：如果旧记录没有placeholderName且当前是keyword，则匹配
              (!h.placeholderName && placeholderName === 'keyword'))
      );

      if (existingIndex >= 0) {
        // 更新时间戳和使用计数
        allHistory[existingIndex].timestamp = Date.now();
        allHistory[existingIndex].usageCount = (allHistory[existingIndex].usageCount || 1) + 1;
        // 确保旧记录也有placeholderName字段
        if (!allHistory[existingIndex].placeholderName) {
          allHistory[existingIndex].placeholderName = placeholderName;
        }
      } else {
        // 添加新记录
        const now = Date.now();
        const newHistory: SearchHistory = {
          id: `${templateId}_${placeholderName}_${now}_${Math.random().toString(36).substr(2, 9)}`,
          templateId,
          keyword,
          timestamp: now,
          usageCount: 1,
          createdAt: now,
          placeholderName
        };
        allHistory.push(newHistory);
      }

      // 按时间戳降序排序，保留最近的100条记录（增加限制以支持多占位符）
      allHistory.sort((a, b) => b.timestamp - a.timestamp);
      const limitedHistory = allHistory.slice(0, 100);

      await chrome.storage.local.set({ [STORAGE_KEYS.SEARCH_HISTORY]: limitedHistory });
    } catch (error) {
      console.error('添加占位符搜索历史失败:', error);
      throw error;
    }
  }

  /**
   * 批量添加多关键词搜索历史记录
   */
  static async addMultiKeywordSearchHistory(templateId: string, keywords: Record<string, string>): Promise<void> {
    try {
      // 为每个非空的关键词添加历史记录
      const promises = Object.entries(keywords)
        .filter(([_, value]) => value && value.trim())
        .map(([placeholderName, keyword]) =>
          this.addPlaceholderSearchHistory(templateId, placeholderName, keyword.trim())
        );

      await Promise.all(promises);
    } catch (error) {
      console.error('批量添加多关键词搜索历史失败:', error);
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
