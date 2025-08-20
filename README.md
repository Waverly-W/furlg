# Furlg - 智能搜索模板管理器

<div align="center">

![Furlg Logo](assets/icon.png)

**简化高频网站搜索操作，通过预设模板和历史记录功能减少重复的复制粘贴操作**

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/your-username/furlg)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-orange.svg)](https://chrome.google.com/webstore)

</div>

## 📖 项目简介

Furlg 是一个专为提升搜索效率而设计的 Chrome 扩展程序。它通过智能的搜索模板管理和历史记录功能，让用户能够快速访问常用的搜索引擎和网站，大幅减少重复的复制粘贴操作。

### 🎯 核心价值

- **效率提升**：一键访问常用搜索，告别重复操作
- **智能记忆**：自动保存搜索历史，支持快速复用
- **个性定制**：灵活的模板配置，适应不同使用场景
- **简洁美观**：现代化的界面设计，流畅的用户体验

## ✨ 功能特性

### 🔍 智能搜索系统
- **一键搜索**：点击历史记录立即执行搜索
- **快捷键支持**：Enter 键快速搜索，方向键导航历史记录
- **实时建议**：聚焦输入框自动显示搜索历史
- **模糊匹配**：智能匹配历史搜索记录

### 📝 搜索模板管理
- **灵活配置**：支持自定义搜索 URL 模板
- **可视化编辑**：直观的模板编辑界面
- **实时预览**：编辑时即时查看效果
- **批量管理**：支持添加、编辑、删除多个模板

### 📊 搜索历史记录
- **自动保存**：每次搜索自动记录关键词
- **智能排序**：按使用频率和时间智能排序
- **快速复用**：点击历史记录立即重新搜索
- **数据持久化**：使用 Chrome Storage API 安全存储

### ⚙️ 个性化设置
- **搜索行为**：支持当前标签页或新标签页打开
- **界面定制**：可配置顶部提示文案显示
- **数据同步**：设置实时保存，立即生效
- **响应式设计**：适配不同屏幕尺寸

## 🚀 安装使用

### 安装方法

#### 方法一：Chrome 网上应用店（推荐）
1. 访问 [Chrome 网上应用店](https://chrome.google.com/webstore)
2. 搜索 "Furlg"
3. 点击"添加至 Chrome"

#### 方法二：开发者模式安装
1. 下载项目源码并构建
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `build/chrome-mv3-prod` 目录

### 使用指南

1. **首次使用**：安装后会自动替换新标签页
2. **添加模板**：点击"模板管理"按钮添加搜索模板
3. **开始搜索**：在输入框中输入关键词，按 Enter 或点击搜索按钮
4. **使用历史**：聚焦输入框查看搜索历史，点击即可重新搜索
5. **个性设置**：点击设置按钮配置个人偏好

## 🛠️ 技术架构

### 技术栈
- **框架**：React 18 + TypeScript
- **构建工具**：Plasmo Framework
- **样式方案**：Tailwind CSS
- **存储方案**：Chrome Storage API
- **开发工具**：ESLint + Prettier

### 项目结构
```
furlg/
├── src/
│   ├── components/          # React 组件
│   │   ├── SettingsModal.tsx       # 设置弹窗
│   │   ├── TemplateManager.tsx     # 模板管理
│   │   ├── SearchSuggestions.tsx   # 搜索建议
│   │   └── ...
│   ├── utils/              # 工具函数
│   │   ├── storage.ts             # 存储管理
│   │   ├── urlBuilder.ts          # URL 构建
│   │   └── searchMatcher.ts       # 搜索匹配
│   └── types/              # 类型定义
├── newtab.tsx              # 新标签页入口
├── popup.tsx               # 弹窗页面
├── style.css               # 全局样式
└── docs/                   # 项目文档
```

### 核心模块

#### 存储管理 (StorageManager)
```typescript
class StorageManager {
  static async getTemplates(): Promise<Template[]>
  static async saveTemplate(template: Template): Promise<void>
  static async getSearchHistory(templateId?: string): Promise<SearchHistory[]>
  static async addSearchHistory(templateId: string, keyword: string): Promise<void>
  static async getGlobalSettings(): Promise<GlobalSettings>
  static async saveGlobalSettings(settings: GlobalSettings): Promise<GlobalSettings>
}
```

#### URL 构建器 (UrlBuilder)
```typescript
class UrlBuilder {
  static validateTemplate(urlPattern: string): boolean
  static buildUrl(urlPattern: string, keyword: string): string
  static async openInNewTab(url: string): Promise<void>
}
```

#### 搜索匹配器 (SearchMatcher)
```typescript
class SearchMatcher {
  static fuzzyMatch(history: SearchHistory[], query: string, limit?: number): SearchHistory[]
  static highlightMatch(text: string, query: string): string
}
```

## 🔧 开发指南

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 pnpm >= 7.0.0

### 开发环境搭建

1. **克隆项目**
```bash
git clone https://github.com/your-username/furlg.git
cd furlg
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
pnpm dev
```

4. **加载扩展**
- 打开 Chrome 浏览器
- 进入 `chrome://extensions/`
- 开启"开发者模式"
- 点击"加载已解压的扩展程序"
- 选择 `build/chrome-mv3-dev` 目录

### 构建和发布

#### 开发构建
```bash
npm run dev
```

#### 生产构建
```bash
npm run build
```

#### 打包发布
```bash
npm run package
```

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 使用 Prettier 格式化代码
- 组件采用函数式组件 + Hooks

### 测试指南
1. **功能测试**：验证所有功能模块正常工作
2. **兼容性测试**：确保在不同 Chrome 版本下正常运行
3. **性能测试**：检查内存使用和响应速度
4. **用户体验测试**：验证界面交互的流畅性

## 📋 未来规划

### 近期计划 (v0.1.0)
- [ ] **数据导入导出**：支持模板和历史记录的备份与恢复
- [ ] **搜索统计**：添加搜索频率和使用统计功能
- [ ] **快捷键支持**：全局快捷键快速打开搜索
- [ ] **主题定制**：支持深色模式和自定义主题

### 中期计划 (v0.2.0)
- [ ] **云端同步**：跨设备同步模板和设置
- [ ] **智能推荐**：基于使用习惯推荐相关搜索
- [ ] **分组管理**：支持模板分类和标签管理
- [ ] **搜索预览**：鼠标悬停预览搜索结果

### 长期愿景 (v1.0.0)
- [ ] **AI 助手**：集成 AI 搜索建议和内容总结
- [ ] **多浏览器支持**：扩展到 Firefox、Edge 等浏览器
- [ ] **企业版功能**：团队共享模板和统一管理
- [ ] **开放 API**：提供第三方集成接口

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式
1. **报告问题**：在 Issues 中报告 bug 或提出功能建议
2. **提交代码**：Fork 项目并提交 Pull Request
3. **完善文档**：改进文档内容和示例
4. **分享反馈**：分享使用体验和改进建议

### 开发流程
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- **作者**：Waverly
- **邮箱**：your-email@example.com
- **项目主页**：https://github.com/your-username/furlg
- **问题反馈**：https://github.com/your-username/furlg/issues

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐️**

Made with ❤️ by Waverly

</div>
