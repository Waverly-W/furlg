import React from 'react';
import { SmartMasonryGrid } from './SmartMasonryGrid';

interface MasonryGridProps {
  children: React.ReactNode;
  className?: string;
  columnWidth?: number;
  columnGutter?: number;
  rowGutter?: number;
  maxColumnCount?: number;
}

// 智能瀑布流布局组件 - 使用最小高度优先算法
export const MasonryGrid: React.FC<MasonryGridProps> = ({
  children,
  className = '',
  columnWidth = 280,
  columnGutter = 24,
  rowGutter,
  maxColumnCount = 4
}) => {
  return (
    <SmartMasonryGrid
      className={className}
      columnWidth={columnWidth}
      columnGutter={columnGutter}
      rowGutter={rowGutter}
      maxColumnCount={maxColumnCount}
    >
      {children}
    </SmartMasonryGrid>
  );
};
