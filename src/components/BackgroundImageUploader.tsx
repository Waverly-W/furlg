import React, { useState, useRef, useCallback } from 'react';
import { BackgroundImageManager, type CompressionOptions, type BackgroundImageInfo } from '../utils/backgroundImageManager';

interface BackgroundImageUploaderProps {
  currentImageId?: string;
  onImageSelected: (imageId: string | undefined, imageUrl: string | undefined) => void;
  onUploadProgress?: (progress: number) => void;
}

export const BackgroundImageUploader: React.FC<BackgroundImageUploaderProps> = ({
  currentImageId,
  onImageSelected,
  onUploadProgress
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'jpeg'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 显示预览
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 20;
          if (next >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return next;
        });
      }, 100);

      onUploadProgress?.(uploadProgress);

      // 保存图片
      const imageInfo = await BackgroundImageManager.saveBackgroundImage(file, compressionOptions);
      
      // 完成上传
      setUploadProgress(100);
      clearInterval(progressInterval);

      // 获取图片URL
      const imageUrl = await BackgroundImageManager.getBackgroundImageURL(imageInfo.id);
      
      // 通知父组件
      onImageSelected(imageInfo.id, imageUrl || undefined);

      console.log('✅ 背景图片上传成功:', {
        id: imageInfo.id,
        originalSize: (imageInfo.originalSize / 1024 / 1024).toFixed(2) + 'MB',
        compressedSize: (imageInfo.compressedSize / 1024 / 1024).toFixed(2) + 'MB',
        compression: ((1 - imageInfo.compressedSize / imageInfo.originalSize) * 100).toFixed(1) + '%'
      });

    } catch (err) {
      console.error('❌ 背景图片上传失败:', err);
      setError(err instanceof Error ? err.message : '上传失败');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [compressionOptions, onImageSelected, onUploadProgress, uploadProgress]);

  // 处理文件输入变化
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 处理拖拽上传
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // 移除背景图片
  const handleRemoveImage = async () => {
    if (currentImageId) {
      try {
        await BackgroundImageManager.deleteBackgroundImage(currentImageId);
        onImageSelected(undefined, undefined);
        setPreviewUrl(null);
      } catch (error) {
        console.error('删除背景图片失败:', error);
        setError('删除失败');
      }
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isUploading 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-sm text-gray-600">正在处理图片...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">{uploadProgress.toFixed(0)}%</div>
          </div>
        ) : (
          <div className="space-y-3">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                选择图片文件
              </button>
              <span className="text-gray-500"> 或拖拽到此处</span>
            </div>
            <div className="text-xs text-gray-500">
              支持 JPG, PNG, WebP, GIF 格式，最大 20MB
            </div>
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* 高级选项 */}
      <div className="border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between"
        >
          <span>压缩选项</span>
          <svg 
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
            {/* 最大尺寸 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">最大宽度</label>
                <input
                  type="number"
                  value={compressionOptions.maxWidth}
                  onChange={(e) => setCompressionOptions(prev => ({
                    ...prev,
                    maxWidth: parseInt(e.target.value) || 1920
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  min="100"
                  max="4096"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">最大高度</label>
                <input
                  type="number"
                  value={compressionOptions.maxHeight}
                  onChange={(e) => setCompressionOptions(prev => ({
                    ...prev,
                    maxHeight: parseInt(e.target.value) || 1080
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  min="100"
                  max="4096"
                />
              </div>
            </div>

            {/* 质量和格式 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  压缩质量 ({Math.round((compressionOptions.quality || 0.85) * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={compressionOptions.quality}
                  onChange={(e) => setCompressionOptions(prev => ({
                    ...prev,
                    quality: parseFloat(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">输出格式</label>
                <select
                  value={compressionOptions.format}
                  onChange={(e) => setCompressionOptions(prev => ({
                    ...prev,
                    format: e.target.value as 'jpeg' | 'webp' | 'png'
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                  <option value="png">PNG</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 当前图片操作 */}
      {(currentImageId || previewUrl) && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRemoveImage}
            className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
          >
            移除背景
          </button>
        </div>
      )}
    </div>
  );
};
