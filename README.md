# MCP Notes

一个基于 Model Context Protocol (MCP) 的高级笔记管理服务器，提供丰富的笔记管理功能。

## 特性

- 📝 基础笔记操作（创建、读取、更新、删除）
- 🔍 强大的搜索功能（支持标题、内容、标签搜索）
- 🏷️ 标签管理系统
- 📂 文件夹组织
- ⭐ 笔记优先级设置
- 📅 截止日期管理
- 🔄 批量操作支持
- 💾 SQLite 持久化存储

## 安装

```bash
# 使用 pnpm 安装
pnpm install mcp-notes

# 或使用 npm 安装
npm install mcp-notes
```

## 使用方法

1. 在你的 MCP 配置文件中添加服务器配置：

```json
{
  "mcpServers": {
    "notes": {
      "command": "node",
      "args": ["/path/to/mcp-notes/build/index.js"]
    }
  }
}
```

2. 可用的工具：

- `create_note`: 创建新笔记
- `get_notes`: 获取笔记列表
- `get_note`: 获取单个笔记详情
- `update_note`: 更新笔记
- `delete_note`: 删除笔记
- `search_notes`: 搜索笔记
- `add_tags`: 添加标签
- `remove_tags`: 移除标签
- `set_priority`: 设置优先级
- `set_due_date`: 设置截止日期
- `create_folder`: 创建文件夹
- `move_to_folder`: 移动笔记到文件夹

## 开发

```bash
# 安装依赖
pnpm install

# 构建项目
pnpm build

# 运行测试
pnpm test
```

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request
