import React, { useMemo, useRef, useEffect, useState } from 'react';

interface SmartMasonryGridProps {
  children: React.ReactNode;
  className?: string;
  columnWidth?: number;
  columnGutter?: number;
  rowGutter?: number;
  maxColumnCount?: number;
}

interface MasonryItem {
  id: string;
  element: React.ReactElement;
  height?: number;
}

// 智能瀑布流组件 - 使用最小高度放置算法
export const SmartMasonryGrid: React.FC<SmartMasonryGridProps> = ({
  children,
  className = '',
  columnWidth = 280,
  columnGutter = 24,
  rowGutter,
  maxColumnCount = 4
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<string, number>>(new Map());
  const [isClient, setIsClient] = useState(false);

  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 监听容器宽度变化
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    updateWidth(); // 初始化宽度

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 将children转换为MasonryItem数组
  const items = useMemo(() => {
    const childArray = React.Children.toArray(children);
    return childArray.map((child, index) => ({
      id: `item-${index}`,
      element: child as React.ReactElement,
      height: itemHeights.get(`item-${index}`) || 300 // 默认高度估计
    }));
  }, [children, itemHeights]);

  // 计算列数
  const columnCount = useMemo(() => {
    if (containerWidth === 0) return 1;
    
    const availableWidth = containerWidth - columnGutter;
    const columnWithGutter = columnWidth + columnGutter;
    const calculatedColumns = Math.floor(availableWidth / columnWithGutter);
    
    return Math.min(Math.max(1, calculatedColumns), maxColumnCount);
  }, [containerWidth, columnWidth, columnGutter, maxColumnCount]);

  // 计算实际列宽
  const actualColumnWidth = useMemo(() => {
    if (containerWidth === 0 || columnCount === 0) return columnWidth;
    
    const totalGutterWidth = (columnCount - 1) * columnGutter;
    return (containerWidth - totalGutterWidth) / columnCount;
  }, [containerWidth, columnCount, columnGutter, columnWidth]);

  // 智能布局算法 - 最小高度优先
  const layoutItems = useMemo(() => {
    if (!isClient || items.length === 0) return [];

    // 初始化列高度数组
    const columnHeights = new Array(columnCount).fill(0);
    const layoutResult: Array<{
      item: MasonryItem;
      left: number;
      top: number;
      width: number;
      column: number;
    }> = [];

    items.forEach((item) => {
      // 找到高度最小的列
      let shortestColumnIndex = 0;
      let shortestHeight = columnHeights[0];

      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < shortestHeight) {
          shortestHeight = columnHeights[i];
          shortestColumnIndex = i;
        }
      }

      // 计算位置
      const left = shortestColumnIndex * (actualColumnWidth + columnGutter);
      const top = columnHeights[shortestColumnIndex];

      // 添加到布局结果
      layoutResult.push({
        item,
        left,
        top,
        width: actualColumnWidth,
        column: shortestColumnIndex
      });

      // 更新列高度
      const itemHeight = item.height || 300;
      const gutterHeight = rowGutter !== undefined ? rowGutter : columnGutter;
      columnHeights[shortestColumnIndex] += itemHeight + gutterHeight;
    });

    return layoutResult;
  }, [items, columnCount, actualColumnWidth, columnGutter, rowGutter, isClient]);

  // 计算容器总高度
  const containerHeight = useMemo(() => {
    if (layoutItems.length === 0) return 0;

    // 重新计算每列的最终高度
    const columnHeights = new Array(columnCount).fill(0);
    layoutItems.forEach(({ top, item, left }) => {
      const itemHeight = item.height || 300;
      const bottom = top + itemHeight;
      // 根据left位置计算正确的列索引
      const column = Math.floor(left / (actualColumnWidth + columnGutter));
      if (column >= 0 && column < columnCount) {
        columnHeights[column] = Math.max(columnHeights[column], bottom);
      }
    });

    // 添加额外的底部间距，确保最后一行卡片完全可见
    const maxHeight = Math.max(...columnHeights);
    const extraPadding = 60; // 增加底部间距
    return maxHeight + extraPadding;
  }, [layoutItems, columnCount, actualColumnWidth, columnGutter]);

  // 高度测量回调
  const measureHeight = (itemId: string, height: number) => {
    setItemHeights(prev => {
      const newMap = new Map(prev);
      if (newMap.get(itemId) !== height) {
        newMap.set(itemId, height);
        return newMap;
      }
      return prev;
    });
  };

  if (!isClient) {
    // 服务端渲染时的简单布局
    return (
      <div ref={containerRef} className={`smart-masonry-grid ${className}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`smart-masonry-grid ${className}`}
      style={{ height: containerHeight }}
    >
      {layoutItems.map(({ item, left, top, width }, index) => (
        <MasonryItemWrapper
          key={item.id}
          item={item}
          left={left}
          top={top}
          width={width}
          onHeightChange={(height) => measureHeight(item.id, height)}
        />
      ))}
    </div>
  );
};

// 瀑布流项目包装器
interface MasonryItemWrapperProps {
  item: MasonryItem;
  left: number;
  top: number;
  width: number;
  onHeightChange: (height: number) => void;
}

const MasonryItemWrapper: React.FC<MasonryItemWrapperProps> = ({
  item,
  left,
  top,
  width,
  onHeightChange
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  // 测量高度
  useEffect(() => {
    if (!itemRef.current) return;

    const measureHeight = () => {
      if (itemRef.current) {
        const height = itemRef.current.offsetHeight;
        onHeightChange(height);
      }
    };

    // 使用ResizeObserver监听高度变化
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(itemRef.current);
    
    // 初始测量
    measureHeight();

    return () => {
      resizeObserver.disconnect();
    };
  }, [onHeightChange]);

  return (
    <div
      ref={itemRef}
      className="smart-masonry-item"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`
      }}
    >
      {item.element}
    </div>
  );
};
