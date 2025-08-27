import React from 'react';
import type { Template, MultiKeywordValues } from '../types';
import { PlaceholderParser } from '../utils/placeholderParser';
import { SearchCardBase } from './SearchCardBase';
import { UnifiedKeywordSearchCard } from './UnifiedKeywordSearchCard';

interface SmartSearchCardProps {
  template: Template;
  onSearchSingle: (template: Template, keyword: string) => void;
  onSearchMultiple: (template: Template, keywords: MultiKeywordValues) => void;
  isSearching?: boolean;
  className?: string;
}

export const SmartSearchCard: React.FC<SmartSearchCardProps> = React.memo(({
  template,
  onSearchSingle,
  onSearchMultiple,
  isSearching = false,
  className = ''
}) => {
  // 检查模板类型
  const placeholders = template.placeholders || [];
  const isSingleKeyword = placeholders.length === 1 && placeholders[0].code === 'keyword';

  // 如果没有占位符列表，显示错误状态
  if (placeholders.length === 0) {
    return (
      <SearchCardBase
        title={template.name}
        className={`search-card border-red-200 ${className}`}
      >
        <div className="text-center flex-1 flex flex-col justify-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 text-sm">模板配置错误：缺少占位符定义</p>
          <p className="text-gray-500 text-xs mt-1">请在模板管理中重新配置此模板</p>
        </div>
      </SearchCardBase>
    );
  }

  // 统一渲染，由 Unified 决定单/多关键词模式
  return (
    <UnifiedKeywordSearchCard
      template={template}
      onSearchSingle={onSearchSingle}
      onSearchMultiple={onSearchMultiple}
      isSearching={isSearching}
      className={className}
    />
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，优化渲染性能
  return (
    prevProps.template.id === nextProps.template.id &&
    prevProps.template.updatedAt === nextProps.template.updatedAt &&
    prevProps.isSearching === nextProps.isSearching &&
    prevProps.className === nextProps.className
  );
});
