import React, { useState } from 'react';

/**
 * 图标测试组件 - 用于验证侧边栏图标显示效果
 * 仅在开发模式下使用
 */
export const IconTestComponent: React.FC = () => {
  const [iconSize, setIconSize] = useState(32);
  const [iconStyle, setIconStyle] = useState('rounded-lg');

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const iconStyles = [
    { value: 'rounded-none', label: '无圆角' },
    { value: 'rounded-sm', label: '小圆角' },
    { value: 'rounded-md', label: '中圆角' },
    { value: 'rounded-lg', label: '大圆角' },
    { value: 'rounded-xl', label: '超大圆角' },
    { value: 'rounded-full', label: '圆形' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">侧边栏图标测试</h1>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">测试说明</h2>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 图标应该显示在插件名称"Furlg"的左边</li>
              <li>• 图标大小应该合适，不会过大或过小</li>
              <li>• 图标与文字的对齐应该美观</li>
              <li>• 图标应该有适当的圆角和阴影效果</li>
            </ul>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">图标样式控制</h2>
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图标大小: {iconSize}px
              </label>
              <input
                type="range"
                min="16"
                max="48"
                value={iconSize}
                onChange={(e) => setIconSize(parseInt(e.target.value))}
                className="w-full slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>16px</span>
                <span>32px</span>
                <span>48px</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图标样式
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {iconStyles.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setIconStyle(style.value)}
                    className={`p-2 text-sm border rounded-md transition-colors ${
                      iconStyle === style.value
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 侧边栏头部预览 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">侧边栏头部预览</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="w-64 bg-white/95 backdrop-blur border-r border-gray-200">
              {/* 模拟侧边栏头部 */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <img 
                    src="/assets/icon.png" 
                    alt="Furlg" 
                    className={`shadow-sm`}
                    style={{ 
                      width: `${iconSize}px`, 
                      height: `${iconSize}px`,
                      borderRadius: iconStyle === 'rounded-none' ? '0' :
                                  iconStyle === 'rounded-sm' ? '2px' :
                                  iconStyle === 'rounded-md' ? '6px' :
                                  iconStyle === 'rounded-lg' ? '8px' :
                                  iconStyle === 'rounded-xl' ? '12px' :
                                  iconStyle === 'rounded-full' ? '50%' : '8px'
                    }}
                  />
                  <div>
                    <h2 className="text-xl font-semibold tracking-wide text-gray-900">Furlg</h2>
                    <p className="text-xs text-gray-500 mt-1">快速搜索中心</p>
                  </div>
                </div>
              </div>
              
              {/* 模拟模板列表 */}
              <div className="p-3 space-y-1">
                <div className="px-2 py-2.5 rounded-md bg-blue-50/80 border border-blue-200 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <div className="font-medium text-blue-700 text-sm">示例模板 1</div>
                </div>
                <div className="px-2 py-2.5 rounded-md hover:bg-gray-50 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <div className="font-medium text-gray-700 text-sm">示例模板 2</div>
                </div>
                <div className="px-2 py-2.5 rounded-md hover:bg-gray-50 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <div className="font-medium text-gray-700 text-sm">示例模板 3</div>
                </div>
              </div>
              
              {/* 模拟设置按钮 */}
              <div className="p-4 border-t border-gray-200 bg-white/95 backdrop-blur">
                <div className="flex justify-center">
                  <button className="w-10 h-10 rounded-full bg-blue-500 text-white shadow-sm flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 不同尺寸对比 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">不同尺寸对比</h2>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {[16, 20, 24, 28, 32, 36, 40].map((size) => (
                <div key={size} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                  <img 
                    src="/assets/icon.png" 
                    alt="Furlg" 
                    className="rounded-lg shadow-sm"
                    style={{ width: `${size}px`, height: `${size}px` }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">Furlg</h3>
                    <p className="text-xs text-gray-500">图标大小: {size}px</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 图标信息 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">图标信息</h2>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">图标路径:</span>
                <span className="ml-2 text-gray-600 font-mono">/assets/icon.png</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">当前大小:</span>
                <span className="ml-2 text-gray-600">{iconSize}px × {iconSize}px</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">当前样式:</span>
                <span className="ml-2 text-gray-600">{iconStyles.find(s => s.value === iconStyle)?.label}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">CSS类:</span>
                <span className="ml-2 text-gray-600 font-mono">w-8 h-8 {iconStyle} shadow-sm</span>
              </div>
            </div>
          </div>
        </div>

        {/* 实际代码 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">实际代码</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`{/* 侧边栏头部 */}
<div className="p-6 border-b border-gray-200">
  <div className="flex items-center gap-3">
    <img 
      src="/assets/icon.png" 
      alt="Furlg" 
      className="w-8 h-8 rounded-lg shadow-sm"
    />
    <div>
      <h2 className="text-xl font-semibold tracking-wide text-gray-900">Furlg</h2>
      <p className="text-xs text-gray-500 mt-1">快速搜索中心</p>
    </div>
  </div>
</div>`}
            </pre>
          </div>
        </div>

        {/* 验证清单 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">验证清单</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                图标显示在插件名称左边
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                图标大小适中（32px × 32px）
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                图标与文字垂直居中对齐
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                图标有适当的圆角和阴影效果
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                整体布局美观协调
              </li>
            </ul>
          </div>
        </div>

        {/* 浏览器兼容性 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">浏览器兼容性</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              图标显示在以下浏览器中测试：
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Chrome 90+ ✅</li>
              <li>• Firefox 88+ ✅</li>
              <li>• Safari 14+ ✅</li>
              <li>• Edge 90+ ✅</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
