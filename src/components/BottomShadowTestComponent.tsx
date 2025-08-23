import React from 'react';
import { SmartSearchCard } from './SmartSearchCard';
import type { Template } from '../types';

/**
 * 底部阴影测试组件 - 用于验证最底部卡片的阴影是否能完整显示
 * 仅在开发模式下使用
 */
export const BottomShadowTestComponent: React.FC = () => {
  // 测试用的模板数据
  const testTemplates: Template[] = [
    {
      id: 'bottom-test-single',
      name: '底部单关键词测试',
      url: 'https://example.com/search?q={keyword}',
      domain: 'example.com',
      placeholders: [{ code: 'keyword', name: '关键词', required: true }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'bottom-test-multi',
      name: '底部多关键词测试',
      url: 'https://example.com/search?q={keyword}&category={category}&location={location}',
      domain: 'example.com',
      placeholders: [
        { code: 'keyword', name: '关键词', required: true },
        { code: 'category', name: '分类', required: false },
        { code: 'location', name: '地点', required: false }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  const handleSearch = () => {
    console.log('测试搜索');
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">底部阴影显示测试</h1>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">测试说明</h2>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 最底部的卡片悬停时应该能完整显示阴影</li>
              <li>• 阴影不应该被下方的提示文字或其他元素遮挡</li>
              <li>• 悬停时卡片向上移动2px，阴影向下延伸约20px</li>
              <li>• 滚动到页面底部测试最底部卡片的阴影效果</li>
            </ul>
          </div>
        </div>

        {/* 模拟页面内容，让测试卡片位于底部 */}
        <div className="space-y-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">模拟内容区域 1</h3>
            <p className="text-gray-600">这里是一些模拟内容，用于将测试卡片推到页面底部。</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">模拟内容区域 2</h3>
            <p className="text-gray-600">继续添加内容，确保测试卡片位于页面底部位置。</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">模拟内容区域 3</h3>
            <p className="text-gray-600">更多内容，让页面有足够的高度进行滚动测试。</p>
          </div>
        </div>

        {/* 瀑布流布局测试 - 模拟实际使用场景 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">瀑布流布局底部测试</h2>
          <div className="max-w-7xl mx-auto">
            <div className="pb-8">
              <div className="smart-masonry-grid" style={{ height: 'auto', minHeight: '400px' }}>
                {testTemplates.map((template, index) => (
                  <div 
                    key={`masonry-${template.id}`} 
                    className="smart-masonry-item"
                    style={{
                      left: `${(index % 2) * 320}px`,
                      top: `${Math.floor(index / 2) * 280 + 200}px`, // 放在较低的位置
                      width: '300px'
                    }}
                  >
                    <SmartSearchCard
                      template={template}
                      onSearchSingle={handleSearch}
                      onSearchMultiple={handleSearch}
                      className="bottom-shadow-test"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 模拟提示组件 */}
        <div className="text-center mt-8 text-gray-500 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-medium text-yellow-800 mb-2">⚠️ 这是模拟的提示组件</p>
          <p>提示：支持单关键词和多关键词模板，聚焦输入框查看搜索历史，使用 Tab 键在多个输入框间切换，点击侧边栏模板名称可快速定位到对应卡片</p>
          <p className="text-xs text-yellow-600 mt-2">请悬停在上方的卡片上，检查阴影是否被此提示组件遮挡</p>
        </div>

        {/* 网格布局测试 */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">网格布局底部测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testTemplates.map((template) => (
              <div key={`grid-${template.id}`} className="h-auto">
                <SmartSearchCard
                  template={template}
                  onSearchSingle={handleSearch}
                  onSearchMultiple={handleSearch}
                  className="bottom-shadow-test-grid"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 模拟页面底部的其他内容 */}
        <div className="mt-8 text-center text-gray-500 text-sm bg-gray-100 p-4 rounded-lg">
          <p>这是页面底部的其他内容，用于测试卡片阴影是否会被遮挡</p>
        </div>

        {/* 测试指导 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">测试步骤</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>滚动到页面底部，找到最底部的搜索卡片</li>
            <li>将鼠标悬停在最底部的卡片上</li>
            <li>观察卡片的阴影是否完整显示，没有被下方内容遮挡</li>
            <li>检查卡片向上移动2px的动画效果</li>
            <li>验证阴影的模糊扩散效果是否完整可见</li>
            <li>在不同屏幕尺寸下重复测试</li>
          </ol>
        </div>

        {/* CSS调试信息 */}
        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">CSS调试信息</h3>
          <pre className="text-xs text-gray-700 overflow-x-auto">
{`/* 当前应用的修复 */
.smart-masonry-grid {
  padding-bottom: 30px; /* 确保底部有足够空间显示阴影 */
}

/* 瀑布流容器包装 */
<div className="pb-8"> /* 额外的底部内边距 */
  <MasonryGrid>
    {/* 卡片内容 */}
  </MasonryGrid>
</div>

/* 提示组件间距调整 */
<div className="text-center mt-8"> /* 从mt-12减少到mt-8 */
  {/* 提示内容 */}
</div>

/* 悬停阴影效果 */
.search-card:hover {
  transform: translateY(-2px) translateZ(0);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
}`}
          </pre>
        </div>

        {/* 额外的底部空间 */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};
