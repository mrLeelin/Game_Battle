# 枪豆人 - GM模式（P键增加20%经验值）

## 修改日期
2025-01-31

## 功能说明
添加 GM 模式调试功能，按下 **P 键** 给所有存活玩家增加 **20% 经验值**（相对于升级所需经验）。

---

## 修改文件

| 文件 | 修改内容 |
|------|----------|
| `shared/Events.js` | 添加 `GM_ADD_EXP` 事件定义 |
| `client/games/gunbean/GunBeanInput.js` | 添加 P 键监听 |
| `client/games/gunbean/GunBeanGame.js` | 添加 `gmAddExp()` 方法 |
| `server/games/gunbean/GunBeanHandler.js` | 添加 `handleGmAddExp()` 事件处理 |

---

## 详细修改

### 1. shared/Events.js

**添加事件定义**:
```javascript
GM_ADD_EXP: 'gunbean:gmAddExp'  // GM模式：增加经验值
```

---

### 2. client/games/gunbean/GunBeanInput.js

**添加 P 键监听**:
```javascript
// P键GM模式：增加20%经验值
if (e.code === 'KeyP') {
    e.preventDefault();
    this.game.gmAddExp();
}
```

---

### 3. client/games/gunbean/GunBeanGame.js

**添加 GM 方法**:
```javascript
/**
 * GM模式：增加20%经验值
 */
gmAddExp() {
    if (!this.isRunning) return;

    // 发送GM经验增加请求
    network.emit(GUNBEAN_EVENTS.GM_ADD_EXP);

    // 显示提示
    if (this.ui) {
        this.ui.showFloatingText('GM: +20% 经验值', '#ffff00');
    }
}
```

---

### 4. server/games/gunbean/GunBeanHandler.js

**事件绑定**:
```javascript
socket.on(GUNBEAN_EVENTS.GM_ADD_EXP, () => {
    this.handleGmAddExp(socket);
});
```

**处理方法**:
```javascript
/**
 * 处理GM模式：增加20%经验值
 */
handleGmAddExp(socket) {
    const player = this.playerManager.getPlayer(socket.id);
    if (!player?.roomId) return;

    const game = this.games.get(player.roomId);
    if (!game || !game.isRunning) return;

    console.log(`[GunBeanHandler] GM模式: ${player.name} 触发 +20% 经验值`);

    // 给所有存活玩家增加 20% 经验值
    game.players.forEach(gamePlayer => {
        if (gamePlayer.isDead) return;

        // 计算增加的经验值（升级所需经验的20%）
        const bonusExp = Math.ceil(gamePlayer.expToNext * 0.2);
        gamePlayer.exp += bonusExp;

        // 广播经验更新
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXP_UPDATE, {
            playerId: gamePlayer.id,
            level: gamePlayer.level,
            exp: gamePlayer.exp,
            expToNext: gamePlayer.expToNext
        });

        // 检查升级
        if (gamePlayer.exp >= gamePlayer.expToNext) {
            this.playerLevelUp(game, gamePlayer);
        }
    });
}
```

---

## 使用方法

1. 启动游戏进入枪豆人模式
2. 按下 **P 键**
3. 所有存活玩家获得升级所需经验值的 20%
4. 可连续按 P 键快速升级测试技能

---

## 回退方案

删除以下代码：
1. `shared/Events.js` 中的 `GM_ADD_EXP` 行
2. `client/games/gunbean/GunBeanInput.js` 中的 P 锤断块
3. `client/games/gunbean/GunBeanGame.js` 中的 `gmAddExp()` 方法
4. `server/games/gunbean/GunBeanHandler.js` 中的事件绑定和处理方法
