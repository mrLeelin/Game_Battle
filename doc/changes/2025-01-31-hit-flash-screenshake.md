# 受击闪白 + 震屏效果

**日期**: 2025-01-31
**任务**: #3 实现受击闪白 + 震屏效果

## 修改文件

### 1. `client/games/gunbean/GunBeanScene.js`

#### 新增属性
- `physicsParticles` - 物理粒子数组（带重力和地面碰撞）
- `shakeIntensity` - 震动强度
- `shakeDuration` - 震动持续时间
- `shakeStartTime` - 震动开始时间

#### 新增方法
- `startScreenShake(intensity, duration)` - 开始震屏效果
- `getShakeOffset()` - 获取当前震屏偏移（随时间衰减）
- `flashEntity(entityType, entityId, duration)` - 触发实体闪白效果
- `createDeathExplosion(x, y, color)` - 创建物理死亡粒子（带重力和反弹）
- `createHitParticles(x, y)` - 创建船只受击粒子
- `drawPhysicsParticles(ctx)` - 绘制物理粒子

#### 修改方法
- `update(deltaTime)` - 添加物理粒子更新逻辑（重力、地面碰撞、反弹）
- `render()` - 应用震屏偏移（ctx.translate）
- `drawEnemy(ctx, enemy)` - 添加闪白状态检测和绘制
- `drawBoat(ctx, boat)` - 添加闪白状态检测和绘制
- `removeEnemy(enemyId)` - 使用新的物理死亡粒子效果
- `destroy()` - 清理物理粒子数组

### 2. `client/games/gunbean/GunBeanGame.js`

#### 新增事件监听
- `GUNBEAN_EVENTS.BOAT_DAMAGED` - 船只受伤事件

#### 新增方法
- `handleBoatDamaged(data)` - 处理船只受伤（敌人碰撞），触发闪白+震屏+粒子

#### 修改方法
- `handleBulletHit(data)`:
  - 敌人受击时触发闪白效果
  - 自己船只受击时触发闪白+震屏+粒子
- `handleBoatDestroyed(data)`:
  - 添加大型爆炸粒子效果
  - 自己船只被摧毁时触发强烈震屏
- `destroy()` - 清理 BOAT_DAMAGED 事件监听

### 3. `shared/Events.js`

#### 新增事件
- `BOAT_DAMAGED: 'gunbean:boatDamaged'` - 船只受伤事件

### 4. `server/games/gunbean/GunBeanHandler.js`

#### 修改方法
- `enemyHitBoat(game, enemy, boat)`:
  - 新增 `BOAT_DAMAGED` 事件发送
  - 包含 boatId、damage、hp、maxHp 信息

## 效果说明

### 震屏效果
- 船只被子弹击中：强度 12px，持续 250ms
- 船只被敌人撞击：强度 15px，持续 300ms
- 船只被摧毁：强度 25px，持续 500ms
- 震动随时间线性衰减

### 闪白效果
- 敌人受击：持续 80ms
- 船只受击：持续 150ms
- 闪白时整个实体变为白色

### 物理粒子效果
- 敌人死亡时生成 15 个物理粒子
- 粒子具有重力（600 px/s²）
- 碰到地面会反弹（弹性系数 0.5-0.7）
- 碰到侧边界会反弹
- 粒子有发光效果（shadowBlur）
- 生命周期 1.5-2 秒

## 代码 Diff 概要

```diff
# GunBeanScene.js
+ this.physicsParticles = [];
+ this.shakeIntensity = 0;
+ this.shakeDuration = 0;
+ this.shakeStartTime = 0;
+ startScreenShake(intensity, duration)
+ getShakeOffset()
+ flashEntity(entityType, entityId, duration)
+ createDeathExplosion(x, y, color)
+ createHitParticles(x, y)
+ drawPhysicsParticles(ctx)

# render() 中
+ const shake = this.getShakeOffset();
+ ctx.save();
+ ctx.translate(shake.x, shake.y);
+ this.drawPhysicsParticles(ctx);
+ ctx.restore();

# drawEnemy/drawBoat 中
+ const isFlashing = entity.flashEndTime && Date.now() < entity.flashEndTime;
+ ctx.fillStyle = isFlashing ? '#ffffff' : originalColor;

# GunBeanGame.js
+ network.on(GUNBEAN_EVENTS.BOAT_DAMAGED, ...)
+ handleBoatDamaged(data)
+ this.scene.flashEntity(...)
+ this.scene.startScreenShake(...)
+ this.scene.createHitParticles(...)
+ this.scene.createDeathExplosion(...)

# Events.js
+ BOAT_DAMAGED: 'gunbean:boatDamaged'

# GunBeanHandler.js (服务端)
+ this.io.to(game.roomId).emit(GUNBEAN_EVENTS.BOAT_DAMAGED, {...})
```

## 回退方案

如需回退，删除以下内容：
1. `GunBeanScene.js` 中所有新增的震屏、闪白、物理粒子相关代码
2. `GunBeanGame.js` 中 BOAT_DAMAGED 事件监听和 handleBoatDamaged 方法
3. `Events.js` 中 BOAT_DAMAGED 事件定义
4. `GunBeanHandler.js` 中 enemyHitBoat 方法里的 BOAT_DAMAGED 事件发送

---

## 2025-01-31 打击感增强更新

### 修改内容

#### 1. 子弹速度翻倍
- `client/games/gunbean/GunBeanGame.js`: `CONFIG.BULLET_SPEED` 400 → 800
- `server/games/gunbean/GunBeanHandler.js`: `CONFIG.BULLET_SPEED` 400 → 800

#### 2. 子弹击退效果（新增）
- `server/games/gunbean/GunBeanHandler.js`:
  - 新增 `CONFIG.KNOCKBACK_FORCE: 80`
  - `hitEnemy()` 方法添加击退逻辑，根据子弹方向给敌人施加位移

#### 3. 敌人死亡震屏（新增）
- `client/games/gunbean/GunBeanGame.js`:
  - `handleEnemyDied()` 新增 `startScreenShake(8, 150)`

#### 4. 死亡粒子效果增强
- `client/games/gunbean/GunBeanScene.js` `createDeathExplosion()`:
  - 粒子数量: 15 → 30
  - 粒子速度: 150-350 → 300-700
  - 粒子尺寸: 4-10 → 8-20
  - 向上爆发力: -100 → -250
  - 重力: 600 → 800
  - 弹性: 0.5-0.7 → 0.6-0.85
  - 生命: 1.5-2.0 → 2.0-2.8

### 回退方案

```javascript
// GunBeanGame.js
CONFIG.BULLET_SPEED = 400;
// 删除 handleEnemyDied 中的 startScreenShake

// GunBeanHandler.js
CONFIG.BULLET_SPEED = 400;
// 删除 KNOCKBACK_FORCE
// 删除 hitEnemy 中的击退逻辑

// GunBeanScene.js 恢复原参数:
particleCount = 15; speed = 150-350; radius = 4-10; vy初速 = -100
```
