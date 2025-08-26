import React, { useState, useEffect } from 'react';
import { BackgroundImageUploader } from './BackgroundImageUploader';
import { BackgroundImageManagerComponent } from './BackgroundImageManager';
import { BackgroundImageManager } from '../utils/backgroundImageManager';
import type { GlobalSettings } from '../types';

interface EnhancedBackgroundSettingsProps {
  settings: GlobalSettings;
  onBackgroundChange: (backgroundSettings: {
    backgroundImage?: string;
    backgroundImageId?: string;
    backgroundMaskOpacity?: number;
    backgroundBlur?: number;
  }) => void;
}

export const EnhancedBackgroundSettings: React.FC<EnhancedBackgroundSettingsProps> = ({
  settings,
  onBackgroundChange
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载当前背景图片
  useEffect(() => {
    const loadCurrentImage = async () => {
      if (settings.backgroundImageId) {
        setLoading(true);
        try {
          const imageUrl = await BackgroundImageManager.getBackgroundImageURL(settings.backgroundImageId);
          setCurrentImageUrl(imageUrl);
        } catch (error) {
          console.error('加载当前背景图片失败:', error);
          // 如果加载失败，可能是图片已被删除，清除设置
          onBackgroundChange({
            backgroundImageId: undefined,
            backgroundImage: undefined
          });
        } finally {
          setLoading(false);
        }
      } else if (settings.backgroundImage) {
        // 向后兼容：如果有旧的base64图片，直接使用
        setCurrentImageUrl(settings.backgroundImage);
      } else {
        setCurrentImageUrl(null);
      }
    };

    loadCurrentImage();
  }, [settings.backgroundImageId, settings.backgroundImage, onBackgroundChange]);

  // 处理图片选择
  const handleImageSelected = (imageId: string | undefined, imageUrl: string | undefined) => {
    onBackgroundChange({
      backgroundImageId: imageId,
      backgroundImage: imageUrl, // 同时更新URL以保持兼容性
      backgroundMaskOpacity: settings.backgroundMaskOpacity,
      backgroundBlur: settings.backgroundBlur
    });
  };

  // 处理遮罩透明度变化
  const handleMaskOpacityChange = (opacity: number) => {
    onBackgroundChange({
      backgroundImageId: settings.backgroundImageId,
      backgroundImage: settings.backgroundImage,
      backgroundMaskOpacity: opacity,
      backgroundBlur: settings.backgroundBlur
    });
  };

  // 处理模糊程度变化
  const handleBlurChange = (blur: number) => {
    onBackgroundChange({
      backgroundImageId: settings.backgroundImageId,
      backgroundImage: settings.backgroundImage,
      backgroundMaskOpacity: settings.backgroundMaskOpacity,
      backgroundBlur: blur
    });
  };

  // 移除背景
  const handleRemoveBackground = () => {
    onBackgroundChange({
      backgroundImageId: undefined,
      backgroundImage: undefined,
      backgroundMaskOpacity: 30,
      backgroundBlur: 0
    });
    setCurrentImageUrl(null);
  };

  return (
    <div className="space-y-6">

      {/* 背景效果设置 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4">背景效果</h4>
        
        <div className="space-y-4">
          {/* 遮罩透明度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700">遮罩透明度</label>
              <span className="text-sm text-gray-500">{settings.backgroundMaskOpacity || 30}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={settings.backgroundMaskOpacity || 30}
              onChange={(e) => handleMaskOpacityChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>透明</span>
              <span>不透明</span>
            </div>
          </div>

          {/* 模糊程度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700">模糊程度</label>
              <span className="text-sm text-gray-500">{settings.backgroundBlur || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={settings.backgroundBlur || 0}
              onChange={(e) => handleBlurChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>清晰</span>
              <span>模糊</span>
            </div>
          </div>
        </div>
      </div>

      {/* 图片管理选项卡 */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* 选项卡头部 */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              上传图片
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              图片管理
            </button>
          </nav>
        </div>

        {/* 选项卡内容 */}
        <div className="p-4">
          {activeTab === 'upload' ? (
            <BackgroundImageUploader
              currentImageId={settings.backgroundImageId}
              onImageSelected={handleImageSelected}
            />
          ) : (
            <BackgroundImageManagerComponent
              currentImageId={settings.backgroundImageId}
              onImageSelected={handleImageSelected}
            />
          )}
        </div>
      </div>

      {/* 使用提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <div className="font-medium mb-1">使用提示</div>
            <ul className="space-y-1 text-xs">
              <li>• 支持最大 20MB 的图片文件</li>
              <li>• 图片会自动压缩以节省存储空间</li>
              <li>• 支持 JPG、PNG、WebP、GIF 格式</li>
              <li>• 可以管理多张背景图片并随时切换</li>
              <li>• 系统会自动清理30天未使用的图片</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
