# NoC Topology Designer - Windows EXE 使用指南

## 下载和运行

### 方式 1: 便携版 (推荐)

1. 下载 `NoC-Topology-Designer-portable.exe` (约 202MB)
2. 直接双击运行，无需安装
3. 应用会自动启动

### 方式 2: 从源代码构建

如果您想自己构建 Windows EXE，请按以下步骤操作：

#### 前置要求
- Node.js 18+ 和 pnpm
- Windows 10/11 系统

#### 构建步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 构建前端应用
pnpm run build

# 3. 编译 Electron 主进程
npx esbuild electron/main.ts --bundle --platform=node --target=node20 --outfile=dist-electron/main.js --external:electron

# 4. 生成 Windows EXE
pnpm run electron-build-win
```

生成的 EXE 文件将位于 `dist/win-unpacked/NoC Topology Designer.exe`

## 功能特性

- **完整的 NoC 拓扑设计工具**
  - 手动添加路由器和连接
  - Mesh 拓扑一键生成
  - Butterfly 蝶形网络生成
  - Clos 三阶段网络生成

- **高级功能**
  - 支持大 Radix 路由器（最多 18 个端口）
  - 智能连线路由（贝塞尔曲线、正交、直线）
  - 迷你地图导航
  - JSON 导入/导出
  - 撤销/重做功能
  - 属性面板编辑

## 系统要求

- Windows 10 或更高版本
- 4GB RAM 最低
- 8GB RAM 推荐
- 500MB 磁盘空间

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `V` | 选择工具 |
| `R` | 添加路由器 |
| `C` | 连接模式 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` | 重做 |
| `Delete` | 删除选中项 |
| `M` | 切换迷你地图 |
| `?` | 帮助 |

## 故障排除

### EXE 无法启动
- 确保您的 Windows 系统已更新到最新版本
- 尝试以管理员身份运行
- 检查磁盘空间是否充足

### 性能问题
- 关闭其他应用以释放内存
- 避免在单个拓扑中添加超过 1000 个节点

### 连线显示问题
- 尝试切换不同的路由模式（Bezier/Orthogonal/Straight）
- 重启应用

## 反馈和支持

如有问题或建议，请在 GitHub 仓库提交 Issue。

## 许可证

MIT License
