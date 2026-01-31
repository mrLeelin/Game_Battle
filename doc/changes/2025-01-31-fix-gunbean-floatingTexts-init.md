# 修复 GunBean 飘字相关 Bug

## 修改日期
2025-01-31

## 修改文件
- `client/games/gunbean/GunBeanScene.js`

## 修改内容

### 修复1：floatingTexts 数组初始化

在构造函数中添加 `floatingTexts` 数组初始化。

**修改位置**：第66-67行

**修改前**：
```javascript
        this.shells = [];            // 抛壳粒子

        // 贴图资源
```

**修改后**：
```javascript
        this.shells = [];            // 抛壳粒子
        this.floatingTexts = [];     // 飘字（伤害数字等）

        // 贴图资源
```

---

### 修复2：floatingTexts 更新逻辑

在 `update` 方法中添加飘字的更新和清理逻辑。

**修改位置**：shells 更新之后，玩家后坐力更新之前

**新增代码**：
```javascript
        // 更新飘字
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.life -= deltaTime;
            ft.offsetY -= 50 * deltaTime;  // 上浮
            ft.scale = Math.max(1.0, ft.scale - deltaTime * 2);  // 缩放回正常大小
            return ft.life > 0;
        });
```

## 修改原因

1. **Bug 1**：`floatingTexts` 未初始化导致游戏启动黑屏
2. **Bug 2**：`floatingTexts` 没有更新逻辑导致飘字不消失

## 影响范围

- 修复了游戏启动黑屏问题
- 飘字现在会正常上浮、缩放并在1秒后消失
