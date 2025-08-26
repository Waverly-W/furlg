import React, { useState, useRef, useEffect } from 'react';
import type { DockShortcut } from '../types';
import { StorageManager } from '../utils/storage';
import { BrowserCompatibility } from '../utils/browserCompatibility';

interface BookmarkImporterProps {
  onImportComplete?: (importedCount: number) => void;
  onError?: (error: string) => void;
}

interface ParsedBookmark {
  title: string;
  url: string;
  selected?: boolean;
  folder?: string;
}

interface BookmarkFolder {
  name: string;
  bookmarks: ParsedBookmark[];
  selected: boolean;
}

export const BookmarkImporter: React.FC<BookmarkImporterProps> = ({
  onImportComplete,
  onError
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [showBookmarkSelector, setShowBookmarkSelector] = useState(false);
  const [availableBookmarks, setAvailableBookmarks] = useState<ParsedBookmark[]>([]);
  const [bookmarkFolders, setBookmarkFolders] = useState<BookmarkFolder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检测浏览器兼容性
  useEffect(() => {
    const info = BrowserCompatibility.detectBrowser();
    setBrowserInfo(info);
  }, []);

  // 解析HTML书签文件（支持文件夹结构）
  const parseBookmarkFile = (content: string): { bookmarks: ParsedBookmark[], folders: BookmarkFolder[] } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const bookmarks: ParsedBookmark[] = [];
    const folders: BookmarkFolder[] = [];

    // 递归解析书签结构
    const parseNode = (node: Element, folderPath: string = '') => {
      const children = Array.from(node.children);

      for (const child of children) {
        if (child.tagName === 'DT') {
          const link = child.querySelector('a[href]');
          const folderHeader = child.querySelector('h3');

          if (link) {
            // 这是一个书签
            const href = link.getAttribute('href');
            const title = link.textContent?.trim();

            if (href && title && href.startsWith('http')) {
              bookmarks.push({
                title,
                url: href,
                selected: true,
                folder: folderPath || '根目录'
              });
            }
          } else if (folderHeader) {
            // 这是一个文件夹
            const folderName = folderHeader.textContent?.trim() || '未命名文件夹';
            const fullFolderPath = folderPath ? `${folderPath}/${folderName}` : folderName;

            // 查找文件夹内容
            const dl = child.querySelector('dl');
            if (dl) {
              parseNode(dl, fullFolderPath);
            }
          }
        } else if (child.tagName === 'DL') {
          parseNode(child, folderPath);
        }
      }
    };

    // 开始解析
    const body = doc.body || doc.documentElement;
    parseNode(body);

    // 按文件夹分组
    const folderMap = new Map<string, ParsedBookmark[]>();
    bookmarks.forEach(bookmark => {
      const folder = bookmark.folder || '根目录';
      if (!folderMap.has(folder)) {
        folderMap.set(folder, []);
      }
      folderMap.get(folder)!.push(bookmark);
    });

    // 创建文件夹对象
    folderMap.forEach((folderBookmarks, folderName) => {
      folders.push({
        name: folderName,
        bookmarks: folderBookmarks,
        selected: true
      });
    });

    return { bookmarks, folders };
  };

  // 解析JSON书签文件（Chrome格式，支持文件夹结构）
  const parseJsonBookmarks = (content: string): { bookmarks: ParsedBookmark[], folders: BookmarkFolder[] } => {
    try {
      const data = JSON.parse(content);
      const bookmarks: ParsedBookmark[] = [];
      const folders: BookmarkFolder[] = [];

      const extractBookmarks = (node: any, folderPath: string = '') => {
        if (node.type === 'url' && node.url && node.name) {
          bookmarks.push({
            title: node.name,
            url: node.url,
            selected: true,
            folder: folderPath || '根目录'
          });
        } else if (node.type === 'folder' && node.children) {
          const folderName = node.name || '未命名文件夹';
          const fullFolderPath = folderPath ? `${folderPath}/${folderName}` : folderName;

          node.children.forEach((child: any) => extractBookmarks(child, fullFolderPath));
        } else if (node.children) {
          node.children.forEach((child: any) => extractBookmarks(child, folderPath));
        }
      };

      // Chrome书签格式
      if (data.roots) {
        Object.entries(data.roots).forEach(([rootName, root]: [string, any]) => {
          if (root.children) {
            const rootFolderName = rootName === 'bookmark_bar' ? '书签栏' :
                                 rootName === 'other' ? '其他书签' :
                                 rootName === 'synced' ? '移动设备书签' : rootName;
            root.children.forEach((child: any) => extractBookmarks(child, rootFolderName));
          }
        });
      } else if (Array.isArray(data)) {
        // 其他格式
        data.forEach((item: any) => extractBookmarks(item));
      }

      // 按文件夹分组
      const folderMap = new Map<string, ParsedBookmark[]>();
      bookmarks.forEach(bookmark => {
        const folder = bookmark.folder || '根目录';
        if (!folderMap.has(folder)) {
          folderMap.set(folder, []);
        }
        folderMap.get(folder)!.push(bookmark);
      });

      // 创建文件夹对象
      folderMap.forEach((folderBookmarks, folderName) => {
        folders.push({
          name: folderName,
          bookmarks: folderBookmarks,
          selected: true
        });
      });

      return { bookmarks, folders };
    } catch (error) {
      throw new Error('无法解析JSON书签文件');
    }
  };

  // 处理文件导入
  const handleFileImport = async (file: File) => {
    if (!file) return;

    setIsImporting(true);

    try {
      const content = await file.text();
      let result: { bookmarks: ParsedBookmark[], folders: BookmarkFolder[] };

      // 根据文件类型解析
      if (file.name.toLowerCase().endsWith('.json')) {
        result = parseJsonBookmarks(content);
      } else if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')) {
        result = parseBookmarkFile(content);
      } else {
        // 尝试自动检测格式
        try {
          result = parseJsonBookmarks(content);
        } catch {
          result = parseBookmarkFile(content);
        }
      }

      if (result.bookmarks.length === 0) {
        throw new Error('未找到有效的书签数据');
      }

      // 显示书签选择器
      setAvailableBookmarks(result.bookmarks);
      setBookmarkFolders(result.folders);
      setShowBookmarkSelector(true);

    } catch (error) {
      console.error('解析书签文件失败:', error);
      onError?.(error instanceof Error ? error.message : '解析失败');
    } finally {
      setIsImporting(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  // 处理拖拽
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileImport(file);
    }
  };

  // 使用浏览器书签API（兼容多种浏览器）
  const handleBrowserBookmarks = async () => {
    try {
      setIsImporting(true);

      // 检查权限
      const hasPermission = await BrowserCompatibility.checkBookmarkPermission();
      if (!hasPermission) {
        const granted = await BrowserCompatibility.requestBookmarkPermission();
        if (!granted) {
          throw new Error('需要书签访问权限才能导入书签');
        }
      }

      // 获取书签数据
      const bookmarkTree = await BrowserCompatibility.getBookmarks();
      const result = extractBookmarksWithFolders(bookmarkTree);

      if (result.bookmarks.length === 0) {
        throw new Error('未找到有效的书签，请确保浏览器中有书签数据');
      }

      // 显示书签选择器
      setAvailableBookmarks(result.bookmarks);
      setBookmarkFolders(result.folders);
      setShowBookmarkSelector(true);

    } catch (error) {
      console.error('获取浏览器书签失败:', error);
      const errorMessage = BrowserCompatibility.getLocalizedErrorMessage(error as Error);
      onError?.(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  // 从浏览器书签树中提取书签（支持文件夹结构）
  const extractBookmarksWithFolders = (bookmarkTree: any[]): { bookmarks: ParsedBookmark[], folders: BookmarkFolder[] } => {
    const bookmarks: ParsedBookmark[] = [];
    const folders: BookmarkFolder[] = [];

    const extractBookmarks = (nodes: any[], folderPath: string = '') => {
      if (!Array.isArray(nodes)) return;

      nodes.forEach(node => {
        if (node.url && node.title) {
          // 只保留HTTP/HTTPS链接
          if (node.url.startsWith('http://') || node.url.startsWith('https://')) {
            bookmarks.push({
              title: node.title.trim(),
              url: node.url.trim(),
              selected: true,
              folder: folderPath || '根目录'
            });
          }
        }

        if (node.children && Array.isArray(node.children)) {
          const folderName = node.title || '未命名文件夹';
          const fullFolderPath = folderPath ? `${folderPath}/${folderName}` : folderName;
          extractBookmarks(node.children, fullFolderPath);
        }
      });
    };

    extractBookmarks(bookmarkTree);

    // 按文件夹分组
    const folderMap = new Map<string, ParsedBookmark[]>();
    bookmarks.forEach(bookmark => {
      const folder = bookmark.folder || '根目录';
      if (!folderMap.has(folder)) {
        folderMap.set(folder, []);
      }
      folderMap.get(folder)!.push(bookmark);
    });

    // 创建文件夹对象
    folderMap.forEach((folderBookmarks, folderName) => {
      folders.push({
        name: folderName,
        bookmarks: folderBookmarks,
        selected: true
      });
    });

    return { bookmarks, folders };
  };

  // 处理书签选择状态变化
  const handleBookmarkToggle = (bookmarkIndex: number, folderIndex: number) => {
    const newFolders = [...bookmarkFolders];
    newFolders[folderIndex].bookmarks[bookmarkIndex].selected =
      !newFolders[folderIndex].bookmarks[bookmarkIndex].selected;

    // 更新文件夹选中状态
    const folderBookmarks = newFolders[folderIndex].bookmarks;
    const selectedCount = folderBookmarks.filter(b => b.selected).length;
    newFolders[folderIndex].selected = selectedCount > 0;

    setBookmarkFolders(newFolders);

    // 更新总书签列表
    const allBookmarks = newFolders.flatMap(folder => folder.bookmarks);
    setAvailableBookmarks(allBookmarks);
  };

  // 处理文件夹选择状态变化
  const handleFolderToggle = (folderIndex: number) => {
    const newFolders = [...bookmarkFolders];
    const folder = newFolders[folderIndex];
    const newSelected = !folder.selected;

    // 更新文件夹和其中所有书签的选中状态
    folder.selected = newSelected;
    folder.bookmarks.forEach(bookmark => {
      bookmark.selected = newSelected;
    });

    setBookmarkFolders(newFolders);

    // 更新总书签列表
    const allBookmarks = newFolders.flatMap(folder => folder.bookmarks);
    setAvailableBookmarks(allBookmarks);
  };

  // 全选/取消全选
  const handleSelectAll = (selectAll: boolean) => {
    const newFolders = bookmarkFolders.map(folder => ({
      ...folder,
      selected: selectAll,
      bookmarks: folder.bookmarks.map(bookmark => ({
        ...bookmark,
        selected: selectAll
      }))
    }));

    setBookmarkFolders(newFolders);

    // 更新总书签列表
    const allBookmarks = newFolders.flatMap(folder => folder.bookmarks);
    setAvailableBookmarks(allBookmarks);
  };

  // 确认导入选中的书签
  const handleConfirmImport = async () => {
    try {
      setIsImporting(true);

      // 获取所有选中的书签
      const selectedBookmarks = availableBookmarks.filter(bookmark => bookmark.selected);

      if (selectedBookmarks.length === 0) {
        throw new Error('请至少选择一个书签');
      }

      // 限制导入数量
      const maxImport = 100;
      const bookmarksToImport = selectedBookmarks.slice(0, maxImport);

      // 转换为导入格式（移除选择状态）
      const importData = bookmarksToImport.map(({ title, url }) => ({ title, url }));

      // 导入到存储
      await StorageManager.importBookmarksAsDockShortcuts(importData);

      // 关闭选择器
      setShowBookmarkSelector(false);
      setAvailableBookmarks([]);
      setBookmarkFolders([]);
      setSearchQuery('');

      onImportComplete?.(bookmarksToImport.length);
    } catch (error) {
      console.error('导入选中书签失败:', error);
      onError?.(error instanceof Error ? error.message : '导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  // 取消导入
  const handleCancelImport = () => {
    setShowBookmarkSelector(false);
    setAvailableBookmarks([]);
    setBookmarkFolders([]);
    setSearchQuery('');
  };

  // 搜索过滤
  const getFilteredFolders = () => {
    if (!searchQuery.trim()) {
      return bookmarkFolders;
    }

    const query = searchQuery.toLowerCase();
    return bookmarkFolders.map(folder => ({
      ...folder,
      bookmarks: folder.bookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query)
      )
    })).filter(folder => folder.bookmarks.length > 0);
  };

  // 获取统计信息
  const getSelectionStats = () => {
    const totalBookmarks = availableBookmarks.length;
    const selectedBookmarks = availableBookmarks.filter(b => b.selected).length;
    return { totalBookmarks, selectedBookmarks };
  };

  // 如果显示书签选择器
  if (showBookmarkSelector) {
    const filteredFolders = getFilteredFolders();
    const { totalBookmarks, selectedBookmarks } = getSelectionStats();

    return (
      <div className="space-y-4">
        {/* 书签选择器标题 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">选择要导入的书签</h3>
          <button
            onClick={handleCancelImport}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 搜索和统计 */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索书签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            已选择 {selectedBookmarks} / {totalBookmarks} 个书签
          </div>
        </div>

        {/* 全选控制 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleSelectAll(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              全选
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              取消全选
            </button>
          </div>
        </div>

        {/* 书签列表 */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {filteredFolders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? '没有找到匹配的书签' : '没有可用的书签'}
            </div>
          ) : (
            filteredFolders.map((folder, folderIndex) => (
              <div key={folder.name} className="border-b border-gray-100 last:border-b-0">
                {/* 文件夹标题 */}
                <div className="bg-gray-50 px-4 py-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={folder.selected}
                    onChange={() => handleFolderToggle(folderIndex)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <span className="font-medium text-gray-700">{folder.name}</span>
                  <span className="text-xs text-gray-500">({folder.bookmarks.length})</span>
                </div>

                {/* 文件夹中的书签 */}
                <div className="divide-y divide-gray-100">
                  {folder.bookmarks.map((bookmark, bookmarkIndex) => (
                    <div key={`${bookmark.url}-${bookmarkIndex}`} className="px-4 py-3 flex items-center space-x-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={bookmark.selected}
                        onChange={() => handleBookmarkToggle(bookmarkIndex, folderIndex)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=16`}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iNCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNOCA0QzYuMzQzMTUgNCA1IDUuMzQzMTUgNSA3QzUgOC42NTY4NSA2LjM0MzE1IDEwIDggMTBDOS42NTY4NSAxMCAxMSA4LjY1Njg1IDExIDdDMTEgNS4zNDMxNSA5LjY1Njg1IDQgOCA0WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNOCAxMUM2LjM0MzE1IDExIDUgMTIuMzQzMSA1IDE0SDExQzExIDEyLjM0MzEgOS42NTY4NSAxMSA4IDExWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{bookmark.title}</div>
                        <div className="text-xs text-gray-500 truncate">{bookmark.url}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancelImport}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={isImporting || selectedBookmarks === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>导入中...</span>
              </>
            ) : (
              <span>导入选中的书签 ({selectedBookmarks})</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        <p>支持以下导入方式：</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
          <li>从浏览器直接导入（推荐，支持Chrome、Edge、Firefox）</li>
          <li>导入HTML书签文件（.html/.htm）</li>
          <li>导入JSON书签文件（.json）</li>
        </ul>

        {/* 浏览器兼容性信息 */}
        {browserInfo && (
          <div className={`mt-3 p-2 rounded text-xs ${
            browserInfo.supportsBookmarks
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center space-x-2 mb-1">
              <span className={browserInfo.supportsBookmarks ? 'text-green-700' : 'text-yellow-700'}>
                {browserInfo.supportsBookmarks ? '✅' : '⚠️'}
              </span>
              <span className={browserInfo.supportsBookmarks ? 'text-green-700' : 'text-yellow-700'}>
                <strong>当前浏览器：</strong>{browserInfo.name} {browserInfo.version}
              </span>
            </div>

            {browserInfo.supportsBookmarks ? (
              <p className="text-green-600">
                支持直接导入书签，点击下方按钮即可开始导入
              </p>
            ) : (
              <div className="text-yellow-700">
                <p className="mb-1">不支持直接导入，请使用文件导入方式：</p>
                <p className="font-medium">{BrowserCompatibility.getBookmarkExportGuide()}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 浏览器书签导入 */}
      <div>
        <button
          onClick={handleBrowserBookmarks}
          disabled={isImporting || (browserInfo && !browserInfo.supportsBookmarks)}
          className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
            browserInfo && !browserInfo.supportsBookmarks
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isImporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>导入中...</span>
            </>
          ) : browserInfo && !browserInfo.supportsBookmarks ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>当前浏览器不支持直接导入</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>从浏览器导入书签</span>
            </>
          )}
        </button>
      </div>

      {/* 分割线 */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-3 text-xs text-gray-500">或</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* 文件导入区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">
              拖拽书签文件到此处，或
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium disabled:text-gray-400"
            >
              点击选择文件
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            支持 .html, .htm, .json 格式
          </p>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.json"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default BookmarkImporter;
