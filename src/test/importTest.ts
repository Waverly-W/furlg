/**
 * 导入测试 - 验证所有模块导入是否正常
 */

// 测试 colorExtractor 导入
try {
  const colorExtractor = require('../utils/colorExtractor');
  console.log('✅ colorExtractor 导入成功');
  console.log('导出的函数:', Object.keys(colorExtractor).filter(key => typeof colorExtractor[key] === 'function'));
} catch (error) {
  console.error('❌ colorExtractor 导入失败:', error);
}

// 测试 colorSchemeGenerator 导入
try {
  const colorSchemeGenerator = require('../utils/colorSchemeGenerator');
  console.log('✅ colorSchemeGenerator 导入成功');
  console.log('导出的函数:', Object.keys(colorSchemeGenerator).filter(key => typeof colorSchemeGenerator[key] === 'function'));
} catch (error) {
  console.error('❌ colorSchemeGenerator 导入失败:', error);
}

// 测试 intelligentThemeGenerator 导入
try {
  const intelligentThemeGenerator = require('../utils/intelligentThemeGenerator');
  console.log('✅ intelligentThemeGenerator 导入成功');
  console.log('导出的函数:', Object.keys(intelligentThemeGenerator).filter(key => typeof intelligentThemeGenerator[key] === 'function'));
} catch (error) {
  console.error('❌ intelligentThemeGenerator 导入失败:', error);
}

console.log('🎉 所有模块导入测试完成！');
