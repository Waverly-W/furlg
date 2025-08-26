import React, { useState } from 'react';
import type { GlobalSettings, DockShortcut } from '../types';
import { StorageManager } from '../utils/storage';
import { BookmarkImporter } from './BookmarkImporter';

interface DockSettingsPanelProps {
  settings: GlobalSettings;
  shortcuts: DockShortcut[];
  onSettingsChange: (settings: GlobalSettings) => void;
  onShortcutsChange: (shortcuts: DockShortcut[]) => void;
}

interface ShortcutFormData {
  name: string;
  url: string;
  icon?: string;
}

const DockSettingsPanel: React.FC<DockSettingsPanelProps> = ({
  settings,
  shortcuts,
  onSettingsChange,
  onShortcutsChange
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<DockShortcut | null>(null);
  const [formData, setFormData] = useState<ShortcutFormData>({
    name: '',
    url: '',
    icon: ''
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const dockSettings = settings.dockSettings || {
    enabled: true,
    maxDisplayCount: 8,
    position: 'bottom'
  };

  // 更新Dock设置
  const updateDockSettings = (updates: Partial<typeof dockSettings>) => {
    const newSettings = {
      ...settings,
      dockSettings: { ...dockSettings, ...updates }
    };
    onSettingsChange(newSettings);
  };

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 处理添加/编辑快捷方式
  const handleSaveShortcut = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      showMessage('error', '请填写名称和URL');
      return;
    }

    try {
      // 验证URL格式
      new URL(formData.url);
    } catch {
      showMessage('error', 'URL格式无效');
      return;
    }

    try {
      const shortcut: DockShortcut = {
        id: editingShortcut?.id || `dock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        url: formData.url.trim(),
        icon: formData.icon?.trim() || `https://www.google.com/s2/favicons?domain=${new URL(formData.url).hostname}&sz=32`,
        index: editingShortcut?.index || shortcuts.length,
        createdAt: editingShortcut?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await StorageManager.saveDockShortcut(shortcut);
      const updatedShortcuts = await StorageManager.getDockShortcuts();
      onShortcutsChange(updatedShortcuts);

      setShowAddForm(false);
      setEditingShortcut(null);
      setFormData({ name: '', url: '', icon: '' });
      showMessage('success', editingShortcut ? '快捷方式已更新' : '快捷方式已添加');
    } catch (error) {
      console.error('保存快捷方式失败:', error);
      showMessage('error', '保存失败，请重试');
    }
  };

  // 处理删除快捷方式
  const handleDeleteShortcut = async (shortcut: DockShortcut) => {
    if (!confirm(`确定要删除 "${shortcut.name}" 吗？`)) return;

    try {
      await StorageManager.deleteDockShortcut(shortcut.id);
      const updatedShortcuts = await StorageManager.getDockShortcuts();
      onShortcutsChange(updatedShortcuts);
      showMessage('success', '快捷方式已删除');
    } catch (error) {
      console.error('删除快捷方式失败:', error);
      showMessage('error', '删除失败，请重试');
    }
  };

  // 处理编辑快捷方式
  const handleEditShortcut = (shortcut: DockShortcut) => {
    setEditingShortcut(shortcut);
    setFormData({
      name: shortcut.name,
      url: shortcut.url,
      icon: shortcut.icon || ''
    });
    setShowAddForm(true);
  };

  // 处理书签导入完成
  const handleImportComplete = async (importedCount: number) => {
    const updatedShortcuts = await StorageManager.getDockShortcuts();
    onShortcutsChange(updatedShortcuts);
    setShowImporter(false);
    showMessage('success', `成功导入 ${importedCount} 个书签`);
  };

  // 处理拖拽排序
  const handleDragStart = (e: React.DragEvent, shortcut: DockShortcut) => {
    e.dataTransfer.setData('text/plain', shortcut.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetShortcut: DockShortcut) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId === targetShortcut.id) return;

    try {
      const newOrder = [...shortcuts];
      const draggedIndex = newOrder.findIndex(s => s.id === draggedId);
      const targetIndex = newOrder.findIndex(s => s.id === targetShortcut.id);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedItem] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);

        // 更新索引
        const reorderedShortcuts = newOrder.map((shortcut, index) => ({
          ...shortcut,
          index,
          updatedAt: Date.now()
        }));

        await StorageManager.setDockShortcuts(reorderedShortcuts);
        onShortcutsChange(reorderedShortcuts);
      }
    } catch (error) {
      console.error('重新排序失败:', error);
      showMessage('error', '排序失败，请重试');
    }
  };

  return (
    <div className="p-6 space-y-8 overflow-y-auto">
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

      {/* Dock基础设置 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Dock栏设置</h3>
        
        <div className="space-y-4">
          {/* 启用/禁用 */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={dockSettings.enabled}
              onChange={(e) => updateDockSettings({ enabled: e.target.checked })}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">启用Dock栏</span>
          </label>

          {/* 显示数量 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大显示数量: {dockSettings.maxDisplayCount}
            </label>
            <input
              type="range"
              min="3"
              max="20"
              value={dockSettings.maxDisplayCount}
              onChange={(e) => updateDockSettings({ maxDisplayCount: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>3</span>
              <span>20</span>
            </div>
          </div>

          {/* 位置设置（预留） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">位置</label>
            <select
              value={dockSettings.position}
              onChange={(e) => updateDockSettings({ position: e.target.value as 'bottom' | 'top' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bottom">底部</option>
              <option value="top">顶部</option>
            </select>
          </div>
        </div>
      </div>

      {/* 快捷方式管理 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">快捷方式管理</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowImporter(!showImporter)}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              导入书签
            </button>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingShortcut(null);
                setFormData({ name: '', url: '', icon: '' });
              }}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              添加快捷方式
            </button>
          </div>
        </div>

        {/* 书签导入器 */}
        {showImporter && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <BookmarkImporter
              onImportComplete={handleImportComplete}
              onError={(error) => showMessage('error', error)}
            />
          </div>
        )}

        {/* 添加/编辑表单 */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              {editingShortcut ? '编辑快捷方式' : '添加快捷方式'}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.google.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图标URL（可选）</label>
                <input
                  type="url"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="留空将自动获取网站图标"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveShortcut}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  {editingShortcut ? '更新' : '添加'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingShortcut(null);
                    setFormData({ name: '', url: '', icon: '' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 快捷方式列表 */}
        <div className="space-y-2">
          {shortcuts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>暂无快捷方式</p>
              <p className="text-sm mt-1">点击上方按钮添加或导入书签</p>
            </div>
          ) : (
            shortcuts.map((shortcut, index) => (
              <div
                key={shortcut.id}
                draggable
                onDragStart={(e) => handleDragStart(e, shortcut)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, shortcut)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-move"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                    </svg>
                  </div>
                  <img
                    src={shortcut.icon || `https://www.google.com/s2/favicons?domain=${new URL(shortcut.url).hostname}&sz=16`}
                    alt={shortcut.name}
                    className="w-4 h-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iNCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNOCA0QzYuMzQzMTUgNCA1IDUuMzQzMTUgNSA3QzUgOC42NTY4NSA2LjM0MzE1IDEwIDggMTBDOS42NTY4NSAxMCAxMSA4LjY1Njg1IDExIDdDMTEgNS4zNDMxNSA5LjY1Njg1IDQgOCA0WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNOCAxMUM2LjM0MzE1IDExIDUgMTIuMzQzMSA1IDE0SDExQzExIDEyLjM0MzEgOS42NTY4NSAxMSA4IDExWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                    }}
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900">{shortcut.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{shortcut.url}</div>
                  </div>
                  {index < dockSettings.maxDisplayCount && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">显示中</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditShortcut(shortcut)}
                    className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteShortcut(shortcut)}
                    className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {shortcuts.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            <p>💡 提示：拖拽快捷方式可以调整显示顺序</p>
            <p>前 {dockSettings.maxDisplayCount} 个快捷方式将显示在Dock栏中</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DockSettingsPanel;
