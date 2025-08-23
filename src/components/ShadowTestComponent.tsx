import React from 'react';
import { SmartSearchCard } from './SmartSearchCard';
import type { Template } from '../types';

/**
 * 阴影测试组件 - 用于验证搜索卡片阴影效果的一致性
 * 仅在开发模式下使用
 */
export const ShadowTestComponent: React.FC = () => {
  // 测试用的模板数据
  const testTemplates: Template[] = [
    {
      id: 'test-single-1',
      name: '单关键词测试1',
      url: 'https://example.com/search?q={keyword}',
      domain: 'example.com',
      placeholders: [{ code: 'keyword', name: '关键词', required: true }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'test-single-2',
      name: '单关键词测试2',
      url: 'https://example.com/search?q={keyword}',
      domain: 'example.com',
      placeholders: [{ code: 'keyword', name: '关键词', required: true }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'test-multi-1',
      name: '多关键词测试1',
      url: 'https://example.com/search?q={keyword}&category={category}&location={location}',
      domain: 'example.com',
      placeholders: [
        { code: 'keyword', name: '关键词', required: true },
        { code: 'category', name: '分类', required: false },
        { code: 'location', name: '地点', required: false }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'test-multi-2',
      name: '多关键词测试2',
      url: 'https://example.com/search?q={keyword}&type={type}&price={price}&brand={brand}',
      domain: 'example.com',
      placeholders: [
        { code: 'keyword', name: '关键词', required: true },
        { code: 'type', name: '类型', required: false },
        { code: 'price', name: '价格', required: false },
        { code: 'brand', name: '品牌', required: false }
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">搜索卡片阴影效果测试</h1>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">测试说明</h2>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 所有卡片应该有一致的基础阴影效果</li>
              <li>• 悬停时所有卡片应该有一致的悬停阴影效果</li>
              <li>• 单关键词卡片和多关键词卡片的阴影应该完全相同</li>
              <li>• 在不同窗口尺寸下阴影效果应该保持一致</li>
              <li>• 瀑布流布局不应该影响卡片的阴影效果</li>
            </ul>
          </div>
        </div>

        {/* 网格布局测试 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">网格布局测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testTemplates.map((template) => (
              <div key={`grid-${template.id}`} className="h-auto">
                <SmartSearchCard
                  template={template}
                  onSearchSingle={handleSearch}
                  onSearchMultiple={handleSearch}
                  className="shadow-test-grid"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 瀑布流布局测试 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">瀑布流布局测试</h2>
          <div className="smart-masonry-grid" style={{ height: '600px' }}>
            {testTemplates.map((template, index) => (
              <div 
                key={`masonry-${template.id}`} 
                className="smart-masonry-item"
                style={{
                  left: `${(index % 3) * 320}px`,
                  top: `${Math.floor(index / 3) * 280}px`,
                  width: '300px'
                }}
              >
                <SmartSearchCard
                  template={template}
                  onSearchSingle={handleSearch}
                  onSearchMultiple={handleSearch}
                  className="shadow-test-masonry"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 不同高度测试 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">不同高度卡片测试</h2>
          <div className="flex flex-wrap gap-6">
            {testTemplates.map((template) => (
              <div 
                key={`height-${template.id}`} 
                className="w-80"
                style={{ 
                  height: template.placeholders.length > 1 ? '320px' : '200px' 
                }}
              >
                <SmartSearchCard
                  template={template}
                  onSearchSingle={handleSearch}
                  onSearchMultiple={handleSearch}
                  className="shadow-test-height h-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 响应式测试提示 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">响应式测试</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              请调整浏览器窗口大小来测试不同屏幕尺寸下的阴影效果一致性。
              特别注意在桌面端、平板端和移动端视图下的表现。
            </p>
          </div>
        </div>

        {/* CSS调试信息 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">CSS调试信息</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`/* 当前应用的CSS规则 */
.search-card {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
  transition: all 0.2s ease-in-out !important;
}

.search-card:hover {
  transform: translateY(-2px) translateZ(0) !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}`}
            </pre>
          </div>
        </div>

        {/* 浏览器兼容性测试 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">浏览器兼容性</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              请在以下浏览器中测试阴影效果：
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Chrome 90+</li>
              <li>• Firefox 88+</li>
              <li>• Safari 14+</li>
              <li>• Edge 90+</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
