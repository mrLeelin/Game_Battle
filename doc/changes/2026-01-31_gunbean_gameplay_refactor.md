# 枪豆人游戏玩法重构

## 日期
2026-01-31

## 修改概述
根据用户需求对枪豆人游戏进行玩法重构：
1. 固定摄像机（不再跟随船只）
2. 玩家游玩范围扩大到整个屏幕
3. 玩家碰到边缘反弹（不死亡）
4. 玩家没有生命值
5. 船只有生命值

## 修改的文件

### 1. `server/games/gunbean/GunBeanHandler.js`
- **CONFIG 配置变更**：
  - `ARENA_WIDTH`: 800 → 1200
  - `ARENA_HEIGHT`: 600 → 800
  - 移除 `MAX_HP`（玩家生命值）
  - 新增 `BOAT_MAX_HP: 10`（船只生命值）
  - 新增 `BOUNCE_DAMPING: 0.7`（边界反弹衰减）
  - 新增 `BULLET_DAMAGE: 1`（子弹伤害）
  - 新增 `ENEMY_DAMAGE: 2`（敌人伤害）

- **船只逻辑**：
  - 船只创建时添加 `hp` 和 `maxHp` 属性
  - 边界碰撞改为反弹（反转速度并衰减）

- **玩家逻辑**：
  - 移除玩家 `hp` 属性
  - 玩家死亡由船只 HP 归零触发

- **伤害逻辑**：
  - `hitBoat()`: 子弹命中船只减少船只 HP
  - `enemyHitBoat()`: 敌人碰撞船只减少船只 HP
  - 新增 `destroyBoat()`: 船只被摧毁时船上所有玩家死亡

- **复活逻辑**：
  - 复活时恢复船只 HP 而不是玩家 HP

- **状态同步**：
  - 同步船只 HP 信息
  - 移除玩家 HP 同步

### 2. `client/games/gunbean/GunBeanScene.js`
- **ARENA 配置**：
  - `WIDTH`: 800 → 1200
  - `HEIGHT`: 600 → 800
  - `WATER_MARGIN`: 100 → 50

- **摄像机**：
  - 新增 `cameraFixed: true` 标志
  - `updateCamera()` 在固定模式下不跟随目标

- **船只**：
  - `createBoat()` 添加 `hp` 和 `maxHp` 属性
  - `updateBoatPosition()` 支持更新 HP
  - `drawBoat()` 显示船只血量条（不是玩家血量）

- **玩家**：
  - `createPlayer()` 移除 `hp` 和 `maxHp` 属性

### 3. `client/games/gunbean/GunBeanGame.js`
- **CONFIG**：
  - `MAX_HP` → `BOAT_MAX_HP`

- **状态变量**：
  - `hp` → `boatHp`, `boatMaxHp`

- **事件处理**：
  - 新增 `BOAT_DESTROYED` 事件监听
  - `processInitData()`: 使用船只 HP
  - `handlePlayerUpdate()`: 同步船只 HP
  - `handleBulletHit()`: 更新船只 HP
  - `handlePlayerRevived()`: 恢复船只 HP
  - 新增 `handleBoatDestroyed()`: 处理船只被摧毁

- **游戏循环**：
  - 摄像机固定在中心 (0, 0)

### 4. `client/games/gunbean/GunBeanUI.js`
- 血量图标: ❤️ → 🚢
- 默认显示: `3/3` → `10/10`
- 操作提示更新
- 新增 `updateBoatHealth()` 方法
- `updateHealth()` 改为调用 `updateBoatHealth()`

### 5. `shared/Events.js`
- 新增 `BOAT_DESTROYED: 'gunbean:boatDestroyed'` 事件

## 玩法变化对比

| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| 摄像机 | 跟随玩家船只 | 固定在场地中心 |
| 场地大小 | 800x600 | 1200x800 |
| 边界处理 | 掉出边界死亡 | 碰到边界反弹 |
| 玩家生命值 | 有（3点） | 无 |
| 船只生命值 | 无（玩家HP总和） | 有（10点） |
| 子弹伤害 | 无（仅推动） | 1点/发 |
| 敌人伤害 | 1点/次（对玩家） | 2点/次（对船只） |

## 测试建议
1. 启动游戏，确认摄像机固定不动
2. 射击使船只移动到边界，确认反弹效果
3. 被敌人/子弹击中，确认船只 HP 减少
4. 船只 HP 归零，确认船上玩家死亡
5. 复活后确认船只 HP 恢复满值
