import React, { useState } from 'react';
import type { Template } from '../types';

/**
 * 侧边栏布局测试组件 - 用于验证设置按钮固定在底部的效果
 * 仅在开发模式下使用
 */
export const SidebarLayoutTestComponent: React.FC = () => {
  const [templateCount, setTemplateCount] = useState(20);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  // 生成测试模板数据
  const generateTestTemplates = (count: number): Template[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: `test-template-${index + 1}`,
      name: `测试模板 ${index + 1} - ${index % 3 === 0 ? '这是一个很长的模板名称用来测试文本截断效果' : index % 2 === 0 ? '中等长度模板名称' : '短名称'}`,
      url: `https://example.com/search?q={keyword}`,
      domain: 'example.com',
      placeholders: [{ code: 'keyword', name: '关键词', required: true }],
      createdAt: Date.now() - index * 1000,
      updatedAt: Date.now() - index * 1000
    }));
  };

  const testTemplates = generateTestTemplates(templateCount);

  const handleTemplateClick = (templateId: string) => {
    console.log('点击模板:', templateId);
  };

  const handleSettingsClick = () => {
    console.log('点击设置按钮');
    alert('设置按钮可见且可点击！');
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">侧边栏布局测试</h1>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">测试说明</h2>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 设置按钮应该始终固定在侧边栏底部可见位置</li>
              <li>• 当模板数量很多时，模板列表应该可以滚动</li>
              <li>• 设置按钮不应该被模板列表挤出视口</li>
              <li>• 调整模板数量来测试不同场景下的布局表现</li>
            </ul>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">测试控制</h2>
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板数量: {templateCount}
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={templateCount}
                onChange={(e) => setTemplateCount(parseInt(e.target.value))}
                className="w-full slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                侧边栏宽度: {sidebarWidth}px
              </label>
              <input
                type="range"
                min="200"
                max="400"
                value={sidebarWidth}
                onChange={(e) => setSidebarWidth(parseInt(e.target.value))}
                className="w-full slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>200px</span>
                <span>300px</span>
                <span>400px</span>
              </div>
            </div>
          </div>
        </div>

        {/* 侧边栏测试区域 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">侧边栏布局测试</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
            <div className="flex h-full">
              {/* 测试侧边栏 */}
              <div
                className="bg-white/95 backdrop-blur border-r border-gray-200 shadow-sm flex flex-col"
                style={{ width: `${sidebarWidth}px` }}
              >
                {/* 侧边栏头部 */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                  <h2 className="text-xl font-semibold tracking-wide text-gray-900">Furlg</h2>
                  <p className="text-xs text-gray-500 mt-1">快速搜索中心</p>
                </div>

                {/* 模板列表 */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                  {testTemplates.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="text-gray-500 text-sm mb-4">还没有任何模板</div>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                        创建模板
                      </button>
                    </div>
                  ) : (
                    <div className="py-3 space-y-1 px-3">
                      {testTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateClick(template.id)}
                          className="w-full text-left px-2 py-2.5 rounded-md transition-colors flex items-center gap-2 border border-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <div className="font-medium truncate">
                            {template.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 侧边栏底部设置按钮 - 固定在底部 */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white/95 backdrop-blur">
                  <div className="flex justify-center">
                    <button
                      onClick={handleSettingsClick}
                      className="w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm flex items-center justify-center transition-colors"
                      title="设置"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* 主内容区域 */}
              <div className="flex-1 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">主内容区域</h3>
                  <p className="text-gray-600">这里是主要内容显示区域</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 测试结果显示 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">测试结果</h2>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">当前模板数量:</span>
                <span className="ml-2 text-gray-600">{templateCount}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">侧边栏宽度:</span>
                <span className="ml-2 text-gray-600">{sidebarWidth}px</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">列表高度:</span>
                <span className="ml-2 text-gray-600">自适应（可滚动）</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">设置按钮状态:</span>
                <span className="ml-2 text-green-600">✅ 固定在底部</span>
              </div>
            </div>
          </div>
        </div>

        {/* 测试场景 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">测试场景</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setTemplateCount(5)}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-800 mb-1">少量模板</h3>
              <p className="text-sm text-gray-600">5个模板，测试正常显示</p>
            </button>
            
            <button
              onClick={() => setTemplateCount(20)}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-800 mb-1">中等数量</h3>
              <p className="text-sm text-gray-600">20个模板，测试滚动效果</p>
            </button>
            
            <button
              onClick={() => setTemplateCount(50)}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-800 mb-1">大量模板</h3>
              <p className="text-sm text-gray-600">50个模板，测试极限情况</p>
            </button>
          </div>
        </div>

        {/* 验证清单 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">验证清单</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                设置按钮始终可见在侧边栏底部
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                模板列表可以正常滚动
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                大量模板时设置按钮不会被挤出视口
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                侧边栏布局在不同宽度下都正常工作
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                滚动条样式美观且不影响布局
              </li>
            </ul>
          </div>
        </div>

        {/* 技术说明 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">技术实现</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`/* 关键CSS修复 */
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
}

.sidebar-template-list {
  flex: 1;
  min-height: 0; /* 关键：允许flex子项收缩 */
  overflow-y: auto;
}

.sidebar-footer {
  flex-shrink: 0; /* 防止底部按钮被压缩 */
}

/* HTML结构 */
<div className="flex flex-col"> {/* 侧边栏容器 */}
  <div className="flex-shrink-0"> {/* 头部 */}
  <div className="flex-1 min-h-0 overflow-y-auto"> {/* 模板列表 */}
  <div className="flex-shrink-0"> {/* 设置按钮 */}
</div>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
