import type { SearchHistory } from "../types";

/**
 * 搜索匹配工具类
 */
export class SearchMatcher {
  /**
   * 模糊匹配搜索历史记录
   * @param history 历史记录数组
   * @param query 查询字符串
   * @param limit 返回结果数量限制
   */
  static fuzzyMatch(history: SearchHistory[], query: string, limit: number = 10): SearchHistory[] {
    if (!query.trim()) {
      // 如果查询为空，返回最近的记录
      return history
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    }

    const queryLower = query.toLowerCase().trim();
    
    // 过滤匹配的记录
    const matches = history.filter(item => 
      item.keyword.toLowerCase().includes(queryLower)
    );

    // 按匹配度和时间排序
    return matches
      .map(item => ({
        ...item,
        matchScore: this.calculateMatchScore(item.keyword, queryLower)
      }))
      .sort((a, b) => {
        // 先按匹配度排序，再按时间排序
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return b.timestamp - a.timestamp;
      })
      .slice(0, limit)
      .map(({ matchScore, ...item }) => item); // 移除临时的matchScore字段
  }

  /**
   * 计算匹配分数
   * @param text 文本内容
   * @param query 查询字符串
   */
  private static calculateMatchScore(text: string, query: string): number {
    const textLower = text.toLowerCase();
    
    // 完全匹配得分最高
    if (textLower === query) {
      return 100;
    }
    
    // 开头匹配得分较高
    if (textLower.startsWith(query)) {
      return 80;
    }
    
    // 包含匹配
    if (textLower.includes(query)) {
      // 根据匹配位置和长度比例计算分数
      const index = textLower.indexOf(query);
      const lengthRatio = query.length / text.length;
      const positionScore = Math.max(0, 50 - index); // 位置越靠前分数越高
      const lengthScore = lengthRatio * 30; // 匹配长度占比越高分数越高
      
      return Math.min(79, positionScore + lengthScore);
    }
    
    return 0;
  }

  /**
   * 高亮匹配的文本
   * @param text 原始文本
   * @param query 查询字符串
   */
  static highlightMatch(text: string, query: string): string {
    if (!query.trim()) {
      return text;
    }

    const queryLower = query.toLowerCase().trim();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);
    
    if (index === -1) {
      return text;
    }

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return `${before}<mark class="bg-yellow-200 px-1 rounded">${match}</mark>${after}`;
  }
}
