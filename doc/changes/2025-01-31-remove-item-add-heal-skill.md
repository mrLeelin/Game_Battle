# 取消道具掉落，增加回复技能

**日期**: 2025-01-31

## 修改内容

### 1. 取消道具掉落功能
- 位置：`server/games/gunbean/GunBeanHandler.js` - `killEnemy` 方法
- 删除：敌人死亡时的道具掉落逻辑（回血道具20%、磁铁5%）

### 2. 新增"回复"肉鸽技能
- 位置：`server/games/gunbean/GunBeanSkillData.js`
- 技能配置：

```javascript
{
    id: 'heal',
    name: '回复',
    icon: '❤️',
    rarity: 'common',
    description: '立即恢复生命值',
    effectPerLevel: '+3生命值',
    maxLevel: 5,
    immediate: true
}
```

## 技能效果
- 选择后立即恢复3点生命值
- 可重复选择，每次都恢复3点
- 最多可选5次

## 代码对比

### 删除的代码（killEnemy方法）
```javascript
// ========== 道具掉落 ========== (已删除)
// 回血道具 20%，全屏磁铁 5%
const roll = Math.random() * 100;
if (roll < 20) {
    this.spawnItem(game, enemy.x, enemy.y, 'health');
} else if (roll >= 20 && roll < 25) {
    this.spawnItem(game, enemy.x, enemy.y, 'magnet');
}
```

### 新增的技能处理（已存在于handleSkillSelect）
```javascript
if (skill.immediate && skill.id === 'heal') {
    const boat = game.boats.get(gamePlayer.boatId);
    if (boat) {
        boat.hp = Math.min(boat.hp + 3, boat.maxHp);
    }
}
```

## 修改文件
- `server/games/gunbean/GunBeanHandler.js`
- `server/games/gunbean/GunBeanSkillData.js`
