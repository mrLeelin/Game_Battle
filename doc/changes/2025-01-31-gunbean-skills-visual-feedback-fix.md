# 枪豆人 - 肉鸽技能效果修复和视觉反馈

## 修改日期
2025-01-31

## 问题描述
肉鸽技能添加后没有效果，Buff没有任何视觉反馈，无法确认技能是否生效。

---

## 问题分析

| 问题 | 原因 |
|------|------|
| **服务端没发送技能数据** | `BULLET_FIRED` 事件只发送基础数据，没发送 poison/fire/freeze/explosive/chain 等 |
| **客户端没接收技能数据** | `handleBulletFired` 没存储技能效果 |
| **子弹绘制无效果** | `drawBullet` 只画黄色圆，没根据技能变色 |
| **闪电链时机错误** | 闪电链在敌人**死亡时**触发，应该**命中时**触发 |
| **吸血没广播血量** | 吸血后没调用 `syncState`，客户端看不到血量变化 |
| **毒素伤害固定** | 毒素伤害固定为 1，没用技能等级 |
| **爆炸/闪电链无视觉反馈** | 客户端没绘制爆炸范围和闪电效果 |

---

## 修改文件

| 文件 | 修改内容 |
|------|----------|
| `shared/Events.js` | 添加 `EXPLOSIVE_EFFECT` 和 `CHAIN_EFFECT` 视觉反馈事件 |
| `server/games/gunbean/GunBeanHandler.js` | 1. `BULLET_FIRED` 添加技能效果数据<br>2. 闪电链在命中时触发<br>3. 吸血后广播血量<br>4. 毒素使用技能等级<br>5. 添加爆炸/闪电链视觉反馈发送 |
| `client/games/gunbean/GunBeanGame.js` | 1. 接收并存储技能效果数据<br>2. 监听视觉反馈事件 |
| `client/games/gunbean/GunBeanScene.js` | 1. 子弹对象存储技能数据<br>2. 根据技能效果绘制不同样式子弹<br>3. 绘制爆炸和闪电链视觉效果 |

---

## 详细修改

### 1. 服务端 - 发送技能效果数据

**文件**: `server/games/gunbean/GunBeanHandler.js`

**修改位置**: `handleShoot` 方法中的 `BULLET_FIRED` 事件发送

```javascript
// 修改前
this.io.to(player.roomId).emit(GUNBEAN_EVENTS.BULLET_FIRED, {
    bulletId, playerId, boatId, x, y, dirX, dirY, damage: totalDamage
});

// 修改后
this.io.to(player.roomId).emit(GUNBEAN_EVENTS.BULLET_FIRED, {
    bulletId, playerId, boatId, x, y, dirX, dirY, damage: totalDamage,
    // 技能效果数据
    poison: poisonLevel,
    fire: fireLevel,
    freeze: freezeLevel,
    explosive: explosiveLevel,
    chain: chainLevel,
    bounceLeft: bounceLevel,
    pierceLeft: pierceLevel,
    split: splitLevel,
    boomerang: boomerangLevel
});
```

---

### 2. 服务端 - 修复闪电链触发时机

**文件**: `server/games/gunbean/GunBeanHandler.js`

**修改位置**: `hitEnemy` 方法

```javascript
// 修改前：闪电链在敌人死亡时触发
if (enemy.hp <= 0) {
    this.killEnemy(game, enemy, bullet.ownerId);
    if (bullet.explosive > 0) { /*...*/ }
    if (bullet.chain > 0) {
        this.chainEffect(game, enemy, bullet.chain, bullet.damage, bullet.ownerId);
    }
}

// 修改后：闪电链在命中时立即触发
if (bullet.chain > 0) {
    this.chainEffect(game, enemy, bullet.chain, damage, bullet.ownerId);
}

if (enemy.hp <= 0) {
    this.killEnemy(game, enemy, bullet.ownerId);
    if (bullet.explosive > 0) { /*...*/ }
}
```

---

### 3. 服务端 - 修复吸血血量广播

**文件**: `server/games/gunbean/GunBeanHandler.js`

```javascript
// 吸血
const lifestealLevel = killer.skills['lifesteal'] || 0;
if (lifestealLevel > 0) {
    const boat = game.boats.get(killer.boatId);
    if (boat && boat.hp < boat.maxHp) {
        boat.hp = Math.min(boat.hp + lifestealLevel, boat.maxHp);
        // 广播血量更新（让客户端看到吸血效果）
        this.syncState(game.roomId);
    }
}
```

---

### 4. 服务端 - 修复毒素伤害

**文件**: `server/games/gunbean/GunBeanHandler.js`

```javascript
// 修改前
if (bullet.poison > 0) {
    enemy.poisoned = true;
    enemy.poisonDamage = 1;  // 固定值
    // ...
}

// 修改后
if (bullet.poison > 0) {
    enemy.poisoned = true;
    enemy.poisonDamage = bullet.poison;  // 使用技能等级
    // ...
}
```

---

### 5. 服务端 - 添加视觉反馈发送

**文件**: `server/games/gunbean/GunBeanHandler.js`

**爆炸效果**:
```javascript
explosiveEffect(game, x, y, level, ownerId) {
    const radius = 50 + level * 15;
    // 发送爆炸视觉反馈
    this.io.to(game.roomId).emit(GUNBEAN_EVENTS.EXPLOSIVE_EFFECT, {
        x: x, y: y, radius: radius, level: level
    });
    // ...
}
```

**闪电链效果**:
```javascript
chainEffect(game, sourceEnemy, chainCount, damage, ownerId) {
    const chainTargets = [];
    // ... 收集目标位置 ...
    chainTargets.push({ x: nearestEnemy.x, y: nearestEnemy.y });

    // 发送闪电链视觉反馈
    this.io.to(game.roomId).emit(GUNBEAN_EVENTS.CHAIN_EFFECT, {
        targets: chainTargets
    });
}
```

---

### 6. 客户端 - 存储技能效果数据

**文件**: `client/games/gunbean/GunBeanGame.js` 和 `GunBeanScene.js`

```javascript
// GunBeanGame.js - handleBulletFired
this.scene.createBullet({
    id: data.bulletId, x: data.x, y: data.y,
    vx: data.dirX * CONFIG.BULLET_SPEED,
    vy: data.dirY * CONFIG.BULLET_SPEED,
    // 技能效果数据
    poison: data.poison || 0,
    fire: data.fire || 0,
    freeze: data.freeze || 0,
    explosive: data.explosive || 0,
    chain: data.chain || 0,
    // ...
});

// GunBeanScene.js - createBullet
const bullet = {
    id: bulletData.id, x: bulletData.x, y: bulletData.y,
    vx: bulletData.vx, vy: bulletData.vy,
    poison: bulletData.poison || 0,
    fire: bulletData.fire || 0,
    freeze: bulletData.freeze || 0,
    // ...
};
```

---

### 7. 客户端 - 子弹根据技能变色

**文件**: `client/games/gunbean/GunBeanScene.js`

**修改**: `drawBullet` 方法

| 技能 | 颜色 | 视觉效果 |
|------|------|----------|
| 默认 | #ffff00 (黄色) | 无 |
| 环绕弹 | #00ffff (青色) | 发光 |
| 分裂弹 | #ff88ff (粉色) | 无 |
| 火焰弹 | #ff4400 (橙红色) | 发光 |
| 毒素 | #00ff00 (绿色) | 发光 |
| 冰冻 | #88ffff (冰蓝色) | 发光 |
| 爆炸 | #ff8800 (橙色) | 发光 |
| 闪电链 | #ffff88 (亮黄色) | 发光 |
| 回旋镖 | #aa00ff (紫色) | 无 |

---

### 8. 客户端 - 绘制爆炸和闪电链效果

**爆炸效果**: 绘制扩散的橙色圆环，带透明衰减

**闪电链效果**: 绘制连接敌人的黄色闪电线条，带发光效果

---

## 技能效果对照表

| 技能ID | 名称 | 效果颜色 | 视觉反馈 |
|--------|------|----------|----------|
| `poison` | 毒素 | 绿色 | 敌人每秒掉血 |
| `fire` | 火焰弹 | 橙红色 | 敌人每秒掉血 |
| `freeze` | 冰冻 | 冰蓝色 | 敌人减速 |
| `explosive` | 爆炸 | 橙色 | 范围爆炸圆环 |
| `chain` | 闪电链 | 亮黄色 | 闪电路径 |
| `lifesteal` | 吸血 | - | 血量增加（广播） |
| `bounce` | 弹跳 | - | - |
| `pierce` | 穿透 | - | - |
| `split` | 分裂弹 | 粉色 | 分裂出子弹 |
| `boomerang` | 回旋镖 | 紫色 | - |
| `orbitalBullet` | 弹幕 | 青色 | 环绕子弹 |

---

## 测试建议

1. **基础技能测试**:
   - 选择毒素/火焰/冰冻技能，观察子弹颜色变化
   - 击中敌人，确认效果生效

2. **高级技能测试**:
   - 选择爆炸技能，观察爆炸圆环效果
   - 选择闪电链技能，观察闪电路径
   - 选择吸血技能，观察血量增加

3. **组合测试**:
   - 同时选择毒素+爆炸，确认两种效果都生效
   - 多人游戏，确认技能对所有玩家生效

---

## 回退方案

删除以下代码：
1. 服务端 `BULLET_FIRED` 中的技能效果数据
2. 服务端的视觉反馈发送
3. 客户端对技能数据的接收和存储
4. 客户端的视觉反馈绘制
5. `Events.js` 中的新事件定义
