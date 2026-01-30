# 玩家列表显示头像

## 变更日期
2026-01-30

## 变更类型
feat: 新功能

## 变更描述
在房间内玩家列表中显示每个玩家的头像，实现头像信息的服务端同步。

## 修改文件

### 1. shared/Events.js
- 添加 `SET_AVATAR` 事件用于头像同步

### 2. server/core/PlayerManager.js
- `addPlayer()`: 玩家数据添加 `avatar` 字段
- 新增 `setPlayerAvatar()`: 设置玩家头像（支持 emoji 和 image 类型）
  - emoji 限制 10 字符
  - image 限制 150000 字符（约 100KB base64）

### 3. server/lobby/RoomManager.js
- `getRoomState()`: 返回玩家头像信息

### 4. server/lobby/LobbyHandler.js
- `bindEvents()`: 监听 `SET_AVATAR` 事件
- 新增 `handleSetAvatar()`: 处理头像更新并广播房间状态

### 5. client/lobby/LobbyManager.js
- 导入 avatarManager
- `setUsername()`: 登录时同步头像
- 新增 `syncAvatar()`: 发送头像到服务端
- 新增 `updateAvatar()`: 更新并同步头像

### 6. client/lobby/LobbyUI.js
- `showAvatarPicker()`: 改用 `lobbyManager.updateAvatar()` 同步头像

### 7. client/lobby/RoomUI.js
- `renderPlayerList()`: 渲染玩家头像
  - 支持 emoji 类型（显示文字）
  - 支持 image 类型（显示背景图）

### 8. client/style.css
- `.player-item`: 添加 flex 布局和 gap
- `.player-avatar`: 玩家头像样式（36x36 圆形）
- `.player-avatar.has-image`: 图片头像样式

## 数据流

```
1. 登录时:
   客户端 setUsername() → 发送 SET_AVATAR → 服务端存储

2. 更换头像时:
   AvatarPicker → lobbyManager.updateAvatar() → 发送 SET_AVATAR
   → 服务端存储 → 广播 STATE_UPDATE → 其他玩家更新列表

3. 进入房间时:
   服务端 getRoomState() 包含所有玩家头像 → 客户端渲染
```

## 头像数据结构
```javascript
{
  type: 'emoji' | 'image',
  data: string  // emoji 字符或 base64 图片
}
```

## 注意事项
- 服务端限制 base64 图片大小防止内存占用过大
- 头像随房间状态广播，无需单独同步事件
