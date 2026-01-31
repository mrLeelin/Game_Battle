# 枪豆人 - 击退/反弹/反作用力极限增强 + 震屏增强 + 性能优化

## 日期
2025-01-31

## 修改文件
- `server/games/gunbean/GunBeanHandler.js`
- `client/games/gunbean/GunBeanScene.js`
- `client/games/gunbean/GunBeanGame.js`
- `client/games/gunbean/GunBeanUI.js`

## 修改内容

### 服务端 CONFIG 配置调整

| 配置项 | 原值 | 新值 | 说明 |
|--------|------|------|------|
| `RECOIL_FORCE` | 120 | **800** | 射击后坐力（爆发式） |
| `KNOCKBACK_FORCE` | 80 | **320** | 子弹击退力度4倍 |
| `BOUNCE_DAMPING` | 0.7 | **2.8** | 边界反弹4倍 |
| `FRICTION` | 0.97 | **0.92** | 摩擦力降低，滑行更远 |
| `laserRecoil` | 300 | **600** | 激光炮后坐力翻倍 |

### 客户端震屏效果增强

| 场景 | 原强度 | 新强度 | 原时长 | 新时长 |
|------|--------|--------|--------|--------|
| 射击 | 3 | **12** | 50ms | **120ms** |
| 敌人死亡 | 8 | **20** | 150ms | **250ms** |
| 船只受击 | 15 | **30** | 300ms | **400ms** |
| 船只摧毁 | 25 | **50** | 500ms | **800ms** |
| 全屏泛白 | 0.4 | **0.5** | 200ms | **250ms** |
| 射击震屏 | 12 | **已移除** | 120ms | **已移除** |

### 性能优化 - 移除所有blur效果

**GunBeanUI.js:**
- 移除所有 `backdrop-filter: blur(...)` → `backdrop-filter: none`
- 影响：时间面板、分数面板、经验条、血量面板、护盾面板、弹药面板、技能列表

**GunBeanScene.js:**
- 注释掉所有 `ctx.shadowBlur = ...`
- 影响：船只阴影、敌人阴影、经验球发光、敌人闪白、子弹发光、物理粒子、飘字发光

**预期效果：**
- 大幅提升渲染帧率
- 减少GPU负担
- 画面会少一些发光/模糊效果，但更流畅

## 代码 Diff

```diff
// 游戏配置
const CONFIG = {
    ...
-    RECOIL_FORCE: 120,      // 后坐力
-    KNOCKBACK_FORCE: 80,    // 子弹击退力度
+    RECOIL_FORCE: 480,      // 后坐力（4倍）
+    KNOCKBACK_FORCE: 320,   // 子弹击退力度（4倍）
    ...
-    BOUNCE_DAMPING: 0.7,    // 边界反弹衰减系数
+    BOUNCE_DAMPING: 2.8,    // 边界反弹衰减系数（4倍）
    ...
};

// 激光炮后坐力
-    const laserRecoil = 300;
+    const laserRecoil = 600;
```

## 功能对比

### 修改前（原始值）
- 射击后坐力：120
- 子弹击退：80
- 边界反弹：0.7
- 激光后坐力：300

### 修改后（4倍增强）
- 射击后坐力：480（射击反冲极强）
- 子弹击退：320（敌人被打飞很远）
- 边界反弹：2.8（撞墙会大幅加速弹回）
- 激光后坐力：600（激光发射时强烈后退）

## 回退方案

如需回退到原始值：
```javascript
RECOIL_FORCE: 120,
KNOCKBACK_FORCE: 80,
BOUNCE_DAMPING: 0.7,
const laserRecoil = 300;
```
