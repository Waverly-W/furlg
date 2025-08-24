import React, { useState, useEffect } from 'react';
import { BackgroundImageManager, type BackgroundImageInfo } from '../utils/backgroundImageManager';

interface BackgroundImageManagerProps {
  currentImageId?: string;
  onImageSelected: (imageId: string | undefined, imageUrl: string | undefined) => void;
}

export const BackgroundImageManagerComponent: React.FC<BackgroundImageManagerProps> = ({
  currentImageId,
  onImageSelected
}) => {
  const [images, setImages] = useState<BackgroundImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageUsage, setStorageUsage] = useState<{
    totalSize: number;
    imageCount: number;
  }>({ totalSize: 0, imageCount: 0 });
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // 加载图片列表
  const loadImages = async () => {
    try {
      setLoading(true);
      const [imageList, usage] = await Promise.all([
        BackgroundImageManager.getAllBackgroundImages(),
        BackgroundImageManager.getStorageUsage()
      ]);
      
      // 按最后使用时间排序
      imageList.sort((a, b) => b.lastUsed - a.lastUsed);
      
      setImages(imageList);
      setStorageUsage(usage);
    } catch (error) {
      console.error('加载图片列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // 选择图片
  const handleSelectImage = async (imageId: string) => {
    try {
      const imageUrl = await BackgroundImageManager.getBackgroundImageURL(imageId);
      onImageSelected(imageId, imageUrl || undefined);
      await loadImages(); // 重新加载以更新最后使用时间
    } catch (error) {
      console.error('选择图片失败:', error);
    }
  };

  // 删除单个图片
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('确定要删除这张背景图片吗？')) return;

    try {
      await BackgroundImageManager.deleteBackgroundImage(imageId);
      
      // 如果删除的是当前使用的图片，清除选择
      if (imageId === currentImageId) {
        onImageSelected(undefined, undefined);
      }
      
      await loadImages();
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedImages.size} 张图片吗？`)) return;

    try {
      await Promise.all(
        Array.from(selectedImages).map(id => 
          BackgroundImageManager.deleteBackgroundImage(id)
        )
      );

      // 如果删除的包含当前使用的图片，清除选择
      if (currentImageId && selectedImages.has(currentImageId)) {
        onImageSelected(undefined, undefined);
      }

      setSelectedImages(new Set());
      await loadImages();
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  // 清理过期图片
  const handleCleanup = async () => {
    if (!confirm('确定要清理30天未使用的图片吗？')) return;

    try {
      await BackgroundImageManager.cleanupOldImages();
      await loadImages();
    } catch (error) {
      console.error('清理失败:', error);
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

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-sm text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 存储使用情况 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">存储使用情况</h4>
          <button
            onClick={handleCleanup}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            清理过期图片
          </button>
        </div>
        <div className="text-sm text-gray-600">
          <div>图片数量: {storageUsage.imageCount}</div>
          <div>总大小: {formatFileSize(storageUsage.totalSize)}</div>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedImages.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              已选择 {selectedImages.size} 张图片
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedImages(new Set())}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                取消选择
              </button>
              <button
                onClick={handleBatchDelete}
                className="text-xs text-red-600 hover:text-red-700"
              >
                删除选中
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片列表 */}
      {images.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">暂无背景图片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                currentImageId === image.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* 选择框 */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedImages.has(image.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedImages);
                    if (e.target.checked) {
                      newSelected.add(image.id);
                    } else {
                      newSelected.delete(image.id);
                    }
                    setSelectedImages(newSelected);
                  }}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {/* 图片预览 */}
              <div
                className="aspect-video bg-gray-100 flex items-center justify-center"
                onClick={() => handleSelectImage(image.id)}
              >
                <ImagePreview imageId={image.id} alt={image.name} />
              </div>

              {/* 图片信息 */}
              <div className="p-2 bg-white">
                <div className="text-xs font-medium text-gray-900 truncate" title={image.name}>
                  {image.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  <div>{image.width} × {image.height}</div>
                  <div>{formatFileSize(image.compressedSize)}</div>
                  <div>最后使用: {formatDate(image.lastUsed)}</div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(image.id);
                  }}
                  className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="删除图片"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 当前使用标识 */}
              {currentImageId === image.id && (
                <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  当前使用
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 图片预览组件
const ImagePreview: React.FC<{ imageId: string; alt: string }> = ({ imageId, alt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const url = await BackgroundImageManager.getBackgroundImageURL(imageId);
        setImageUrl(url);
      } catch (error) {
        console.error('加载图片预览失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // 清理URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageId]);

  if (loading) {
    return (
      <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="text-gray-400">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover"
    />
  );
};
