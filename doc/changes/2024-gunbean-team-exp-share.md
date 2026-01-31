# GunBean 团队共享经验修复

## 修改日期
2024年

## 修改文件
1. `server/games/gunbean/GunBeanHandler.js`

## 修改原因
Bug：只有一个玩家出现肉鸽面板（技能选择界面）

---

## 问题分析

原来的经验球收集逻辑只给**最近的玩家**添加经验：
```javascript
collectExpOrb(game, gamePlayer, expOrb) {
    gamePlayer.exp += Math.round(expOrb.exp * expMultiplier);
    // 只有这个玩家升级并显示技能面板
    if (gamePlayer.exp >= gamePlayer.expToNext) {
        this.playerLevelUp(game, gamePlayer);
    }
}
```

这导致其他玩家永远不会升级，无法看到技能选择面板。

---

## 修改内容

### GunBeanHandler.js - collectExpOrb() 方法

将经验改为**团队共享**，所有存活玩家都获得经验：

```javascript
collectExpOrb(game, collectorPlayer, expOrb) {
    game.expOrbs.delete(expOrb.id);

    // 通知经验球被收集
    this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXP_ORB_COLLECTED, {
        orbId: expOrb.id,
        playerId: collectorPlayer.id
    });

    // 所有存活玩家都获得经验（团队共享）
    game.players.forEach(gamePlayer => {
        if (gamePlayer.isDead) return;

        const expBonusLevel = gamePlayer.skills['expBonus'] || 0;
        const expMultiplier = 1 + expBonusLevel * 0.15;

        gamePlayer.exp += Math.round(expOrb.exp * expMultiplier);

        // 检查升级
        if (gamePlayer.exp >= gamePlayer.expToNext) {
            this.playerLevelUp(game, gamePlayer);
        }

        // 更新经验
        this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXP_UPDATE, {
            playerId: gamePlayer.id,
            level: gamePlayer.level,
            exp: gamePlayer.exp,
            expToNext: gamePlayer.expToNext
        });
    });
}
```

---

## 效果对比

| 状态 | 修改前 | 修改后 |
|------|--------|--------|
| 经验获取 | 只有最近玩家 | 所有存活玩家 |
| 升级 | 只有收集者升级 | 所有玩家同时升级 |
| 技能面板 | 只有一人显示 | 所有人都显示 |

---

## 回退方案

恢复 `collectExpOrb` 方法为只给单个玩家添加经验的版本。
