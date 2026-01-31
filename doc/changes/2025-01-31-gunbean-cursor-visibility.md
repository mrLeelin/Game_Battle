# 枪豆人游戏鼠标光标显示控制

## 日期
2025-01-31

## 需求描述
1. 玩家死亡后，鼠标光标要显示出来
2. 按下 ESC 键时，鼠标光标要显示出来
3. 按下开火键（鼠标左键或空格）时，鼠标光标隐藏

## 修改文件

### 1. client/games/gunbean/GunBeanUI.js
新增两个方法控制鼠标光标显示/隐藏：

```javascript
/**
 * 显示鼠标光标
 */
showCursor() {
    document.body.classList.remove('gb-hide-cursor');
}

/**
 * 隐藏鼠标光标
 */
hideCursor() {
    document.body.classList.add('gb-hide-cursor');
}
```

### 2. client/games/gunbean/GunBeanGame.js

**handlePlayerDied 方法：**
- 玩家死亡时调用 `this.ui.showCursor()` 显示鼠标

```diff
if (data.playerId === this.localPlayerId) {
    this.isDead = true;
    this.ui.showDeathOverlay(true);
    this.ui.hideCrosshair();
+   this.ui.showCursor();
}
```

**handlePlayerRevived 方法：**
- 玩家复活时调用 `this.ui.hideCursor()` 隐藏鼠标

```diff
if (data.playerId === this.localPlayerId) {
    this.isDead = false;
    this.boatHp = data.boatHp || CONFIG.BOAT_MAX_HP;
    this.boatMaxHp = data.boatMaxHp || CONFIG.BOAT_MAX_HP;
    this.ui.showDeathOverlay(false);
    this.ui.showCrosshair();
+   this.ui.hideCursor();
    this.ui.updateBoatHealth(this.boatHp, this.boatMaxHp);
}
```

### 3. client/games/gunbean/GunBeanInput.js

**onKeyDown 方法：**
- 新增 ESC 键处理：显示鼠标、隐藏准星
- 空格键射击时：隐藏鼠标、显示准星

```javascript
// ESC键显示鼠标
if (e.code === 'Escape') {
    e.preventDefault();
    if (this.game.ui) {
        this.game.ui.showCursor();
        this.game.ui.hideCrosshair();
    }
}

// 空格键射击
if (e.code === 'Space') {
    e.preventDefault();
    this.isShooting = true;
    // 开火时隐藏鼠标
    if (this.game.ui && !this.game.isDead) {
        this.game.ui.hideCursor();
        this.game.ui.showCrosshair();
    }
}
```

**onMouseDown 方法：**
- 鼠标左键开火时：隐藏鼠标、显示准星

```javascript
onMouseDown(e) {
    if (e.button === 0) { // 左键
        this.isShooting = true;
        // 开火时隐藏鼠标
        if (this.game.ui && !this.game.isDead) {
            this.game.ui.hideCursor();
            this.game.ui.showCrosshair();
        }
    }
}
```

## 功能对比
| 场景 | 修改前 | 修改后 |
|------|--------|--------|
| 玩家死亡 | 鼠标隐藏 | 鼠标显示 |
| 按下 ESC | 无反应 | 鼠标显示，准星隐藏 |
| 按下开火键 | 无变化 | 鼠标隐藏，准星显示 |
| 玩家复活 | 只显示准星 | 隐藏鼠标，显示准星 |

## 测试建议
1. 进入游戏，确认鼠标默认隐藏，准星显示
2. 按 ESC 键，确认鼠标显示，准星隐藏
3. 点击鼠标左键或按空格键，确认鼠标隐藏，准星显示
4. 让玩家死亡，确认鼠标显示
5. 玩家复活后，确认鼠标隐藏，准星显示
