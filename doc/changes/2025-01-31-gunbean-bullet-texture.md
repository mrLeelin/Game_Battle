# 准星周围子弹图标改用贴图

## 修改日期
2025-01-31

## 修改文件
- `client/games/gunbean/GunBeanUI.js`

## 修改内容

### 1. 添加贴图 import（文件顶部）

```javascript
import bulletFullUrl from '../../../texture/qiangdouren/bullet_slot_1.png';
import bulletEmptyUrl from '../../../texture/qiangdouren/bullet_slot_2.png';
```

### 2. 修改 CSS 样式

移除 CSS 中的 background-image（改为在 JS 中动态设置）：

```css
.gb-ammo-bullet {
    position: absolute;
    width: 16px; height: 16px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    transform-origin: center center;
    transition: all 0.2s ease;
    filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
}
.gb-ammo-bullet.empty {
    filter: none;
    opacity: 0.6;
}
```

### 3. 修改 updateAmmo 方法

在生成 HTML 时动态设置背景图片 URL：

```javascript
const bgUrl = isEmpty ? bulletEmptyUrl : bulletFullUrl;
bulletsHtml += `<div class="gb-ammo-bullet ${isEmpty ? 'empty' : ''}"
    style="left: calc(50% + ${x}px); top: calc(50% + ${y}px);
           transform: translate(-50%, -50%);
           background-image: url('${bgUrl}');"></div>`;
```

## 使用的贴图资源

根据 `doc/game/qiangdouren/贴图资源.md`：
- 有子弹图标：`texture/qiangdouren/bullet_slot_1.png`
- 空壳图标：`texture/qiangdouren/bullet_slot_2.png`

## 修改原因

1. 使用贴图替代 CSS 绘制的圆点，视觉效果更好
2. 通过 ES 模块 import 加载贴图，符合项目现有模式，Vite 能正确处理路径

## 影响范围

- 准星周围的子弹图标现在使用贴图显示
- 有子弹时显示 bullet_slot_1.png（带发光效果）
- 空弹时显示 bullet_slot_2.png（半透明）
