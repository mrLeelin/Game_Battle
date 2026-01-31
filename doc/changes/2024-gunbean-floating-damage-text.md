# GunBean 场景内掉血飘字

## 修改日期
2024年

## 修改文件
1. `client/games/gunbean/GunBeanScene.js`
2. `client/games/gunbean/GunBeanGame.js`

## 修改原因
新增场景内掉血飘字功能，伤害数字显示在战场内而非 UI 层

---

## 新增功能

### GunBeanScene.js

#### 1. 新增 `floatingTexts` 数组
- 存储所有飘字数据

#### 2. 新增 `createFloatingText` 方法
```javascript
createFloatingText(x, y, text, color = '#ff4444', fontSize = 24)
```
- `x, y` - 游戏坐标位置
- `text` - 显示的文字（如 "-1"）
- `color` - 文字颜色
- `fontSize` - 字体大小

#### 3. 新增 `drawFloatingTexts` 方法
- 渲染飘字，带有：
  - 上浮动画（每秒上浮 60 像素）
  - 淡出效果
  - 弹出缩放效果（1.5 → 1.0）
  - 黑色描边 + 发光效果

#### 4. 在 `update` 中更新飘字动画

#### 5. 在 `render` 中调用 `drawFloatingTexts`

### GunBeanGame.js

#### 6. 敌人受击时显示飘字
```javascript
this.scene.createFloatingText(enemy.x, enemy.y - 20, `-${damage}`, '#ff4444', 28);
```

#### 7. 船只受伤时显示飘字
```javascript
this.scene.createFloatingText(sceneBoat.x, sceneBoat.y - 30, `-${damage}`, '#ff0000', 32);
```

---

## 飘字特性

| 属性 | 值 |
|------|-----|
| 生命周期 | 1.0 秒 |
| 上浮速度 | 60 像素/秒 |
| 初始缩放 | 1.5 倍（弹出效果） |
| 结束缩放 | 1.0 倍 |
| 描边 | 黑色，4px |
| 发光 | 与文字同色，blur 10px |

---

## 回退方案

如需回退：
1. `GunBeanScene.js` - 移除 `floatingTexts`、`createFloatingText`、`drawFloatingTexts` 相关代码
2. `GunBeanGame.js` - 移除 `createFloatingText` 调用
