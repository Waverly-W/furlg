import React, { useState, useEffect, useRef } from "react";
import type { Template, PlaceholderInfo } from "./src/types";
import { StorageManager } from "./src/utils/storage";
import { PlaceholderParser } from "./src/utils/placeholderParser";
import { UrlBuilder } from "./src/utils/urlBuilder";
import "./style.css";

interface PageInfo {
  url: string;
  title: string;
  domain: string;
}

interface PlaceholderReplacement {
  id: string;
  originalText: string;
  placeholderCode: string;
  placeholderName: string;
  startIndex: number;
  endIndex: number;
}

interface SearchMatch {
  start: number;
  end: number;
  text: string;
}

interface SearchReplaceState {
  searchText: string;
  isRegex: boolean;
  matches: SearchMatch[];
  currentMatchIndex: number;
}

const Popup = () => {
  // 状态管理
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [urlPattern, setUrlPattern] = useState("");
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
  const [replacements, setReplacements] = useState<PlaceholderReplacement[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 搜索替换状态
  const [searchReplace, setSearchReplace] = useState<SearchReplaceState>({
    searchText: '',
    isRegex: false,
    matches: [],
    currentMatchIndex: -1
  });
  const [urlHistory, setUrlHistory] = useState<string[]>([]);

  // 引用
  const urlInputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 自适应高度功能
  function adjustTextareaHeight() {
    const textarea = urlInputRef.current;
    if (!textarea) return;

    // 重置高度以获取正确的scrollHeight
    textarea.style.height = 'auto';

    // 计算行数
    const lineHeight = 20; // 大约每行20px
    const minRows = 2;
    const maxRows = 6;
    const contentRows = Math.ceil(textarea.scrollHeight / lineHeight);
    const rows = Math.max(minRows, Math.min(maxRows, contentRows));

    // 设置高度
    textarea.style.height = `${rows * lineHeight}px`;
  }

  // 监听URL模板变化，自动调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [urlPattern]);

  // 高亮搜索匹配项的功能
  function highlightMatches(text: string, matches: SearchMatch[]): string {
    if (matches.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    matches.forEach((match, index) => {
      // 添加匹配前的文本
      result += text.substring(lastIndex, match.start);

      // 添加高亮的匹配文本
      const isCurrentMatch = index === searchReplace.currentMatchIndex;
      const highlightClass = isCurrentMatch ? 'bg-yellow-300' : 'bg-yellow-100';
      result += `<mark class="${highlightClass}">${text.substring(match.start, match.end)}</mark>`;

      lastIndex = match.end;
    });

    // 添加最后的文本
    result += text.substring(lastIndex);

    return result;
  }

  // 获取当前页面信息
  useEffect(() => {
    getCurrentPageInfo();
  }, []);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving && templateName.trim() && urlPattern.trim()) {
          handleSave();
        }
      }

      // Ctrl/Cmd + R 重置
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleReset();
      }

      // Ctrl/Cmd + F 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Ctrl/Cmd + Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (urlHistory.length > 0) {
          handleUndo();
        }
      }

      // Escape 清除选择和搜索
      if (e.key === 'Escape') {
        setSelectedText("");
        setSelectionRange(null);
        setMessage(null);
        // 清除搜索
        setSearchReplace(prev => ({
          ...prev,
          searchText: '',
          matches: [],
          currentMatchIndex: -1
        }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saving, templateName, urlPattern, urlHistory]);

  // 自动清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function getCurrentPageInfo() {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab && tab.url && tab.title) {
        // 过滤掉扩展页面和特殊页面
        if (tab.url.startsWith('chrome://') ||
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('moz-extension://') ||
            tab.url.startsWith('edge://')) {
          setMessage({ type: 'error', text: '无法为浏览器内部页面创建模板' });
          setLoading(false);
          return;
        }

        const url = new URL(tab.url);
        const pageInfo: PageInfo = {
          url: tab.url,
          title: tab.title,
          domain: url.hostname
        };

        setPageInfo(pageInfo);
        setTemplateName(tab.title);
        setUrlPattern(tab.url);
      } else {
        setMessage({ type: 'error', text: '无法获取当前页面信息' });
      }
    } catch (error) {
      console.error('获取页面信息失败:', error);
      setMessage({ type: 'error', text: '获取页面信息失败，请重试' });
    } finally {
      setLoading(false);
    }
  }

  // 获取智能建议
  function getSmartSuggestions(text: string): Array<{code: string, name: string, reason: string}> {
    const suggestions: Array<{code: string, name: string, reason: string}> = [];
    const lowerText = text.toLowerCase();

    // 数字模式检测
    if (/^\d+$/.test(text)) {
      if (parseInt(text) > 0 && parseInt(text) < 1000) {
        suggestions.push({ code: 'page', name: '页码', reason: '检测到数字，可能是页码' });
      }
      suggestions.push({ code: 'id', name: 'ID', reason: '检测到数字，可能是ID' });
    }

    // 中文检测
    if (/[\u4e00-\u9fa5]/.test(text)) {
      suggestions.push({ code: 'query', name: '搜索词', reason: '检测到中文，可能是搜索关键词' });
      suggestions.push({ code: 'keyword', name: '关键词', reason: '检测到中文，可能是关键词' });
    }

    // 英文单词检测
    if (/^[a-zA-Z\s]+$/.test(text) && text.length > 2) {
      suggestions.push({ code: 'query', name: '搜索词', reason: '检测到英文，可能是搜索词' });
      if (text.includes(' ')) {
        suggestions.push({ code: 'phrase', name: '短语', reason: '检测到多个单词，可能是短语' });
      }
    }

    // URL参数名检测
    const commonParams: Record<string, {code: string, name: string}> = {
      'q': { code: 'query', name: '搜索词' },
      'query': { code: 'query', name: '搜索词' },
      'search': { code: 'query', name: '搜索词' },
      'keyword': { code: 'keyword', name: '关键词' },
      'kw': { code: 'keyword', name: '关键词' },
      'cat': { code: 'category', name: '分类' },
      'category': { code: 'category', name: '分类' },
      'type': { code: 'type', name: '类型' },
      'sort': { code: 'sort', name: '排序' },
      'order': { code: 'order', name: '排序' },
      'page': { code: 'page', name: '页码' },
      'p': { code: 'page', name: '页码' },
      'size': { code: 'size', name: '尺寸' },
      'color': { code: 'color', name: '颜色' },
      'brand': { code: 'brand', name: '品牌' },
      'price': { code: 'price', name: '价格' },
      'location': { code: 'location', name: '位置' },
      'date': { code: 'date', name: '日期' },
      'time': { code: 'time', name: '时间' }
    };

    if (commonParams[lowerText]) {
      const param = commonParams[lowerText];
      suggestions.push({
        code: param.code,
        name: param.name,
        reason: `检测到常见参数名 "${text}"`
      });
    }

    // 特殊格式检测
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      suggestions.push({ code: 'date', name: '日期', reason: '检测到日期格式' });
    }

    if (/^#[0-9a-fA-F]{6}$/.test(text)) {
      suggestions.push({ code: 'color', name: '颜色', reason: '检测到颜色代码' });
    }

    // 去重并限制数量
    const uniqueSuggestions = suggestions.filter((item, index, self) =>
      index === self.findIndex(t => t.code === item.code)
    );

    return uniqueSuggestions.slice(0, 4); // 最多显示4个建议
  }

  // 搜索匹配功能
  function findMatches(text: string, searchText: string, isRegex: boolean): SearchMatch[] {
    if (!searchText.trim()) return [];

    const matches: SearchMatch[] = [];

    try {
      if (isRegex) {
        const regex = new RegExp(searchText, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0]
          });
          // 防止无限循环
          if (match[0].length === 0) break;
        }
      } else {
        const searchLower = searchText.toLowerCase();
        const textLower = text.toLowerCase();
        let startIndex = 0;

        while (true) {
          const index = textLower.indexOf(searchLower, startIndex);
          if (index === -1) break;

          matches.push({
            start: index,
            end: index + searchText.length,
            text: text.substring(index, index + searchText.length)
          });

          startIndex = index + 1;
        }
      }
    } catch (error) {
      console.error('搜索错误:', error);
    }

    return matches;
  }

  // 处理搜索输入变化
  function handleSearchChange(value: string) {
    const matches = findMatches(urlPattern, value, searchReplace.isRegex);
    setSearchReplace(prev => ({
      ...prev,
      searchText: value,
      matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1
    }));
  }

  // 切换正则表达式模式
  function toggleRegexMode() {
    const newIsRegex = !searchReplace.isRegex;
    const matches = findMatches(urlPattern, searchReplace.searchText, newIsRegex);
    setSearchReplace(prev => ({
      ...prev,
      isRegex: newIsRegex,
      matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1
    }));
  }

  // 全部替换功能
  function handleReplaceAll() {
    if (searchReplace.matches.length === 0) return;

    // 确认操作
    const confirmMessage = `确定要将 ${searchReplace.matches.length} 个匹配的 "${searchReplace.searchText}" 替换为占位符吗？`;
    if (!confirm(confirmMessage)) return;

    // 保存历史记录用于撤销
    setUrlHistory(prev => [...prev, urlPattern]);

    // 显示占位符选择对话框
    const placeholderCode = prompt('请输入占位符代码（如：query, keyword, category）:');
    if (!placeholderCode) return;

    // 验证占位符代码格式
    if (!PlaceholderParser.validatePlaceholderCode(placeholderCode)) {
      setMessage({ type: 'error', text: '占位符名称格式无效，必须以字母开头，只能包含字母、数字和下划线' });
      return;
    }

    // 从后往前替换，避免索引偏移问题
    let newUrlPattern = urlPattern;
    const sortedMatches = [...searchReplace.matches].sort((a, b) => b.start - a.start);

    for (const match of sortedMatches) {
      newUrlPattern =
        newUrlPattern.substring(0, match.start) +
        `{${placeholderCode}}` +
        newUrlPattern.substring(match.end);
    }

    setUrlPattern(newUrlPattern);

    // 添加或更新占位符
    const placeholderName = prompt('请输入占位符显示名称:') || placeholderCode;
    const existingPlaceholder = placeholders.find(p => p.code === placeholderCode);

    if (!existingPlaceholder) {
      const newPlaceholder = PlaceholderParser.createPlaceholderInfo(placeholderCode, placeholderName);
      setPlaceholders([...placeholders, newPlaceholder]);
    }

    // 清除搜索状态
    setSearchReplace(prev => ({
      ...prev,
      searchText: '',
      matches: [],
      currentMatchIndex: -1
    }));

    setMessage({ type: 'success', text: `已替换 ${searchReplace.matches.length} 个匹配项为 {${placeholderCode}}` });
  }

  // 撤销功能
  function handleUndo() {
    if (urlHistory.length === 0) return;

    const lastUrl = urlHistory[urlHistory.length - 1];
    setUrlPattern(lastUrl);
    setUrlHistory(prev => prev.slice(0, -1));

    // 重新搜索
    const matches = findMatches(lastUrl, searchReplace.searchText, searchReplace.isRegex);
    setSearchReplace(prev => ({
      ...prev,
      matches,
      currentMatchIndex: matches.length > 0 ? 0 : -1
    }));

    setMessage({ type: 'success', text: '已撤销上一次操作' });
  }

  return (
    <div className="w-96 max-h-[600px] bg-white">
      {/* 头部 */}
      <div className="bg-blue-500 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">创建搜索模板</h1>
          <button
            onClick={() => chrome.tabs.create({ url: 'chrome://newtab/' })}
            className="text-blue-100 hover:text-white text-sm"
          >
            打开主页
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4 overflow-y-auto max-h-[520px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">获取页面信息...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 页面信息显示 - 简化版 */}
            {pageInfo && (
              <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                <span className="font-medium">{pageInfo.title}</span>
                <span className="mx-2">•</span>
                <span>{pageInfo.domain}</span>
              </div>
            )}

            {/* 模板名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模板名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="例如：Bing搜索"
              />
            </div>

            {/* 搜索替换工具 */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-800">搜索替换工具</h4>
                {searchReplace.matches.length > 0 && (
                  <span className="text-xs text-blue-600">
                    找到 {searchReplace.matches.length} 个匹配项
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchReplace.searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    placeholder="输入要查找的文本..."
                  />
                  <button
                    onClick={toggleRegexMode}
                    className={`px-2 py-1 text-xs rounded ${
                      searchReplace.isRegex
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    title="正则表达式模式"
                  >
                    .*
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleReplaceAll}
                    disabled={searchReplace.matches.length === 0}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    全部替换为占位符
                  </button>
                  <button
                    onClick={handleUndo}
                    disabled={urlHistory.length === 0}
                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title="撤销上一次操作"
                  >
                    撤销
                  </button>
                </div>
              </div>
            </div>

            {/* URL模板编辑 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL模板 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  ref={urlInputRef}
                  value={urlPattern}
                  onChange={(e) => {
                    setUrlPattern(e.target.value);
                    // 实时同步占位符列表
                    if (e.target.value.trim()) {
                      const syncedPlaceholders = PlaceholderParser.syncPlaceholderList(e.target.value, placeholders);
                      if (syncedPlaceholders.length !== placeholders.length) {
                        setPlaceholders(syncedPlaceholders);
                      }
                    }
                    // 重新搜索匹配项
                    if (searchReplace.searchText) {
                      const matches = findMatches(e.target.value, searchReplace.searchText, searchReplace.isRegex);
                      setSearchReplace(prev => ({
                        ...prev,
                        matches,
                        currentMatchIndex: matches.length > 0 ? 0 : -1
                      }));
                    }
                  }}
                  onSelect={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    if (start !== end) {
                      setSelectedText(urlPattern.substring(start, end));
                      setSelectionRange({ start, end });
                    } else {
                      setSelectedText("");
                      setSelectionRange(null);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm font-mono resize-none transition-colors ${
                    selectedText ? 'border-blue-300 bg-blue-50' :
                    searchReplace.matches.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                  } focus:ring-blue-500`}
                  style={{ minHeight: '40px', height: 'auto' }}
                  placeholder="粘贴或编辑URL，使用搜索工具快速替换..."
                />

                {/* 状态指示器 */}
                <div className="absolute top-1 right-1 flex space-x-1">
                  {searchReplace.matches.length > 0 && (
                    <div className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {searchReplace.matches.length}
                    </div>
                  )}
                  {placeholders.length > 0 && (
                    <div className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {placeholders.length}
                    </div>
                  )}
                </div>
              </div>

              {/* 选中文本提示 - 简化版 */}
              {selectedText && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <span className="text-yellow-800">已选中: </span>
                  <code className="bg-yellow-100 px-1 rounded font-medium">
                    {selectedText.length > 40 ? selectedText.substring(0, 40) + '...' : selectedText}
                  </code>
                </div>
              )}
            </div>

            {/* 占位符替换工具 - 简化版 */}
            {selectedText && selectionRange && (
              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-800">替换选中文本</span>
                  <span className="text-xs text-blue-600">
                    "{selectedText.length > 15 ? selectedText.substring(0, 15) + '...' : selectedText}"
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 mb-2">
                  <button
                    onClick={() => handleReplaceWithPlaceholder('query', '搜索词')}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    query
                  </button>
                  <button
                    onClick={() => handleReplaceWithPlaceholder('keyword', '关键词')}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    keyword
                  </button>
                  <button
                    onClick={() => handleReplaceWithPlaceholder('category', '分类')}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    category
                  </button>
                  <button
                    onClick={() => handleReplaceWithPlaceholder('page', '页码')}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    page
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="或输入自定义名称后按回车"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        handleReplaceWithPlaceholder(value, value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* 占位符列表 - 简化版 */}
            {placeholders.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">占位符 ({placeholders.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {placeholders.map((placeholder) => (
                    <div key={placeholder.id} className="flex items-center bg-gray-100 rounded text-xs">
                      <code className="px-2 py-1">{`{${placeholder.code}}`}</code>
                      <button
                        onClick={() => handleRemovePlaceholder(placeholder.id!)}
                        className="px-1 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-r"
                        title="删除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* 消息提示 */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* 操作按钮 - 简化版 */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !templateName.trim() || !urlPattern.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  '保存模板'
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                重置
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 处理占位符替换
  function handleReplaceWithPlaceholder(code: string, name: string) {
    if (!selectedText || !selectionRange) return;

    // 验证占位符代码格式
    if (!PlaceholderParser.validatePlaceholderCode(code)) {
      setMessage({ type: 'error', text: '占位符名称格式无效，必须以字母开头，只能包含字母、数字和下划线' });
      return;
    }

    // 检查是否已存在相同的占位符
    const existingPlaceholder = placeholders.find(p => p.code === code);
    if (existingPlaceholder) {
      // 如果已存在，直接替换文本
      const newUrlPattern =
        urlPattern.substring(0, selectionRange.start) +
        `{${code}}` +
        urlPattern.substring(selectionRange.end);
      setUrlPattern(newUrlPattern);
    } else {
      // 创建新的占位符
      const newPlaceholder = PlaceholderParser.createPlaceholderInfo(code, name);
      setPlaceholders([...placeholders, newPlaceholder]);

      // 替换URL中的文本
      const newUrlPattern =
        urlPattern.substring(0, selectionRange.start) +
        `{${code}}` +
        urlPattern.substring(selectionRange.end);
      setUrlPattern(newUrlPattern);
    }

    // 清除选择
    setSelectedText("");
    setSelectionRange(null);

    // 清除消息
    setMessage(null);
  }

  // 删除占位符
  function handleRemovePlaceholder(placeholderId: string) {
    const placeholder = placeholders.find(p => p.id === placeholderId);
    if (!placeholder) return;

    // 从URL模板中移除占位符
    const placeholderPattern = `{${placeholder.code}}`;
    const newUrlPattern = urlPattern.replace(new RegExp(placeholderPattern.replace(/[{}]/g, '\\$&'), 'g'), placeholder.code);
    setUrlPattern(newUrlPattern);

    // 从占位符列表中移除
    setPlaceholders(placeholders.filter(p => p.id !== placeholderId));
  }

  // 验证表单
  function validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!templateName.trim()) {
      errors.push('请填写模板名称');
    }

    if (!urlPattern.trim()) {
      errors.push('请填写URL模板');
    } else {
      // 验证URL格式
      try {
        new URL(urlPattern.replace(/\{[^}]+\}/g, 'test'));
      } catch {
        errors.push('URL格式无效，请检查URL结构');
      }

      // 验证占位符
      const validation = PlaceholderParser.validatePlaceholders(urlPattern);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // 保存模板
  async function handleSave() {
    const validation = validateForm();
    if (!validation.isValid) {
      setMessage({ type: 'error', text: validation.errors[0] });
      return;
    }

    try {
      setSaving(true);

      // 同步占位符列表
      const syncedPlaceholders = PlaceholderParser.syncPlaceholderList(urlPattern, placeholders);

      const template: Template = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: templateName.trim(),
        urlPattern: urlPattern.trim(),
        domain: pageInfo?.domain,
        placeholders: syncedPlaceholders,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await StorageManager.saveTemplate(template);

      setMessage({ type: 'success', text: `模板 "${templateName}" 保存成功！正在关闭...` });

      // 2秒后关闭popup
      setTimeout(() => {
        window.close();
      }, 2000);

    } catch (error) {
      console.error('保存模板失败:', error);
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  }

  // 重置表单
  function handleReset() {
    if (pageInfo) {
      setTemplateName(pageInfo.title);
      setUrlPattern(pageInfo.url);
    } else {
      setTemplateName("");
      setUrlPattern("");
    }
    setPlaceholders([]);
    setReplacements([]);
    setSelectedText("");
    setSelectionRange(null);
    setMessage(null);
    setShowPreview(false);
  }
};

export default Popup;
