/**
 * 背景图片管理器
 * 支持大文件存储和优化处理
 */

export interface BackgroundImageInfo {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  format: string;
  width: number;
  height: number;
  createdAt: number;
  lastUsed: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 - 1.0
  format?: 'jpeg' | 'webp' | 'png';
}

export interface BackgroundImageData {
  info: BackgroundImageInfo;
  blob: Blob;
}

/**
 * 背景图片管理器类
 */
export class BackgroundImageManager {
  private static readonly STORAGE_KEY = 'backgroundImages';
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  private static readonly DEFAULT_COMPRESSION: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'jpeg'
  };

  // 运行期 URL 缓存，避免重复创建与泄露
  private static urlCache: Map<string, string> = new Map()

  /** 撤销指定图片的对象URL */
  static revokeObjectURL(id: string) {
    const url = this.urlCache.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      this.urlCache.delete(id)
    }
  }

  /** 撤销全部对象URL（页面卸载时可调用） */
  static revokeAllObjectURLs() {
    for (const [_, url] of this.urlCache) {
      URL.revokeObjectURL(url)
    }
    this.urlCache.clear()
  }

  /**
   * 从 data URL 导入并保存为背景图，返回图片信息
   */
  static async saveBackgroundImageFromDataUrl(dataUrl: string, name = 'imported-image.png'): Promise<BackgroundImageInfo> {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const type = blob.type || 'image/png'
    const file = new File([blob], name, { type })
    return this.saveBackgroundImage(file)
  }


  /**
   * 保存背景图片
   */
  static async saveBackgroundImage(
    file: File,
    compressionOptions: CompressionOptions = {}
  ): Promise<BackgroundImageInfo> {
    // 验证文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`文件大小超过限制（${this.MAX_FILE_SIZE / 1024 / 1024}MB）`);
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('不支持的图片格式');
    }

    // 生成唯一ID
    const id = `bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 获取图片尺寸
    const dimensions = await this.getImageDimensions(file);

    // 压缩图片
    const compressedBlob = await this.compressImage(file, {
      ...this.DEFAULT_COMPRESSION,
      ...compressionOptions
    });

    // 创建图片信息
    const info: BackgroundImageInfo = {
      id,
      name: file.name,
      originalSize: file.size,
      compressedSize: compressedBlob.size,
      format: compressedBlob.type,
      width: dimensions.width,
      height: dimensions.height,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    // 保存到IndexedDB
    await this.saveToIndexedDB(id, { info, blob: compressedBlob });

    // 更新图片列表
    await this.updateImageList(info);

    return info;
  }

  /**
   * 获取背景图片
   */
  static async getBackgroundImage(id: string): Promise<BackgroundImageData | null> {
    try {
      const data = await this.getFromIndexedDB(id);
      if (data) {
        // 更新最后使用时间
        data.info.lastUsed = Date.now();
        await this.updateImageList(data.info);
      }
      return data;
    } catch (error) {
      console.error('获取背景图片失败:', error);
      return null;
    }
  }

  /**
   * 获取背景图片URL
   */
  static async getBackgroundImageURL(id: string): Promise<string | null> {
    // 命中缓存直接返回
    const cached = this.urlCache.get(id)
    if (cached) return cached

    const data = await this.getBackgroundImage(id)
    if (!data) return null

    const url = URL.createObjectURL(data.blob)
    // 缓存并返回
    this.urlCache.set(id, url)
    return url
  }

  /**
   * 删除背景图片
   */
  static async deleteBackgroundImage(id: string): Promise<void> {
    await this.deleteFromIndexedDB(id);
    await this.removeFromImageList(id);
  }

  /**
   * 获取所有背景图片信息
   */
  static async getAllBackgroundImages(): Promise<BackgroundImageInfo[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || [];
    } catch (error) {
      console.error('获取图片列表失败:', error);
      return [];
    }
  }

  /**
   * 清理过期图片
   */
  static async cleanupOldImages(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const images = await this.getAllBackgroundImages();
    const now = Date.now();

    for (const image of images) {
      if (now - image.lastUsed > maxAge) {
        await this.deleteBackgroundImage(image.id);
      }
    }
  }

  /**
   * 获取存储使用情况
   */
  static async getStorageUsage(): Promise<{
    totalSize: number;
    imageCount: number;
    images: BackgroundImageInfo[];
  }> {
    const images = await this.getAllBackgroundImages();
    const totalSize = images.reduce((sum, img) => sum + img.compressedSize, 0);

    return {
      totalSize,
      imageCount: images.length,
      images
    };
  }

  /**
   * 压缩图片
   */
  private static async compressImage(
    file: File,
    options: CompressionOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // 计算压缩后的尺寸
          const { width, height } = this.calculateCompressedSize(
            img.width,
            img.height,
            options.maxWidth || 1920,
            options.maxHeight || 1080
          );

          canvas.width = width;
          canvas.height = height;

          // 绘制压缩后的图片
          ctx?.drawImage(img, 0, 0, width, height);

          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              try {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('图片压缩失败'));
                }
              } finally {
                // 画布资源由 GC 回收；此处无需 revoke
              }
            },
            `image/${options.format || 'jpeg'}`,
            options.quality || 0.85
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('图片加载失败')) };
      const objectUrl = URL.createObjectURL(file)
      img.src = objectUrl;
    });
  }

  /**
   * 计算压缩后的尺寸
   */
  private static calculateCompressedSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // 按比例缩放
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * 获取图片尺寸
   */
  private static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(objectUrl)
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('无法获取图片尺寸')) };
      const objectUrl = URL.createObjectURL(file)
      img.src = objectUrl;
    });
  }

  /**
   * 保存到IndexedDB
   */
  private static async saveToIndexedDB(id: string, data: BackgroundImageData): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BackgroundImages', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');

        const putRequest = store.put(data, id);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images');
        }
      };
    });
  }

  /**
   * 从IndexedDB获取
   */
  private static async getFromIndexedDB(id: string): Promise<BackgroundImageData | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BackgroundImages', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');

        const getRequest = store.get(id);
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images');
        }
      };
    });
  }

  /**
   * 从IndexedDB删除
   */
  private static async deleteFromIndexedDB(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BackgroundImages', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');

        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }

  /**
   * 更新图片列表
   */
  private static async updateImageList(info: BackgroundImageInfo): Promise<void> {
    const images = await this.getAllBackgroundImages();
    const index = images.findIndex(img => img.id === info.id);

    if (index >= 0) {
      images[index] = info;
    } else {
      images.push(info);
    }

    await chrome.storage.local.set({ [this.STORAGE_KEY]: images });
  }

  /**
   * 从图片列表中移除
   */
  private static async removeFromImageList(id: string): Promise<void> {
    const images = await this.getAllBackgroundImages();
    const filtered = images.filter(img => img.id !== id);
    await chrome.storage.local.set({ [this.STORAGE_KEY]: filtered });
  }
}
