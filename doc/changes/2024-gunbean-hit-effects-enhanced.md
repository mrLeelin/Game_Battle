# GunBean 怪物受击效果增强

## 修改日期
2024年

## 修改文件
1. `client/games/gunbean/GunBeanScene.js`
2. `client/games/gunbean/GunBeanGame.js`

## 修改原因
修复怪物受击闪白丢失问题，增强受击反馈和特效

---

## 问题分析

1. **光环特效没有正确渲染**：`createHitRing()` 创建了 `type: 'ring'` 类型粒子，但 `drawParticles()` 没有特殊处理
2. **闪白时间太短**：只有 80ms
3. **粒子特效太弱**：数量少、尺寸小、生命短
4. **膨胀效果不明显**：只有 30%

---

## 修改内容

### GunBeanScene.js

#### 1. `drawParticles` 方法
- 添加对 `ring` 类型粒子的特殊渲染（描边圆环 + 扩散效果 + 发光）
- 普通粒子也添加发光效果

#### 2. `createHitRing` 方法
- 增加光环初始半径：10 → 15
- 增加光环最大半径：50 → 80
- 延长生命周期：0.3s → 0.5s
- 新增次光环（橙色）叠加效果

#### 3. `createHitParticles` 方法
- 粒子数量：8 → 15
- 粒子半径：3-6 → 5-10
- 粒子生命：0.5s → 0.8s
- 颜色多样化：红、橙、黄、白

#### 4. `drawEnemy` 方法
- 受击膨胀幅度：30% → 50%

### GunBeanGame.js

#### 5. `handleBulletHit` 方法
- 敌人闪白持续时间：80ms → 150ms

---

## 效果对比

| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| 闪白持续时间 | 80ms | 150ms |
| 光环类型 | 1个白色 | 2个（白+橙） |
| 光环最大半径 | 50 | 80 |
| 光环生命周期 | 0.3s | 0.5s |
| 粒子数量 | 8 | 15 |
| 粒子半径 | 3-6 | 5-10 |
| 粒子生命 | 0.5s | 0.8s |
| 膨胀幅度 | 30% | 50% |
| 粒子发光 | 无 | 有 |

---

## 回退方案

如需回退，恢复以下文件：
1. `GunBeanScene.js` - `drawParticles`、`createHitRing`、`createHitParticles` 方法和膨胀参数
2. `GunBeanGame.js` - `handleBulletHit` 中的闪白时间
