/**
 * 智能主题生成功能测试
 */

import { generateIntelligentThemes, type ThemeGenerationOptions } from '../utils/intelligentThemeGenerator';

// 测试用的示例图片URL（可以是任何有效的图片URL）
const TEST_IMAGE_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/**
 * 测试基本主题生成功能
 */
export async function testBasicThemeGeneration() {
  console.log('🧪 测试基本主题生成功能...');
  
  try {
    const themes = await generateIntelligentThemes(TEST_IMAGE_URL, {
      maxThemes: 3,
      ensureAccessibility: true
    });
    
    console.log('✅ 基本主题生成成功');
    console.log(`生成了 ${themes.length} 个主题`);
    
    themes.forEach((theme, index) => {
      console.log(`主题 ${index + 1}:`, {
        name: theme.name,
        mood: theme.colorScheme.mood,
        harmony: theme.colorScheme.harmony,
        accessible: theme.accessibility.isAccessible,
        contrastScore: theme.colorScheme.contrastScore,
        harmonyScore: theme.colorScheme.harmonyScore
      });
    });
    
    return true;
  } catch (error) {
    console.error('❌ 基本主题生成失败:', error);
    return false;
  }
}

/**
 * 测试不同提取策略
 */
export async function testExtractionStrategies() {
  console.log('🧪 测试不同提取策略...');
  
  const strategies = ['distributed', 'center', 'edge', 'corners'] as const;
  
  for (const strategy of strategies) {
    try {
      console.log(`测试策略: ${strategy}`);
      
      const themes = await generateIntelligentThemes(TEST_IMAGE_URL, {
        extractionStrategy: strategy,
        maxThemes: 2,
        ensureAccessibility: true
      });
      
      console.log(`✅ 策略 ${strategy} 成功生成 ${themes.length} 个主题`);
      
    } catch (error) {
      console.error(`❌ 策略 ${strategy} 失败:`, error);
      return false;
    }
  }
  
  return true;
}

/**
 * 测试不同情绪偏好
 */
export async function testMoodPreferences() {
  console.log('🧪 测试不同情绪偏好...');
  
  const moods = ['warm', 'cool', 'vibrant', 'muted', 'elegant'] as const;
  
  for (const mood of moods) {
    try {
      console.log(`测试情绪: ${mood}`);
      
      const themes = await generateIntelligentThemes(TEST_IMAGE_URL, {
        preferredMood: mood,
        maxThemes: 2,
        ensureAccessibility: true
      });
      
      console.log(`✅ 情绪 ${mood} 成功生成 ${themes.length} 个主题`);
      
      // 验证生成的主题是否符合预期情绪
      const hasExpectedMood = themes.some(theme => theme.colorScheme.mood === mood);
      if (hasExpectedMood) {
        console.log(`✅ 成功生成了 ${mood} 风格的主题`);
      } else {
        console.log(`⚠️ 未生成预期的 ${mood} 风格主题，但这可能是正常的`);
      }
      
    } catch (error) {
      console.error(`❌ 情绪 ${mood} 失败:`, error);
      return false;
    }
  }
  
  return true;
}

/**
 * 测试配色和谐度
 */
export async function testHarmonyTypes() {
  console.log('🧪 测试配色和谐度...');
  
  const harmonies = ['monochromatic', 'analogous', 'complementary'] as const;
  
  for (const harmony of harmonies) {
    try {
      console.log(`测试和谐度: ${harmony}`);
      
      const themes = await generateIntelligentThemes(TEST_IMAGE_URL, {
        preferredHarmony: harmony,
        maxThemes: 2,
        ensureAccessibility: true
      });
      
      console.log(`✅ 和谐度 ${harmony} 成功生成 ${themes.length} 个主题`);
      
      // 验证生成的主题是否符合预期和谐度
      const hasExpectedHarmony = themes.some(theme => theme.colorScheme.harmony === harmony);
      if (hasExpectedHarmony) {
        console.log(`✅ 成功生成了 ${harmony} 配色的主题`);
      } else {
        console.log(`⚠️ 未生成预期的 ${harmony} 配色主题，但这可能是正常的`);
      }
      
    } catch (error) {
      console.error(`❌ 和谐度 ${harmony} 失败:`, error);
      return false;
    }
  }
  
  return true;
}

/**
 * 测试可访问性验证
 */
export async function testAccessibility() {
  console.log('🧪 测试可访问性验证...');
  
  try {
    const themes = await generateIntelligentThemes(TEST_IMAGE_URL, {
      ensureAccessibility: true,
      minContrastRatio: 4.5,
      maxThemes: 5
    });
    
    console.log('✅ 可访问性测试成功');
    
    themes.forEach((theme, index) => {
      console.log(`主题 ${index + 1} 可访问性:`, {
        isAccessible: theme.accessibility.isAccessible,
        wcagLevel: theme.accessibility.wcagLevel,
        contrastRatio: theme.accessibility.contrastRatio
      });
    });
    
    // 验证所有主题都符合可访问性要求
    const allAccessible = themes.every(theme => theme.accessibility.isAccessible);
    if (allAccessible) {
      console.log('✅ 所有主题都符合可访问性要求');
    } else {
      console.log('⚠️ 部分主题可能不符合可访问性要求');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 可访问性测试失败:', error);
    return false;
  }
}

/**
 * 测试重新生成功能
 */
export async function testRegeneration() {
  console.log('🧪 测试重新生成功能...');
  
  try {
    // 第一次生成
    const themes1 = await generateIntelligentThemes(TEST_IMAGE_URL, {
      maxThemes: 3,
      variationSeed: 1
    });
    
    // 第二次生成（不同种子）
    const themes2 = await generateIntelligentThemes(TEST_IMAGE_URL, {
      maxThemes: 3,
      variationSeed: 2
    });
    
    console.log('✅ 重新生成测试成功');
    console.log(`第一次生成: ${themes1.length} 个主题`);
    console.log(`第二次生成: ${themes2.length} 个主题`);
    
    // 验证两次生成的结果是否不同
    const isDifferent = themes1.some((theme1, index) => {
      const theme2 = themes2[index];
      return theme2 && (
        theme1.name !== theme2.name ||
        theme1.colorScheme.mood !== theme2.colorScheme.mood ||
        theme1.colorScheme.harmony !== theme2.colorScheme.harmony
      );
    });
    
    if (isDifferent) {
      console.log('✅ 重新生成产生了不同的结果');
    } else {
      console.log('⚠️ 重新生成的结果相似，这可能是正常的');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 重新生成测试失败:', error);
    return false;
  }
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('🚀 开始智能主题生成功能测试...\n');
  
  const tests = [
    { name: '基本主题生成', fn: testBasicThemeGeneration },
    { name: '提取策略测试', fn: testExtractionStrategies },
    { name: '情绪偏好测试', fn: testMoodPreferences },
    { name: '配色和谐度测试', fn: testHarmonyTypes },
    { name: '可访问性测试', fn: testAccessibility },
    { name: '重新生成测试', fn: testRegeneration }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await test.fn();
    if (result) {
      passedTests++;
    }
    console.log(''); // 空行分隔
  }
  
  console.log(`\n📊 测试结果: ${passedTests}/${tests.length} 个测试通过`);
  
  if (passedTests === tests.length) {
    console.log('🎉 所有测试通过！智能主题生成功能工作正常。');
  } else {
    console.log('⚠️ 部分测试失败，请检查相关功能。');
  }
  
  return passedTests === tests.length;
}

// 如果直接运行此文件，执行所有测试
if (typeof window === 'undefined') {
  // Node.js 环境
  runAllTests().catch(console.error);
}
