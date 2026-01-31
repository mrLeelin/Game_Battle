# 修复 BallGameInput.js THREE 未导入问题

## 修改日期
2024年

## 修改文件
`client/games/ballgame/BallGameInput.js`

## 修改原因
游戏卡死，原因是使用了 THREE.Vector3 但未导入 THREE 模块

## 代码对比

### 修改前 (第 1-6 行)
```javascript
/**
 * 抢球大战 - 输入控制
 * 第一人称 FPS 模式
 */
import { FIELD } from './BallGameScene.js';
```

### 修改后 (第 1-7 行)
```javascript
/**
 * 抢球大战 - 输入控制
 * 第一人称 FPS 模式
 */
import * as THREE from 'three';
import { FIELD } from './BallGameScene.js';
```

## 功能对比

| 状态 | 修改前 | 修改后 |
|------|--------|--------|
| 游戏启动 | ❌ 卡死 | ✅ 正常 |
| WASD 移动 | ❌ 报错 THREE is not defined | ✅ 正常 |
| 鼠标投掷 | ❌ 报错 THREE is not defined | ✅ 正常 |

## 回退方案
如需回退，删除第 5 行 `import * as THREE from 'three';`
