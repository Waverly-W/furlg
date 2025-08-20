import type { Template } from "../types";

/**
 * URL构建工具类
 */
export class UrlBuilder {
  /**
   * 验证URL模板格式
   */
  static validateTemplate(urlPattern: string): boolean {
    try {
      // 检查是否包含占位符
      if (!urlPattern.includes('{keyword}')) {
        return false;
      }
      
      // 尝试构建一个测试URL
      const testUrl = this.buildUrl(urlPattern, 'test');
      new URL(testUrl); // 验证URL格式
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 构建搜索URL
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
   * 执行搜索操作
   */
  static async performSearch(template: Template, keyword: string): Promise<void> {
    const searchUrl = this.buildUrl(template.urlPattern, keyword);
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
