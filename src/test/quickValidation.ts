/**
 * 快速验证脚本 - 验证核心功能是否正常
 */

import { rgbToHsl, hslToRgb, getContrastRatio, rgbToHex } from '../utils/colorExtractor';
import { generateColorSchemes } from '../utils/colorSchemeGenerator';

/**
 * 测试基础颜色转换函数
 */
function testColorConversion() {
  console.log('🧪 测试颜色转换函数...');
  
  try {
    // 测试 RGB 到 HSL 转换
    const hsl = rgbToHsl(255, 0, 0); // 红色
    console.log('RGB(255,0,0) -> HSL:', hsl);
    
    // 测试 HSL 到 RGB 转换
    const rgb = hslToRgb(0, 100, 50); // 红色
    console.log('HSL(0,100,50) -> RGB:', rgb);
    
    // 测试 RGB 到 HEX 转换
    const hex = rgbToHex(255, 0, 0); // 红色
    console.log('RGB(255,0,0) -> HEX:', hex);
    
    // 测试对比度计算
    const contrast = getContrastRatio([255, 255, 255], [0, 0, 0]); // 白色和黑色
    console.log('白色和黑色的对比度:', contrast);
    
    console.log('✅ 颜色转换函数测试通过');
    return true;
  } catch (error) {
    console.error('❌ 颜色转换函数测试失败:', error);
    return false;
  }
}

/**
 * 测试配色方案生成
 */
function testColorSchemeGeneration() {
  console.log('🧪 测试配色方案生成...');
  
  try {
    // 创建一个模拟的调色板
    const mockPalette = {
      dominant: {
        rgb: [100, 150, 200] as [number, number, number],
        hex: '#6496c8',
        hsl: [210, 50, 59] as [number, number, number],
        frequency: 100,
        weight: 1.0,
        area: 25,
        position: 'center' as const
      },
      secondary: [
        {
          rgb: [120, 170, 220] as [number, number, number],
          hex: '#78aadc',
          hsl: [215, 55, 67] as [number, number, number],
          frequency: 80,
          weight: 0.8,
          area: 15,
          position: 'distributed' as const
        }
      ],
      accent: {
        rgb: [200, 100, 50] as [number, number, number],
        hex: '#c86432',
        hsl: [20, 60, 49] as [number, number, number],
        frequency: 60,
        weight: 0.6,
        area: 10,
        position: 'edge' as const
      },
      neutral: {
        rgb: [150, 150, 150] as [number, number, number],
        hex: '#969696',
        hsl: [0, 0, 59] as [number, number, number],
        frequency: 40,
        weight: 0.4,
        area: 8,
        position: 'distributed' as const
      },
      warm: [],
      cool: [],
      vibrant: [],
      muted: [],
      light: [],
      dark: []
    };
    
    // 生成配色方案
    const schemes = generateColorSchemes(mockPalette, {
      ensureAccessibility: true,
      minContrastRatio: 4.5,
      variationSeed: 1
    });
    
    console.log(`生成了 ${schemes.length} 个配色方案`);
    
    schemes.forEach((scheme, index) => {
      console.log(`方案 ${index + 1}:`, {
        name: scheme.name,
        mood: scheme.mood,
        harmony: scheme.harmony,
        contrastScore: scheme.contrastScore.toFixed(1),
        harmonyScore: scheme.harmonyScore.toFixed(1)
      });
    });
    
    console.log('✅ 配色方案生成测试通过');
    return true;
  } catch (error) {
    console.error('❌ 配色方案生成测试失败:', error);
    return false;
  }
}

/**
 * 运行所有验证测试
 */
function runValidation() {
  console.log('🚀 开始快速验证...\n');
  
  const tests = [
    { name: '颜色转换函数', fn: testColorConversion },
    { name: '配色方案生成', fn: testColorSchemeGeneration }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = test.fn();
    if (result) {
      passedTests++;
    }
  }
  
  console.log(`\n📊 验证结果: ${passedTests}/${tests.length} 个测试通过`);
  
  if (passedTests === tests.length) {
    console.log('🎉 所有验证通过！功能正常工作。');
  } else {
    console.log('⚠️ 部分验证失败，请检查相关功能。');
  }
  
  return passedTests === tests.length;
}

// 导出验证函数
export { runValidation, testColorConversion, testColorSchemeGeneration };

// 如果直接运行此文件，执行验证
if (typeof window === 'undefined') {
  // Node.js 环境
  runValidation();
}
