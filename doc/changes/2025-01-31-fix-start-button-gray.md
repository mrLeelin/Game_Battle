# 修复房间界面开始按钮一直灰色的问题

## 问题描述
房间界面中，当刚进入并选择游戏类型后，"开始"按钮一直是灰色（禁用状态），无法点击。

## 根本原因
客户端 `LobbyManager.js` 没有监听 `GAME_TYPE_CHANGED` 事件。

服务端在设置游戏类型后发送了两个事件：
1. `GAME_TYPE_CHANGED` - 游戏类型变更通知
2. `STATE_UPDATE` - 房间状态更新

但客户端只监听了 `STATE_UPDATE` 事件，没有监听 `GAME_TYPE_CHANGED` 事件。

## 修复方案
在 `client/lobby/LobbyManager.js` 中添加 `GAME_TYPE_CHANGED` 事件的监听器。

### 修改内容
**文件：** `client/lobby/LobbyManager.js`

添加监听器：
```javascript
// 游戏类型变更
network.on(ROOM_EVENTS.GAME_TYPE_CHANGED, (data) => {
    if (this.currentRoom) {
        this.currentRoom.gameType = data.gameType;
        eventBus.emit('room:stateUpdated', this.currentRoom);
    }
});
```

## 日期
2025-01-31
