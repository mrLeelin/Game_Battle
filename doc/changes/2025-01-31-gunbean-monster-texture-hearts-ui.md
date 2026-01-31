# 枪豆人 - 小怪贴图、心形血条、受击效果

**日期**: 2025-01-31

---

## 改动概述

1. 给小怪添加贴图，增加 3 种小怪类型做出差异性
2. 血条改为心形图标显示（10 颗心）
3. 船体受击增加全屏泛红效果
4. 修复技能选择界面不显示的 Bug
5. 更新 Roguelike 技能系统设计文档（含融合系统）

---

## 详细改动

### 1. 小怪贴图系统

#### 服务端 `server/games/gunbean/GunBeanHandler.js`

新增敌人类型配置：
```javascript
const ENEMY_TYPES = {
    1: { type: 1, hpMultiplier: 1.0, speedMultiplier: 1.0, expMultiplier: 1.0, size: 45 },  // 普通
    2: { type: 2, hpMultiplier: 0.6, speedMultiplier: 1.5, expMultiplier: 0.8, size: 37.5 }, // 快速
    3: { type: 3, hpMultiplier: 2.0, speedMultiplier: 0.6, expMultiplier: 1.5, size: 60 }    // 重型
};
```

修改 `spawnEnemy()` 方法：
- 随机生成 1-3 类型敌人
- 应用类型属性（血量、速度、经验、尺寸）

修改 `updatePhysics()` 方法：
- 敌人移动使用 `speedMultiplier`

修改 `killEnemy()` 方法：
- 经验计算使用 `expMultiplier`

#### 客户端 `client/games/gunbean/GunBeanScene.js`

新增贴图配置：
```javascript
const TEXTURE_CONFIG = {
    monsters: {
        1: monster1Url,  // texture/qiangdouren/monster_1.png
        2: monster2Url,  // texture/qiangdouren/monster_2.png
        3: monster3Url   // texture/qiangdouren/monster_3.png
    }
};
```

修改 `drawEnemy()` 方法：
- 根据敌人类型使用对应贴图
- 支持闪白效果（使用辅助画布合成）
- 添加摆动、浮动、呼吸动画
- 添加受击膨胀虚化效果

### 2. 心形血条 UI

#### 服务端配置修改

```javascript
const CONFIG = {
    TEAM_MAX_HP: 10,    // 从 20 改为 10（10 颗心）
    ENEMY_DAMAGE: 1,    // 从 2 改为 1（每次碰撞减 1 颗心）
};
```

#### 客户端 `client/games/gunbean/GunBeanUI.js`

模板修改：
```html
<!-- 旧版 -->
<div class="gb-health">
    <span class="gb-health-icon">❤️</span>
    <div class="gb-health-bar">...</div>
    <span class="gb-health-text">20/20</span>
</div>

<!-- 新版 -->
<div class="gb-health">
    <div class="gb-hearts"></div>
</div>
```

新增样式：
```css
.gb-hearts { display: flex; flex-wrap: wrap; gap: 4px; }
.gb-heart { font-size: 24px; transition: transform 0.2s; }
.gb-heart.full { filter: drop-shadow(0 0 3px #ff4444); }
.gb-heart.empty { filter: grayscale(100%) opacity(0.4); }
.gb-heart.damaged { animation: heartDamage 0.3s ease; }
```

修改 `updateBoatHealth()` 方法：
- 生成心形图标（❤️）
- 满血红心，空血灰心
- 受伤时心形放大闪烁动画

### 3. 全屏泛红效果

#### 客户端 `client/games/gunbean/GunBeanScene.js`

新增属性：
```javascript
this.screenFlashAlpha = 0;
this.screenFlashDuration = 0;
this.screenFlashStartTime = 0;
```

新增方法：
```javascript
startScreenFlash(intensity = 0.5, duration = 300) {...}
getScreenFlashAlpha() {...}
```

在 `render()` 方法末尾绘制：
```javascript
const flashAlpha = this.getScreenFlashAlpha();
if (flashAlpha > 0) {
    ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
    ctx.fillRect(0, 0, w, h);
}
```

#### 客户端 `client/games/gunbean/GunBeanGame.js`

在 `handleBoatDamaged()` 中调用：
```javascript
this.scene.startScreenFlash(0.4, 200);  // 全屏泛红效果
```

### 4. 技能选择 Bug 修复

#### 服务端 `server/games/gunbean/GunBeanHandler.js`

修改 `playerLevelUp()` 方法：
- 添加调试日志
- 如果 socket 获取失败，使用房间广播作为备用方案

```javascript
const socket = this.io.sockets.sockets.get(gamePlayer.id);
if (socket) {
    socket.emit(GUNBEAN_EVENTS.SKILL_CHOICES, {...});
} else {
    // 备用方案：房间广播
    this.io.to(game.roomId).emit(GUNBEAN_EVENTS.SKILL_CHOICES, {
        playerId: gamePlayer.id,
        ...
    });
}
```

#### 客户端 `client/games/gunbean/GunBeanGame.js`

修改 `handleSkillChoices()` 方法：
- 检查 playerId 是否是发给自己的
- 添加空数据检查

### 5. Roguelike 技能文档更新

更新 `doc/game/qiangdouren/Roguelike.md`：
- 新增技能融合系统设计
- 18 种融合配方（攻击/控制/生存/机动/特殊）
- 传说级技能详情
- 实现优先级规划

---

## 文件变更列表

| 文件 | 操作 |
|------|------|
| `server/games/gunbean/GunBeanHandler.js` | 修改 |
| `client/games/gunbean/GunBeanScene.js` | 修改 |
| `client/games/gunbean/GunBeanGame.js` | 修改 |
| `client/games/gunbean/GunBeanUI.js` | 修改 |
| `doc/game/qiangdouren/Roguelike.md` | 修改 |

---

## 功能对比

### 小怪系统

| 功能 | 修改前 | 修改后 |
|------|--------|--------|
| 小怪外观 | 统一红色方块 | 3 种贴图 |
| 小怪类型 | 单一类型 | 3 种（普通/快速/重型） |
| 血量差异 | 无 | ×1.0 / ×0.6 / ×2.0 |
| 速度差异 | 无 | ×1.0 / ×1.5 / ×0.6 |
| 经验差异 | 无 | ×1.0 / ×0.8 / ×1.5 |

### 血量显示

| 功能 | 修改前 | 修改后 |
|------|--------|--------|
| 显示方式 | 血条 + 数字 | 心形图标 |
| 初始血量 | 20 | 10（10 颗心） |
| 敌人伤害 | 2 | 1（1 颗心） |

### 受击效果

| 功能 | 修改前 | 修改后 |
|------|--------|--------|
| 震屏 | ✅ | ✅ |
| 实体闪白 | ✅ | ✅ |
| 全屏泛红 | ❌ | ✅ |
| 心形动画 | ❌ | ✅ |

---

## 回退方案

```bash
git checkout -- server/games/gunbean/GunBeanHandler.js
git checkout -- client/games/gunbean/GunBeanScene.js
git checkout -- client/games/gunbean/GunBeanGame.js
git checkout -- client/games/gunbean/GunBeanUI.js
git checkout -- doc/game/qiangdouren/Roguelike.md
```
