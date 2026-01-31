# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
模块化多人在线游戏平台，基于 Three.js 渲染与 Socket.io 实时通信，支持多种游戏类型。

## 开发命令
```bash
# 启动（Windows）：双击
#   开始游戏.bat（同时打开服务端+客户端）
#   开始服务器.bat（仅服务端）
#   开始客户端.bat（仅客户端）

npm run server    # 服务端，端口 3000
npm run client    # 客户端开发服务器，端口 8080
npm run dev       # 同时启动服务端与客户端
npm run build     # 构建输出到 dist/
```

## 项目结构
```
Battle/
├─ shared/                 # 客户端/服务端共享
│  ├─ Constants.js         # 全局常量（房间/网络等）
│  ├─ Events.js            # Socket 事件定义
│  └─ GameTypes.js         # 游戏类型注册
├─ client/                 # 客户端
│  ├─ main.js              # 应用入口
│  ├─ core/                # 通用模块（Network/Scene 等）
│  ├─ lobby/               # 大厅逻辑与 UI
│  └─ games/               # 具体游戏模块（如 fps/）
├─ server/                 # 服务端
│  ├─ index.js             # 服务端入口（ESM）
│  ├─ core/                # Socket/Player 管理
│  ├─ lobby/               # 房间/大厅逻辑
│  └─ games/               # 游戏逻辑路由与处理器
├─ doc/
│  ├─ error/               # 错误记录
│  └─ changes/             # 改动留档（强制）
└─ dist/                   # 构建产物
```

## 核心设计原则
- `lobby/` 仅处理登录、房间列表、创建/加入、准备与开始游戏。
- `games/` 仅处理具体游戏逻辑，事件边界由 `shared/Events.js` 约束。
- 新增游戏类型时：
  1) 在 `shared/GameTypes.js` 注册
  2) 新建 `client/games/<game>/` 并继承 `GameBase`
  3) 新建 `server/games/<game>/` 并实现服务端处理器
  4) 在 `client/main.js` 中加入动态加载
  5) 在 `server/games/GameRouter.js` 注册处理器

## 技术栈
- 前端：Three.js, Socket.io-client, anime.js, Vite
- 后端：Node.js (ESM), Express, Socket.io

## 强制规则
- 所有回复必须使用中文。
- 每次出现错误必须记录到 `doc/error/`。
- 每次写代码或改动文件都必须在 `doc/changes/` 留档（全量记录）。
- 写代码之前先阅读 `doc/error/`，避免重复问题。


## 文档
- 枪豆人 贴图资源在  @doc/game/qiangdouren/贴图资源.md
  