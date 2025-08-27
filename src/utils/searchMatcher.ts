import type { SearchHistory } from "../types";

/**
 * 搜索匹配工具类
 */
export class SearchMatcher {
  /**
   * 模糊匹配搜索历史记录（支持 alias 与 keyword，并按优先级排序）
   * 优先级：alias 完全匹配 > keyword 完全匹配 > alias 部分匹配 > keyword 部分匹配
   */
  static fuzzyMatch(history: SearchHistory[], query: string, limit: number = 10): SearchHistory[] {
    const q = query.trim()
    if (!q) {
      return history.slice(0, limit)
    }
    const queryLower = q.toLowerCase()

    const augmented = history
      .map(item => {
        const alias = ((item as any).alias || item.keyword) as string
        const aliasInfo = this.calculateMatchInfo(alias, queryLower)
        const keywordInfo = this.calculateMatchInfo(item.keyword, queryLower)

        // 计算优先级类别
        const rankAlias = this.rankFromInfo(aliasInfo)
        const rankKeyword = this.rankFromInfo(keywordInfo)
        const primaryRank = Math.max(rankAlias, rankKeyword)

        // 选择用于细分排序的得分（若 alias 等级更高，则用 alias 分数，否则用 keyword 分数）
        const primaryScore = rankAlias >= rankKeyword ? aliasInfo.score : keywordInfo.score

        return {
          item,
          meta: {
            alias,
            aliasInfo,
            keywordInfo,
            primaryRank,
            primaryScore
          }
        }
      })
      // 过滤掉完全不匹配的项
      .filter(x => x.meta.aliasInfo.type !== 'none' || x.meta.keywordInfo.type !== 'none')
      // 排序：优先级 > 分数 > 时间（新近优先）
      .sort((a, b) => {
        if (a.meta.primaryRank !== b.meta.primaryRank) return b.meta.primaryRank - a.meta.primaryRank
        if (a.meta.primaryScore !== b.meta.primaryScore) return b.meta.primaryScore - a.meta.primaryScore
        return b.item.timestamp - a.item.timestamp
      })
      .slice(0, limit)

    return augmented.map(x => x.item)
  }

  /**
   * 计算单字段匹配信息
   */
  private static calculateMatchInfo(text: string, queryLower: string): { type: 'none'|'exact'|'prefix'|'partial', score: number } {
    const t = text.toLowerCase()
    if (!t) return { type: 'none', score: 0 }
    if (t === queryLower) return { type: 'exact', score: 100 }
    if (t.startsWith(queryLower)) return { type: 'prefix', score: 80 }
    if (t.includes(queryLower)) {
      const index = t.indexOf(queryLower)
      const lengthRatio = queryLower.length / text.length
      const positionScore = Math.max(0, 50 - index)
      const lengthScore = lengthRatio * 30
      return { type: 'partial', score: Math.min(79, positionScore + lengthScore) }
    }
    return { type: 'none', score: 0 }
  }

  /** 将匹配类型映射为排序等级 */
  private static rankFromInfo(info: { type: 'none'|'exact'|'prefix'|'partial' }): number {
    switch (info.type) {
      case 'exact': return 3
      case 'prefix':
      case 'partial': return 1
      case 'none':
      default: return 0
    }
  }

  /**
   * 获取优先高亮字段（alias 优先于 keyword，当两者都匹配时）
   */
  static getPreferredMatchField(item: SearchHistory, query: string): 'alias'|'keyword'|'none' {
    const q = query.trim()
    if (!q) return 'none'
    const alias = ((item as any).alias || item.keyword) as string
    const aliasInfo = this.calculateMatchInfo(alias, q.toLowerCase())
    const keywordInfo = this.calculateMatchInfo(item.keyword, q.toLowerCase())

    // 别名 exact 优先、否则比较等级；相同等级时优先 alias
    const rankAlias = this.rankFromInfo(aliasInfo)
    const rankKeyword = this.rankFromInfo(keywordInfo)
    if (rankAlias === 0 && rankKeyword === 0) return 'none'
    if (rankAlias > rankKeyword) return 'alias'
    if (rankKeyword > rankAlias) return 'keyword'
    // 等级相同，别名优先
    return 'alias'
  }

  /**
   * 高亮匹配的文本
   */
  static highlightMatch(text: string, query: string): string {
    if (!query.trim()) return text
    const queryLower = query.toLowerCase().trim()
    const textLower = text.toLowerCase()
    const index = textLower.indexOf(queryLower)
    if (index === -1) return text
    const before = text.substring(0, index)
    const match = text.substring(index, index + query.length)
    const after = text.substring(index + query.length)
    return `${before}<mark class="bg-yellow-200 px-1 rounded">${match}</mark>${after}`
  }
}
