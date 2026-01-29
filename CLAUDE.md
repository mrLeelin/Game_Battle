# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

模块化多人在线游戏平台，支持多种游戏类型，基于 Three.js 渲染和 Socket.io 实时通信。

## 开发命令

```bash
# 启动游戏（Windows）
双击 开始游戏.bat

# 或分别启动
npm run server    # 游戏服务器 (端口 3000)
npm run client    # 客户端开发服务器 (端口 8080)
npm run dev       # 同时启动服务端和客户端

# 构建生产版本
npm run build     # 输出到 dist/
```

## 项目架构

```
Battle/
├── shared/                    # 客户端/服务端共享
│   ├── Constants.js           # 全局常量（房间配置等）
│   ├── Events.js              # Socket 事件名定义
│   └── GameTypes.js           # 游戏类型注册表
│
├── client/                    # 客户端
│   ├── main.js                # 应用入口，状态管理
│   ├── core/                  # 核心模块（与游戏无关）
│   │   ├── Network.js         # Socket.io 封装
│   │   ├── SceneManager.js    # Three.js 场景管理
│   │   └── EventBus.js        # 事件总线
│   ├── lobby/                 # 大厅模块（与游戏解耦）
│   │   ├── LobbyManager.js    # 大厅逻辑
│   │   ├── LobbyUI.js         # 登录/大厅界面
│   │   └── RoomUI.js          # 房间界面
│   └── games/                 # 游戏模块（可扩展）
│       ├── GameBase.js        # 游戏抽象基类
│       └── fps/               # FPS 游戏
│           ├── FPSGame.js     # FPS 主逻辑
│           ├── FPSPlayer.js   # 玩家模型
│           ├── FPSWeapon.js   # 武器系统
│           ├── FPSWorld.js    # 场景构建
│           └── FPSHUD.js      # 游戏 HUD
│
└── server/                    # 服务端
    ├── index.js               # 服务端入口
    ├── core/
    │   ├── SocketManager.js   # Socket 管理
    │   └── PlayerManager.js   # 玩家数据管理
    ├── lobby/
    │   ├── LobbyHandler.js    # 大厅事件处理
    │   └── RoomManager.js     # 房间管理
    └── games/
        ├── GameRouter.js      # 游戏事件路由
        └── fps/
            └── FPSGameHandler.js  # FPS 服务端逻辑
```

## 核心设计原则

### 大厅与游戏解耦
- `lobby/` 模块只处理：登录、房间列表、创建/加入房间、准备状态
- `games/` 模块只处理：具体游戏逻辑
- 通过 `shared/Events.js` 定义事件边界
- 通过 `shared/GameTypes.js` 注册游戏类型

### 添加新游戏步骤
1. 在 `shared/GameTypes.js` 注册游戏信息
2. 创建 `client/games/[游戏名]/` 目录，继承 `GameBase`
3. 创建 `server/games/[游戏名]/` 目录，实现服务端逻辑
4. 在 `client/main.js` 的 `loadGameModule()` 添加动态导入
5. 在 `server/games/GameRouter.js` 注册处理器

### 房间规则
- 最多 8 人 (`shared/Constants.js` 中 `ROOM.MAX_PLAYERS`)
- 状态：`waiting`（可加入）/ `running`（不可加入）
- 房主可选择游戏类型，所有非房主玩家准备后可开始

## 技术栈

- **前端**: Three.js, Socket.io-client, anime.js, Vite
- **后端**: Express, Socket.io
- **共享**: ES Modules (服务端需 Node.js 18+)

## 核心规则

**所有回复必须使用中文。**


## 每次出现错误就把错误放到 doc/error/  文件夹下

## 写代码之前读取 doc/error/ 确保不会再犯