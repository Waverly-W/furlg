import { useState, useEffect } from 'react';
import type { Template } from '../types';
import { SidebarUtils } from '../utils/sidebarUtils';

/**
 * React Hook: 用于管理侧边栏宽度
 */
export function useSidebarWidth(templates: Template[], initialWidth?: number) {
  const [width, setWidth] = useState(() => {
    if (initialWidth) {
      return SidebarUtils.validateWidth(initialWidth, templates);
    }
    return SidebarUtils.getSuggestedWidth(templates);
  });

  // 当模板变化时，重新验证宽度
  useEffect(() => {
    const validatedWidth = SidebarUtils.validateWidth(width, templates);
    if (validatedWidth !== width) {
      setWidth(validatedWidth);
    }
  }, [templates, width]);

  // 监听窗口大小变化，重新计算最大宽度
  useEffect(() => {
    const handleResize = () => {
      const validatedWidth = SidebarUtils.validateWidth(width, templates);
      if (validatedWidth !== width) {
        setWidth(validatedWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, templates]);

  const updateWidth = (newWidth: number) => {
    const validatedWidth = SidebarUtils.validateWidth(newWidth, templates);
    setWidth(validatedWidth);
    return validatedWidth;
  };

  const getRange = () => SidebarUtils.getWidthRange(templates);

  return {
    width,
    updateWidth,
    getRange,
    formatForCSS: () => SidebarUtils.formatWidthForCSS(width),
    isMobile: SidebarUtils.isMobile()
  };
}
