# GunBean 飘字相关 Bug

## Bug 1: floatingTexts 未初始化（已修复）

### 错误信息

```
[App] 游戏启动失败: TypeError: Cannot read properties of undefined (reading 'forEach')
    at GunBeanScene.drawFloatingTexts (GunBeanScene.js:1651:28)
    at GunBeanScene.render (GunBeanScene.js:934:14)
    at GunBeanGame.gameLoop (GunBeanGame.js:805:20)
    at GunBeanGame.start (GunBeanGame.js:781:14)
    at App.startGame (main.js:103:30)
```

### 问题原因

`GunBeanScene.js` 构造函数中遗漏了 `floatingTexts` 数组的初始化。

### 修复方案

在构造函数第66行 `this.shells = [];` 之后添加：

```javascript
this.floatingTexts = [];     // 飘字（伤害数字等）
```

---

## Bug 2: 飘字不消失（已修复）

### 问题现象

飘字（伤害数字）显示后不会消失，一直停留在屏幕上。

### 问题原因

`update` 方法中遗漏了 `floatingTexts` 的更新逻辑。其他粒子（particles、physicsParticles、waterRipples、shells）都有更新和清理逻辑，但 floatingTexts 没有。

### 修复方案

在 `update` 方法中 shells 更新之后添加：

```javascript
// 更新飘字
this.floatingTexts = this.floatingTexts.filter(ft => {
    ft.life -= deltaTime;
    ft.offsetY -= 50 * deltaTime;  // 上浮
    ft.scale = Math.max(1.0, ft.scale - deltaTime * 2);  // 缩放回正常大小
    return ft.life > 0;
});
```

---

## 修复日期

2025-01-31
