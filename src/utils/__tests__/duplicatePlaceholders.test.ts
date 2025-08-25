import { PlaceholderParser } from '../placeholderParser';
import { UrlBuilder } from '../urlBuilder';
import type { MultiKeywordValues } from '../../types';

describe('重复占位符处理测试', () => {
  describe('PlaceholderParser.extractPlaceholders', () => {
    it('应该提取所有占位符（包括重复的）', () => {
      const urlPattern = 'https://example.com/search?q={query}&category={category}&sort={query}';
      const placeholders = PlaceholderParser.extractPlaceholders(urlPattern);
      
      expect(placeholders).toEqual(['query', 'category', 'query']);
      expect(placeholders.length).toBe(3);
    });

    it('应该处理多个相同占位符的情况', () => {
      const urlPattern = 'https://example.com/{query}/search/{query}/results/{query}';
      const placeholders = PlaceholderParser.extractPlaceholders(urlPattern);
      
      expect(placeholders).toEqual(['query', 'query', 'query']);
      expect(placeholders.length).toBe(3);
    });
  });

  describe('PlaceholderParser.extractUniquePlaceholders', () => {
    it('应该提取唯一的占位符（去重）', () => {
      const urlPattern = 'https://example.com/search?q={query}&category={category}&sort={query}';
      const uniquePlaceholders = PlaceholderParser.extractUniquePlaceholders(urlPattern);
      
      expect(uniquePlaceholders).toEqual(['query', 'category']);
      expect(uniquePlaceholders.length).toBe(2);
    });

    it('应该处理多个相同占位符的去重', () => {
      const urlPattern = 'https://example.com/{query}/search/{query}/results/{query}';
      const uniquePlaceholders = PlaceholderParser.extractUniquePlaceholders(urlPattern);
      
      expect(uniquePlaceholders).toEqual(['query']);
      expect(uniquePlaceholders.length).toBe(1);
    });

    it('应该保持占位符的顺序（第一次出现的位置）', () => {
      const urlPattern = 'https://example.com/{category}/search?q={query}&cat={category}&sort={query}';
      const uniquePlaceholders = PlaceholderParser.extractUniquePlaceholders(urlPattern);
      
      expect(uniquePlaceholders).toEqual(['category', 'query']);
    });
  });

  describe('占位符验证逻辑', () => {
    it('验证应该基于唯一占位符', () => {
      const urlPattern = 'https://example.com/search?q={query}&backup={query}';
      const validation = PlaceholderParser.validatePlaceholders(urlPattern);
      
      expect(validation.isValid).toBe(true);
      expect(validation.placeholders).toEqual(['query']);
    });

    it('模板类型判断应该基于唯一占位符', () => {
      const singleKeywordPattern = 'https://example.com/search?q={keyword}&backup={keyword}';
      const multiKeywordPattern = 'https://example.com/search?q={query}&cat={category}&q2={query}';
      
      expect(PlaceholderParser.isSingleKeywordTemplate(singleKeywordPattern)).toBe(true);
      expect(PlaceholderParser.isMultiKeywordTemplate(multiKeywordPattern)).toBe(true);
    });
  });

  describe('占位符列表生成', () => {
    it('应该为唯一占位符生成配置列表', () => {
      const urlPattern = 'https://example.com/search?q={query}&backup={query}&cat={category}';
      const placeholderList = PlaceholderParser.generatePlaceholderListFromTemplate(urlPattern);
      
      expect(placeholderList.length).toBe(2);
      expect(placeholderList.map(p => p.code)).toEqual(['query', 'category']);
    });

    it('同步占位符列表应该基于唯一占位符', () => {
      const urlPattern = 'https://example.com/search?q={query}&backup={query}&cat={category}';
      const currentList = [
        { id: '1', code: 'query', name: '搜索词', required: true },
        { id: '2', code: 'oldField', name: '旧字段', required: true }
      ];
      
      const syncedList = PlaceholderParser.syncPlaceholderList(urlPattern, currentList);
      
      expect(syncedList.length).toBe(2);
      expect(syncedList.map(p => p.code)).toEqual(['query', 'category']);
    });
  });

  describe('URL构建和替换', () => {
    it('应该同时替换所有相同的占位符', () => {
      const urlPattern = 'https://example.com/search?q={query}&backup={query}&cat={category}';
      const keywords: MultiKeywordValues = {
        query: 'test search',
        category: 'books'
      };
      
      const result = UrlBuilder.buildUrlWithMultipleKeywords(urlPattern, keywords);
      const expected = 'https://example.com/search?q=test%20search&backup=test%20search&cat=books';
      
      expect(result).toBe(expected);
    });

    it('应该处理多个相同占位符的复杂情况', () => {
      const urlPattern = 'https://example.com/{query}/search/{query}/results?q={query}&sort={sort}';
      const keywords: MultiKeywordValues = {
        query: 'javascript',
        sort: 'date'
      };
      
      const result = UrlBuilder.buildUrlWithMultipleKeywords(urlPattern, keywords);
      const expected = 'https://example.com/javascript/search/javascript/results?q=javascript&sort=date';
      
      expect(result).toBe(expected);
    });

    it('验证缺失关键词应该基于唯一占位符', () => {
      const urlPattern = 'https://example.com/search?q={query}&backup={query}';
      const keywords: MultiKeywordValues = {}; // 缺少 query
      
      expect(() => {
        UrlBuilder.buildUrlWithMultipleKeywords(urlPattern, keywords);
      }).toThrow('缺少必需的关键词: query');
    });
  });

  describe('边界情况', () => {
    it('应该处理没有占位符的情况', () => {
      const urlPattern = 'https://example.com/static-page';
      
      expect(PlaceholderParser.extractPlaceholders(urlPattern)).toEqual([]);
      expect(PlaceholderParser.extractUniquePlaceholders(urlPattern)).toEqual([]);
    });

    it('应该处理只有一个占位符的情况', () => {
      const urlPattern = 'https://example.com/search?q={query}';
      
      expect(PlaceholderParser.extractPlaceholders(urlPattern)).toEqual(['query']);
      expect(PlaceholderParser.extractUniquePlaceholders(urlPattern)).toEqual(['query']);
    });

    it('应该处理空字符串', () => {
      const urlPattern = '';
      
      expect(PlaceholderParser.extractPlaceholders(urlPattern)).toEqual([]);
      expect(PlaceholderParser.extractUniquePlaceholders(urlPattern)).toEqual([]);
    });
  });
});
