import type { Template, MultiKeywordValues } from "../types";
import { PlaceholderParser } from "./placeholderParser";

/**
 * URL构建工具类
 */
export class UrlBuilder {
  /**
   * 验证URL模板格式
   */
  static validateTemplate(urlPattern: string): boolean {
    try {
      // 使用占位符解析器验证
      const validation = PlaceholderParser.validatePlaceholders(urlPattern);
      if (!validation.isValid) {
        return false;
      }

      // 尝试构建一个测试URL
      const placeholders = validation.placeholders;
      const testValues: MultiKeywordValues = {};
      placeholders.forEach(name => {
        testValues[name] = 'test';
      });

      const testUrl = this.buildUrlWithMultipleKeywords(urlPattern, testValues);
      new URL(testUrl); // 验证URL格式

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 构建搜索URL（单关键词，向后兼容）
   */
  static buildUrl(urlPattern: string, keyword: string): string {
    if (!keyword.trim()) {
      throw new Error('搜索关键词不能为空');
    }

    // 对关键词进行URL编码
    const encodedKeyword = encodeURIComponent(keyword.trim());

    // 替换占位符
    return urlPattern.replace(/{keyword}/g, encodedKeyword);
  }

  /**
   * 构建搜索URL（多关键词支持）
   */
  static buildUrlWithMultipleKeywords(urlPattern: string, keywords: MultiKeywordValues): string {
    let result = urlPattern;

    // 验证所有必需的关键词都已提供
    const placeholders = PlaceholderParser.extractUniquePlaceholders(urlPattern);
    const missingKeywords = placeholders.filter(name => !keywords[name] || !keywords[name].trim());

    if (missingKeywords.length > 0) {
      throw new Error(`缺少必需的关键词: ${missingKeywords.join(', ')}`);
    }

    // 替换所有占位符
    for (const [name, value] of Object.entries(keywords)) {
      if (value && value.trim()) {
        const encodedValue = encodeURIComponent(value.trim());
        const placeholder = `{${name}}`;
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), encodedValue);
      }
    }

    return result;
  }

  /**
   * 智能构建URL（自动检测单/多关键词）
   */
  static buildUrlSmart(urlPattern: string, keywords: string | MultiKeywordValues): string {
    // 如果是字符串，使用单关键词模式
    if (typeof keywords === 'string') {
      return this.buildUrl(urlPattern, keywords);
    }

    // 如果是对象，使用多关键词模式
    return this.buildUrlWithMultipleKeywords(urlPattern, keywords);
  }

  /**
   * 在新标签页中打开URL
   */
  static async openInNewTab(url: string): Promise<void> {
    try {
      await chrome.tabs.create({ url, active: true });
    } catch (error) {
      console.error('打开新标签页失败:', error);
      throw error;
    }
  }

  /**
   * 执行搜索操作（单关键词，向后兼容）
   */
  static async performSearch(template: Template, keyword: string): Promise<void> {
    const searchUrl = this.buildUrl(template.urlPattern, keyword);
    await this.openInNewTab(searchUrl);
  }

  /**
   * 执行搜索操作（多关键词支持）
   */
  static async performSearchWithMultipleKeywords(template: Template, keywords: MultiKeywordValues): Promise<void> {
    const searchUrl = this.buildUrlWithMultipleKeywords(template.urlPattern, keywords);
    await this.openInNewTab(searchUrl);
  }

  /**
   * 智能执行搜索（自动检测单/多关键词）
   */
  static async performSearchSmart(template: Template, keywords: string | MultiKeywordValues): Promise<void> {
    const searchUrl = this.buildUrlSmart(template.urlPattern, keywords);
    await this.openInNewTab(searchUrl);
  }

  /**
   * 从URL中提取域名
   */
  static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}
