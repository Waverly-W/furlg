import type { PlaceholderInfo, PlaceholderValidationResult, TemplatePlaceholderValidationResult } from "../types";

/**
 * 占位符解析器
 * 用于解析URL模板中的占位符，支持多关键词功能
 */
export class PlaceholderParser {
  /**
   * 从URL模板中提取所有占位符（包含重复的）
   * @param urlPattern URL模板字符串
   * @returns 占位符名称数组（可能包含重复项）
   */
  static extractPlaceholders(urlPattern: string): string[] {
    const matches = urlPattern.match(/\{([^}]+)\}/g);
    if (!matches) return [];

    return matches.map(match => match.slice(1, -1)).filter(name => name.trim());
  }

  /**
   * 从URL模板中提取唯一的占位符（去重）
   * @param urlPattern URL模板字符串
   * @returns 唯一的占位符名称数组
   */
  static extractUniquePlaceholders(urlPattern: string): string[] {
    const allPlaceholders = this.extractPlaceholders(urlPattern);
    return [...new Set(allPlaceholders)];
  }

  /**
   * 验证占位符格式和命名规范
   * @param urlPattern URL模板字符串
   * @returns 验证结果
   */
  static validatePlaceholders(urlPattern: string): PlaceholderValidationResult {
    const placeholders = this.extractUniquePlaceholders(urlPattern);
    const errors: string[] = [];

    // 检查是否有占位符
    if (placeholders.length === 0) {
      errors.push('URL模板必须包含至少一个占位符，如 {keyword}');
      return { isValid: false, errors, placeholders: [] };
    }

    // 检查占位符命名规范
    const namePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    const invalidNames = placeholders.filter(name => !namePattern.test(name));
    if (invalidNames.length > 0) {
      errors.push(`占位符名称格式无效: ${invalidNames.join(', ')}。名称必须以字母开头，只能包含字母、数字和下划线`);
    }

    // 检查重复占位符
    const uniquePlaceholders = [...new Set(placeholders)];
    if (uniquePlaceholders.length !== placeholders.length) {
      const duplicates = placeholders.filter((name, index) => placeholders.indexOf(name) !== index);
      errors.push(`发现重复的占位符: ${[...new Set(duplicates)].join(', ')}`);
    }

    // 检查占位符长度
    const longNames = placeholders.filter(name => name.length > 50);
    if (longNames.length > 0) {
      errors.push(`占位符名称过长: ${longNames.join(', ')}。建议不超过50个字符`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      placeholders: uniquePlaceholders
    };
  }

  /**
   * 检查模板是否为单关键词模板（向后兼容）
   * @param urlPattern URL模板字符串
   * @returns 是否为单关键词模板
   */
  static isSingleKeywordTemplate(urlPattern: string): boolean {
    const placeholders = this.extractUniquePlaceholders(urlPattern);
    return placeholders.length === 1 && placeholders[0] === 'keyword';
  }

  /**
   * 检查模板是否为多关键词模板
   * @param urlPattern URL模板字符串
   * @returns 是否为多关键词模板
   */
  static isMultiKeywordTemplate(urlPattern: string): boolean {
    const placeholders = this.extractUniquePlaceholders(urlPattern);
    return placeholders.length > 1 || (placeholders.length === 1 && placeholders[0] !== 'keyword');
  }

  /**
   * 生成默认的占位符配置信息
   * @param placeholders 占位符名称数组
   * @returns 占位符配置信息数组
   */
  static generateDefaultPlaceholderInfo(placeholders: string[]): PlaceholderInfo[] {
    return placeholders.map(name => ({
      name,
      label: this.generateDefaultLabel(name),
      required: true,
      placeholder: `请输入${this.generateDefaultLabel(name)}`
    }));
  }

  /**
   * 根据占位符名称生成默认标签
   * @param placeholderName 占位符名称
   * @returns 默认标签
   */
  private static generateDefaultLabel(placeholderName: string): string {
    // 常见占位符的中文映射
    const labelMap: Record<string, string> = {
      'keyword': '关键词',
      'query': '搜索词',
      'q': '搜索词',
      'search': '搜索内容',
      'term': '搜索词',
      'category': '分类',
      'cat': '分类',
      'type': '类型',
      'tag': '标签',
      'region': '地区',
      'location': '位置',
      'city': '城市',
      'country': '国家',
      'language': '语言',
      'lang': '语言',
      'sort': '排序',
      'order': '排序',
      'page': '页码',
      'limit': '数量',
      'size': '大小',
      'format': '格式',
      'date': '日期',
      'time': '时间',
      'year': '年份',
      'month': '月份',
      'day': '日期'
    };

    // 如果有预定义的标签，使用预定义的
    if (labelMap[placeholderName.toLowerCase()]) {
      return labelMap[placeholderName.toLowerCase()];
    }

    // 否则将驼峰命名转换为中文友好的格式
    const formatted = placeholderName
      .replace(/([A-Z])/g, ' $1') // 在大写字母前添加空格
      .replace(/[_-]/g, ' ')      // 替换下划线和连字符为空格
      .trim()
      .toLowerCase();

    // 首字母大写
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  /**
   * 验证关键词值是否完整
   * @param placeholders 占位符配置数组
   * @param values 关键词值对象
   * @returns 验证结果
   */
  static validateKeywordValues(placeholders: PlaceholderInfo[], values: Record<string, string>): {
    isValid: boolean;
    errors: string[];
    missingRequired: string[];
  } {
    const errors: string[] = [];
    const missingRequired: string[] = [];

    for (const placeholder of placeholders) {
      const value = values[placeholder.code];

      // 检查必填字段
      if (placeholder.required !== false && (!value || !value.trim())) {
        missingRequired.push(placeholder.name);
        errors.push(`${placeholder.name} 不能为空`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      missingRequired
    };
  }

  /**
   * 验证模板的占位符一致性
   * @param urlPattern URL模板字符串
   * @param placeholderList 占位符列表
   * @returns 验证结果
   */
  static validateTemplatePlaceholderConsistency(
    urlPattern: string,
    placeholderList: PlaceholderInfo[]
  ): TemplatePlaceholderValidationResult {
    const usedPlaceholders = this.extractUniquePlaceholders(urlPattern);
    const definedPlaceholders = placeholderList.map(p => p.code);

    const missingInList = usedPlaceholders.filter(code => !definedPlaceholders.includes(code));
    const missingInTemplate = definedPlaceholders.filter(code => !usedPlaceholders.includes(code));

    const errors: string[] = [];

    if (missingInList.length > 0) {
      errors.push(`URL模板中使用了未定义的占位符: ${missingInList.map(code => `{${code}}`).join(', ')}`);
    }

    if (missingInTemplate.length > 0) {
      errors.push(`占位符列表中定义了但URL模板中未使用的占位符: ${missingInTemplate.map(code => `{${code}}`).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      missingInList,
      missingInTemplate,
      usedPlaceholders
    };
  }

  /**
   * 验证占位符代码格式
   * @param code 占位符代码
   * @returns 是否有效
   */
  static validatePlaceholderCode(code: string): boolean {
    const namePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    return namePattern.test(code) && code.length <= 50;
  }

  /**
   * 创建新的占位符信息
   * @param code 占位符代码
   * @param name 占位符名称
   * @returns 占位符信息对象
   */
  static createPlaceholderInfo(code: string, name: string): PlaceholderInfo {
    return {
      id: `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code,
      name,
      required: true,
      placeholder: `请输入${name}`
    };
  }

  /**
   * 从URL模板自动生成占位符列表（用于数据迁移）
   * @param urlPattern URL模板字符串
   * @returns 占位符列表
   */
  static generatePlaceholderListFromTemplate(urlPattern: string): PlaceholderInfo[] {
    const placeholderCodes = this.extractUniquePlaceholders(urlPattern);
    return placeholderCodes.map(code =>
      this.createPlaceholderInfo(code, this.generateDefaultLabel(code))
    );
  }

  /**
   * 同步占位符列表与URL模板
   * @param urlPattern URL模板字符串
   * @param currentList 当前占位符列表
   * @returns 同步后的占位符列表
   */
  static syncPlaceholderList(urlPattern: string, currentList: PlaceholderInfo[]): PlaceholderInfo[] {
    const usedPlaceholders = this.extractUniquePlaceholders(urlPattern);
    const currentCodes = currentList.map(p => p.code);

    // 保留现有的占位符配置
    const syncedList = currentList.filter(p => usedPlaceholders.includes(p.code));

    // 添加新发现的占位符
    const newCodes = usedPlaceholders.filter(code => !currentCodes.includes(code));
    newCodes.forEach(code => {
      syncedList.push(this.createPlaceholderInfo(code, this.generateDefaultLabel(code)));
    });

    return syncedList;
  }
}
