import React, { useState, useMemo } from 'react';
import { MasonryAlgorithms, MasonryPerformanceTester, type MasonryItem } from '../utils/masonryAlgorithms';

interface MasonryAlgorithmDemoProps {
  className?: string;
}

export const MasonryAlgorithmDemo: React.FC<MasonryAlgorithmDemoProps> = ({ 
  className = '' 
}) => {
  const [itemCount, setItemCount] = useState(20);
  const [columnCount, setColumnCount] = useState(3);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'roundRobin' | 'shortestColumn' | 'optimized'>('optimized');

  // 生成测试数据
  const testItems = useMemo(() => {
    return MasonryAlgorithms.generateTestItems(itemCount);
  }, [itemCount]);

  // 计算布局对比
  const comparison = useMemo(() => {
    return MasonryAlgorithms.compareAlgorithms(
      testItems, 
      columnCount, 
      280, // columnWidth
      24,  // columnGutter
      24   // rowGutter
    );
  }, [testItems, columnCount]);

  // 运行性能测试
  const runPerformanceTest = () => {
    MasonryPerformanceTester.testAlgorithmPerformance(itemCount, columnCount);
  };

  return (
    <div className={`masonry-algorithm-demo p-6 ${className}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">瀑布流算法演示</h2>
        
        {/* 控制面板 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目数量: {itemCount}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                列数: {columnCount}
              </label>
              <input
                type="range"
                min="2"
                max="5"
                value={columnCount}
                onChange={(e) => setColumnCount(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                算法类型
              </label>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="roundRobin">轮询算法 (Legacy)</option>
                <option value="shortestColumn">最小高度算法</option>
                <option value="optimized">优化最小高度算法</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={runPerformanceTest}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            运行性能测试 (查看控制台)
          </button>
        </div>

        {/* 算法对比结果 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(comparison).map(([key, result]) => (
            <div 
              key={key}
              className={`bg-white border rounded-lg p-4 ${
                selectedAlgorithm === key ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
            >
              <h3 className="font-semibold text-lg mb-3">{result.algorithm}</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>总高度:</span>
                  <span className="font-mono">{result.metrics.totalHeight.toFixed(0)}px</span>
                </div>
                
                <div className="flex justify-between">
                  <span>平衡分数:</span>
                  <span className={`font-mono ${
                    result.metrics.balanceScore >= 80 ? 'text-green-600' :
                    result.metrics.balanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.metrics.balanceScore}/100
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>高度差:</span>
                  <span className="font-mono">
                    {(result.metrics.maxColumnHeight - result.metrics.minColumnHeight).toFixed(0)}px
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>高度方差:</span>
                  <span className="font-mono">{result.metrics.heightVariance.toFixed(0)}</span>
                </div>
              </div>
              
              {/* 列高度可视化 */}
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">列高度分布:</div>
                <div className="flex space-x-1">
                  {Array.from({ length: columnCount }, (_, i) => {
                    const columnItems = result.layout.filter(item => item.column === i);
                    const columnHeight = columnItems.reduce((sum, item) => 
                      Math.max(sum, item.top + item.item.height), 0
                    );
                    const maxHeight = result.metrics.maxColumnHeight;
                    const heightPercent = (columnHeight / maxHeight) * 100;
                    
                    return (
                      <div key={i} className="flex-1 bg-gray-200 rounded" style={{ height: '60px' }}>
                        <div 
                          className="bg-blue-500 rounded transition-all duration-300"
                          style={{ 
                            height: `${heightPercent}%`,
                            marginTop: `${100 - heightPercent}%`
                          }}
                          title={`列 ${i + 1}: ${columnHeight.toFixed(0)}px`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 布局可视化 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">
            布局可视化 - {comparison[selectedAlgorithm].algorithm}
          </h3>
          
          <div className="relative bg-gray-50 rounded-lg p-4 overflow-hidden">
            <MasonryVisualization 
              layout={comparison[selectedAlgorithm].layout}
              columnCount={columnCount}
              columnWidth={280}
              columnGutter={24}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 布局可视化组件
interface MasonryVisualizationProps {
  layout: any[];
  columnCount: number;
  columnWidth: number;
  columnGutter: number;
}

const MasonryVisualization: React.FC<MasonryVisualizationProps> = ({
  layout,
  columnCount,
  columnWidth,
  columnGutter
}) => {
  const containerWidth = columnCount * columnWidth + (columnCount - 1) * columnGutter;
  const containerHeight = Math.max(...layout.map(item => item.top + item.item.height));
  const scale = Math.min(1, 800 / containerWidth); // 缩放以适应容器

  return (
    <div 
      className="relative mx-auto"
      style={{ 
        width: `${containerWidth * scale}px`,
        height: `${containerHeight * scale}px`,
        minHeight: '200px'
      }}
    >
      {layout.map((item, index) => (
        <div
          key={item.item.id}
          className={`absolute border-2 rounded transition-all duration-300 ${
            item.item.data?.type === 'multi' 
              ? 'bg-blue-100 border-blue-300' 
              : 'bg-green-100 border-green-300'
          }`}
          style={{
            left: `${item.left * scale}px`,
            top: `${item.top * scale}px`,
            width: `${item.width * scale}px`,
            height: `${item.item.height * scale}px`
          }}
          title={`Item ${index + 1}: ${item.item.height}px (${item.item.data?.type})`}
        >
          <div className="p-1 text-xs font-mono">
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
};
