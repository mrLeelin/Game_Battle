# 3D Game Agent - 使用文档

## 📖 概述

3D Game Agent 是一个用于 3D JavaScript 游戏开发的全功能 Agent 系统，包含：

- **Claude Code Skill** - 在 Claude Code 中快速调用的技能
- **MCP Server** - 提供可编程的工具集 API
- **CLI Agent** - 命令行工具，用于项目管理和代码生成

支持的游戏引擎：
- Three.js（推荐）
- Babylon.js
- PlayCanvas

---

## 🚀 快速开始

### 1. 安装 CLI Agent

```bash
cd agent/cli
npm install
npm link
```

### 2. 创建新项目

```bash
game-agent create my-game --engine=threejs
cd my-game
npm install
npm run dev
```

### 3. 生成组件

```bash
# FPS 控制器
game-agent generate player-controller --type=fps

# 敌人 AI
game-agent generate enemy-ai

# 武器系统
game-agent generate weapon
```

---

## 🛠️ CLI 命令参考

### create - 创建项目

```bash
game-agent create <name> [options]

选项:
  -e, --engine <engine>     游戏引擎 (threejs, babylon, playcanvas)
  -t, --template <template> 项目模板 (basic, fps, tps, platformer)
  --typescript              使用 TypeScript
  --multiplayer             包含多人游戏支持
```

### generate - 生成组件

```bash
game-agent generate <component> [options]

组件类型:
  player-controller   玩家控制器 (支持 --type=fps|tps)
  enemy-ai            敌人 AI
  weapon              武器系统
  vehicle             载具控制器
  ui-panel            UI 面板

选项:
  -t, --type <type>   组件子类型
  -o, --output <path> 输出路径 (默认: src/game)
  --force             覆盖已存在的文件
```

### optimize - 优化资源

```bash
game-agent optimize <target> [options]

目标:
  models    优化 3D 模型
  textures  优化纹理
  code      优化代码
  all       全部优化

选项:
  -t, --target-platform <platform>  目标平台 (mobile, desktop, vr)
  -q, --quality <quality>           质量级别 (low, medium, high)
  --dry-run                         预览模式
```

### debug - 调试分析

```bash
game-agent debug <action> [options]

动作:
  profile   性能分析
  analyze   代码分析
  report    生成报告

选项:
  -d, --duration <seconds>  分析时长
  -o, --output <path>       输出路径
```

---

## 🔧 MCP Server API

### 启动服务器

```bash
cd agent/mcp-server
npm install
npm start
```

服务器运行在 `http://localhost:3100`

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 服务器信息 |
| `/health` | GET | 健康检查 |
| `/tools` | GET | 列出所有可用工具 |
| `/execute` | POST | 执行工具 |

### 调用示例

```javascript
// 执行工具
const response = await fetch('http://localhost:3100/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'create_scene',
    params: {
      sceneName: 'GameScene',
      template: 'outdoor',
      shadows: true
    }
  })
});

const result = await response.json();
console.log(result.code);
```

### 可用工具

#### 场景工具
- `create_scene` - 创建场景
- `add_terrain` - 添加地形
- `setup_skybox` - 配置天空盒
- `add_lighting` - 添加光源

#### 模型工具
- `load_model` - 加载模型
- `optimize_model` - 优化模型
- `setup_lod` - 配置 LOD

#### 动画工具
- `create_animation` - 创建动画
- `blend_animations` - 动画混合
- `setup_animator` - 动画状态机

#### 物理工具
- `add_rigidbody` - 添加刚体
- `add_collider` - 添加碰撞体
- `setup_physics_world` - 配置物理世界

#### 网络工具
- `sync_transform` - 同步 Transform
- `sync_state` - 同步游戏状态
- `setup_interpolation` - 配置插值

#### 材质工具
- `create_pbr_material` - 创建 PBR 材质
- `bake_lightmap` - 烘焙光照
- `setup_shadows` - 配置阴影

#### 优化工具
- `analyze_performance` - 性能分析
- `compress_textures` - 压缩纹理
- `batch_meshes` - 网格批处理

#### 调试工具
- `show_stats` - 显示统计
- `draw_debug` - 绘制调试
- `log_analysis` - 日志分析

---

## 📝 Claude Code Skill 使用

### 触发方式

在 Claude Code 中输入相关关键词即可自动激活：

```
"创建一个 Three.js 场景"
"添加 FPS 控制器"
"如何同步多个玩家的位置"
"帮我优化场景性能"
```

### 示例对话

```
用户: 帮我创建一个户外场景，有地形和天空

Agent: 我将为您生成户外场景代码，包含：
- 程序化地形
- 天空盒
- 环境光照
- 雾效

[生成代码...]
```

---

## 🏗️ 项目结构

```
agent/
├── skills/                 # Claude Code Skill 配置
│   └── 3d-game-dev.md
│
├── mcp-server/             # MCP Server
│   ├── package.json
│   ├── index.js
│   └── tools/              # 工具模块
│       ├── tool-base.js
│       ├── scene-tools.js
│       ├── model-tools.js
│       ├── animation-tools.js
│       ├── physics-tools.js
│       ├── network-tools.js
│       ├── material-tools.js
│       ├── optimize-tools.js
│       └── debug-tools.js
│
├── cli/                    # CLI Agent
│   ├── package.json
│   ├── index.js
│   └── commands/
│       ├── create.js
│       ├── generate.js
│       ├── optimize.js
│       └── debug.js
│
├── templates/              # 代码模板
│   └── engines/
│       └── threejs/
│
└── README.md               # 本文档
```

---

## 🔌 与 Battle 项目集成

本 Agent 与 Battle 项目深度集成：

1. **共享模块** - 复用 `shared/` 目录的常量和事件定义
2. **网络架构** - 兼容现有的 Socket.io 架构
3. **项目结构** - 遵循项目的模块化设计原则

### 在 Battle 项目中使用

```javascript
// 引入网络同步组件
import { NetworkTransform } from './agent/mcp-server/tools/network-tools.js';

// 创建本地玩家同步
const playerSync = new NetworkTransform(player, socket, {
  isLocal: true,
  syncPosition: true,
  syncRotation: true
});

// 在游戏循环中更新
function update(delta) {
  playerSync.update(delta);
}
```

---

## 📊 性能最佳实践

### 移动端优化

- 最大三角形数: 10,000
- 最大纹理尺寸: 512px
- 禁用实时阴影
- 使用 LOD

### 桌面端标准

- 最大三角形数: 100,000
- 最大纹理尺寸: 2048px
- 启用软阴影
- 使用网格批处理

### VR 优化

- 最大三角形数: 50,000
- 最大纹理尺寸: 1024px
- 保持 90 FPS
- 减少 Draw Call

---

## 🐛 故障排除

### MCP Server 无法启动

```bash
# 检查端口占用
lsof -i :3100

# 使用其他端口
MCP_PORT=3200 npm start
```

### CLI 命令未找到

```bash
# 重新链接
cd agent/cli
npm unlink
npm link
```

### 模板生成失败

确保当前目录有写入权限：

```bash
chmod +w .
```

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
