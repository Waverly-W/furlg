import React, { useState, useEffect, useRef } from 'react';
import type { DockShortcut, DockSettings } from '../types';
import { StorageManager } from '../utils/storage';

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

  const handleImageError = () => {
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
        {!imageError && shortcut.icon ? (
          <img
            src={shortcut.icon}
            alt={shortcut.name}
            className="w-8 h-8 object-cover"
            onError={handleImageError}
          />
        ) : (
          <img
            src={getFallbackIcon(shortcut.url)}
            alt={shortcut.name}
            className="w-8 h-8 object-cover"
            onError={() => {
              // 如果连fallback都失败了，显示默认图标
              const target = event?.target as HTMLImageElement;
              if (target) {
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMTYgOEMxMi42ODYzIDggMTAgMTAuNjg2MyAxMCAxNEMxMCAxNy4zMTM3IDEyLjY4NjMgMjAgMTYgMjBDMTkuMzEzNyAyMCAyMiAxNy4zMTM3IDIyIDE0QzIyIDEwLjY4NjMgMTkuMzEzNyA4IDE2IDhaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xNiAyMkMxMi42ODYzIDIyIDEwIDI0LjY4NjMgMTAgMjhIMjJDMjIgMjQuNjg2MyAxOS4zMTM3IDIyIDE2IDIyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
              }
            }}
          />
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
  onShortcutEdit,
  onShortcutDelete
}) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    shortcut: DockShortcut | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    shortcut: null
  });

  const dockRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      shortcut
    });
  };

  const handleContextMenuAction = (action: 'edit' | 'delete' | 'open' | 'openNew') => {
    if (!contextMenu.shortcut) return;

    switch (action) {
      case 'edit':
        onShortcutEdit?.(contextMenu.shortcut);
        break;
      case 'delete':
        onShortcutDelete?.(contextMenu.shortcut);
        break;
      case 'open':
        window.location.href = contextMenu.shortcut.url;
        break;
      case 'openNew':
        window.open(contextMenu.shortcut.url, '_blank');
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
            {shortcuts.map((shortcut) => (
              <DockItem
                key={shortcut.id}
                shortcut={shortcut}
                onItemClick={handleItemClick}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu.visible && contextMenu.shortcut && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60] min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button
            onClick={() => handleContextMenuAction('open')}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            在当前标签页打开
          </button>
          <button
            onClick={() => handleContextMenuAction('openNew')}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            在新标签页打开
          </button>
          <hr className="my-1 border-gray-200" />
          <button
            onClick={() => handleContextMenuAction('edit')}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={() => handleContextMenuAction('delete')}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            删除
          </button>
        </div>
      )}

      {/* CSS样式 */}
      <style jsx>{`
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
