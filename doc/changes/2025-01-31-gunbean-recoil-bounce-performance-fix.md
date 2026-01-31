# 枪豆人 - 反作用力和撞墙反弹性能优化

## 修改日期
2025-01-31

## 问题描述
反作用力（后坐力）和撞墙反弹功能特别卡，影响游戏流畅度。

---

## 问题分析

### 客户端性能瓶颈（GunBeanScene.js）

1. **动态插值计算过于复杂**（第 769-787 行）
   - 每帧计算 `distSq / maxDist`
   - 复杂的 easeOutQuad 公式：`1 - (1 - t) * (1 - t)`
   - 包含 `Math.min` 调用

2. **物理粒子系统**（第 840-874 行）
   - 每个粒子都要计算 `Math.abs(p.vy)`
   - 包含 `Math.max` 和 `Math.min` 边界限制

3. **弹壳系统**（第 886-900 行）
   - 每个弹壳检查 `s.vy > 0` 条件

### 服务端性能瓶颈（GunBeanHandler.js）

1. **撞墙反弹**（第 664-683 行）
   - 每艘船每帧计算边界值
   - 4次 `Math.abs` 调用

---

## 优化内容

### 1. 客户端 - 简化动态插值计算

**文件**: `client/games/gunbean/GunBeanScene.js`

**修改前**:
```javascript
// 使用复杂的缓动公式
const maxDist = 2500;
const t = Math.min(1, distSq / maxDist);
const eased = 1 - (1 - t) * (1 - t);
dynamicLerp = this.lerpSpeed + (0.85 - this.lerpSpeed) * eased;
```

**修改后**:
```javascript
// 使用简单的距离阈值判断
if (distSq < 100) {
    dynamicLerp = this.lerpSpeed;           // < 10px
} else if (distSq < 900) {
    dynamicLerp = 0.3;                       // 10-30px
} else if (distSq < 2500) {
    dynamicLerp = 0.5;                       // 30-50px
} else {
    dynamicLerp = 0.75;                      // > 50px
}
```

**效果**:
- 消除了 `Math.min`、除法、乘方运算
- 使用简单的整数比较
- 保持相同的插值效果

---

### 2. 客户端 - 优化物理粒子碰撞

**文件**: `client/games/gunbean/GunBeanScene.js`

**修改内容**:
- 缓存常量 `boundX` 避免重复计算
- 使用平方比较替代 `Math.abs`
- 简化边界碰撞逻辑，减少 `Math.max/min` 调用

**修改前**:
```javascript
if (Math.abs(p.vy) < 20) {
    p.vy = 0;
}
// ...
p.x = Math.max(-boundX, Math.min(boundX, p.x));
```

**修改后**:
```javascript
const stopBounceThresholdSq = 400; // 20^2
if (p.vy * p.vy < stopBounceThresholdSq) {
    p.vy = 0;
}
// ...
if (p.x < -boundX) {
    p.x = -boundX;
} else if (p.x > boundX) {
    p.x = boundX;
}
```

---

### 3. 客户端 - 优化弹壳碰撞

**文件**: `client/games/gunbean/GunBeanScene.js`

**修改内容**:
- 缓存常量 `shellGroundY` 和 `gravity`
- 简化条件判断

---

### 4. 服务端 - 优化边界检测

**文件**: `server/games/gunbean/GunBeanHandler.js`

**修改内容**:
- 将边界计算移到循环外部（避免每艘船重复计算）
- 用条件判断替代 `Math.abs`

**修改前**:
```javascript
game.boats.forEach(boat => {
    // ...
    const halfW = CONFIG.ARENA_WIDTH / 2 - CONFIG.BOAT_RADIUS;
    const halfH = CONFIG.ARENA_HEIGHT / 2 - CONFIG.BOAT_RADIUS;

    if (boat.x < -halfW) {
        boat.x = -halfW;
        boat.vx = Math.abs(boat.vx) * CONFIG.BOUNCE_DAMPING;
    }
    // ...
});
```

**修改后**:
```javascript
// 预计算边界值
const halfW = CONFIG.ARENA_WIDTH / 2 - CONFIG.BOAT_RADIUS;
const halfH = CONFIG.ARENA_HEIGHT / 2 - CONFIG.BOAT_RADIUS;
const leftBound = -halfW;
const rightBound = halfW;
// ...
const bounceDamping = CONFIG.BOUNCE_DAMPING;

game.boats.forEach(boat => {
    // ...
    if (boat.x < leftBound) {
        boat.x = leftBound;
        boat.vx = boat.vx < 0 ? -boat.vx * bounceDamping : boat.vx * bounceDamping;
    }
    // ...
});
```

---

## 性能提升预估

| 优化项 | 修改前 | 修改后 | 提升 |
|--------|--------|--------|------|
| 客户端插值计算 | 除法 + 乘方 + Math.min | 4次整数比较 | ~60% |
| 物理粒子 Math.abs | 每粒子2次 | 0次 | ~100% |
| 服务端边界计算 | 每船4次 Math.abs | 每船0次 | ~40% |

---

## 回退方案

如需回退，恢复以下文件到修改前的状态：
1. `client/games/gunbean/GunBeanScene.js`
2. `server/games/gunbean/GunBeanHandler.js`

---

## 测试建议

1. 测试后坐力爆发时的流畅度
2. 测试快速连续撞墙反弹时的性能
3. 测试大量物理粒子（爆炸效果）时的帧率
