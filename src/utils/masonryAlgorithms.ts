// 瀑布流布局算法工具类

export interface MasonryItem {
  id: string;
  height: number;
  data?: any;
}

export interface LayoutResult {
  item: MasonryItem;
  column: number;
  left: number;
  top: number;
  width: number;
}

export interface AlgorithmMetrics {
  totalHeight: number;
  heightVariance: number;
  averageColumnHeight: number;
  maxColumnHeight: number;
  minColumnHeight: number;
  balanceScore: number; // 0-100，100表示完美平衡
}

/**
 * 瀑布流布局算法类
 */
export class MasonryAlgorithms {
  /**
   * 简单轮询算法（react-masonry-css使用的方法）
   */
  static roundRobinLayout(
    items: MasonryItem[],
    columnCount: number,
    columnWidth: number,
    columnGutter: number,
    rowGutter: number
  ): LayoutResult[] {
    const columnHeights = new Array(columnCount).fill(0);
    const results: LayoutResult[] = [];

    items.forEach((item, index) => {
      const column = index % columnCount;
      const left = column * (columnWidth + columnGutter);
      const top = columnHeights[column];

      results.push({
        item,
        column,
        left,
        top,
        width: columnWidth
      });

      columnHeights[column] += item.height + rowGutter;
    });

    return results;
  }

  /**
   * 最小高度优先算法（智能算法）
   */
  static shortestColumnLayout(
    items: MasonryItem[],
    columnCount: number,
    columnWidth: number,
    columnGutter: number,
    rowGutter: number
  ): LayoutResult[] {
    const columnHeights = new Array(columnCount).fill(0);
    const results: LayoutResult[] = [];

    items.forEach((item) => {
      // 找到高度最小的列
      let shortestColumn = 0;
      let shortestHeight = columnHeights[0];

      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < shortestHeight) {
          shortestHeight = columnHeights[i];
          shortestColumn = i;
        }
      }

      const left = shortestColumn * (columnWidth + columnGutter);
      const top = columnHeights[shortestColumn];

      results.push({
        item,
        column: shortestColumn,
        left,
        top,
        width: columnWidth
      });

      columnHeights[shortestColumn] += item.height + rowGutter;
    });

    return results;
  }

  /**
   * 优化的最小高度算法（考虑视觉平衡）
   */
  static optimizedShortestColumnLayout(
    items: MasonryItem[],
    columnCount: number,
    columnWidth: number,
    columnGutter: number,
    rowGutter: number
  ): LayoutResult[] {
    const columnHeights = new Array(columnCount).fill(0);
    const results: LayoutResult[] = [];

    items.forEach((item) => {
      // 找到高度最小的列，如果有多个相同高度的列，选择最左边的
      let bestColumn = 0;
      let minHeight = columnHeights[0];

      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < minHeight) {
          minHeight = columnHeights[i];
          bestColumn = i;
        }
      }

      // 如果有多个列高度相同，考虑视觉平衡
      const tolerance = 50; // 50px的容差
      const candidateColumns: number[] = [];
      
      for (let i = 0; i < columnCount; i++) {
        if (Math.abs(columnHeights[i] - minHeight) <= tolerance) {
          candidateColumns.push(i);
        }
      }

      // 在候选列中选择最左边的（保持视觉平衡）
      if (candidateColumns.length > 1) {
        bestColumn = Math.min(...candidateColumns);
      }

      const left = bestColumn * (columnWidth + columnGutter);
      const top = columnHeights[bestColumn];

      results.push({
        item,
        column: bestColumn,
        left,
        top,
        width: columnWidth
      });

      columnHeights[bestColumn] += item.height + rowGutter;
    });

    return results;
  }

  /**
   * 计算布局质量指标
   */
  static calculateMetrics(layout: LayoutResult[], columnCount: number): AlgorithmMetrics {
    const columnHeights = new Array(columnCount).fill(0);

    // 计算每列的最终高度
    layout.forEach(({ top, item }) => {
      const column = layout.find(l => l.top === top)?.column || 0;
      const bottom = top + item.height;
      columnHeights[column] = Math.max(columnHeights[column], bottom);
    });

    const maxHeight = Math.max(...columnHeights);
    const minHeight = Math.min(...columnHeights);
    const averageHeight = columnHeights.reduce((sum, h) => sum + h, 0) / columnCount;
    
    // 计算高度方差
    const variance = columnHeights.reduce((sum, h) => sum + Math.pow(h - averageHeight, 2), 0) / columnCount;
    
    // 计算平衡分数 (0-100)
    const heightDifference = maxHeight - minHeight;
    const balanceScore = Math.max(0, 100 - (heightDifference / averageHeight) * 100);

    return {
      totalHeight: maxHeight,
      heightVariance: variance,
      averageColumnHeight: averageHeight,
      maxColumnHeight: maxHeight,
      minColumnHeight: minHeight,
      balanceScore: Math.round(balanceScore)
    };
  }

  /**
   * 对比不同算法的性能
   */
  static compareAlgorithms(
    items: MasonryItem[],
    columnCount: number,
    columnWidth: number,
    columnGutter: number,
    rowGutter: number
  ) {
    const roundRobinLayout = this.roundRobinLayout(items, columnCount, columnWidth, columnGutter, rowGutter);
    const shortestColumnLayout = this.shortestColumnLayout(items, columnCount, columnWidth, columnGutter, rowGutter);
    const optimizedLayout = this.optimizedShortestColumnLayout(items, columnCount, columnWidth, columnGutter, rowGutter);

    const roundRobinMetrics = this.calculateMetrics(roundRobinLayout, columnCount);
    const shortestColumnMetrics = this.calculateMetrics(shortestColumnLayout, columnCount);
    const optimizedMetrics = this.calculateMetrics(optimizedLayout, columnCount);

    return {
      roundRobin: {
        layout: roundRobinLayout,
        metrics: roundRobinMetrics,
        algorithm: 'Round Robin (Legacy)'
      },
      shortestColumn: {
        layout: shortestColumnLayout,
        metrics: shortestColumnMetrics,
        algorithm: 'Shortest Column'
      },
      optimized: {
        layout: optimizedLayout,
        metrics: optimizedMetrics,
        algorithm: 'Optimized Shortest Column'
      }
    };
  }

  /**
   * 生成测试数据
   */
  static generateTestItems(count: number): MasonryItem[] {
    const items: MasonryItem[] = [];
    
    for (let i = 0; i < count; i++) {
      // 模拟不同类型的卡片高度
      let height: number;
      
      if (i % 5 === 0) {
        // 20% 的卡片是多关键词卡片（较高）
        height = 300 + Math.random() * 200; // 300-500px
      } else {
        // 80% 的卡片是单关键词卡片（较矮）
        height = 180 + Math.random() * 80; // 180-260px
      }

      items.push({
        id: `item-${i}`,
        height: Math.round(height),
        data: { index: i, type: i % 5 === 0 ? 'multi' : 'single' }
      });
    }

    return items;
  }
}

/**
 * 性能测试工具
 */
export class MasonryPerformanceTester {
  static testAlgorithmPerformance(itemCount: number, columnCount: number = 3) {
    const items = MasonryAlgorithms.generateTestItems(itemCount);
    const columnWidth = 280;
    const columnGutter = 24;
    const rowGutter = 24;

    console.log(`\n=== 瀑布流算法性能测试 ===`);
    console.log(`测试项目数量: ${itemCount}`);
    console.log(`列数: ${columnCount}`);
    console.log(`列宽: ${columnWidth}px`);
    console.log(`列间距: ${columnGutter}px`);
    console.log(`行间距: ${rowGutter}px\n`);

    const startTime = performance.now();
    const comparison = MasonryAlgorithms.compareAlgorithms(
      items, columnCount, columnWidth, columnGutter, rowGutter
    );
    const endTime = performance.now();

    console.log(`总计算时间: ${(endTime - startTime).toFixed(2)}ms\n`);

    // 输出结果对比
    Object.entries(comparison).forEach(([key, result]) => {
      console.log(`--- ${result.algorithm} ---`);
      console.log(`总高度: ${result.metrics.totalHeight.toFixed(0)}px`);
      console.log(`平均列高: ${result.metrics.averageColumnHeight.toFixed(0)}px`);
      console.log(`最高列: ${result.metrics.maxColumnHeight.toFixed(0)}px`);
      console.log(`最矮列: ${result.metrics.minColumnHeight.toFixed(0)}px`);
      console.log(`高度差: ${(result.metrics.maxColumnHeight - result.metrics.minColumnHeight).toFixed(0)}px`);
      console.log(`平衡分数: ${result.metrics.balanceScore}/100`);
      console.log(`高度方差: ${result.metrics.heightVariance.toFixed(0)}\n`);
    });

    return comparison;
  }
}
