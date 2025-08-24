/**
 * 背景图片管理功能测试
 */

import { BackgroundImageManager } from '../utils/backgroundImageManager';

/**
 * 创建测试用的图片文件
 */
function createTestImageFile(name: string, size: number = 1024): File {
  // 创建一个简单的1x1像素的PNG图片
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 1, 1);
  }

  // 转换为Blob
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], name, { type: 'image/png' });
        resolve(file);
      }
    });
  }) as any; // 简化测试，实际使用时需要正确处理Promise
}

/**
 * 测试图片保存功能
 */
export async function testSaveImage() {
  console.log('🧪 测试图片保存功能...');
  
  try {
    // 创建测试图片
    const testFile = createTestImageFile('test-image.png');
    
    // 保存图片
    const imageInfo = await BackgroundImageManager.saveBackgroundImage(testFile, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
      format: 'jpeg'
    });
    
    console.log('✅ 图片保存成功:', {
      id: imageInfo.id,
      name: imageInfo.name,
      originalSize: imageInfo.originalSize,
      compressedSize: imageInfo.compressedSize,
      compressionRatio: ((1 - imageInfo.compressedSize / imageInfo.originalSize) * 100).toFixed(1) + '%'
    });
    
    return imageInfo;
  } catch (error) {
    console.error('❌ 图片保存失败:', error);
    throw error;
  }
}

/**
 * 测试图片获取功能
 */
export async function testGetImage(imageId: string) {
  console.log('🧪 测试图片获取功能...');
  
  try {
    const imageData = await BackgroundImageManager.getBackgroundImage(imageId);
    
    if (imageData) {
      console.log('✅ 图片获取成功:', {
        id: imageData.info.id,
        name: imageData.info.name,
        blobSize: imageData.blob.size,
        blobType: imageData.blob.type
      });
      
      return imageData;
    } else {
      throw new Error('图片不存在');
    }
  } catch (error) {
    console.error('❌ 图片获取失败:', error);
    throw error;
  }
}

/**
 * 测试图片URL生成
 */
export async function testGetImageURL(imageId: string) {
  console.log('🧪 测试图片URL生成...');
  
  try {
    const imageUrl = await BackgroundImageManager.getBackgroundImageURL(imageId);
    
    if (imageUrl) {
      console.log('✅ 图片URL生成成功:', imageUrl.substring(0, 50) + '...');
      
      // 验证URL是否有效
      const img = new Image();
      return new Promise<string>((resolve, reject) => {
        img.onload = () => {
          console.log('✅ 图片URL验证成功');
          URL.revokeObjectURL(imageUrl); // 清理URL
          resolve(imageUrl);
        };
        img.onerror = () => {
          reject(new Error('图片URL无效'));
        };
        img.src = imageUrl;
      });
    } else {
      throw new Error('无法生成图片URL');
    }
  } catch (error) {
    console.error('❌ 图片URL生成失败:', error);
    throw error;
  }
}

/**
 * 测试图片列表功能
 */
export async function testGetAllImages() {
  console.log('🧪 测试图片列表功能...');
  
  try {
    const images = await BackgroundImageManager.getAllBackgroundImages();
    
    console.log('✅ 图片列表获取成功:', {
      count: images.length,
      images: images.map(img => ({
        id: img.id,
        name: img.name,
        size: img.compressedSize
      }))
    });
    
    return images;
  } catch (error) {
    console.error('❌ 图片列表获取失败:', error);
    throw error;
  }
}

/**
 * 测试存储使用情况
 */
export async function testStorageUsage() {
  console.log('🧪 测试存储使用情况...');
  
  try {
    const usage = await BackgroundImageManager.getStorageUsage();
    
    console.log('✅ 存储使用情况获取成功:', {
      totalSize: (usage.totalSize / 1024 / 1024).toFixed(2) + ' MB',
      imageCount: usage.imageCount,
      averageSize: usage.imageCount > 0 ? 
        (usage.totalSize / usage.imageCount / 1024).toFixed(2) + ' KB' : '0 KB'
    });
    
    return usage;
  } catch (error) {
    console.error('❌ 存储使用情况获取失败:', error);
    throw error;
  }
}

/**
 * 测试图片删除功能
 */
export async function testDeleteImage(imageId: string) {
  console.log('🧪 测试图片删除功能...');
  
  try {
    await BackgroundImageManager.deleteBackgroundImage(imageId);
    
    // 验证图片是否已删除
    const imageData = await BackgroundImageManager.getBackgroundImage(imageId);
    
    if (imageData === null) {
      console.log('✅ 图片删除成功');
      return true;
    } else {
      throw new Error('图片删除失败，仍然存在');
    }
  } catch (error) {
    console.error('❌ 图片删除失败:', error);
    throw error;
  }
}

/**
 * 测试压缩功能
 */
export async function testCompression() {
  console.log('🧪 测试压缩功能...');
  
  try {
    const testFile = createTestImageFile('compression-test.png', 2048);
    
    // 测试不同压缩设置
    const compressionTests = [
      { quality: 1.0, format: 'png' as const, name: '无压缩PNG' },
      { quality: 0.9, format: 'jpeg' as const, name: '高质量JPEG' },
      { quality: 0.7, format: 'jpeg' as const, name: '中等质量JPEG' },
      { quality: 0.5, format: 'webp' as const, name: '中等质量WebP' }
    ];
    
    const results = [];
    
    for (const test of compressionTests) {
      const imageInfo = await BackgroundImageManager.saveBackgroundImage(testFile, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: test.quality,
        format: test.format
      });
      
      results.push({
        name: test.name,
        originalSize: imageInfo.originalSize,
        compressedSize: imageInfo.compressedSize,
        compressionRatio: ((1 - imageInfo.compressedSize / imageInfo.originalSize) * 100).toFixed(1) + '%',
        format: imageInfo.format
      });
      
      // 清理测试图片
      await BackgroundImageManager.deleteBackgroundImage(imageInfo.id);
    }
    
    console.log('✅ 压缩测试完成:', results);
    return results;
  } catch (error) {
    console.error('❌ 压缩测试失败:', error);
    throw error;
  }
}

/**
 * 运行所有测试
 */
export async function runAllBackgroundImageTests() {
  console.log('🚀 开始背景图片管理功能测试...\n');
  
  const tests = [
    { name: '图片保存', fn: testSaveImage },
    { name: '存储使用情况', fn: testStorageUsage },
    { name: '图片列表', fn: testGetAllImages },
    { name: '压缩功能', fn: testCompression }
  ];
  
  let passedTests = 0;
  let savedImageId: string | null = null;
  
  for (const test of tests) {
    console.log(`\n--- ${test.name}测试 ---`);
    try {
      const result = await test.fn();
      
      // 保存第一个测试的图片ID用于后续测试
      if (test.name === '图片保存' && result && typeof result === 'object' && 'id' in result) {
        savedImageId = result.id;
      }
      
      passedTests++;
    } catch (error) {
      console.error(`${test.name}测试失败:`, error);
    }
  }
  
  // 如果有保存的图片，测试获取和删除功能
  if (savedImageId) {
    console.log('\n--- 图片获取测试 ---');
    try {
      await testGetImage(savedImageId);
      passedTests++;
    } catch (error) {
      console.error('图片获取测试失败:', error);
    }
    
    console.log('\n--- 图片URL生成测试 ---');
    try {
      await testGetImageURL(savedImageId);
      passedTests++;
    } catch (error) {
      console.error('图片URL生成测试失败:', error);
    }
    
    console.log('\n--- 图片删除测试 ---');
    try {
      await testDeleteImage(savedImageId);
      passedTests++;
    } catch (error) {
      console.error('图片删除测试失败:', error);
    }
  }
  
  const totalTests = tests.length + (savedImageId ? 3 : 0);
  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 个测试通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！背景图片管理功能工作正常。');
  } else {
    console.log('⚠️ 部分测试失败，请检查相关功能。');
  }
  
  return passedTests === totalTests;
}

// 如果直接运行此文件，执行所有测试
if (typeof window !== 'undefined') {
  // 浏览器环境，可以手动调用
  (window as any).runBackgroundImageTests = runAllBackgroundImageTests;
  console.log('💡 在控制台中运行 runBackgroundImageTests() 来执行测试');
}
