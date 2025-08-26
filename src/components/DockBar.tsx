import React, { useState, useEffect, useRef } from 'react';
import { IconCacheManager } from '../utils/iconCache';
import type { DockShortcut, DockSettings } from '../types';

interface DockBarProps {
  shortcuts: DockShortcut[];
  settings: DockSettings;
  onShortcutClick?: (shortcut: DockShortcut, event: React.MouseEvent) => void;
  onShortcutEdit?: (shortcut: DockShortcut) => void;
  onShortcutDelete?: (shortcut: DockShortcut) => void;
}

interface DockItemProps {
  shortcut: DockShortcut;
  onItemClick: (shortcut: DockShortcut, event: React.MouseEvent) => void;
  onContextMenu: (shortcut: DockShortcut, event: React.MouseEvent) => void;
}

const DockItem: React.FC<DockItemProps> = ({ shortcut, onItemClick, onContextMenu }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [iconSrc, setIconSrc] = useState<string | null>(null);

  const handleImageError = async () => {
    // 首次错误：尝试强制刷新一次
    if (shortcut.icon) {
      const refreshed = await IconCacheManager.refetch(shortcut.icon)
      if (refreshed) { setIconSrc(refreshed); setImageError(false); return }
    }
    setImageError(true);
  };

  const getFallbackIcon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMTYgOEMxMi42ODYzIDggMTAgMTAuNjg2MyAxMCAxNEMxMCAxNy4zMTM3IDEyLjY4NjMgMjAgMTYgMjBDMTkuMzEzNyAyMCAyMiAxNy4zMTM3IDIyIDE0QzIyIDEwLjY4NjMgMTkuMzEzNyA4IDE2IDhaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xNiAyMkMxMi42ODYzIDIyIDEwIDI0LjY4NjMgMTAgMjhIMjJDMjIgMjQuNjg2MyAxOS4zMTM3IDIyIDE2IDIyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
    }
  };

  // 加载图标（缓存优先）
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const primary = shortcut.icon
        const iconUrl = primary || getFallbackIcon(shortcut.url)
        const cached = await IconCacheManager.getOrFetchIconURL(iconUrl)
        if (!mounted) return
        if (cached) setIconSrc(cached)
        else setIconSrc(iconUrl)
      } catch (e) {
        if (!mounted) return
        setIconSrc(getFallbackIcon(shortcut.url))
      } finally {
        // no-op
      }
    }
    load()
    return () => { mounted = false }
  }, [shortcut.icon, shortcut.url])

  return (
    <div
      className={`dock-item relative flex items-center justify-center transition-all duration-300 ease-out cursor-pointer ${
        isHovered ? 'transform -translate-y-2 scale-110' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => onItemClick(shortcut, e)}
      onContextMenu={(e) => onContextMenu(shortcut, e)}
      title={shortcut.name}
    >
      {/* 图标容器 */}
      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg flex items-center justify-center overflow-hidden">
        {!imageError && iconSrc ? (
          <img
            src={iconSrc}
            alt={shortcut.name}
            className="w-8 h-8 object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-8 h-8 rounded bg-white/20 text-white text-sm flex items-center justify-center select-none">
            {shortcut.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* 悬停时显示的名称tooltip */}
      {isHovered && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {shortcut.name}
        </div>
      )}

      {/* 活跃指示器 */}
      <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </div>
  );
};

export const DockBar: React.FC<DockBarProps> = ({
  shortcuts,
  settings,
  onShortcutClick,
  onShortcutEdit: _onShortcutEdit,
  onShortcutDelete
}) => {
  // 本地覆盖的快捷方式（用于编辑/添加后立即反映）
  const [localShortcuts, setLocalShortcuts] = useState<DockShortcut[]>(shortcuts)
  useEffect(() => { setLocalShortcuts(shortcuts) }, [shortcuts])

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    shortcut: DockShortcut | null;
    anchorRect: DOMRect | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    shortcut: null,
    anchorRect: null
  });

  // 内联编辑面板
  const [editor, setEditor] = useState<{
    visible: boolean;
    mode: 'edit' | 'add';
    top: number;
    left: number;
    shortcut: DockShortcut | null;
    form: { name: string; url: string; icon?: string } | null;
  }>({ visible: false, mode: 'edit', top: 0, left: 0, shortcut: null, form: null })

  const dockRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭编辑面板
  useEffect(() => {
    if (!editor.visible) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!editorRef.current) return
      if (!editorRef.current.contains(target)) setEditor(prev => ({ ...prev, visible: false }))
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditor(prev => ({ ...prev, visible: false })) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [editor.visible])

  // 处理点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);

  // 如果Dock被禁用或没有快捷方式，不显示
  if (!settings.enabled || shortcuts.length === 0) {
    return null;
  }

  const handleItemClick = (shortcut: DockShortcut, event: React.MouseEvent) => {
    event.preventDefault();
    if (onShortcutClick) {
      onShortcutClick(shortcut, event);
    } else {
      // 默认行为：在新标签页打开
      window.open(shortcut.url, '_blank');
    }
  };

  const handleContextMenu = (shortcut: DockShortcut, event: React.MouseEvent) => {
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      shortcut,
      anchorRect: rect
    });
  };

  const clampPosition = (x: number, y: number, panelW = 320, panelH = 220) => {
    const vw = window.innerWidth, vh = window.innerHeight
    let left = Math.min(Math.max(8, x), vw - panelW - 8)
    let top = Math.min(Math.max(8, y), vh - panelH - 8)
    return { left, top }
  }

  const openEditorNear = (mode: 'edit' | 'add', anchor: DOMRect, shortcut: DockShortcut | null) => {
    const preferredAbove = settings.position === 'bottom'
    const x = anchor.left + anchor.width / 2 - 160 // 居中对齐，面板宽约320
    const y = preferredAbove ? (anchor.top - 12 - 220) : (anchor.bottom + 12)
    const pos = clampPosition(x, y)
    setEditor({
      visible: true,
      mode,
      top: pos.top,
      left: pos.left,
      shortcut,
      form: shortcut ? { name: shortcut.name, url: shortcut.url, icon: shortcut.icon } : { name: '', url: '', icon: '' }
    })
  }

  const handleContextMenuAction = (action: 'edit' | 'delete' | 'open' | 'openNew' | 'add') => {
    if (!contextMenu.shortcut && action !== 'add') return;

    switch (action) {
      case 'edit':
        if (contextMenu.anchorRect) openEditorNear('edit', contextMenu.anchorRect, contextMenu.shortcut!)
        break;
      case 'add':
        if (contextMenu.anchorRect) openEditorNear('add', contextMenu.anchorRect, null)
        break;
      case 'delete':
        onShortcutDelete?.(contextMenu.shortcut!);
        break;
      case 'open':
        window.location.href = contextMenu.shortcut!.url;
        break;
      case 'openNew':
        window.open(contextMenu.shortcut!.url, '_blank');
        break;
    }

    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  return (
    <>
      {/* Dock栏主体 */}
      <div
        ref={dockRef}
        className={`fixed ${settings.position === 'top' ? 'top-4' : 'bottom-4'} left-1/2 transform -translate-x-1/2 z-50`}
      >
        <div className="dock-container bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl px-4 py-3">
          <div className="flex items-center space-x-3">
            {localShortcuts.map((shortcut) => (
              <DockItem
                key={shortcut.id}
                shortcut={shortcut}
                onItemClick={handleItemClick}
                onContextMenu={handleContextMenu}
              />
            ))}
            {/* 添加按钮 */}
            <button
              ref={addBtnRef}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                openEditorNear('add', rect, null)
              }}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center"
              title="添加书签"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60] min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y, transform: 'translate(-50%, -100%)' }}
        >
          {contextMenu.shortcut && (
            <>
              <button onClick={() => handleContextMenuAction('open')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">在当前标签页打开</button>
              <button onClick={() => handleContextMenuAction('openNew')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">在新标签页打开</button>
              <hr className="my-1 border-gray-200" />
              <button onClick={() => handleContextMenuAction('edit')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">编辑</button>
              <button onClick={() => handleContextMenuAction('delete')} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">删除</button>
              <hr className="my-1 border-gray-200" />
            </>
          )}
          <button onClick={() => handleContextMenuAction('add')} className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">添加新书签</button>
        </div>
      )}

      {/* 内联编辑面板 */}
      {editor.visible && (
        <div className="fixed z-[70]" style={{ top: editor.top, left: editor.left }}>
          <div ref={editorRef} className="w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-900">{editor.mode === 'edit' ? '编辑书签' : '添加书签'}</div>
              <button onClick={() => setEditor(prev => ({ ...prev, visible: false }))} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={editor.form?.name || ''}
                onChange={(e) => setEditor(prev => ({
                  ...prev,
                  form: {
                    name: e.target.value,
                    url: prev.form?.url ?? '',
                    icon: prev.form?.icon
                  }
                }))}
                placeholder="名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="url"
                value={editor.form?.url || ''}
                onChange={(e) => setEditor(prev => ({
                  ...prev,
                  form: {
                    name: prev.form?.name ?? '',
                    url: e.target.value,
                    icon: prev.form?.icon
                  }
                }))}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="url"
                value={editor.form?.icon || ''}
                onChange={(e) => setEditor(prev => ({
                  ...prev,
                  form: {
                    name: prev.form?.name ?? '',
                    url: prev.form?.url ?? '',
                    icon: e.target.value
                  }
                }))}
                placeholder="图标URL（可选）"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setEditor(prev => ({ ...prev, visible: false }))} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded">取消</button>
              <button
                onClick={async () => {
                  if (!editor.form?.name?.trim() || !editor.form?.url?.trim()) return
                  try {
                    const now = Date.now()
                    const inputUrl = editor.form.url.trim()
                    const shortcut: DockShortcut = editor.mode === 'edit' && editor.shortcut ? {
                      ...editor.shortcut,
                      name: editor.form.name.trim(),
                      url: inputUrl,
                      icon: editor.form.icon?.trim() || `https://www.google.com/s2/favicons?domain=${new URL(inputUrl).hostname}&sz=32`,
                      updatedAt: now
                    } : {
                      id: `dock_${now}_${Math.random().toString(36).slice(2, 9)}`,
                      name: editor.form!.name.trim(),
                      url: inputUrl,
                      icon: editor.form?.icon?.trim() || `https://www.google.com/s2/favicons?domain=${new URL(inputUrl).hostname}&sz=32`,
                      index: localShortcuts.length,
                      createdAt: now,
                      updatedAt: now
                    }
                    // 持久化
                    const { StorageManager } = await import('../utils/storage')
                    await StorageManager.saveDockShortcut(shortcut)
                    // 本地更新
                    setLocalShortcuts(prev => {
                      const list = [...prev]
                      const idx = list.findIndex(s => s.id === shortcut.id)
                      if (idx >= 0) list[idx] = shortcut; else list.push(shortcut)
                      return list.sort((a, b) => a.index - b.index)
                    })
                    setEditor(prev => ({ ...prev, visible: false }))
                  } catch (e) {
                    console.error('保存书签失败', e)
                  }
                }}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS样式 */}
      <style>{`
        .dock-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .dock-item:hover {
          transform: translateY(-8px) scale(1.1);
        }

        @media (max-width: 768px) {
          .dock-container {
            padding: 8px 12px;
          }
          
          .dock-item {
            margin: 0 2px;
          }
          
          .dock-item .w-12 {
            width: 40px;
            height: 40px;
          }
          
          .dock-item img {
            width: 24px;
            height: 24px;
          }
        }

        @media (max-width: 480px) {
          .dock-container {
            padding: 6px 8px;
          }
          
          .dock-item .w-12 {
            width: 36px;
            height: 36px;
          }
          
          .dock-item img {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </>
  );
};

export default DockBar;
