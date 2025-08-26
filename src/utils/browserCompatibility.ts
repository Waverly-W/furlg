/**
 * 浏览器兼容性工具
 * 处理不同浏览器的API差异，特别是书签API
 */

export interface BrowserInfo {
  name: string;
  version?: string;
  isChrome: boolean;
  isEdge: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  supportsBookmarks: boolean;
  bookmarkAPIType: 'chrome' | 'webextension' | 'none';
}

export class BrowserCompatibility {
  private static browserInfo: BrowserInfo | null = null;

  /**
   * 检测浏览器信息
   */
  static detectBrowser(): BrowserInfo {
    if (this.browserInfo) {
      return this.browserInfo;
    }

    const userAgent = navigator.userAgent;
    let name = 'Unknown';
    let version = '';
    let isChrome = false;
    let isEdge = false;
    let isFirefox = false;
    let isSafari = false;

    // 检测Edge
    if (userAgent.includes('Edg/')) {
      name = 'Microsoft Edge';
      isEdge = true;
      const match = userAgent.match(/Edg\/([0-9.]+)/);
      version = match ? match[1] : '';
    }
    // 检测Chrome
    else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
      name = 'Google Chrome';
      isChrome = true;
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      version = match ? match[1] : '';
    }
    // 检测Firefox
    else if (userAgent.includes('Firefox/')) {
      name = 'Mozilla Firefox';
      isFirefox = true;
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      version = match ? match[1] : '';
    }
    // 检测Safari
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      name = 'Safari';
      isSafari = true;
      const match = userAgent.match(/Version\/([0-9.]+)/);
      version = match ? match[1] : '';
    }

    // 检测书签API支持
    const { supportsBookmarks, bookmarkAPIType } = this.detectBookmarkAPI();

    this.browserInfo = {
      name,
      version,
      isChrome,
      isEdge,
      isFirefox,
      isSafari,
      supportsBookmarks,
      bookmarkAPIType
    };

    return this.browserInfo;
  }

  /**
   * 检测书签API支持情况
   */
  static detectBookmarkAPI(): { supportsBookmarks: boolean; bookmarkAPIType: 'chrome' | 'webextension' | 'none' } {
    // 检查Chrome扩展API
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      return { supportsBookmarks: true, bookmarkAPIType: 'chrome' };
    }

    // 检查WebExtension API (Firefox, Edge Legacy)
    if (typeof browser !== 'undefined' && browser.bookmarks) {
      return { supportsBookmarks: true, bookmarkAPIType: 'webextension' };
    }

    // 检查全局chrome对象
    if (typeof window !== 'undefined' && (window as any).chrome?.bookmarks) {
      return { supportsBookmarks: true, bookmarkAPIType: 'chrome' };
    }

    return { supportsBookmarks: false, bookmarkAPIType: 'none' };
  }

  /**
   * 获取书签数据（兼容不同浏览器）
   */
  static async getBookmarks(): Promise<any[]> {
    const { bookmarkAPIType } = this.detectBookmarkAPI();

    if (bookmarkAPIType === 'none') {
      throw new Error('当前浏览器不支持书签API');
    }

    try {
      let bookmarkTree: any[] = [];

      if (bookmarkAPIType === 'chrome') {
        // Chrome/Edge (Chromium) API
        bookmarkTree = await chrome.bookmarks.getTree();
      } else if (bookmarkAPIType === 'webextension') {
        // WebExtension API
        bookmarkTree = await (browser as any).bookmarks.getTree();
      }

      return bookmarkTree;
    } catch (error) {
      console.error('获取书签失败:', error);
      throw new Error(`获取书签失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从书签树中提取书签URL
   */
  static extractBookmarksFromTree(bookmarkTree: any[]): Array<{ title: string; url: string }> {
    const bookmarks: Array<{ title: string; url: string }> = [];

    const extractBookmarks = (nodes: any[]) => {
      if (!Array.isArray(nodes)) return;

      nodes.forEach(node => {
        if (node.url && node.title) {
          // 只保留HTTP/HTTPS链接
          if (node.url.startsWith('http://') || node.url.startsWith('https://')) {
            bookmarks.push({
              title: node.title.trim(),
              url: node.url.trim()
            });
          }
        }
        
        if (node.children && Array.isArray(node.children)) {
          extractBookmarks(node.children);
        }
      });
    };

    extractBookmarks(bookmarkTree);

    // 去重（基于URL）
    const uniqueBookmarks = bookmarks.filter((bookmark, index, self) => 
      index === self.findIndex(b => b.url === bookmark.url)
    );

    return uniqueBookmarks;
  }

  /**
   * 获取浏览器特定的导出书签指导
   */
  static getBookmarkExportGuide(): string {
    const browser = this.detectBrowser();

    if (browser.isEdge) {
      return '在Edge中导出书签：设置和更多 → 收藏夹 → 管理收藏夹 → 导出收藏夹';
    } else if (browser.isChrome) {
      return '在Chrome中导出书签：书签 → 书签管理器 → 整理 → 将书签导出到HTML文件';
    } else if (browser.isFirefox) {
      return '在Firefox中导出书签：书签 → 管理所有书签 → 导入和备份 → 将书签导出到HTML';
    } else if (browser.isSafari) {
      return '在Safari中导出书签：文件 → 导出书签';
    } else {
      return '请在浏览器的书签管理器中查找导出功能';
    }
  }

  /**
   * 检查是否需要权限
   */
  static async checkBookmarkPermission(): Promise<boolean> {
    const { bookmarkAPIType } = this.detectBookmarkAPI();

    if (bookmarkAPIType === 'none') {
      return false;
    }

    try {
      if (bookmarkAPIType === 'chrome') {
        // 尝试获取权限
        if (chrome.permissions) {
          const hasPermission = await chrome.permissions.contains({
            permissions: ['bookmarks']
          });
          return hasPermission;
        }
      }
      
      // 对于其他情况，假设有权限（会在实际调用时检查）
      return true;
    } catch (error) {
      console.error('检查书签权限失败:', error);
      return false;
    }
  }

  /**
   * 请求书签权限
   */
  static async requestBookmarkPermission(): Promise<boolean> {
    const { bookmarkAPIType } = this.detectBookmarkAPI();

    if (bookmarkAPIType === 'chrome' && chrome.permissions) {
      try {
        const granted = await chrome.permissions.request({
          permissions: ['bookmarks']
        });
        return granted;
      } catch (error) {
        console.error('请求书签权限失败:', error);
        return false;
      }
    }

    return true; // 对于其他浏览器，假设已有权限
  }

  /**
   * 获取错误信息的本地化文本
   */
  static getLocalizedErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('permission')) {
      return '缺少书签访问权限，请在扩展设置中启用书签权限';
    } else if (message.includes('not supported')) {
      return '当前浏览器不支持书签API，请使用文件导入方式';
    } else if (message.includes('network')) {
      return '网络错误，请检查网络连接后重试';
    } else if (message.includes('timeout')) {
      return '操作超时，请重试';
    } else {
      return `导入失败：${error.message}`;
    }
  }

  /**
   * 获取浏览器兼容性报告
   */
  static getCompatibilityReport(): string {
    const browser = this.detectBrowser();
    const lines = [
      `浏览器：${browser.name} ${browser.version || ''}`,
      `书签API支持：${browser.supportsBookmarks ? '✅ 支持' : '❌ 不支持'}`,
      `API类型：${browser.bookmarkAPIType}`,
    ];

    if (!browser.supportsBookmarks) {
      lines.push('');
      lines.push('解决方案：');
      lines.push('1. 使用文件导入方式');
      lines.push('2. ' + this.getBookmarkExportGuide());
    }

    return lines.join('\n');
  }
}

export default BrowserCompatibility;
