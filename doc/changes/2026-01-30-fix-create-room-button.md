# 修复创建房间按钮退出后不可点击问题

**日期**: 2026-01-30
**文件**: `client/lobby/LobbyUI.js`

## 问题描述
点击创建房间后，再点击退出房间，创建房间按钮变得不可点击。

## 问题原因
在 `handleCreateRoom()` 方法中，创建房间时会调用 `setCreateButtonEnabled(false)` 禁用按钮。
但退出房间后调用的 `showLobby()` 方法没有重置按钮状态，导致按钮一直处于禁用状态。

## 修改内容

### 修改前
```javascript
showLobby() {
    this.hideAll();
    this.elements.lobbyScreen.style.display = 'flex';
    this.isVisible = true;
    lobbyManager.requestRoomList();
}
```

### 修改后
```javascript
showLobby() {
    this.hideAll();
    this.elements.lobbyScreen.style.display = 'flex';
    this.isVisible = true;
    this.setCreateButtonEnabled(true);  // 重置创建按钮状态
    if (this.elements.newRoomInput) {
        this.elements.newRoomInput.value = '';  // 清空房间名输入框
    }
    lobbyManager.requestRoomList();
}
```

## 功能对比

| 操作流程 | 修改前 | 修改后 |
|---------|--------|--------|
| 创建房间 → 退出房间 | 按钮禁用，显示"加入中..." | 按钮可用，显示"创建/加入" |
| 输入框内容 | 保留上次输入的房间名 | 自动清空 |

## 回退方案
如需回退，将 `showLobby()` 方法恢复为修改前的版本。
