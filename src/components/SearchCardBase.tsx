import React from 'react';

interface SearchCardBaseProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SearchCardBase: React.FC<SearchCardBaseProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`
      bg-white rounded-xl border border-gray-200
      flex flex-col h-full
      card-style-target
      ${className}
    `}>
      {/* 统一的标题区域 */}
      <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
      </div>
      
      {/* 内容区域 */}
      <div className="px-6 pb-6 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};
