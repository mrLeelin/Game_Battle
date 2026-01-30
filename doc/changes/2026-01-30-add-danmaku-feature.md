# 新增房间弹幕功能

**日期**: 2026-01-30
**类型**: feat (新功能)

## 需求描述

在房间界面增加弹幕功能，玩家可以在左下角输入框中输入文字发送弹幕，房间内所有玩家都可以看见该弹幕。

## 修改文件

### 1. `shared/Events.js`
- 添加 `DANMAKU_SEND: 'room:danmakuSend'` - 客户端发送弹幕事件
- 添加 `DANMAKU_BROADCAST: 'room:danmakuBroadcast'` - 服务端广播弹幕事件

### 2. `client/index.html`
- 在 `#room-screen` 中添加弹幕容器 `#danmaku-container`
- 添加弹幕输入区域 `#danmaku-input-area`，包含输入框和发送按钮

### 3. `client/style.css`
- 添加弹幕容器样式（全屏覆盖，不影响鼠标交互）
- 添加弹幕滚动动画 `@keyframes danmaku-scroll`（从右向左）
- 添加弹幕条目样式（科幻发光效果）
- 添加输入框区域样式（左下角固定定位）

### 4. `client/lobby/LobbyManager.js`
- 添加 `DANMAKU_BROADCAST` 事件监听，触发 `room:danmakuReceived` 事件
- 添加 `sendDanmaku(text)` 方法发送弹幕

### 5. `client/lobby/RoomUI.js`
- 缓存弹幕相关 DOM 元素
- 绑定发送按钮点击事件和输入框回车事件
- 监听 `room:danmakuReceived` 事件显示弹幕
- 添加 `handleSendDanmaku()` 方法处理发送
- 添加 `showDanmaku(text, playerName)` 方法创建弹幕动画
- 添加 `clearDanmaku()` 方法清空弹幕
- 使用轨道系统避免弹幕重叠

### 6. `server/lobby/LobbyHandler.js`
- 添加 `DANMAKU_SEND` 事件监听
- 添加 `handleDanmakuSend(socket, data)` 方法处理弹幕
- 实现文本校验（长度限制 50 字符）
- 实现 XSS 防护（转义 HTML 字符）
- 广播弹幕给房间内所有玩家

## 功能特性

- 弹幕从屏幕右侧滚动到左侧
- 滚动时长随机 8-12 秒
- 使用轨道系统（10 条轨道）避免弹幕重叠
- 科幻风格发光效果，与现有 UI 一致
- 弹幕不影响鼠标点击（pointer-events: none）
- 支持回车键快速发送
- 离开房间时自动清空弹幕

## 安全措施

- 客户端和服务端双重文本长度限制（50 字符）
- 服务端 XSS 防护（转义 HTML 特殊字符）
- 验证玩家是否在房间内才能发送
