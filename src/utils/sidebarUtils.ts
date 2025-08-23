import type { Template } from '../types';

/**
 * 侧边栏宽度计算工具
 */
export class SidebarUtils {
  // 默认侧边栏宽度
  static readonly DEFAULT_WIDTH = 256;

  // 最大侧边栏宽度
  static readonly MAX_WIDTH = 400;

  // 侧边栏内边距和间距（基于实际CSS类）
  static readonly PADDING_LEFT = 20; // px-5 = 20px
  static readonly PADDING_RIGHT = 20; // px-5 = 20px
  static readonly ICON_WIDTH = 6; // w-1.5 = 6px (蓝色圆点)
  static readonly ICON_MARGIN = 8; // gap-2 = 8px
  static readonly SCROLLBAR_WIDTH = 8; // 滚动条宽度预留（减少）
  static readonly EXTRA_PADDING = 12; // 额外的安全边距

  /**
   * 创建一个临时的canvas元素来测量文本宽度
   */
  private static getTextWidth(text: string, font: string = '14px system-ui, -apple-system, sans-serif'): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    
    context.font = font;
    return context.measureText(text).width;
  }

  /**
   * 计算模板名称的显示宽度
   */
  static calculateTemplateNameWidth(templateName: string): number {
    // 使用与侧边栏相同的字体样式
    const font = '500 14px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    return this.getTextWidth(templateName, font);
  }

  /**
   * 计算侧边栏的最小宽度
   */
  static calculateMinWidth(templates: Template[]): number {
    if (templates.length === 0) {
      // 空模板时使用一个较小的最小宽度
      return 180;
    }

    // 找到最长的模板名称
    let maxNameWidth = 0;
    templates.forEach(template => {
      const nameWidth = this.calculateTemplateNameWidth(template.name);
      maxNameWidth = Math.max(maxNameWidth, nameWidth);
    });

    // 计算最小宽度：左边距 + 图标宽度 + 图标间距 + 最长文本宽度 + 右边距 + 滚动条宽度 + 额外边距
    const calculatedMinWidth = this.PADDING_LEFT +
                              this.ICON_WIDTH +
                              this.ICON_MARGIN +
                              maxNameWidth +
                              this.PADDING_RIGHT +
                              this.SCROLLBAR_WIDTH +
                              this.EXTRA_PADDING;

    // 设置一个更合理的最小宽度范围
    const absoluteMinWidth = 160; // 绝对最小宽度
    const reasonableMinWidth = 180; // 合理的最小宽度

    // 如果计算出的宽度太小，使用合理的最小宽度
    // 如果计算出的宽度合理，使用计算值
    // 但不要超过默认宽度太多
    const finalMinWidth = Math.max(calculatedMinWidth, reasonableMinWidth);

    // 如果计算出的最小宽度接近或超过默认宽度，适当减少
    if (finalMinWidth > this.DEFAULT_WIDTH * 0.9) {
      return Math.min(finalMinWidth, this.DEFAULT_WIDTH * 0.85);
    }

    return Math.max(finalMinWidth, absoluteMinWidth);
  }

  /**
   * 计算侧边栏的最大宽度
   */
  static calculateMaxWidth(): number {
    const screenWidth = window.innerWidth;
    const maxByScreen = screenWidth * 0.3; // 屏幕宽度的30%
    return Math.min(this.MAX_WIDTH, maxByScreen);
  }

  /**
   * 验证侧边栏宽度是否在有效范围内
   */
  static validateWidth(width: number, templates: Template[]): number {
    const minWidth = this.calculateMinWidth(templates);
    const maxWidth = this.calculateMaxWidth();
    
    return Math.max(minWidth, Math.min(width, maxWidth));
  }

  /**
   * 获取侧边栏宽度的建议值
   */
  static getSuggestedWidth(templates: Template[]): number {
    const minWidth = this.calculateMinWidth(templates);
    const maxWidth = this.calculateMaxWidth();

    // 根据模板数量和名称长度智能计算建议宽度
    if (templates.length === 0) {
      return 200; // 空模板时的建议宽度
    }

    // 计算平均模板名称长度
    const totalNameWidth = templates.reduce((sum, template) => {
      return sum + this.calculateTemplateNameWidth(template.name);
    }, 0);
    const avgNameWidth = totalNameWidth / templates.length;

    // 基于平均长度计算建议宽度
    const baseWidth = this.PADDING_LEFT +
                     this.ICON_WIDTH +
                     this.ICON_MARGIN +
                     avgNameWidth +
                     this.PADDING_RIGHT +
                     this.SCROLLBAR_WIDTH +
                     this.EXTRA_PADDING;

    // 在基础宽度上增加适当的缓冲
    let suggestedWidth = baseWidth + 30; // 增加30px的舒适缓冲

    // 确保建议宽度在合理范围内
    suggestedWidth = Math.max(suggestedWidth, minWidth + 20); // 至少比最小宽度大20px
    suggestedWidth = Math.min(suggestedWidth, maxWidth); // 不超过最大宽度

    // 如果建议宽度接近默认宽度，优先使用默认宽度
    if (Math.abs(suggestedWidth - this.DEFAULT_WIDTH) < 30) {
      return this.DEFAULT_WIDTH;
    }

    return Math.round(suggestedWidth);
  }

  /**
   * 检查是否为移动端
   */
  static isMobile(): boolean {
    return window.innerWidth < 768;
  }

  /**
   * 格式化宽度值为CSS样式
   */
  static formatWidthForCSS(width: number): string {
    return `${Math.round(width)}px`;
  }

  /**
   * 获取宽度范围信息
   */
  static getWidthRange(templates: Template[]): {
    min: number;
    max: number;
    default: number;
    suggested: number;
  } {
    return {
      min: this.calculateMinWidth(templates),
      max: this.calculateMaxWidth(),
      default: this.DEFAULT_WIDTH,
      suggested: this.getSuggestedWidth(templates)
    };
  }

  /**
   * 调试方法：获取详细的宽度计算信息
   */
  static getWidthCalculationDetails(templates: Template[]): {
    templateCount: number;
    longestTemplateName: string;
    longestTemplateWidth: number;
    averageTemplateWidth: number;
    calculatedMinWidth: number;
    finalMinWidth: number;
    suggestedWidth: number;
    maxWidth: number;
    breakdown: {
      paddingLeft: number;
      iconWidth: number;
      iconMargin: number;
      textWidth: number;
      paddingRight: number;
      scrollbarWidth: number;
      extraPadding: number;
    };
  } {
    let maxNameWidth = 0;
    let longestTemplateName = '';
    let totalNameWidth = 0;

    templates.forEach(template => {
      const nameWidth = this.calculateTemplateNameWidth(template.name);
      totalNameWidth += nameWidth;
      if (nameWidth > maxNameWidth) {
        maxNameWidth = nameWidth;
        longestTemplateName = template.name;
      }
    });

    const avgNameWidth = templates.length > 0 ? totalNameWidth / templates.length : 0;

    const calculatedMinWidth = this.PADDING_LEFT +
                              this.ICON_WIDTH +
                              this.ICON_MARGIN +
                              maxNameWidth +
                              this.PADDING_RIGHT +
                              this.SCROLLBAR_WIDTH +
                              this.EXTRA_PADDING;

    return {
      templateCount: templates.length,
      longestTemplateName,
      longestTemplateWidth: maxNameWidth,
      averageTemplateWidth: avgNameWidth,
      calculatedMinWidth,
      finalMinWidth: this.calculateMinWidth(templates),
      suggestedWidth: this.getSuggestedWidth(templates),
      maxWidth: this.calculateMaxWidth(),
      breakdown: {
        paddingLeft: this.PADDING_LEFT,
        iconWidth: this.ICON_WIDTH,
        iconMargin: this.ICON_MARGIN,
        textWidth: maxNameWidth,
        paddingRight: this.PADDING_RIGHT,
        scrollbarWidth: this.SCROLLBAR_WIDTH,
        extraPadding: this.EXTRA_PADDING
      }
    };
  }
}


