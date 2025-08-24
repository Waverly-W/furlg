import React from 'react';

interface SearchCardBaseProps {
  title: string;
  domain?: string;
  children: React.ReactNode;
  className?: string;
}

export const SearchCardBase: React.FC<SearchCardBaseProps> = ({
  title,
  domain,
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
        <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">{title}</h3>
        {domain && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
            {domain}
          </span>
        )}
      </div>
      
      {/* 内容区域 */}
      <div className="px-6 pb-6 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};
