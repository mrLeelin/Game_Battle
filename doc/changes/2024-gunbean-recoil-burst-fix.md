# GunBean 后坐力爆发感修复

## 修改日期
2024年

## 修改文件
1. `client/games/gunbean/GunBeanScene.js`

## 修改原因
开枪后坐力没有爆发加速感，移动很平滑，缺乏打击感

---

## 问题分析

客户端使用固定的插值速度 `lerpSpeed = 0.15` 来平滑船只移动：
```javascript
boat.x += (boat.targetX - boat.x) * this.lerpSpeed;
```

这导致服务端发来的爆发性后坐力位移被平滑化，失去了"瞬间爆发"的感觉。

---

## 修改内容

### GunBeanScene.js - update() 方法

使用**动态插值速度**替代固定插值：

```javascript
// 计算目标距离
const dx = boat.targetX - boat.x;
const dy = boat.targetY - boat.y;
const dist = Math.sqrt(dx * dx + dy * dy);

// 动态插值速度：距离越大（后坐力期间），插值越快
const dynamicLerp = dist > 30 ? 0.5 : (dist > 10 ? 0.3 : this.lerpSpeed);

boat.x += dx * dynamicLerp;
boat.y += dy * dynamicLerp;
```

---

## 动态插值规则

| 距离范围 | 插值速度 | 场景 |
|----------|----------|------|
| > 30 像素 | 0.5 (快速) | 后坐力爆发 |
| 10-30 像素 | 0.3 (中速) | 过渡 |
| < 10 像素 | 0.15 (正常) | 普通移动 |

---

## 效果对比

| 状态 | 修改前 | 修改后 |
|------|--------|--------|
| 开枪后坐力 | 平滑缓慢移动 | 瞬间爆发加速 |
| 正常移动 | 平滑 | 平滑（不变） |

---

## 回退方案

如需回退，恢复 `GunBeanScene.js` 中船只更新代码为固定插值：
```javascript
boat.x += (boat.targetX - boat.x) * this.lerpSpeed;
boat.y += (boat.targetY - boat.y) * this.lerpSpeed;
```
